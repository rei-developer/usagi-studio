export const HISTORY_BYTES = 64 * 1024 * 1024;
export const HISTORY_COUNT = 500;

export function transaction(map, layer, width) {
  return { map, layer, width, changes: new Map() };
}

export function writeCell(edit, data, x, y, value) {
  if (data[y][x] === value) return false;
  const index = y * edit.width + x;
  const previous = edit.changes.get(index);
  edit.changes.set(index, {
    before: previous ? previous.before : data[y][x],
    after: value,
  });
  data[y][x] = value;
  return true;
}

export function pack(edit) {
  let count = 0;
  for (const value of edit.changes.values())
    if (value.before !== value.after) count++;
  if (!count) return null;
  const cells = new Uint32Array(count * 3);
  let i = 0;
  for (const [index, value] of edit.changes) {
    if (value.before === value.after) continue;
    cells[i++] = index;
    cells[i++] = value.before;
    cells[i++] = value.after;
  }
  return { map: edit.map, layer: edit.layer, width: edit.width, cells };
}

export function trimHistory(state) {
  let bytes = [...state.mapHistory, ...state.mapFuture].reduce(
    (sum, item) => sum + item.cells.byteLength,
    0
  );
  let trimmed = false;
  while (
    bytes > HISTORY_BYTES ||
    state.mapHistory.length + state.mapFuture.length > HISTORY_COUNT
  ) {
    const oldest = [...state.mapHistory, ...state.mapFuture].reduce((a, b) =>
      (b.sequence ?? Infinity) < (a.sequence ?? Infinity) ? b : a
    );
    const list = state.mapHistory.includes(oldest)
      ? state.mapHistory
      : state.mapFuture;
    const [item] = list.splice(list.indexOf(oldest), 1);
    bytes -= item.cells.byteLength;
    trimmed = true;
  }
  if (trimmed)
    state.historyNotice =
      "실행 취소 한도에 도달해 가장 오래된 이력을 제거했습니다.";
}
