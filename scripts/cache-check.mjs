import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../src/utils/chunkCache.js", import.meta.url),
  "utf8"
);
const { ChunkCache, CACHE_BYTES } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const cache = new ChunkCache();
for (let i = 0; i < 16; i++)
  cache.set(String(i), { width: 1024, height: 1024 });
assert.equal(cache.bytes, CACHE_BYTES);
cache.get("0");
cache.set("16", { width: 1024, height: 1024 });
assert.ok(cache.get("0"));
assert.equal(cache.get("1"), undefined);
assert.equal(cache.bytes, CACHE_BYTES);
const retained = cache.get("0");
cache.clear();
assert.equal(cache.bytes, 0);
assert.equal(retained.width, 0);
assert.equal(cache.entries.size, 0);
console.log(
  "Cache: byte limit, least recently used eviction and buffer release passed"
);
