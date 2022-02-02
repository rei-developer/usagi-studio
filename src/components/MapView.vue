<template>
  <div class="canvas-wrapper">
    <canvas id="mapCanvas" :width="width" :height="height">
      자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해주세요.
    </canvas>
  </div>
</template>

<style lang="scss" scoped>
.canvas-wrapper {
  width: 100%;
  height: 800px;
  overflow: auto;
}
</style>

<script>
const TILESIZE = 32;
const TOOLS = {
  BRUSH: 0,
  PAN: 1,
  FILL: 2,
};
const AUTOTILES = [
  [
    [27, 28, 33, 34],
    [5, 28, 33, 34],
    [27, 6, 33, 34],
    [5, 6, 33, 34],
    [27, 28, 33, 12],
    [5, 28, 33, 12],
    [27, 6, 33, 12],
    [5, 6, 33, 12],
  ],
  [
    [27, 28, 11, 34],
    [5, 28, 11, 34],
    [27, 6, 11, 34],
    [5, 6, 11, 34],
    [27, 28, 11, 12],
    [5, 28, 11, 12],
    [27, 6, 11, 12],
    [5, 6, 11, 12],
  ],
  [
    [25, 26, 31, 32],
    [25, 6, 31, 32],
    [25, 26, 31, 12],
    [25, 6, 31, 12],
    [15, 16, 21, 22],
    [15, 16, 21, 12],
    [15, 16, 11, 22],
    [15, 16, 11, 12],
  ],
  [
    [29, 30, 35, 36],
    [29, 30, 11, 36],
    [5, 30, 35, 36],
    [5, 30, 11, 36],
    [39, 40, 45, 46],
    [5, 40, 45, 46],
    [39, 6, 45, 46],
    [5, 6, 45, 46],
  ],
  [
    [25, 30, 31, 36],
    [15, 16, 45, 46],
    [13, 14, 19, 20],
    [13, 14, 19, 12],
    [17, 18, 23, 24],
    [17, 18, 11, 24],
    [41, 42, 47, 48],
    [5, 42, 47, 48],
  ],
  [
    [37, 38, 43, 44],
    [37, 6, 43, 44],
    [13, 18, 19, 24],
    [13, 14, 43, 44],
    [37, 42, 43, 48],
    [17, 18, 47, 48],
    [13, 18, 43, 48],
    [1, 2, 7, 8],
  ],
];

