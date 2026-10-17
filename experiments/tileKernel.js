import { createKernel } from "./wasmKernel";

let kernel, loading;
export function warmTileKernel() {
  if (!loading)
    loading = (async () => {
      try {
        const response = await fetch(
          new URL("../output/tile-kernel.wasm", import.meta.url)
        );
        if (!response.ok) return;
        kernel = await createKernel(await response.arrayBuffer());
      } catch {
        kernel = null;
      }
    })();
  return loading;
}

export function batchAutotileIds(layer, affected) {
  // shortcut: only measured 256x256-or-smaller dense batches use WASM.
  if (!kernel || affected.size < 4096 || layer.length * layer[0].length > 65536)
    return null;
  try {
    const indices = Uint32Array.from(affected);
    return { indices, ids: kernel.autotiles(layer, indices).value };
  } catch {
    kernel = null;
    return null;
  }
}
