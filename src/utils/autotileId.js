const BITMASK = {
  254: 1,
  251: 2,
  250: 3,
  127: 4,
  126: 5,
  123: 6,
  122: 7,
  223: 8,
  222: 9,
  219: 10,
  218: 11,
  95: 12,
  94: 13,
  91: 14,
  90: 15,
  214: 16,
  210: 17,
  86: 18,
  82: 19,
  248: 20,
  120: 21,
  216: 22,
  88: 23,
  107: 24,
  75: 25,
  106: 26,
  74: 27,
  31: 28,
  30: 29,
  27: 30,
  26: 31,
  66: 32,
  24: 33,
  208: 34,
  80: 35,
  104: 36,
  72: 37,
  11: 38,
  10: 39,
  22: 40,
  18: 41,
  64: 42,
  16: 43,
  2: 44,
  8: 45,
  0: 46,
  255: 0,
};

export function autotileId(layer, _id, x, y) {
  // 주변 타일을 비교하여 오토타일 id를 부여합니다.
  const NW = Math.pow(2, 0);
  const N = Math.pow(2, 1);
  const NE = Math.pow(2, 2);
  const W = Math.pow(2, 3);
  const E = Math.pow(2, 4);
  const SW = Math.pow(2, 5);
  const S = Math.pow(2, 6);
  const SE = Math.pow(2, 7);

  // Empty cells and positions outside the map never connect.
  const connected = (dx, dy) =>
    _id === Math.floor(layer[y + dy]?.[x + dx] / 48);
  const n = connected(0, -1);
  const e = connected(1, 0);
  const s = connected(0, 1);
  const w = connected(-1, 0);
  let sum = (n ? N : 0) + (e ? E : 0) + (s ? S : 0) + (w ? W : 0);
  if (n && w && connected(-1, -1)) sum += NW;
  if (n && e && connected(1, -1)) sum += NE;
  if (s && w && connected(-1, 1)) sum += SW;
  if (s && e && connected(1, 1)) sum += SE;
  return BITMASK[sum] + 48 * _id;
}
