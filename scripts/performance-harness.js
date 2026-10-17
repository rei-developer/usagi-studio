import { exportMapImage, supportsWorkerExport } from "../src/utils/exportImage";
import { loadAssets } from "../src/utils/mapAssets";
import { restoreMaps } from "../src/utils/mapFiles";
import { connectedArea } from "../src/utils/editAlgorithms";
import { autotileId } from "../src/utils/autotileId";
import { transaction, writeCell, pack } from "../src/utils/editHistory";
import { createKernel } from "../experiments/wasmKernel";
import { legacyRenderer } from "../experiments/legacyImageExport";

const clone = (layer) => layer.map((row) => row.slice());
const median = (values) =>
  values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
const percentile = (values, p) =>
  values.length
    ? values.slice().sort((a, b) => a - b)[Math.ceil(values.length * p) - 1]
    : 0;
async function setup() {
  const sample = await (await fetch("/bench-fixture.json")).json();
  const map = restoreMaps({
    version: 1,
    activeMap: "sample",
    maps: { sample },
  }).sample;
  const assets = await loadAssets(map);
  return { map, assets };
}
const ready = setup();
const largeMap = (map, size = 256) => ({
  ...map,
  width: size,
  height: size,
  data: Array.from({ length: 3 }, (_, layer) =>
    Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) =>
        layer === 0
          ? (x + y) % 2
            ? 393
            : 94
          : (x + y + layer) % 5 === 0
            ? 94
            : 0
      )
    )
  ),
});

async function kernelBenchmark() {
  await ready;
  const start = performance.now();
  const kernel = await createKernel(
    await (await fetch("/tile-kernel.wasm")).arrayBuffer()
  );
  const loadMs = performance.now() - start;
  const results = [];
  for (const size of [50, 256, 512])
    for (const dense of [false, true]) {
      const source = Array.from({ length: size }, () =>
        Array(size).fill(dense ? 94 : 0)
      );
      const candidates = Uint32Array.from({ length: size * size }, (_, i) => i);
      for (const operation of ["fill", "autotiles"]) {
        const modes = { js: [], wasm: [] };
        let reference;
        for (let run = 0; run < 8; run++)
          for (const mode of run % 2 ? ["wasm", "js"] : ["js", "wasm"]) {
            const layer = clone(source),
              edit = transaction("bench", 0, size);
            const start = performance.now();
            let value,
              timing = {};
            if (mode === "wasm")
              ({ value, timing } =
                operation === "fill"
                  ? kernel.fill(layer, 0, 0)
                  : kernel.autotiles(layer, candidates));
            else if (operation === "fill") value = connectedArea(layer, 0, 0);
            else
              value = candidates.map((index) => {
                const y = Math.floor(index / size),
                  x = index % size,
                  id = layer[y][x];
                return id >= 48 && id < 384
                  ? autotileId(layer, Math.floor(id / 48), x, y)
                  : id;
              });
            const computed = performance.now();
            for (let i = 0; i < value.length; i++) {
              const index = operation === "fill" ? value[i] : candidates[i];
              writeCell(
                edit,
                layer,
                index % size,
                Math.floor(index / size),
                operation === "fill" ? 393 : value[i]
              );
            }
            const record = pack(edit),
              end = performance.now();
            const result = JSON.stringify(
              record ? Array.from(record.cells) : []
            );
            if (reference !== undefined && reference !== result)
              throw Error("JS/WASM transaction mismatch");
            reference = result;
            if (run >= 3)
              modes[mode].push({
                totalMs: end - start,
                kernelAndCopyMs: computed - start,
                applyMs: end - computed,
                ...timing,
              });
          }
        results.push({
          size,
          dense,
          operation,
          modes,
          jsMedianMs: median(modes.js.map((x) => x.totalMs)),
          wasmMedianMs: median(modes.wasm.map((x) => x.totalMs)),
        });
      }
    }
  const layer = Array.from({ length: 256 }, () => Array(256).fill(94));
  const batchSizes = [];
  for (const count of [9, 256, 4096, 65536]) {
    const indices = Uint32Array.from({ length: count }, (_, i) => i);
    const samples = { js: [], wasm: [] };
    for (let run = 0; run < 8; run++)
      for (const mode of run % 2 ? ["wasm", "js"] : ["js", "wasm"]) {
        const data = clone(layer),
          edit = transaction("batch", 0, 256),
          start = performance.now();
        const values =
          mode === "wasm"
            ? kernel.autotiles(data, indices).value
            : indices.map((i) =>
                autotileId(data, 1, i % 256, Math.floor(i / 256))
              );
        for (let i = 0; i < count; i++)
          writeCell(
            edit,
            data,
            indices[i] % 256,
            Math.floor(indices[i] / 256),
            values[i]
          );
        pack(edit);
        if (run >= 3) samples[mode].push(performance.now() - start);
      }
    batchSizes.push({
      count,
      samples,
      jsMedianMs: median(samples.js),
      wasmMedianMs: median(samples.wasm),
    });
  }
  return { loadMs, results, batchSizes };
}