export default {
  name: "MapView",
  props: {
    activeMap: String,
    maps: Object,
    selectedTile: Array,
    autotiles: Array,
    mode: Number,
  },
  data: () => ({
    width: 0,
    height: 0,
    tileset: null,
    activeLayer: 2,
    tileAddStart: false,
    ix: 0,
    iy: 0,
  }),
  created() {
    this.init();
  },
  mounted() {
    this.getEventHandler("#mapCanvas", "pointerdown", (e) => {
      if (this.mode === TOOLS.BRUSH) {
        this.tileAddStart = true;
        this.ix = this.getTileLocation(e).tx;
        this.iy = this.getTileLocation(e).ty;
        this.addSelectedTile(e);
      }
    });
    this.getEventHandler("#mapCanvas", "pointermove", (e) => {
      if (this.selectedTile.length) {
        this.draw();
        if (this.mode === TOOLS.BRUSH) {
          this.previewSelectedTile(e);
          if (this.tileAddStart) {
            this.addSelectedTile(e);
          }
        }
      }
    });
    this.getEventHandler("#mapCanvas", "pointerup", () => {
      this.tileAddStart = false;
    });
    this.getEventHandler("#mapCanvas", "mouseleave", () => {
      this.draw();
    });
  },
  methods: {
    init() {
      this.width = this.maps[this.activeMap].width * TILESIZE;
      this.height = this.maps[this.activeMap].height * TILESIZE;
      this.tileset = new Image();
      this.tileset.src = require(`@/assets/tilesets/${
        this.maps[this.activeMap].tileset
      }.png`);
      this.tileset.onload = () => {
        this.draw();
      };
    },
    draw() {
      const ctx = this.getContext();
      ctx.clearRect(0, 0, this.width, this.height);
      this.maps[this.activeMap].data.forEach((layer, lindex) => {
        if (this.activeLayer >= 1 && this.activeLayer <= 3) {
          if (lindex + 1 > this.activeLayer) {
            ctx.globalAlpha = 0.3;
          } else if (lindex + 1 === this.activeLayer) {
            ctx.globalAlpha = 1;
          }
        }
        for (let y = 0; y < this.maps[this.activeMap].height; y++) {
          for (let x = 0; x < this.maps[this.activeMap].width; x++) {
            const tile = layer[y][x];
            ctx.globalAlpha = 1;
            if (this.activeLayer === 4) {
              this.drawTiles(ctx, x, y);
            }
            if (tile >= 384) {
              // 일반 타일
              const tileNum = tile - 384; // 오프셋
              const tileRow = parseInt(tileNum / 8);
              const tileCol = tileNum % 8;
              ctx.drawImage(
                this.tileset,
                tileCol * TILESIZE,
                tileRow * TILESIZE,
                TILESIZE,
                TILESIZE,
                x * TILESIZE,
                y * TILESIZE,
                TILESIZE,
                TILESIZE
              );
            } else if (tile > 0) {
              // 오토타일
              const autotileId = parseInt(tile / 48) - 1;
              const tileNum = tile % 48;
              const tiles = AUTOTILES[parseInt(tileNum / 8)][tileNum % 8];
              for (let i = 0; i < 5; i++) {
                const tile_position = tiles[i] - 1;
                ctx.drawImage(
                  this.autotiles[autotileId],
                  (tile_position % 6) * 16,
                  parseInt(tile_position / 6) * 16,
                  16,
                  16,
                  x * TILESIZE + (i % 2) * 16,
                  y * TILESIZE + parseInt(i / 2) * 16,
                  16,
                  16
                );
              }
            }
          }
        }
        if (this.activeLayer >= 1 && this.activeLayer <= 3 && lindex + 1 < this.activeLayer) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
          ctx.fillRect(0, 0, this.width, this.height);
        }
      });
    },
    getContext() {
      const canvas = this.$el.querySelector("#mapCanvas");
      return canvas.getContext("2d");
    },
    drawTiles(ctx, x, y) {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.rect(x * TILESIZE, y * TILESIZE, TILESIZE, TILESIZE);
      ctx.stroke();
    },
    getTileLocation(event) {
      const { x, y } = event.target.getBoundingClientRect();
      const tx = Math.floor(Math.max(event.clientX - x, 0) / TILESIZE);
      const ty = Math.floor(Math.max(event.clientY - y, 0) / TILESIZE);
      return { tx, ty };
    },
    previewSelectedTile(event) {
      const { tx, ty } = this.getTileLocation(event);
      const ix = this.selectedTile[0].x;
      const iy = this.selectedTile[0].y;
      if (this.activeLayer >= 1 && this.activeLayer <= 3) {
        const ctx = this.getContext();
        ctx.globalAlpha = 0.7;
        this.selectedTile.forEach((tile) => {
          if (tile.id >= 384) {
            ctx.drawImage(
              this.tileset,
              tile.x * TILESIZE,
              tile.y * TILESIZE,
              TILESIZE,
              TILESIZE,
              (tx + tile.x - ix) * TILESIZE,
              (ty + tile.y - iy) * TILESIZE,
              TILESIZE,
              TILESIZE
            );
          } else if (tile.id > 0) {
            const autotileId = tile.id - 1;
            if (this.autotiles[autotileId]) {
              ctx.drawImage(
                this.autotiles[autotileId],
                0,
                0,
                TILESIZE,
                TILESIZE,
                tx * TILESIZE,
                ty * TILESIZE,
                TILESIZE,
                TILESIZE
              );
            }
          }
        });
        const width =
          this.selectedTile[this.selectedTile.length - 1].x -
          this.selectedTile[0].x +
          1;
        const height =
          this.selectedTile[this.selectedTile.length - 1].y -
          this.selectedTile[0].y +
          1;
        this.drawRect(
          "#mapCanvas",
          tx * TILESIZE,
          ty * TILESIZE,
          width * TILESIZE,
          height * TILESIZE
        );
      }
    },
    addSelectedTile(event) {
      const { tx, ty } = this.getTileLocation(event);
      const ix = this.selectedTile[0].x;
      const iy = this.selectedTile[0].y;
      const layer = this.maps[this.activeMap].data[this.activeLayer - 1];
      if (this.activeLayer >= 1 && this.activeLayer <= 3) {
        this.selectedTile.forEach((tile) => {
          if (tile.id === 0) {
            layer[ty][tx] = 0;
          } else if (tile.id >= 384) {
            const tileOffsetX = tile.x - ix;
            const tileOffsetY = tile.y - iy;
            const width =
              Math.max.apply(
                null,
                this.selectedTile.map((item) => item.x)
              ) -
              Math.min.apply(
                null,
                this.selectedTile.map((item) => item.x)
              ) +
              1;
            const height =
              Math.max.apply(
                null,
                this.selectedTile.map((item) => item.y)
              ) -
              Math.min.apply(
                null,
                this.selectedTile.map((item) => item.y)
              ) +
              1;
            const repeatX = (tx - this.ix) % width;
            const repeatY = (ty - this.iy) % height;
            layer[ty + tileOffsetY - repeatY][tx + tileOffsetX - repeatX] =
              tile.id;
          } else if (tile.id > 0) {
            layer[ty][tx] = this.getAutotileId(tx, ty);
            const d = [
              [tx, ty - 1],
              [tx - 1, ty],
              [tx + 1, ty],
              [tx, ty + 1],
              [tx - 1, ty - 1],
              [tx + 1, ty - 1],
              [tx - 1, ty + 1],
              [tx + 1, ty + 1],
            ];
            d.forEach((item) => {
              if (
                item[0] > 0 &&
                item[1] > 0 &&
                item[0] < this.maps[this.activeMap].width &&
                item[1] < this.maps[this.activeMap].height
              ) {
                if (
                  tile.id === parseInt(layer[item[1]][item[0]] / 48) &&
                  layer[item[1]][item[0]]
                ) {
                  layer[item[1]][item[0]] = this.getAutotileId(
                    item[0],
                    item[1]
                  );
                }
              }
            });
          }
        });
      }
    },
    getAutotileId(x, y) {
      // 주변 타일을 비교하여 오토타일 id를 부여합니다.
      const NW = Math.pow(2, 0);
      const N = Math.pow(2, 1);
      const NE = Math.pow(2, 2);
      const W = Math.pow(2, 3);
      const E = Math.pow(2, 4);
      const SW = Math.pow(2, 5);
      const S = Math.pow(2, 6);
      const SE = Math.pow(2, 7);
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
        256: 46,
        0: 47,
        255: 0,
      };
      const layer = this.maps[this.activeMap].data[this.activeLayer - 1];
      const _id = this.selectedTile[0].id;
      if (!this.autotiles[_id]) return 0;
      const checkAutotile = (id) => {
        return _id === parseInt(id / 48) || id === 0;
      };
      let sum = 0;
      let n = false,
        e = false,
        s = false,
        w = false;
      if (!layer[y][x]) return 48 * _id;
      if ((y > 0 && checkAutotile(layer[y - 1][x])) || y === 0) {
        n = true;
        sum += N;
      }
      if ((x > 0 && checkAutotile(layer[y][x - 1])) || x === 0) {
        w = true;
        sum += W;
      }
      if (
        (x < this.maps[this.activeMap].width &&
          checkAutotile(layer[y][x + 1])) ||
        x === this.maps[this.activeMap].width - 1
      ) {
        e = true;
        sum += E;
      }
      if (
        (y < this.maps[this.activeMap].height &&
          checkAutotile(layer[y + 1][x])) ||
        y === this.maps[this.activeMap].height - 1
      ) {
        s = true;
        sum += S;
      }
      if (
        (n && w && y > 0 && x > 0 && checkAutotile(layer[y - 1][x - 1])) ||
        y === 0 ||
        x === 0
      )
        sum += NW;
      if (
        (n &&
          e &&
          y > 0 &&
          x < this.maps[this.activeMap].width &&
          checkAutotile(layer[y - 1][x + 1])) ||
        y === 0 ||
        x === this.maps[this.activeMap].width - 1
      )
        sum += NE;
      if (
        (s &&
          w &&
          y < this.maps[this.activeMap].height &&
          x > 0 &&
          checkAutotile(layer[y + 1][x - 1])) ||
        y === this.maps[this.activeMap].height - 1 ||
        x === 0
      )
        sum += SW;
      if (
        (s &&
          e &&
          x < this.maps[this.activeMap].width &&
          y < this.maps[this.activeMap].height &&
          checkAutotile(layer[y + 1][x + 1])) ||
        x === this.maps[this.activeMap].width - 1 ||
        y === this.maps[this.activeMap].height - 1
      )
        sum += SE;
      return BITMASK[sum] + 48 * _id;
    },
    removeTile(event) {
      const { tx, ty } = this.getTileLocation(event);
      const layer = this.maps[this.activeMap].data[this.activeLayer - 1];
      if (this.activeLayer >= 1 && this.activeLayer <= 3) {
        layer[ty][tx] = 0;
      }
    },
    getEventHandler(id, event, callback) {
      return this.$el.querySelector(id).addEventListener(event, callback);
    },
    drawRect(canvasId, x, y, width, height, style = "rgba(0, 0, 0, 1") {
      const ctx = this.getContext(canvasId);
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = style;
      ctx.rect(x, y, width, height);
      ctx.stroke();
    },
  },
};
</script>
