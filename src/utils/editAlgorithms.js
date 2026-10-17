export function connectedArea(layer, x, y) {
  const width = layer[0].length;
  const height = layer.length;
  const group = (id) => (id >= 48 && id < 384 ? Math.floor(id / 48) * 48 : id);
  const target = group(layer[y][x]);
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;
  const add = (index) => {
    if (visited[index]) return;
    visited[index] = 1;
    if (group(layer[Math.floor(index / width)][index % width]) === target) {
      queue[tail++] = index;
    }
  };
  add(y * width + x);
  while (head < tail) {
    const index = queue[head++];
    const cx = index % width;
    if (index >= width) add(index - width);
    if (index + width < visited.length) add(index + width);
    if (cx > 0) add(index - 1);
    if (cx + 1 < width) add(index + 1);
  }
  return queue.subarray(0, tail);
}

export function pattern(tiles) {
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const tile of tiles) {
    left = Math.min(left, tile.x);
    top = Math.min(top, tile.y);
    right = Math.max(right, tile.x);
    bottom = Math.max(bottom, tile.y);
  }
  const width = right - left + 1;
  const height = bottom - top + 1;
  const cells = new Array(width * height);
  for (const tile of tiles)
    cells[(tile.y - top) * width + tile.x - left] = tile;
  return (x, y) =>
    cells[
      (((y % height) + height) % height) * width +
        (((x % width) + width) % width)
    ];
}

export function ellipseContains(x, y, x0, y0, x1, y1) {
  const width = Math.abs(x1 - x0) + 1;
  const height = Math.abs(y1 - y0) + 1;
  const c = Math.sqrt(Math.abs((width / 2) ** 2 - (height / 2) ** 2));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const dx = width > height ? c : 0;
  const dy = width > height ? 0 : c;
  return (
    Math.round(
      Math.hypot(x - cx + dx, y - cy + dy) +
        Math.hypot(x - cx - dx, y - cy - dy)
    ) < Math.max(width, height)
  );
}