async function exportOnce(
  mode,
  format = "png",
  size = 256,
  signal,
  onProgress = () => {},
  scale = size === 256 ? 0.5 : 1,
  onTiming
) {
  const { map, assets } = await ready;
  const fixture = largeMap(map, size);
  if (mode === "legacy")
    return legacyRenderer.exportImage.call(
      {
        ...legacyRenderer,
        ...assets,
        maps: { sample: fixture },
        activeMap: "sample",
        backgroundColor: "#333",
      },
      format,
      scale,
      onProgress,
      signal
    );
  return exportMapImage(fixture, assets, {
    format,
    scale,
    background: "#333",
    signal,
    onProgress,
    mode,
    onTiming,
  });
}

async function measureExport(mode, format = "png") {
  const intervals = [],
    rafGaps = [],
    longTasks = [];
  let last = performance.now(),
    rafLast = last,
    frame;
  const timer = setInterval(() => {
    const now = performance.now();
    intervals.push(Math.max(0, now - last - 8));
    last = now;
  }, 8);
  const tick = (now) => {
    rafGaps.push(now - rafLast);
    rafLast = now;
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  const observer = new PerformanceObserver((list) =>
    longTasks.push(...list.getEntries().map((e) => e.duration))
  );
  observer.observe({ type: "longtask" });
  const start = performance.now();
  let phases;
  const blob = await exportOnce(
    mode,
    format,
    256,
    undefined,
    undefined,
    undefined,
    (timing) => {
      phases = timing;
    }
  );
  const totalMs = performance.now() - start;
  clearInterval(timer);
  cancelAnimationFrame(frame);
  await new Promise((resolve) => setTimeout(resolve, 60));
  longTasks.push(...observer.takeRecords().map((e) => e.duration));
  observer.disconnect();
  return {
    totalMs,
    phases,
    blobBytes: blob.size,
    timerLagP95Ms: percentile(intervals, 0.95),
    timerLagMaxMs: Math.max(0, ...intervals),
    rafGapP95Ms: percentile(rafGaps, 0.95),
    rafGapMaxMs: Math.max(0, ...rafGaps),
    longTasks,
  };
}

async function pixels(blob) {
  const bitmap = await createImageBitmap(blob),
    canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  canvas.width = canvas.height = 0;
  return data;
}
async function exportChecks() {
  const checks = [];
  for (const format of ["png", "jpg", "webp"]) {
    const a = await pixels(await exportOnce("legacy", format, 50));
    const b = await pixels(await exportOnce("worker", format, 50));
    if (a.length !== b.length || a.some((value, i) => value !== b[i]))
      throw Error(`${format} output pixels differ`);
    checks.push(`${format} decoded pixels equal baseline`);
  }
  for (const scale of [0.5, 0.25, 0.125]) {
    const a = await pixels(
      await exportOnce("legacy", "png", 50, undefined, undefined, scale)
    );
    const b = await pixels(
      await exportOnce("worker", "png", 50, undefined, undefined, scale)
    );
    if (a.length !== b.length || a.some((value, i) => value !== b[i]))
      throw Error("Scaled PNG differs: " + scale);
    checks.push("PNG pixels equal baseline at scale " + scale);
  }
  const largeBefore = await pixels(await exportOnce("legacy", "png", 256));
  const largeAfter = await pixels(await exportOnce("worker", "png", 256));
  if (
    largeBefore.length !== largeAfter.length ||
    largeBefore.some((value, i) => value !== largeAfter[i])
  )
    throw Error("Scaled 4096 PNG pixels differ");
  checks.push("4096x4096 scaled PNG decoded pixels equal baseline");
  const controller = new AbortController();
  let cancelled = false;
  try {
    await exportOnce("worker", "png", 256, controller.signal, () =>
      controller.abort()
    );
  } catch (error) {
    if (error.name !== "AbortError") throw error;
    cancelled = true;
  }
  if (!cancelled) throw Error("Worker cancel failed");
  checks.push("worker cancellation rejects without blob");
  await exportOnce("worker", "png", 50);
  checks.push("export works after cancellation");
  return checks;
}

async function workerParity() {
  const checks = [];
  const { map, assets } = await ready;
  let seed = 17;
  const fixture = {
    ...map,
    width: 41,
    height: 29,
    data: Array.from({ length: 3 }, () =>
      Array.from({ length: 29 }, () =>
        Array.from({ length: 41 }, () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed % 4 === 0
            ? 0
            : 384 + (seed % ((assets.tileset.height / 32) * 8));
        })
      )
    ),
  };
  for (const format of ["png", "jpg", "webp"])
    for (const scale of [1, 0.5, 0.25, 0.125]) {
      const original = await pixels(
        await window.usagiBefore.exportFixture(fixture, {
          format,
          scale,
          background: "#333",
        })
      );
      let timing;
      const actual = await pixels(
        await exportMapImage(fixture, assets, {
          format,
          scale,
          background: "#333",
          onTiming: (value) => {
            timing = value;
          },
        })
      );
      if (
        original.length !== actual.length ||
        original.some((v, i) => v !== actual[i])
      )
        throw Error(
          "Random layered tile pixels differ at " + format + " " + scale
        );
      if (timing.tileCacheBytes !== 256 * (32 * scale) ** 2 * 4)
        throw Error("Tile cache bound was not exercised");
      checks.push(
        "random layered pixels and 256-tile cache bound at " +
          format +
          " " +
          scale
      );
    }

  return checks;
}
window.usagiBenchmark = {
  workerParity,
  exportFixture: async (fixture, options) =>
    exportMapImage(fixture, (await ready).assets, options),
  kernelBenchmark,
  measureExport,
  exportChecks,
  exportOnce,
  supportsWorkerExport,
  ready,
};
