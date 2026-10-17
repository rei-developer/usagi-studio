// Baseline frozen from 933521a; only imported by the comparison harness.
import { TILESIZE } from "../src/utils/tileset";
import { canExport, imageSize } from "../src/utils/imageExport";
export const legacyRenderer = {
  drawTile(context, _id, x, y, zoom = this.zoom) {
    if (_id >= 384) {
      // 일반 타일
      const tileNum = _id - 384; // 오프셋
      const tileRow = parseInt(tileNum / 8);
      const tileCol = tileNum % 8;
      context.drawImage(
        this.tileset,
        tileCol * TILESIZE,
        tileRow * TILESIZE,
        TILESIZE,
        TILESIZE,
        x * TILESIZE * zoom,
        y * TILESIZE * zoom,
        TILESIZE * zoom,
        TILESIZE * zoom
      );
    } else if (_id >= 48) {
      // 오토타일
      const id = parseInt(_id / 48) - 1;
      if (!this.autotiles[id]) return;
      const index = _id % 48;
      context.drawImage(
        this.autotileAtlases[id],
        (index % 8) * TILESIZE,
        Math.floor(index / 8) * TILESIZE,
        TILESIZE,
        TILESIZE,
        x * TILESIZE * zoom,
        y * TILESIZE * zoom,
        TILESIZE * zoom,
        TILESIZE * zoom
      );
    }
  },
  async exportImage(format, scale = 1, onProgress = () => {}, signal) {
    const mime = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" }[
      format
    ];
    const map = this.maps[this.activeMap];
    if (!mime || !canExport(map.width, map.height, scale))
      throw new Error("이미지 출력 한도를 초과했습니다.");
    const layers = map.data.map((layer) => layer.map((row) => row.slice()));
    const check = () => {
      if (signal?.aborted) throw new DOMException("취소", "AbortError");
    };
    await Promise.all(
      [this.tileset, ...this.autotiles]
        .filter(Boolean)
        .map((image) => image.decode())
    );
    check();
    const canvas = document.createElement("canvas");
    Object.assign(canvas, imageSize(map.width, map.height, scale));
    try {
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = false;
      if (format === "jpg") {
        context.fillStyle = this.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      const total = layers.length * map.width * map.height;
      let done = 0,
        start = performance.now();
      for (const layer of layers)
        for (let y = 0; y < map.height; y++)
          for (let x = 0; x < map.width; x++) {
            this.drawTile(context, layer[y][x], x, y, scale);
            done++;
            if (done % 256 === 0 && performance.now() - start >= 8) {
              onProgress(Math.floor((done / total) * 95));
              await new Promise((resolve) => setTimeout(resolve, 0));
              check();
              start = performance.now();
            }
          }
      check();
      onProgress(95);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, mime, 0.95)
      );
      check();
      if (!blob || blob.type !== mime)
        throw new Error("이미지 인코딩을 지원하지 않습니다.");
      onProgress(100);
      return blob;
    } finally {
      canvas.width = canvas.height = 0;
    }
  },
};
