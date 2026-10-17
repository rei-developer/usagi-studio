import { renderImage, IMAGE_MIMES } from "./imageRenderer";
import { canExport } from "./imageExport";
import { TILESIZE } from "./tileset";

export function supportsWorkerExport() {
  return (
    typeof Worker !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof OffscreenCanvas.prototype.convertToBlob === "function"
  );
}

// mode is used by the comparison harness; the editor always uses auto.
export async function exportMapImage(
  map,
  assets,
  { format, scale, background, onProgress = () => {}, signal, mode = "auto" }
) {
  const check = () => {
    if (signal?.aborted) throw new DOMException("취소", "AbortError");
  };
  check();
  if (!IMAGE_MIMES[format] || !canExport(map.width, map.height, scale))
    throw new Error("이미지 출력 한도를 초과했습니다.");
  const job = {
    width: map.width,
    height: map.height,
    scale,
    format,
    background,
    layers: map.data.map((layer) => {
      const flat = new Uint32Array(map.width * map.height);
      layer.forEach((row, y) => flat.set(row, y * map.width));
      return flat;
    }),
  };
  if (mode === "main" || !supportsWorkerExport())
    return renderImage(
      document.createElement("canvas"),
      job,
      assets,
      onProgress,
      check
    );

  const bitmaps = [];
  let worker;
  try {
    for (const image of [assets.tileset, ...assets.autotileAtlases]) {
      if (!image || scale === 1)
        bitmaps.push(image ? await createImageBitmap(image) : null);
      else {
        // HTMLImageElement and ImageBitmap downsampling differ at tile edges in Chromium.
        // Scale the small source atlas once to preserve existing export pixels.
        const atlas = document.createElement("canvas");
        atlas.width = image.width * scale;
        atlas.height = image.height * scale;
        try {
          const context = atlas.getContext("2d");
          context.imageSmoothingEnabled = false;
          let started = performance.now();
          for (let y = 0; y < image.height; y += TILESIZE) {
            for (let x = 0; x < image.width; x += TILESIZE)
              context.drawImage(
                image,
                x,
                y,
                TILESIZE,
                TILESIZE,
                x * scale,
                y * scale,
                TILESIZE * scale,
                TILESIZE * scale
              );
            if (performance.now() - started >= 8) {
              await new Promise((resolve) => setTimeout(resolve, 0));
              check();
              started = performance.now();
            }
          }
          bitmaps.push(await createImageBitmap(atlas));
        } finally {
          atlas.width = atlas.height = 0;
        }
      }
      check();
    }
    worker = new Worker(
      new URL("../workers/imageExport.worker.js", import.meta.url)
    );
    return await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, blob) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", abort);
        worker.terminate();
        if (error) reject(error);
        else resolve(blob);
      };
      const abort = () => finish(new DOMException("취소", "AbortError"));
      signal?.addEventListener("abort", abort, { once: true });
      worker.onerror = (event) => {
        event.preventDefault();
        finish(new Error("이미지 출력 Worker가 실패했습니다."));
      };
      worker.onmessageerror = () =>
        finish(new Error("이미지 출력 결과를 읽지 못했습니다."));
      worker.onmessage = ({ data }) => {
        if (settled) return;
        if (data.error) finish(new Error(data.error));
        else if (data.blob) finish(null, data.blob);
        else onProgress(data.progress);
      };
      try {
        worker.postMessage(
          {
            job,
            assets: {
              tileset: bitmaps[0],
              autotileAtlases: bitmaps.slice(1),
              tileSize: TILESIZE * scale,
            },
          },
          [
            ...job.layers.map((layer) => layer.buffer),
            ...bitmaps.filter(Boolean),
          ]
        );
      } catch (error) {
        finish(error);
      }
    });
  } finally {
    worker?.terminate();
    for (const bitmap of bitmaps) bitmap?.close();
  }
}
