import { autotileId } from "./autotileId";
import { restoreMaps } from "./mapFiles";

export const MAX_IMPORT_BYTES = 16 * 1024 * 1024;

export function checkDimensions(width, height) {
  if (![width, height].every((n) => Number.isInteger(n) && n >= 1 && n <= 256))
    throw new Error("너비와 높이는 1–256 사이의 정수여야 합니다.");
}

export function nextMapId(maps) {
  let number = 1;
  while (maps[`Map${String(number).padStart(3, "0")}`]) number++;
  return `Map${String(number).padStart(3, "0")}`;
}

export function newMap(source, name, width, height) {
  checkDimensions(width, height);
  if (!name.trim()) throw new Error("맵 이름을 입력해주세요.");
  const metadata = Object.fromEntries(
    Object.entries(source).filter(([key]) => key !== "data")
  );
  return {
    ...structuredClone(metadata),
    name: name.trim(),
    width,
    height,
    events: [],
    data: Array.from({ length: 3 }, () =>
      Array.from({ length: height }, () => Array(width).fill(0))
    ),
  };
}

export function croppedCells(map, width, height) {
  let count = 0;
  for (const layer of map.data)
    for (let y = 0; y < map.height; y++)
      for (let x = 0; x < map.width; x++)
        if ((x >= width || y >= height) && layer[y][x]) count++;
  return count;
}

export function resizeMap(map, width, height) {
  checkDimensions(width, height);
  if (map.events?.length)
    throw new Error("이벤트가 있는 맵은 크기를 변경할 수 없습니다.");
  const data = map.data.map((layer) =>
    Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => layer[y]?.[x] ?? 0)
    )
  );
  for (const layer of data)
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const id = layer[y][x];
        if (
          id >= 48 &&
          id < 384 &&
          (x === width - 1 ||
            y === height - 1 ||
            x === map.width - 1 ||
            y === map.height - 1)
        )
          layer[y][x] = autotileId(layer, Math.floor(id / 48), x, y);
      }
  return { ...map, width, height, data };
}

export function importMap(text) {
  const value = JSON.parse(text);
  checkDimensions(value?.width, value?.height);
  if (!Array.isArray(value.events ?? []))
    throw new Error("이벤트 목록 형식이 올바르지 않습니다.");
  const map = restoreMaps({
    version: 1,
    activeMap: "import",
    maps: { import: value },
  }).import;
  const names = [map.tileset, ...map.autotiles.filter(Boolean)];
  if (
    !map.tileset ||
    names.some(
      (name) =>
        /[\\/:]/.test(name) ||
        [...name].some((char) => char.charCodeAt(0) < 32) ||
        name === "." ||
        name === ".."
    )
  )
    throw new Error("타일 자산은 경로가 아닌 파일명이어야 합니다.");
  return map;
}

export function checkTileIds(map, assets) {
  const count = 8 * Math.floor(assets.tileset.height / 32);
  if (assets.tileset.width !== 256 || assets.tileset.height % 32)
    throw new Error("타일셋은 너비 256px, 높이 32px 배수여야 합니다.");
  for (const layer of map.data)
    for (const row of layer)
      for (const id of row)
        if (
          id !== 0 &&
          (id < 48 ||
            (id < 384
              ? !assets.autotiles[Math.floor(id / 48) - 1]
              : id >= 384 + count))
        )
          throw new Error(`타일 ID ${id}에 해당하는 이미지가 없습니다.`);
}

export async function snapshotMaps(maps, onProgress) {
  const result = {};
  const total = Object.values(maps).reduce((n, map) => n + map.height * 3, 0);
  let done = 0,
    started = performance.now();
  for (const [id, map] of Object.entries(maps)) {
    const { data, ...metadata } = map;
    const copied = structuredClone(metadata);
    result[id] = Object.fromEntries(
      Object.keys(map).map((key) => [key, key === "data" ? [] : copied[key]])
    );
    for (const layer of data) {
      const flat = [];
      result[id].data.push(flat);
      for (const row of layer) {
        for (const tile of row) flat.push(tile);
        done++;
        if (performance.now() - started >= 8) {
          onProgress(Math.round((done / total) * 100));
          await new Promise((resolve) => setTimeout(resolve, 0));
          started = performance.now();
        }
      }
    }
  }
  onProgress(100);
  return result;
}
