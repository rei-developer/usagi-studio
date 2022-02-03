<template>
  <div class="map-view-wrapper">
    <div class="content custom-scroll-box">
      <canvas id="mapCanvas" :width="width" :height="height">
        자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해주세요.
      </canvas>
    </div>
    <div class="bottom">
      <div class="item">
        <span v-if="isInside">{{ x }}, {{ y }}</span>
      </div>
      <div class="item">1: 이벤트 이름</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-view-wrapper {
  display: flex;
  flex-direction: column;
  width: calc(100% - 267px);
  height: calc(100vh - 100px);
  border-left: 1px solid #333;
  > .content {
    background: #000;
    overflow: auto;
  }
  > .bottom {
    display: flex;
    justify-content: flex-end;
    height: 19px;
    line-height: 21px;
    font-size: 14px;
    border-top: 1px solid #333;
    background: var(--primary);
    > .item {
      padding: 0 4px;
    }
    > .item:not(:last-child) {
      border-right: 1px solid #33333333;
    }
  }
}
</style>

<script>
import { mapMutations } from "vuex";

const MAP_CANVAS_ID = "#mapCanvas";

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
    activeLayer: Number,
    maps: Object,
    autotiles: Array,
    mode: Number,
    backgroundColor: String,
  },
  data: () => ({
    width: 0,
    height: 0,
    tileset: null,
    tileAddStart: false,
    tileSelectStart: {},
    ix: 0,
    iy: 0,
    mouseX: undefined,
    mouseY: undefined,
  }),
  watch: {
    activeLayer() {
      this.draw();
    },
  },
  created() {
    this.init();
  },
  mounted() {
    this.getEventHandler(MAP_CANVAS_ID, "pointerdown", this.pointerDownEvent);
    this.getEventHandler(MAP_CANVAS_ID, "pointermove", this.pointerMoveEvent);
    this.getEventHandler(MAP_CANVAS_ID, "pointerup", this.pointerUpEvent);
    this.getEventHandler(MAP_CANVAS_ID, "mouseleave", this.mouseLeaveEvent);
    this.getEventHandler(MAP_CANVAS_ID, "contextmenu", this.contextMenuEvent);
  },
  beforeUnmount() {
    this.removeEventHandler(
      MAP_CANVAS_ID,
      "pointerdown",
      this.pointerDownEvent
    );
    this.removeEventHandler(
      MAP_CANVAS_ID,
      "pointermove",
      this.pointerMoveEvent
    );
    this.removeEventHandler(MAP_CANVAS_ID, "pointerup", this.pointerUpEvent);
    this.removeEventHandler(MAP_CANVAS_ID, "mouseleave", this.mouseLeaveEvent);
    this.removeEventHandler(
      MAP_CANVAS_ID,
      "contextmenu",
      this.contextMenuEvent
    );
  },
  computed: {
    drawable() {
      return this.activeLayer >= 1 && this.activeLayer <= 3;
    },
    layer() {
      return this.drawable
        ? this.maps[this.activeMap].data[this.activeLayer - 1]
        : null;
    },
    selectedTiles() {
      return this.$store.state.data.selectedTiles || [];
    },
    x() {
      return this.mouseX.toString().padStart(3, "0");
    },
    y() {
      return this.mouseY.toString().padStart(3, "0");
    },
    isInside() {
      return this.mouseX !== undefined && this.mouseY !== undefined;
    },
  },
  methods: {
    ...mapMutations(["updateFields"]),
    init() {
      this.width = this.maps[this.activeMap].width * TILESIZE;
      this.height = this.maps[this.activeMap].height * TILESIZE;
      this.tileset = new Image();
      this.tileset.src = `/tilesets/${this.maps[this.activeMap].tileset}.png`;
      this.tileset.onload = () => {
        this.draw();
      };
    },
    draw() {
      const ctx = this.getContext();
      ctx.clearRect(0, 0, this.width, this.height);
      this.maps[this.activeMap].data.forEach((layer, lindex) => {
        ctx.globalAlpha = 1;
        if (lindex + 1 === 1) {
          ctx.fillStyle = this.backgroundColor;
          ctx.fillRect(0, 0, this.width, this.height);
        }
        if (this.drawable) {
          if (lindex + 1 > this.activeLayer) {
            ctx.globalAlpha = 0.3;
          } else if (lindex + 1 === this.activeLayer) {
            ctx.globalAlpha = 1;
          }
        }
        for (let y = 0; y < this.maps[this.activeMap].height; y++) {
          for (let x = 0; x < this.maps[this.activeMap].width; x++) {
            const tile = layer[y][x];
            if (this.activeLayer === 4) {
              ctx.globalAlpha = 0.6;
              this.drawTiles(ctx, x, y);
              ctx.globalAlpha = 1;
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
        if (this.drawable && lindex + 1 === this.activeLayer - 1) {
          ctx.fillStyle = "rgba(0, 0, 0, .5)";
          ctx.fillRect(0, 0, this.width, this.height);
        }
      });
    },
    getContext() {
      const canvas = this.$el.querySelector(MAP_CANVAS_ID);
      return canvas.getContext("2d");
    },
    drawTiles(ctx, x, y) {
      ctx.beginPath();
      ctx.lineWidth = 0.5;
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
      const ix = this.selectedTiles[0].x;
      const iy = this.selectedTiles[0].y;
      if (this.drawable) {
        const ctx = this.getContext();
        ctx.globalAlpha = 0.7;
        this.selectedTiles.forEach((tile) => {
          if (tile.id >= 384) {
            const tileNum = tile.id - 384; // 오프셋
            const tileRow = parseInt(tileNum / 8);
            const tileCol = tileNum % 8;
            ctx.drawImage(
              this.tileset,
              tileCol * TILESIZE,
              tileRow * TILESIZE,
              TILESIZE,
              TILESIZE,
              (tx + tile.x - ix) * TILESIZE,
              (ty + tile.y - iy) * TILESIZE,
              TILESIZE,
              TILESIZE
            );
          } else if (tile.id > 8) {
            const autotileId = parseInt(tile.id / 48) - 1;
            if (this.autotiles[autotileId]) {
              const tileNum = tile.id % 48;
              const tiles = AUTOTILES[parseInt(tileNum / 8)][tileNum % 8];
              for (let i = 0; i < 5; i++) {
                const tile_position = tiles[i] - 1;
                ctx.drawImage(
                  this.autotiles[autotileId],
                  (tile_position % 6) * 16,
                  parseInt(tile_position / 6) * 16,
                  16,
                  16,
                  (tx + tile.x - ix) * TILESIZE + (i % 2) * 16,
                  (ty + tile.y - iy) * TILESIZE + parseInt(i / 2) * 16,
                  16,
                  16
                );
              }
            }
          } else if (tile.id > 0) {
            const autotileId = tile.id - 1;
            if (this.autotiles[autotileId]) {
              ctx.drawImage(
                this.autotiles[autotileId],
                0,
                0,
                TILESIZE,
                TILESIZE,
                (tx + tile.x - ix) * TILESIZE,
                (ty + tile.y - iy) * TILESIZE,
                TILESIZE,
                TILESIZE
              );
            }
          }
        });
        const width =
          this.selectedTiles[this.selectedTiles.length - 1].x -
          this.selectedTiles[0].x +
          1;
        const height =
          this.selectedTiles[this.selectedTiles.length - 1].y -
          this.selectedTiles[0].y +
          1;
        this.drawRect(
          MAP_CANVAS_ID,
          tx * TILESIZE,
          ty * TILESIZE,
          width * TILESIZE,
          height * TILESIZE
        );
      }
    },
    getSelectedTile(event) {
      // const offset = 384;
      const { tx, ty } = this.getTileLocation(event);
      const newSelection = [];
      if (this.tileSelectStart) {
        for (
          let ix = Math.min(this.tileSelectStart.x, tx);
          ix < Math.max(this.tileSelectStart.x, tx) + 1;
          ix++
        ) {
          for (
            let iy = Math.min(this.tileSelectStart.y, ty);
            iy < Math.max(this.tileSelectStart.y, ty) + 1;
            iy++
          ) {
            newSelection.push({
              id: this.layer[iy][ix],
              x: ix,
              y: iy,
              shiftKey: event.shiftKey,
            });
          }
        }
      }
      console.log(newSelection);
      if (newSelection.length > 0) return newSelection;
      return [
        { id: this.layer[ty][tx], x: tx, y: ty, shiftKey: event.shiftKey },
      ];
    },
    drawSelectedTile(x, y, width, height) {
      this.draw();
      this.drawRect(
        MAP_CANVAS_ID,
        x * TILESIZE,
        y * TILESIZE,
        width * TILESIZE,
        height * TILESIZE
      );
    },
    addSelectedTile(event) {
      const { tx, ty } = this.getTileLocation(event);
      const ix = this.selectedTiles[0]?.x;
      const iy = this.selectedTiles[0]?.y;
      if (this.drawable && this.selectedTiles.length) {
        this.selectedTiles.forEach((tile) => {
          const tileOffsetX = tile.x - ix;
          const tileOffsetY = tile.y - iy;
          const width =
            Math.max.apply(
              null,
              this.selectedTiles.map((item) => item.x)
            ) -
            Math.min.apply(
              null,
              this.selectedTiles.map((item) => item.x)
            ) +
            1;
          const height =
            Math.max.apply(
              null,
              this.selectedTiles.map((item) => item.y)
            ) -
            Math.min.apply(
              null,
              this.selectedTiles.map((item) => item.y)
            ) +
            1;
          const repeatX = (tx - this.ix) % width;
          const repeatY = (ty - this.iy) % height;
          const dx =
            tileOffsetX - repeatX < 0
              ? width + tileOffsetX - repeatX
              : tileOffsetX - repeatX >= width
              ? width - tileOffsetX + repeatX
              : tileOffsetX - repeatX;
          const dy =
            tileOffsetY - repeatY < 0
              ? height + tileOffsetY - repeatY
              : tileOffsetY - repeatY >= height
              ? height - tileOffsetY + repeatY
              : tileOffsetY - repeatY;
          if (tile.id === 0) {
            this.layer[ty][tx] = 0;
          } else {
            // TODO: 세 칸 이상부터 패턴 파괴
            if (
              ty >= 0 &&
              tx >= 0 &&
              ty + dy < this.maps[this.activeMap].height &&
              tx + dx < this.maps[this.activeMap].width
            ) {
              this.layer[ty + dy][tx + dx] =
                tile.id >= 384 || tile.shiftKey
                  ? tile.id
                  : event.shiftKey
                  ? parseInt(tile.id / 48) * 48
                  : this.getAutotileId(
                      parseInt(tile.id / 48),
                      tx + dx,
                      ty + dy
                    );
              tile.id;
            }
          }
          if (!event.shiftKey && !tile.shiftKey) {
            this.updateAutotile(tx + dx, ty + dy);
          }
        });
      }
    },
    updateAutotile(x, y) {
      const d = [
        [x, y],
        [x, y - 1],
        [x - 1, y],
        [x + 1, y],
        [x, y + 1],
        [x - 1, y - 1],
        [x + 1, y - 1],
        [x - 1, y + 1],
        [x + 1, y + 1],
      ];
      d.forEach((item) => {
        if (
          item[0] >= 0 &&
          item[1] >= 0 &&
          item[0] < this.maps[this.activeMap].width &&
          item[1] < this.maps[this.activeMap].height &&
          this.layer[item[1]][item[0]] > 0 &&
          this.layer[item[1]][item[0]] < 384
        ) {
          this.layer[item[1]][item[0]] = this.getAutotileId(
            parseInt(this.layer[item[1]][item[0]] / 48),
            item[0],
            item[1]
          );
        }
      });
    },
    getAutotileId(_id, x, y) {
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
      if (!this.autotiles[_id - 1]) return 0;
      const checkAutotile = (id) => {
        return _id === parseInt(id / 48);
      };
      let sum = 0;
      let n = false,
        e = false,
        s = false,
        w = false;
      if ((y > 0 && checkAutotile(this.layer[y - 1][x])) || y === 0) {
        n = true;
        sum += N;
      }
      if ((x > 0 && checkAutotile(this.layer[y][x - 1])) || x === 0) {
        w = true;
        sum += W;
      }
      if (
        (x < this.maps[this.activeMap].width - 1 &&
          checkAutotile(this.layer[y][x + 1])) ||
        x === this.maps[this.activeMap].width - 1
      ) {
        e = true;
        sum += E;
      }
      if (
        (y < this.maps[this.activeMap].height - 1 &&
          checkAutotile(this.layer[y + 1][x])) ||
        y === this.maps[this.activeMap].height - 1
      ) {
        s = true;
        sum += S;
      }
      if (
        n &&
        w &&
        ((y > 0 && x > 0 && checkAutotile(this.layer[y - 1][x - 1])) ||
          y === 0 ||
          x === 0)
      )
        sum += NW;
      if (
        n &&
        e &&
        ((y > 0 &&
          x < this.maps[this.activeMap].width - 1 &&
          checkAutotile(this.layer[y - 1][x + 1])) ||
          y === 0 ||
          x === this.maps[this.activeMap].width - 1)
      )
        sum += NE;
      if (
        s &&
        w &&
        ((y < this.maps[this.activeMap].height - 1 &&
          x > 0 &&
          checkAutotile(this.layer[y + 1][x - 1])) ||
          y === this.maps[this.activeMap].height - 1 ||
          x === 0)
      )
        sum += SW;
      if (
        s &&
        e &&
        ((x < this.maps[this.activeMap].width - 1 &&
          y < this.maps[this.activeMap].height - 1 &&
          checkAutotile(this.layer[y + 1][x + 1])) ||
          x === this.maps[this.activeMap].width - 1 ||
          y === this.maps[this.activeMap].height - 1)
      )
        sum += SE;
      return BITMASK[sum] + 48 * _id;
    },
    removeTile(event) {
      const { tx, ty } = this.getTileLocation(event);
      if (this.drawable) {
        this.layer[ty][tx] = 0;
      }
    },
    getEventHandler(id, event, callback) {
      return this.$el.querySelector(id).addEventListener(event, callback);
    },
    removeEventHandler(id, event, callback) {
      return this.$el.querySelector(id).removeEventListener(event, callback);
    },
    drawRect(canvasId, x, y, width, height, style = "rgba(0, 0, 0, 1)") {
      const ctx = this.getContext(canvasId);
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = style;
      ctx.rect(x, y, width, height);
      ctx.stroke();
    },
    pointerDownEvent(e) {
      if (this.mode === TOOLS.BRUSH && this.drawable) {
        this.mouseX = this.getTileLocation(e).tx;
        this.mouseY = this.getTileLocation(e).ty;
        if (e.button === 2 || e.which === 3) {
          this.tileSelectStart = this.getSelectedTile(e)[0];
        } else {
          this.tileAddStart = true;
          this.ix = this.mouseX;
          this.iy = this.mouseY;
          this.addSelectedTile(e);
        }
      }
    },
    pointerMoveEvent(e) {
      if (
        this.mouseX !== this.getTileLocation(e).tx ||
        this.mouseY !== this.getTileLocation(e).ty
      ) {
        this.mouseX = this.getTileLocation(e).tx;
        this.mouseY = this.getTileLocation(e).ty;
        // 마우스 우클릭
        if (e.buttons === 2 || e.which === 3) {
          if (this.tileSelectStart) {
            const selection = this.getSelectedTile(e);
            const width =
              selection[selection.length - 1].x - selection[0].x + 1;
            const height =
              selection[selection.length - 1].y - selection[0].y + 1;
            this.drawSelectedTile(
              selection[0].x,
              selection[0].y,
              width,
              height
            );
            this.updateFields({ selectedTiles: selection });
          }
        } else {
          if (this.selectedTiles.length) {
            this.draw();
            if (this.mode === TOOLS.BRUSH && this.drawable) {
              this.previewSelectedTile(e);
              if (this.tileAddStart) {
                this.addSelectedTile(e);
              }
            }
          }
        }
      }
    },
    pointerUpEvent(e) {
      this.tileAddStart = false;
      // 마우스 우클릭
      if (e.button === 2 || e.which === 3) {
        const selection = this.getSelectedTile(e);
        this.tileSelectStart = null;
        const width = selection[selection.length - 1].x - selection[0].x + 1;
        const height = selection[selection.length - 1].y - selection[0].y + 1;
        this.drawSelectedTile(selection[0].x, selection[0].y, width, height);
        this.updateFields({ selectedTiles: selection });
      }
    },
    mouseLeaveEvent() {
      this.draw();
      this.mouseX = undefined;
      this.mouseY = undefined;
    },
    contextMenuEvent(e) {
      e.preventDefault();
    },
  },
};
</script>
