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
      <div class="item">
        <div class="icon-wrapper" @click="onClickViewTileId">
          <font-awesome-icon :icon="fields.viewTileId ? 'eye' : 'eye-slash'" />
        </div>
      </div>
      <div class="item">
        <div class="icon-wrapper" @click="onClickZoomDowner">
          <font-awesome-icon icon="search-minus" />
        </div>
        <div class="range-wrapper">
          <ui-input-range
            :value="zoom"
            :min="0.1"
            :max="1.0"
            @onInputRange="onInputZoom"
          />
        </div>
        <div class="label-wrapper">
          {{ zoomLabel }}
        </div>
        <div class="icon-wrapper" @click="onClickZoomUpper">
          <font-awesome-icon icon="search-plus" />
        </div>
        <div class="icon-wrapper" @click="onClickZoomClear">
          <font-awesome-icon icon="bullseye" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-view-wrapper {
  display: flex;
  flex-direction: column;
  width: calc(100% - 267px);
  height: calc(100vh - 50px);
  border-left: 1px solid #333;
  > .content {
    height: inherit;
    background: #000;
    overflow: auto;
  }
  > .bottom {
    display: flex;
    justify-content: flex-end;
    height: 19px;
    line-height: 19px;
    font-size: 11px;
    border-top: 1px solid #333;
    background: var(--primary);
    > .item {
      display: flex;
      padding: 0 4px;
      > .icon-wrapper {
        cursor: pointer;
        &:last-child {
          margin-left: 2px;
        }
      }
      > .label-wrapper {
        padding: 0 3px 0 2px;
      }
      > .range-wrapper {
        padding: 2px 0;
      }
    }
    > .item:not(:last-child) {
      border-right: 1px solid #33333333;
    }
  }
}
</style>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { TILESIZE, AUTOTILES, MAP_CANVAS_ID } from "@/utils/tileset";
import { TOOLS } from "@/utils/tools";
import UiInputRange from "@/components/common/InputRange";

