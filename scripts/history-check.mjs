import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../src/utils/editHistory.js", import.meta.url),
  "utf8"
);
const { transaction, writeCell, pack, trimHistory, HISTORY_BYTES } =
  await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
const layer = [
    [0, 1],
    [2, 3],
  ],
  edit = transaction("Map001", 2, 2);
writeCell(edit, layer, 1, 0, 4);
writeCell(edit, layer, 1, 0, 5);
writeCell(edit, layer, 0, 0, 6);
writeCell(edit, layer, 0, 0, 0);
const record = pack(edit);
assert.deepEqual([...record.cells], [1, 1, 5]);
assert.equal(record.layer, 2);
assert.equal(pack(transaction("Map001", 0, 2)), null);
const state = { mapHistory: [], mapFuture: [], historyNotice: "" };
for (let i = 0; i < 501; i++) {
  state.mapHistory.push({ ...record, map: String(i) });
  trimHistory(state);
}
assert.equal(state.mapHistory.length, 500);
assert.equal(state.mapHistory[0].map, "1");
assert.ok(state.historyNotice);
state.mapHistory = [
  { cells: new Uint32Array(HISTORY_BYTES / 4) },
  { cells: new Uint32Array(3) },
];
trimHistory(state);
assert.equal(state.mapHistory.length, 1);
state.mapFuture = state.mapHistory;
state.mapHistory = [];
trimHistory(state);
assert.equal(state.mapFuture.length, 1);
console.log(
  "History: deduplication, no-op, layer, count and byte limits passed"
);
