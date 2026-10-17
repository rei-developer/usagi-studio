export async function createKernel(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const api = instance.exports;
  const run = (layer, indices, start) => {
    const begin = performance.now();
    const width = layer[0].length,
      height = layer.length,
      length = width * height;
    const count = indices ? indices.length : length;
    const input = api.alloc(length),
      output = api.alloc(count),
      candidates = indices ? api.alloc(count) : 0;
    try {
      const memory = new Uint32Array(api.memory.buffer);
      layer.forEach((row, y) => memory.set(row, input / 4 + y * width));
      if (indices) memory.set(indices, candidates / 4);
      const prepared = performance.now();
      const written = indices
        ? (api.autotile_batch(input, width, height, candidates, count, output),
          count)
        : api.connected_area(input, width, height, start, output);
      const computed = performance.now();
      // Rust allocation may grow memory; always create a fresh view after the call.
      const value = new Uint32Array(api.memory.buffer, output, written).slice();
      const copied = performance.now();
      return {
        value,
        timing: {
          prepareMs: prepared - begin,
          computeMs: computed - prepared,
          copyMs: copied - computed,
        },
      };
    } finally {
      api.free(input, length);
      api.free(output, count);
      if (indices) api.free(candidates, count);
    }
  };
  return {
    fill: (layer, x, y) => run(layer, null, y * layer[0].length + x),
    autotiles: (layer, indices) => run(layer, indices),
    memoryBytes: () => api.memory.buffer.byteLength,
  };
}
