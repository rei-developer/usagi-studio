export const SAVE_KEY = "usagi-studio.maps.v1";

export function serializeMap(map) {
  return { ...map, data: map.data.map((layer) => layer.flat()) };
}

export function restoreMaps(saved) {
  if (saved.version !== 1 || !saved.maps?.[saved.activeMap]) {
    throw new Error("지원하지 않는 저장 데이터입니다.");
  }
  return Object.fromEntries(
    Object.entries(saved.maps).map(([id, map]) => {
      if (
        !Number.isInteger(map.width) ||
        map.width < 1 ||
        !Number.isInteger(map.height) ||
        map.height < 1 ||
        typeof map.name !== "string" ||
        typeof map.tileset !== "string" ||
        !Array.isArray(map.autotiles) ||
        map.autotiles.length !== 7 ||
        !map.autotiles.every((name) => typeof name === "string") ||
        !Array.isArray(map.data) ||
        map.data.length !== 3 ||
        !map.data.every(
          (layer) =>
            Array.isArray(layer) &&
            layer.length === map.width * map.height &&
            layer.every((tile) => Number.isInteger(tile) && tile >= 0)
        )
      )
        throw new Error("저장된 맵 형식이 올바르지 않습니다.");
      return [
        id,
        {
          ...map,
          data: map.data.map((layer) =>
            Array.from({ length: map.height }, (_, y) =>
              layer.slice(y * map.width, (y + 1) * map.width)
            )
          ),
        },
      ];
    })
  );
}
