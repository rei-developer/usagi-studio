import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const url = (text) =>
  `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`;
const read = (name) =>
  readFileSync(new URL(`../src/utils/${name}.js`, import.meta.url), "utf8");
const source = read("mapOperations")
  .replace('"./autotileId"', JSON.stringify(url(read("autotileId"))))
  .replace('"./mapFiles"', JSON.stringify(url(read("mapFiles"))));
const {
  newMap,
  resizeMap,
  croppedCells,
  importMap,
  checkTileIds,
  nextMapId,
  snapshotMaps,
} = await import(url(source));
const raw = JSON.parse(
  readFileSync(
    new URL("../src/assets/maps/Map001.json", import.meta.url),
    "utf8"
  )
);
const base = importMap(JSON.stringify(raw));
const blank = newMap(base, "test", 3, 3);
assert.equal(nextMapId({ Map001: {}, Map002: {} }), "Map003");
assert.equal(blank.data.flat(2).some(Boolean), false);
assert.deepEqual(blank.collisions, base.collisions);
blank.data[0][2][2] = 393;
blank.data[1][0][0] = 94;
assert.equal(croppedCells(blank, 2, 2), 1);
const small = resizeMap(blank, 2, 2);
assert.equal(small.data[1][0][0], 94);
assert.equal(resizeMap(blank, 4, 4).data[0][3][3], 0);
assert.throws(() => resizeMap({ ...blank, events: [{}] }, 2, 2));
assert.throws(() => newMap(base, "", 2, 2));
for (const width of [0, 257, 1.5, "2"])
  assert.throws(() => importMap(JSON.stringify({ ...raw, width })));
for (const tileset of ["../hospital", "a/b", "C:\\file", "\u0000"])
  assert.throws(() => importMap(JSON.stringify({ ...raw, tileset })));
const assets = {
  tileset: { width: 256, height: 6400 },
  autotiles: [true, true, true],
};
checkTileIds(base, assets);
for (const id of [1, 40000, 383]) {
  blank.data[0][0][0] = id;
  assert.throws(() => checkTileIds(blank, assets));
}
const snapshot = await snapshotMaps({ Map001: base }, () => {});
assert.deepEqual(snapshot.Map001, raw);
base.data[0][0][0] = 999;
assert.notEqual(snapshot.Map001.data[0][0], 999);

// Exercise IDB lifecycle without touching a real user database.
const requests = [];
globalThis.indexedDB = {
  open() {
    const request = {};
    requests.push(request);
    return request;
  },
};
const storage = await import(url(read("projectStorage")));
const blocked = storage.readProject();
const request = requests.at(-1);
request.onblocked();
await assert.rejects(blocked);
let closed = 0;
request.result = {
  close() {
    closed++;
  },
};
request.onsuccess();
assert.equal(closed, 1);
const pending = storage.readProject();
const next = requests.at(-1);
const operation = { result: "saved" };
const tx = {
  objectStore() {
    return {
      get() {
        return operation;
      },
    };
  },
};
next.result = {
  close() {
    closed++;
  },
  transaction() {
    return tx;
  },
};
next.onsuccess();
await Promise.resolve();
next.result.onversionchange();
tx.oncomplete();
assert.equal(await pending, "saved");
assert.equal(closed, 3);
console.log(
  "Map operations: dimensions, crop, metadata, IDs, snapshot and IDB lifecycle passed"
);