export default {
  name: "MapView",
  components: { UiInputRange },
  props: {
    activeMap: {
      type: String,
      default: null,
    },
    activeLayer: {
      type: Number,
      default: 1,
    },
    maps: {
      type: Object,
      default: null,
    },
    autotiles: {
      type: Array,
      default: () => [],
    },
    mode: {
      type: Number,
      default: 0,
    },
    backgroundColor: {
      type: String,
      default: "#000",
    },
  },
  data: () => ({
    zoom: 1.0,
    tileset: null,
    tileAddStart: false,
    tileSelectStart: {},
    ix: 0,
    iy: 0,
    mouseX: undefined,
    mouseY: undefined,
    previewOnDrawing: false,
    preview: [],
    prevLayer: [],
  }),
  watch: {
    activeLayer() {
      this.draw();
    },
    zoom() {
      this.init();
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
    document.addEventListener("keydown", this.keyDownEvent);
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
    document.removeEventListener("keydown", this.keyDownEvent);
  },
  computed: {
    ...mapGetters(["fields"]),
    width() {
      return this.maps[this.activeMap].width * TILESIZE * this.zoom;
    },
    height() {
      return this.maps[this.activeMap].height * TILESIZE * this.zoom;
    },
    x() {
      return this.mouseX.toString().padStart(3, "0");
    },
    y() {
      return this.mouseY.toString().padStart(3, "0");
    },
    context() {
      const canvas = this.$el.querySelector(MAP_CANVAS_ID);
      return canvas.getContext("2d", { alpha: false });
    },
    layer() {
      return this.drawable
        ? this.maps[this.activeMap].data[this.activeLayer - 1]
        : null;
    },
    zoomLabel() {
      return this.zoom.toFixed(1);
    },
    drawable() {
      return this.activeLayer >= 1 && this.activeLayer <= 3;
    },
    isInside() {
      return this.mouseX !== undefined && this.mouseY !== undefined;
    },
    selectedTiles() {
      return this.$store.state.data.selectedTiles || [];
    },
  },
  methods: {
    ...mapMutations([
      "UPDATE_FIELDS",
      "INIT_MAP_FUTURE",
      "ADD_MAP_HISTORY",
      "ADD_MAP_FUTURE",
      "SET_LOADING",
    ]),
    ...mapActions(["removeMapHistory", "removeMapFuture"]),
    init() {
      this.tileset = new Image();
      this.tileset.src = `/tilesets/${this.maps[this.activeMap].tileset}.png`;
      this.tileset.onload = () => {
        this.draw();
        setTimeout(() => this.SET_LOADING(), 1000);
      };
    },
    draw() {
      this.context.clearRect(0, 0, this.width, this.height);
      this.maps[this.activeMap].data.forEach((layer, lindex) => {
        const layerIndex = lindex + 1;
        for (let y = 0; y < this.maps[this.activeMap].height; y++) {
          for (let x = 0; x < this.maps[this.activeMap].width; x++) {
            this.setContext(this.context, layerIndex, x, y);
            if (this.activeLayer === 4) this.drawBorder(this.context, x, y);
            const tile = layer[y][x];
            this.drawTile(this.context, tile, x, y);
            this.viewTileId(this.context, layerIndex, tile, x, y);
          }
        }
        if (this.drawable && layerIndex === this.activeLayer - 1) {
          this.context.fillStyle = "rgba(0, 0, 0, .5)";
          this.context.fillRect(0, 0, this.width, this.height);
        }
      });
    },
    setContext(context, index, x, y) {
      context.globalAlpha = 1;
      // 줌 깨짐 제거
      if (this.zoom !== 1) {
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
        context.imageSmoothingEnabled = false;
      }
      // 캔버스 배경 설정
      if (index === 1) {
        context.fillStyle = this.backgroundColor;
        context.fillRect(
          x * TILESIZE * this.zoom,
          y * TILESIZE * this.zoom,
          TILESIZE * this.zoom,
          TILESIZE * this.zoom
        );
      }
      // 레이어 반투명 설정
      if (this.drawable && index > this.activeLayer) {
        context.globalAlpha = 0.3;
      } else if (this.drawable && index === this.activeLayer) {
        context.globalAlpha = 1;
      }
    },
    viewTileId(context, index, tile, x, y) {
      if (
        this.fields.viewTileId &&
        this.drawable &&
        index === this.activeLayer
      ) {
        context.font = `${Math.round(11 * this.zoom)}px Arial`;
        context.textAlign = "right";
        context.textBaseline = "bottom";
        context.fillStyle = "#333";
        context.fillText(
          tile,
          (x + 1) * TILESIZE * this.zoom,
          (y + 1) * TILESIZE * this.zoom
        );
      }
    },
    drawTile(context, _id, x, y) {
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
          x * TILESIZE * this.zoom,
          y * TILESIZE * this.zoom,
          TILESIZE * this.zoom,
          TILESIZE * this.zoom
        );
      } else if (_id >= 48) {
        // 오토타일
        const id = parseInt(_id / 48) - 1;
        if (!this.autotiles[id]) return;
        const index = _id % 48;
        const parts = AUTOTILES[parseInt(index / 8)][index % 8];
        for (let i = 0; i < 5; i++) {
          const tile_position = parts[i] - 1;
          context.drawImage(
            this.autotiles[id],
            (tile_position % 6) * 16,
            parseInt(tile_position / 6) * 16,
            16,
            16,
            (x * TILESIZE + (i % 2) * 16) * this.zoom,
            (y * TILESIZE + parseInt(i / 2) * 16) * this.zoom,
            16 * this.zoom,
            16 * this.zoom
          );
        }
      }
    },
    drawBorder(context, x, y) {
      context.globalAlpha = 0.6;
      context.beginPath();
      context.lineWidth = 0.5;
      context.strokeStyle = "rgba(0, 0, 0, 0.4)";
      context.rect(
        x * TILESIZE * this.zoom,
        y * TILESIZE * this.zoom,
        TILESIZE * this.zoom,
        TILESIZE * this.zoom
      );
      context.stroke();
      context.globalAlpha = 1;
    },
    updateCanvas(context, preview) {
      preview.forEach((tile) => {
        context.clearRect(
          tile.x * TILESIZE * this.zoom,
          tile.y * TILESIZE * this.zoom,
          TILESIZE * this.zoom,
          TILESIZE * this.zoom
        );
        this.maps[this.activeMap].data.forEach((layer, lindex) => {
          const layerIndex = lindex + 1;
          this.setContext(this.context, layerIndex);
          if (this.activeLayer === 4)
            this.drawBorder(this.context, tile.x, tile.y);
          this.drawTile(this.context, layer[tile.y][tile.x], tile.x, tile.y);
          this.viewTileId(this.context, layerIndex, tile, tile.x, tile.y);
          if (this.drawable && layerIndex === this.activeLayer - 1) {
            context.fillStyle = "rgba(0, 0, 0, .5)";
            context.fillRect(
              tile.x * TILESIZE * this.zoom,
              tile.y * TILESIZE * this.zoom,
              TILESIZE * this.zoom,
              TILESIZE * this.zoom
            );
          }
        });
      });
    },
    getTileLocation(event) {
      const { x, y } = event.target.getBoundingClientRect();
      const tx = Math.floor(
        Math.max(event.clientX - x, 0) / (TILESIZE * this.zoom)
      );
      const ty = Math.floor(
        Math.max(event.clientY - y, 0) / (TILESIZE * this.zoom)
      );
      return { tx, ty };
    },
    previewSelectedTile(event) {
      const { tx, ty } = this.getTileLocation(event);
      const ix = this.selectedTiles[0].x;
      const iy = this.selectedTiles[0].y;
      this.context.globalAlpha = 0.7;
      if (!this.tileAddStart || (this.tileAddStart && this.previewOnDrawing)) {
        this.selectedTiles.forEach((tile) => {
          const x = tx + tile.x - ix;
          const y = ty + tile.y - iy;
          this.drawTile(this.context, tile.id, x, y);
        });
      }
      const width =
        this.selectedTiles[this.selectedTiles.length - 1].x -
        this.selectedTiles[0].x +
        1;
      const height =
        this.selectedTiles[this.selectedTiles.length - 1].y -
        this.selectedTiles[0].y +
        1;
      this.context.globalAlpha = 1;
      this.drawRect(
        MAP_CANVAS_ID,
        tx * TILESIZE * this.zoom,
        ty * TILESIZE * this.zoom,
        width * TILESIZE * this.zoom,
        height * TILESIZE * this.zoom
      );
    },
    getVertex(tiles) {
      const ix = Math.min.apply(
        null,
        tiles.map((item) => item.x)
      );
      const iy = Math.min.apply(
        null,
        tiles.map((item) => item.y)
      );
      const lx = Math.max.apply(
        null,
        tiles.map((item) => item.x)
      );
      const ly = Math.max.apply(
        null,
        tiles.map((item) => item.y)
      );
      return [
        { x: ix, y: iy },
        { x: lx, y: ly },
      ];
    },
    getBrush(event, layer, preview) {
      const { tx, ty } = this.getTileLocation(event);
      const vertex = this.getVertex(this.selectedTiles);
      const width = vertex[1].x - vertex[0].x + 1;
      const height = vertex[1].y - vertex[0].y + 1;
      this.selectedTiles.forEach((tile) => {
        const tileOffsetX = tile.x - vertex[0].x;
        const tileOffsetY = tile.y - vertex[0].y;
        const repeatX = (tx - this.ix) % width;
        const repeatY = (ty - this.iy) % height;
        const dx =
          tileOffsetX - repeatX < 0
            ? width + tileOffsetX - repeatX
            : tileOffsetX - repeatX >= width
            ? Math.abs(width - tileOffsetX + repeatX)
            : tileOffsetX - repeatX;
        const dy =
          tileOffsetY - repeatY < 0
            ? height + tileOffsetY - repeatY
            : tileOffsetY - repeatY >= height
            ? Math.abs(height - tileOffsetY + repeatY)
            : tileOffsetY - repeatY;
        if (
          tx + dx >= 0 &&
          ty + dy >= 0 &&
          tx + dx < layer[0].length &&
          ty + dy < layer.length
        ) {
          preview.push({
            id:
              tile.id >= 384 || tile.shiftKey
                ? tile.id
                : event.shiftKey
                ? parseInt(tile.id / 48) * 48
                : this.getAutotileId(
                    this.layer,
                    parseInt(tile.id / 48),
                    tx + dx,
                    ty + dy
                  ),
            x: tx + dx,
            y: ty + dy,
          });
        }
      });
      return preview;
    },
    getSquare(event) {
      const preview = [];
      const { tx, ty } = this.getTileLocation(event);
      const vertex = this.getVertex(this.selectedTiles);
      const width = vertex[1].x - vertex[0].x + 1;
      const height = vertex[1].y - vertex[0].y + 1;
      this.selectedTiles.forEach((tile) => {
        const tileOffsetX = tile.x - vertex[0].x;
        const tileOffsetY = tile.y - vertex[0].y;
        for (let y = Math.min(this.iy, ty); y <= Math.max(this.iy, ty); y++) {
          for (let x = Math.min(this.ix, tx); x <= Math.max(this.ix, tx); x++) {
            if (
              (x - Math.min(this.ix, tx)) % width === tileOffsetX &&
              (y - Math.min(this.iy, ty)) % height === tileOffsetY
            ) {
              preview.push({
                id:
                  tile.id >= 384 || tile.shiftKey
                    ? tile.id
                    : event.shiftKey
                    ? parseInt(tile.id / 48) * 48
                    : this.getAutotileId(
                        this.layer,
                        parseInt(tile.id / 48),
                        x,
                        y
                      ),
                x: x,
                y: y,
              });
            }
          }
        }
      });
      return preview;
    },
    getCircle(event) {
      const preview = [];
      const { tx, ty } = this.getTileLocation(event);
      const vertex = this.getVertex(this.selectedTiles);
      const width = vertex[1].x - vertex[0].x + 1;
      const height = vertex[1].y - vertex[0].y + 1;
      const twidth = Math.abs(tx - this.ix) + 1;
      const theight = Math.abs(ty - this.iy) + 1;
      const c = Math.sqrt(Math.abs((twidth / 2) ** 2 - (theight / 2) ** 2));
      const longAxis = theight > twidth ? theight : twidth;
      const focus = [
        {
          x: twidth > theight ? (this.ix + tx) / 2 - c : (this.ix + tx) / 2,
          y: twidth > theight ? (this.iy + ty) / 2 : (this.iy + ty) / 2 - c,
        },
        {
          x: twidth > theight ? (this.ix + tx) / 2 + c : (this.ix + tx) / 2,
          y: twidth > theight ? (this.iy + ty) / 2 : (this.iy + ty) / 2 + c,
        },
      ];
      const getDistance = (a, b) => {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      };
      const isInsideCircle = (a) => {
        return (
          Math.round(getDistance(a, focus[0]) + getDistance(a, focus[1])) <
          longAxis
        );
      };
      this.selectedTiles.forEach((tile) => {
        const tileOffsetX = tile.x - vertex[0].x;
        const tileOffsetY = tile.y - vertex[0].y;
        for (let y = Math.min(this.iy, ty); y <= Math.max(this.iy, ty); y++) {
          for (let x = Math.min(this.ix, tx); x <= Math.max(this.ix, tx); x++) {
            if (
              (x - Math.min(this.ix, tx)) % width === tileOffsetX &&
              (y - Math.min(this.iy, ty)) % height === tileOffsetY &&
              isInsideCircle({ x, y })
            ) {
              preview.push({
                id:
                  tile.id >= 384 || tile.shiftKey
                    ? tile.id
                    : event.shiftKey
                    ? parseInt(tile.id / 48) * 48
                    : this.getAutotileId(
                        this.layer,
                        parseInt(tile.id / 48),
                        x,
                        y
                      ),
                x: x,
                y: y,
              });
            }
          }
        }
      });
      return preview;
    },
    getFill(event, layer) {
      const preview = [];
      const { tx, ty } = this.getTileLocation(event);
      const vertex = this.getVertex(this.selectedTiles);
      const width = vertex[1].x - vertex[0].x + 1;
      const height = vertex[1].y - vertex[0].y + 1;
      const id =
        layer[ty][tx] >= 384 || layer[ty][tx] === 0
          ? layer[ty][tx]
          : parseInt(layer[ty][tx] / 48) * 48;

      const dfs = (layer, x, y, _id) => {
        const contains = (array, object) => {
          return array.some((item) => {
            return JSON.stringify(object) === JSON.stringify(item);
          });
        };
        const result = [];
        const visited = [];
        const queue = [];
        queue.push({ id: _id, x, y });
        while (queue.length !== 0) {
          const node = queue.shift();
          if (!contains(visited, node)) {
            visited.push(node);
            if (
              _id ===
              (node.id >= 384 || node.id === 0
                ? node.id
                : parseInt(node.id / 48) * 48)
            ) {
              result.push({ id: node.id, x: node.x, y: node.y });
              if (node.y - 1 >= 0)
                queue.push({
                  id: layer[node.y - 1][node.x],
                  x: node.x,
                  y: node.y - 1,
                });
              if (node.y + 1 <= layer.length - 1)
                queue.push({
                  id: layer[node.y + 1][node.x],
                  x: node.x,
                  y: node.y + 1,
                });
              if (node.x - 1 >= 0)
                queue.push({
                  id: layer[node.y][node.x - 1],
                  x: node.x - 1,
                  y: node.y,
                });
              if (node.x + 1 <= layer[0].length - 1)
                queue.push({
                  id: layer[node.y][node.x + 1],
                  x: node.x + 1,
                  y: node.y,
                });
            }
          }
        }
        return result;
      };

      const result = dfs(layer, tx, ty, id);
      this.selectedTiles.forEach((tile) => {
        const tileOffsetX = tile.x - vertex[0].x;
        const tileOffsetY = tile.y - vertex[0].y;
        result.forEach((prev) => {
          if (
            (prev.x - tx > 0 ? prev.x - tx : width + ((prev.x - tx) % width)) %
              width ===
              tileOffsetX &&
            (prev.y - ty > 0
              ? prev.y - ty
              : height + ((prev.y - ty) % height)) %
              height ===
              tileOffsetY
          ) {
            preview.push({
              id:
                tile.id >= 384 || tile.shiftKey
                  ? tile.id
                  : event.shiftKey
                  ? parseInt(tile.id / 48) * 48
                  : this.getAutotileId(
                      this.layer,
                      parseInt(tile.id / 48),
                      prev.x,
                      prev.y
                    ),
              x: prev.x,
              y: prev.y,
            });
          }
        });
      });

      return preview;
    },
    getPrevLayer(layer, preview) {
      const prevLayer = [];
      preview.forEach((tile) => {
        prevLayer.push({ id: layer[tile.y][tile.x], x: tile.x, y: tile.y });
      });
      return prevLayer;
    },
    addTiles(event, layer, preview) {
      const prevLayer = [];
      preview.forEach((tile) => {
        prevLayer.push({ id: layer[tile.y][tile.x], x: tile.x, y: tile.y });
        layer[tile.y][tile.x] = tile.id;
      });
      if (!event.shiftKey || (event.shiftKey && this.isCtrlZ(event))) {
        preview.forEach((tile) => {
          this.updateAutotile(tile.x, tile.y);
        });
      }
      return prevLayer;
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
      if (newSelection.length > 1) return newSelection;
      const tileid =
        this.layer[ty][tx] >= 384 || event.shiftKey
          ? this.layer[ty][tx]
          : parseInt(this.layer[ty][tx] / 48) * 48 + 47;
      return [{ id: tileid, x: tx, y: ty, shiftKey: event.shiftKey }];
    },
    drawSelectedTile(x, y, width, height) {
      this.draw();
      this.drawRect(
        MAP_CANVAS_ID,
        x * TILESIZE * this.zoom,
        y * TILESIZE * this.zoom,
        width * TILESIZE * this.zoom,
        height * TILESIZE * this.zoom
      );
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
            this.layer,
            parseInt(this.layer[item[1]][item[0]] / 48),
            item[0],
            item[1]
          );
        }
      });
    },
    getAutotileId(layer, _id, x, y) {
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
      if ((y > 0 && checkAutotile(layer[y - 1][x])) || y === 0) {
        n = true;
        sum += N;
      }
      if ((x > 0 && checkAutotile(layer[y][x - 1])) || x === 0) {
        w = true;
        sum += W;
      }
      if (
        (x < this.maps[this.activeMap].width - 1 &&
          checkAutotile(layer[y][x + 1])) ||
        x === this.maps[this.activeMap].width - 1
      ) {
        e = true;
        sum += E;
      }
      if (
        (y < this.maps[this.activeMap].height - 1 &&
          checkAutotile(layer[y + 1][x])) ||
        y === this.maps[this.activeMap].height - 1
      ) {
        s = true;
        sum += S;
      }
      if (
        n &&
        w &&
        ((y > 0 && x > 0 && checkAutotile(layer[y - 1][x - 1])) ||
          y === 0 ||
          x === 0)
      )
        sum += NW;
      if (
        n &&
        e &&
        ((y > 0 &&
          x < this.maps[this.activeMap].width - 1 &&
          checkAutotile(layer[y - 1][x + 1])) ||
          y === 0 ||
          x === this.maps[this.activeMap].width - 1)
      )
        sum += NE;
      if (
        s &&
        w &&
        ((y < this.maps[this.activeMap].height - 1 &&
          x > 0 &&
          checkAutotile(layer[y + 1][x - 1])) ||
          y === this.maps[this.activeMap].height - 1 ||
          x === 0)
      )
        sum += SW;
      if (
        s &&
        e &&
        ((x < this.maps[this.activeMap].width - 1 &&
          y < this.maps[this.activeMap].height - 1 &&
          checkAutotile(layer[y + 1][x + 1])) ||
          x === this.maps[this.activeMap].width - 1 ||
          y === this.maps[this.activeMap].height - 1)
      )
        sum += SE;
      return BITMASK[sum] + 48 * _id;
    },
    async undo(e) {
      const prevLayer = await this.removeMapHistory();
      if (prevLayer) {
        const nextLayer = this.addTiles(e, this.layer, prevLayer);
        this.ADD_MAP_FUTURE(nextLayer);
      }
      return prevLayer;
    },
    async redo(e) {
      const nextLayer = await this.removeMapFuture();
      if (nextLayer) {
        const prevLayer = this.addTiles(e, this.layer, nextLayer);
        this.ADD_MAP_HISTORY(prevLayer);
      }
      return nextLayer;
    },
    getEventHandler(id, event, callback) {
      return this.$el.querySelector(id).addEventListener(event, callback);
    },
    removeEventHandler(id, event, callback) {
      return this.$el.querySelector(id).removeEventListener(event, callback);
    },
    drawRect(canvasId, x, y, width, height, _style = "rgba(0, 0, 0, 1)") {
      const makefillRect = (x, y, width, height, style = _style) => {
        this.context.fillStyle = style;
        this.context.fillRect(x, y, width, height);
      };
      makefillRect(x, y, width, 4, "#000");
      makefillRect(x, y, 4, height, "#000");
      makefillRect(x + width - 4, y, 4, height, "#000");
      makefillRect(x, y + height - 4, width, 4, "#000");
      makefillRect(x + 1, y + 1, width - 2, 2, "#fff");
      makefillRect(x + 1, y + 1, 2, height - 2, "#fff");
      makefillRect(x + width - 3, y + 1, 2, height - 2, "#fff");
      makefillRect(x + 1, y + height - 3, width - 2, 2, "#fff");
    },
    getPreview(event) {
      let preview = null;
      switch (this.mode) {
        case TOOLS.BRUSH:
          preview = this.getBrush(event, this.layer, this.preview);
          break;
        case TOOLS.SQUARE:
          preview = this.getSquare(event);
          break;
        case TOOLS.CIRCLE:
          preview = this.getCircle(event);
          break;
        case TOOLS.FILL:
          preview = this.getFill(event, this.layer);
          break;
        default:
          break;
      }
      return preview;
    },
    pointerDownEvent(e) {
      this.mouseX = this.getTileLocation(e).tx;
      this.mouseY = this.getTileLocation(e).ty;
      this.ix = this.mouseX;
      this.iy = this.mouseY;
      if (this.drawable) {
        if (
          this.mode === TOOLS.BRUSH ||
          this.mode === TOOLS.SQUARE ||
          this.mode === TOOLS.CIRCLE ||
          this.mode === TOOLS.FILL
        ) {
          if (e.button === 2 || e.which === 3) {
            // 우클릭
            this.tileSelectStart = this.getSelectedTile(e)[0];
          } else {
            // 좌클릭
            this.tileAddStart = true;
            const preview = this.getPreview(e);
            this.prevLayer = this.getPrevLayer(this.layer, preview);
            this.addTiles(e, this.layer, preview);
            this.preview = preview;
            this.draw();
            // this.updateCanvas(this.context, preview);
            this.addTiles(e, this.layer, this.prevLayer);
          }
        } else if (this.mode === TOOLS.SELECT) {
          console.log("SELECT");
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
        if (this.drawable) {
          if (
            this.mode === TOOLS.BRUSH ||
            this.mode === TOOLS.SQUARE ||
            this.mode === TOOLS.CIRCLE ||
            this.mode === TOOLS.FILL
          ) {
            // 우클릭
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
                this.UPDATE_FIELDS({
                  selectedTiles: selection,
                  activeCanvas: MAP_CANVAS_ID,
                });
              }
            } else {
              if (this.tileAddStart && this.mode !== TOOLS.FILL) {
                const preview = this.getPreview(e);
                this.prevLayer = this.getPrevLayer(this.layer, preview);
                this.addTiles(e, this.layer, preview);
                this.preview = preview;
                this.draw();
                // this.updateCanvas(this.context, this.prevLayer);
                // this.updateCanvas(this.context, preview);
                this.addTiles(e, this.layer, this.prevLayer);
              } else {
                this.draw();
                this.previewSelectedTile(e);
              }
            }
          }
        }
      }
    },
    pointerUpEvent(e) {
      if (this.drawable && this.tileAddStart) {
        if (
          this.mode === TOOLS.BRUSH ||
          this.mode === TOOLS.SQUARE ||
          this.mode === TOOLS.CIRCLE ||
          this.mode === TOOLS.FILL
        ) {
          this.addTiles(e, this.layer, this.preview);
          // this.updateCanvas(this.context, this.preview);
          this.preview = [];
          this.draw();
        }
        this.ADD_MAP_HISTORY(this.prevLayer);
        this.INIT_MAP_FUTURE();
        this.previewSelectedTile(e);
      }
      this.tileAddStart = false;
      // 마우스 우클릭
      if (e.button === 2 || e.which === 3) {
        const selection = this.getSelectedTile(e);
        this.tileSelectStart = null;
        const width = selection[selection.length - 1].x - selection[0].x + 1;
        const height = selection[selection.length - 1].y - selection[0].y + 1;
        this.drawSelectedTile(selection[0].x, selection[0].y, width, height);
        this.UPDATE_FIELDS({
          selectedTiles: selection,
          activeCanvas: MAP_CANVAS_ID,
        });
      }
    },
    mouseLeaveEvent() {
      this.draw();
      this.mouseX = undefined;
      this.mouseY = undefined;
    },
    isCtrlZ(e) {
      return (
        ((e.ctrlKey && navigator.userAgentData.platform !== "macOS") ||
          e.metaKey) &&
        e.key === "z"
      );
    },
    async keyDownEvent(e) {
      // undo
      if (this.isCtrlZ(e)) {
        e.preventDefault();
        if (e.shiftKey) {
          await this.redo(e);
          this.draw();
          // this.updateCanvas(this.context, nextLayer);
        } else {
          await this.undo(e);
          this.draw();
          // this.updateCanvas(this.context, prevLayer);
        }
      }
    },
    contextMenuEvent(e) {
      e.preventDefault();
    },
    onClickZoomUpper() {
      if (this.zoom < 1) this.zoom = +(this.zoom + 0.1).toFixed(12);
    },
    onClickZoomDowner() {
      if (this.zoom > 0.1) this.zoom = +(this.zoom - 0.1).toFixed(12);
    },
    onClickViewTileId() {
      this.UPDATE_FIELDS({
        viewTileId: !this.fields.viewTileId,
      });
    },
    onClickZoomClear() {
      this.zoom = 1.0;
    },
    onInputZoom(zoom) {
      this.zoom = zoom;
    },
  },
};
</script>
