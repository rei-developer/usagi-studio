import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const moduleFrom = async (path) =>
  import(
    `data:text/javascript;base64,${readFileSync(new URL(path, root)).toString("base64")}`
  );
const { createKernel } = await moduleFrom("experiments/wasmKernel.js");
const { connectedArea } = await moduleFrom("src/utils/editAlgorithms.js");
const { autotileId } = await moduleFrom("src/utils/autotileId.js");
const kernel = await createKernel(
  readFileSync(
    new URL(
      "rust/tile-kernel/target/wasm32-unknown-unknown/release/usagi_tile_kernel.wasm",
      root
    )
  )
);
let seed = 481;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0);
for (let mask = 0; mask < 256; mask++) {
  const layer = Array.from({ length: 3 }, () => Array(3).fill(0));
  layer[1][1] = 94;
  const cells = [0, 1, 2, 3, 5, 6, 7, 8];
  cells.forEach((index, bit) => {
    if (mask & (1 << bit)) layer[Math.floor(index / 3)][index % 3] = 48;
  });
  assert.equal(
    kernel.autotiles(layer, new Uint32Array([4])).value[0],
    autotileId(layer, 1, 1, 1)
  );
}
for (let run = 0; run < 100; run++) {
  const width = 1 + (random() % 32),
    height = 1 + (random() % 32);
  const layer = Array.from({ length: height }, () =>
    Array.from(
      { length: width },
      () => [0, 48, 94, 96, 142, 384, 393][random() % 7]
    )
  );
  const x = random() % width,
    y = random() % height;
  assert.deepEqual(kernel.fill(layer, x, y).value, connectedArea(layer, x, y));
  const indices = Uint32Array.from({ length: width * height }, (_, i) => i);
  const actual = kernel.autotiles(layer, indices).value;
  indices.forEach((i) => {
    const id = layer[Math.floor(i / width)][i % width];
    assert.equal(
      actual[i],
      id >= 48 && id < 384
        ? autotileId(
            layer,
            Math.floor(id / 48),
            i % width,
            Math.floor(i / width)
          )
        : id
    );
  });
}
const big = Array.from({ length: 256 }, () => Array(256).fill(48));
for (let i = 0; i < 10; i++)
  assert.equal(kernel.fill(big, 0, 0).value.length, 65536);
const memory = kernel.memoryBytes();
for (let i = 0; i < 100; i++) kernel.fill(big, 0, 0);
assert.equal(kernel.memoryBytes(), memory);
console.log(
  "WASM: 256 neighbor masks, 100 random connectivity/edge fixtures, repeated allocation memory bound passed"
);
