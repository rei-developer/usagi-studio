import { TILESIZE } from "./tileset";
import { canExport, imageSize } from "./imageExport";

export const IMAGE_MIMES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export async function renderImage(
  canvas,
  job,
  assets,
  progress,
  check = () => {}
) {
  const { width, height, scale, format, layers, background } = job;
  const mime = IMAGE_MIMES[format];
  if (!mime || !canExport(width, height, scale))
    throw new Error("이미지 출력 한도를 초과했습니다.");
  Object.assign(canvas, imageSize(width, height, scale));
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 출력 컨텍스트를 만들지 못했습니다.");
    context.imageSmoothingEnabled = false;
    if (format === "jpg") {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    const sourceSize = assets.tileSize || TILESIZE;
    const size = TILESIZE * scale,
      total = width * height * layers.length;
    let done = 0,
      started = performance.now();
    for (const layer of layers) {
      for (let index = 0; index < layer.length; index++) {
        const id = layer[index],
          x = index % width,
          y = Math.floor(index / width);
        let image, tile;
        if (id >= 384) {
          image = assets.tileset;
          tile = id - 384;
        } else if (id >= 48) {
          image = assets.autotileAtlases[Math.floor(id / 48) - 1];
          tile = id % 48;
        }
        if (image)
          context.drawImage(
            image,
            (tile % 8) * sourceSize,
            Math.floor(tile / 8) * sourceSize,
            sourceSize,
            sourceSize,
            x * size,
            y * size,
            size,
            size
          );
        done++;
        if (done % 256 === 0 && performance.now() - started >= 8) {
          progress(Math.floor((done / total) * 95));
          await new Promise((resolve) => setTimeout(resolve, 0));
          check();
          started = performance.now();
        }
      }
    }
    check();
    progress(95);
    const blob = canvas.convertToBlob
      ? await canvas.convertToBlob({ type: mime, quality: 0.95 })
      : await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.95));
    check();
    if (!blob || blob.type !== mime)
      throw new Error("이미지 인코딩을 지원하지 않습니다.");
    progress(100);
    return blob;
  } finally {
    canvas.width = canvas.height = 0;
  }
}
