export const CACHE_BYTES = 64 * 1024 * 1024;
export const CHUNK_TILES = 32;

export class ChunkCache {
  constructor() {
    this.entries = new Map();
    this.bytes = 0;
  }
  get(key) {
    const canvas = this.entries.get(key);
    if (canvas) {
      this.entries.delete(key);
      this.entries.set(key, canvas);
    }
    return canvas;
  }
  delete(key) {
    const canvas = this.entries.get(key);
    if (!canvas) return;
    this.bytes -= canvas.width * canvas.height * 4;
    canvas.width = canvas.height = 0;
    this.entries.delete(key);
  }
  set(key, canvas) {
    this.delete(key);
    const size = canvas.width * canvas.height * 4;
    while (this.bytes + size > CACHE_BYTES && this.entries.size)
      this.delete(this.entries.keys().next().value);
    this.entries.set(key, canvas);
    this.bytes += size;
    return canvas;
  }
  clear() {
    for (const key of this.entries.keys()) this.delete(key);
  }
}
