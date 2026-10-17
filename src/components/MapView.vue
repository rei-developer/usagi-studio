<template>
  <div class="map-view-wrapper">
    <div ref="viewport" class="content custom-scroll-box" @scroll="onScroll">
      <div
        class="map-surface"
        :style="{ width: width + 'px', height: height + 'px' }"
      >
        <div
          class="canvas-stage"
          :style="{
            width: viewportWidth + 'px',
            height: viewportHeight + 'px',
          }"
        >
          <canvas
            id="mapCanvas"
            :width="viewportWidth"
            :height="viewportHeight"
          />
          <canvas
            ref="overlay"
            class="map-overlay"
            :width="viewportWidth"
            :height="viewportHeight"
          />
        </div>
      </div>
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
.map-surface {
  position: relative;
}
.canvas-stage {
  position: sticky;
  left: 0;
  top: 0;
}
.map-overlay {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}
.map-view-wrapper {
  display: flex;
  flex-direction: column;
  width: calc(100% - 267px);
  height: calc(100vh - 50px);
  border-left: 1px solid #333;
  > .content {
    flex: 1;
    min-height: 0;
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
import { markRaw, toRaw } from "vue";
import { autotileId } from "@/utils/autotileId";
import { canExport, imageSize } from "@/utils/imageExport";
import { ChunkCache, CHUNK_TILES } from "@/utils/chunkCache";
import { transaction, writeCell, pack } from "@/utils/editHistory";
import { mapGetters, mapMutations, mapActions } from "vuex";
import { TILESIZE, MAP_CANVAS_ID } from "@/utils/tileset";
import {
  connectedArea,
  pattern,
  ellipseContains,
} from "@/utils/editAlgorithms";
import { TOOLS } from "@/utils/tools";
import UiInputRange from "@/components/common/InputRange";

export default {
  name: "MapView",
  components: { UiInputRange },
  props: {
    tileset: { type: Object, default: null },
    autotileAtlases: { type: Array, default: () => [] },
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
    viewportWidth: 1,
    viewportHeight: 1,
    scrollX: 0,
    scrollY: 0,
    tileAddStart: false,
    tileSelectStart: null,
    selectStart: null,
    ix: 0,
    iy: 0,
    mouseX: undefined,
    mouseY: undefined,
    previewOnDrawing: false,
    beforeEdit: null,
    select: [[], [], []],
    isMove: false,
  }),
  watch: {
    activeLayer() {
      this.draw();
    },
    zoom() {
      this.$nextTick(this.resizeViewport);
    },
    "fields.viewTileId"() {
      this.draw();
    },
    select() {
      const select = this.select;
      if (this.select[0].length < 1) return;
      const width = select[0][select[0].length - 1].x - select[0][0].x + 1;
      const height = select[0][select[0].length - 1].y - select[0][0].y + 1;
      this.drawSelect(select[0][0].x, select[0][0].y, width, height);
    },
  },
  created() {
    this.cache = markRaw(new ChunkCache());
    this.frame = null;
    this.mapDirty = false;
    this.overlayRect = null;
    this.cursorTile = null;
  },
  mounted() {
    this.observer = new ResizeObserver(this.resizeViewport);
    this.observer.observe(this.$refs.viewport);
    this.init();
    this.getEventHandler(MAP_CANVAS_ID, "pointerdown", this.pointerDownEvent);
    this.getEventHandler(MAP_CANVAS_ID, "pointermove", this.pointerMoveEvent);
    this.getEventHandler(MAP_CANVAS_ID, "pointerup", this.pointerUpEvent);
    this.getEventHandler(MAP_CANVAS_ID, "pointercancel", this.cancelStroke);
    this.getEventHandler(MAP_CANVAS_ID, "mouseleave", this.mouseLeaveEvent);
    this.getEventHandler(MAP_CANVAS_ID, "contextmenu", this.contextMenuEvent);
    document.addEventListener("keydown", this.keyDownEvent);
  },
  beforeUnmount() {
    this.observer.disconnect();
    cancelAnimationFrame(this.frame);
    this.cache.clear();
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
    this.removeEventHandler(MAP_CANVAS_ID, "pointercancel", this.cancelStroke);
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
        ? toRaw(this.maps[this.activeMap].data[this.activeLayer - 1])
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
      this.resizeViewport();
    },
    resizeViewport() {
      if (!this.$refs.viewport) return;
      this.viewportWidth = Math.max(
        1,
        Math.min(Math.ceil(this.width), this.$refs.viewport.clientWidth)
      );
      this.viewportHeight = Math.max(
        1,
        Math.min(Math.ceil(this.height), this.$refs.viewport.clientHeight)
      );
      this.onScroll();
      this.$nextTick(this.draw);
    },
    onScroll() {
      this.scrollX = this.$refs.viewport.scrollLeft;
      this.scrollY = this.$refs.viewport.scrollTop;
      this.draw();
    },
    draw() {
      this.mapDirty = true;
      this.scheduleFrame();
    },
    scheduleFrame() {
      if (this.frame !== null) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = null;
        if (this.mapDirty) {
          this.mapDirty = false;
          this.renderMap();
        }
        this.renderOverlay();
      });
    },
    invalidateTile(x, y) {
      const prefix = `${Math.floor(x / CHUNK_TILES)},${Math.floor(y / CHUNK_TILES)}:`;
      for (const key of this.cache.entries.keys())
        if (key.startsWith(prefix)) this.cache.delete(key);
    },
    getChunk(cx, cy) {
      const key = `${cx},${cy}:${this.activeMap}:${this.activeLayer}:${this.zoom}`;
      let canvas = this.cache.get(key);
      if (canvas) return canvas;
      const map = toRaw(this.maps[this.activeMap]);
      const left = cx * CHUNK_TILES,
        top = cy * CHUNK_TILES;
      const columns = Math.min(CHUNK_TILES, map.width - left);
      const rows = Math.min(CHUNK_TILES, map.height - top);
      canvas = document.createElement("canvas");
      canvas.width = Math.ceil(columns * TILESIZE * this.zoom);
      canvas.height = Math.ceil(rows * TILESIZE * this.zoom);
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(-left * TILESIZE * this.zoom, -top * TILESIZE * this.zoom);
      map.data.forEach((layer, index) => {
        ctx.globalAlpha =
          this.drawable && index + 1 > this.activeLayer ? 0.3 : 1;
        for (let y = top; y < top + rows; y++)
          for (let x = left; x < left + columns; x++) {
            this.drawTile(ctx, layer[y][x], x, y);
          }
        if (this.drawable && index + 1 === this.activeLayer - 1) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(0, 0, 0, .5)";
          ctx.fillRect(
            left * TILESIZE * this.zoom,
            top * TILESIZE * this.zoom,
            canvas.width,
            canvas.height
          );
        }
      });
      return this.cache.set(key, canvas);
    },
    renderMap() {
      if (!this.tileset) return;
      const ctx = this.context;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
      ctx.imageSmoothingEnabled = false;
      const started = performance.now();
      const size = CHUNK_TILES * TILESIZE * this.zoom;
      const map = this.maps[this.activeMap];
      const right = Math.min(this.scrollX + this.viewportWidth, this.width);
      const bottom = Math.min(this.scrollY + this.viewportHeight, this.height);
      for (let cy = Math.floor(this.scrollY / size); cy * size < bottom; cy++) {
        for (
          let cx = Math.floor(this.scrollX / size);
          cx * size < right;
          cx++
        ) {
          ctx.drawImage(
            this.getChunk(cx, cy),
            cx * size - this.scrollX,
            cy * size - this.scrollY
          );
          if (performance.now() - started >= 8 && (cx + 1) * size < right) {
            this.draw();
            return;
          }
        }
        if (performance.now() - started >= 8 && (cy + 1) * size < bottom) {
          this.draw();
          return;
        }
      }
      if (this.$store.state.loading) this.SET_LOADING();
      ctx.save();
      ctx.translate(-this.scrollX, -this.scrollY);
      if (this.fields.viewTileId || this.activeLayer === 4) {
        for (
          let y = Math.floor(this.scrollY / (TILESIZE * this.zoom));
          y < Math.min(map.height, Math.ceil(bottom / (TILESIZE * this.zoom)));
          y++
        ) {
          for (
            let x = Math.floor(this.scrollX / (TILESIZE * this.zoom));
            x < Math.min(map.width, Math.ceil(right / (TILESIZE * this.zoom)));
            x++
          ) {
            if (this.activeLayer === 4) this.drawBorder(ctx, x, y);
            else if (this.drawable)
              this.viewTileId(ctx, this.activeLayer, this.layer[y][x], x, y);
          }
        }
      }
      ctx.restore();
    },
    renderOverlay() {
      const ctx = this.$refs.overlay.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
      ctx.translate(-this.scrollX, -this.scrollY);
      ctx.imageSmoothingEnabled = false;
      if (
        this.cursorTile &&
        this.selectedTiles.length &&
        this.drawable &&
        !this.tileAddStart
      ) {
        const first = this.selectedTiles[0];
        ctx.globalAlpha = 0.7;
        for (const tile of this.selectedTiles)
          this.drawTile(
            ctx,
            tile.id,
            this.cursorTile.tx + tile.x - first.x,
            this.cursorTile.ty + tile.y - first.y
          );
        ctx.globalAlpha = 1;
      }
      if (this.overlayRect) {
        const { x, y, width, height, dashed } = this.overlayRect;
        ctx.setLineDash(dashed ? [3, 3] : []);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
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
      const map = toRaw(this.maps[this.activeMap]);
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
    getLayer(index) {
      return this.maps[this.activeMap].data[index - 1];
    },
    getTileLocation(event) {
      if (event.tilePosition) return event.tilePosition;
      const { x, y } = this.$el
        .querySelector(MAP_CANVAS_ID)
        .getBoundingClientRect();
      const map = this.maps[this.activeMap];
      return {
        tx: Math.min(
          map.width - 1,
          Math.max(
            0,
            Math.floor(
              (event.clientX - x + this.scrollX) / (TILESIZE * this.zoom)
            )
          )
        ),
        ty: Math.min(
          map.height - 1,
          Math.max(
            0,
            Math.floor(
              (event.clientY - y + this.scrollY) / (TILESIZE * this.zoom)
            )
          )
        ),
      };
    },
    previewSelectedTile(event) {
      if (!this.selectedTiles.length) return;
      const { tx, ty } = this.getTileLocation(event);
      this.cursorTile = { tx, ty };
      const [first, last] = this.getVertex(this.selectedTiles);
      this.drawRect(
        MAP_CANVAS_ID,
        tx * TILESIZE * this.zoom,
        ty * TILESIZE * this.zoom,
        (last.x - first.x + 1) * TILESIZE * this.zoom,
        (last.y - first.y + 1) * TILESIZE * this.zoom
      );
    },
    getVertex(tiles) {
      let x = Infinity,
        y = Infinity,
        right = -Infinity,
        bottom = -Infinity;
      for (const tile of tiles) {
        x = Math.min(x, tile.x);
        y = Math.min(y, tile.y);
        right = Math.max(right, tile.x);
        bottom = Math.max(bottom, tile.y);
      }
      return [
        { x, y },
        { x: right, y: bottom },
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
    patternTile(tile, event, x, y) {
      return {
        id:
          tile.id >= 384 || tile.shiftKey
            ? tile.id
            : event.shiftKey
              ? Math.floor(tile.id / 48) * 48
              : this.getAutotileId(this.layer, Math.floor(tile.id / 48), x, y),
        x,
        y,
      };
    },
    getSquare(event) {
      return this.getShape(event, false);
    },
    getCircle(event) {
      return this.getShape(event, true);
    },
    getShape(event, ellipse) {
      const { tx, ty } = this.getTileLocation(event);
      const at = pattern(toRaw(this.selectedTiles));
      const left = Math.min(this.ix, tx),
        top = Math.min(this.iy, ty);
      const preview = [];
      for (let y = top; y <= Math.max(this.iy, ty); y++) {
        for (let x = left; x <= Math.max(this.ix, tx); x++) {
          if (ellipse && !ellipseContains(x, y, this.ix, this.iy, tx, ty))
            continue;
          const tile = at(x - left, y - top);
          if (tile) preview.push(this.patternTile(tile, event, x, y));
        }
      }
      return preview;
    },
    getFill(event, layer) {
      const { tx, ty } = this.getTileLocation(event);
      const at = pattern(toRaw(this.selectedTiles));
      const preview = [];
      const width = layer[0].length;
      const available = toRaw(this.autotiles);
      for (const index of connectedArea(layer, tx, ty)) {
        const x = index % width,
          y = Math.floor(index / width);
        const tile = at(x - tx, y - ty);
        if (!tile) continue;
        const group = Math.floor(tile.id / 48);
        const id =
          tile.id >= 384 || tile.shiftKey
            ? tile.id
            : available[group - 1]
              ? group * 48
              : 0;
        preview.push({ id, x, y });
      }
      return preview;
    },
    getSelect(event) {
      const { tx, ty } = this.getTileLocation(event);
      let newSelection = [[], [], []];
      if (this.selectStart) {
        for (
          let ix = Math.min(this.selectStart.x, tx);
          ix < Math.max(this.selectStart.x, tx) + 1;
          ix++
        ) {
          for (
            let iy = Math.min(this.selectStart.y, ty);
            iy < Math.max(this.selectStart.y, ty) + 1;
            iy++
          ) {
            for (let i = 0; i < 3; i++) {
              newSelection[i].push({
                id: this.getLayer(i + 1)[iy][ix],
                x: ix,
                y: iy,
                shiftKey: true,
              });
            }
          }
        }
      }
      if (newSelection[0].length > 1) return newSelection;
      newSelection = [[], [], []];
      for (let i = 0; i < 3; i++) {
        newSelection[i].push({
          id: this.getLayer(i + 1)[ty][tx],
          x: tx,
          y: ty,
          shiftKey: true,
        });
      }
      return newSelection;
    },
    rollbackPreview() {
      if (!this.beforeEdit) return;
      const layer = this.layer,
        width = this.beforeEdit.width,
        chunks = new Set();
      for (const [index, change] of this.beforeEdit.changes) {
        const x = index % width,
          y = Math.floor(index / width);
        layer[y][x] = change.before;
        chunks.add(
          `${Math.floor(x / CHUNK_TILES)},${Math.floor(y / CHUNK_TILES)}:`
        );
      }
      for (const key of this.cache.entries.keys())
        if (chunks.has(key.split(":")[0] + ":")) this.cache.delete(key);
      this.beforeEdit.changes.clear();
    },
    addTiles(event, layer, preview) {
      const edit = this.beforeEdit;
      const width = layer[0].length;
      const chunks = new Set();
      const write = (x, y, id) => {
        if (writeCell(edit, layer, x, y, id))
          chunks.add(
            `${Math.floor(x / CHUNK_TILES)},${Math.floor(y / CHUNK_TILES)}:`
          );
      };
      for (const tile of preview) write(tile.x, tile.y, tile.id);
      if (!event.shiftKey) {
        const affected = new Set();
        for (const tile of preview) {
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const x = tile.x + dx,
                y = tile.y + dy;
              if (x < 0 || x >= width || y < 0 || y >= layer.length) continue;
              const id = layer[y][x];
              if (id >= 48 && id < 384) affected.add(y * width + x);
            }
        }
        for (const index of affected) {
          const x = index % width,
            y = Math.floor(index / width);
          write(x, y, autotileId(layer, Math.floor(layer[y][x] / 48), x, y));
        }
      }
      for (const key of this.cache.entries.keys())
        if (chunks.has(key.split(":")[0] + ":")) this.cache.delete(key);
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
      this.cursorTile = null;
      this.drawRect(
        MAP_CANVAS_ID,
        x * TILESIZE * this.zoom,
        y * TILESIZE * this.zoom,
        width * TILESIZE * this.zoom,
        height * TILESIZE * this.zoom
      );
    },
    drawSelect(x, y, width, height) {
      this.cursorTile = null;
      this.drawDotRect(
        x * TILESIZE * this.zoom,
        y * TILESIZE * this.zoom,
        width * TILESIZE * this.zoom,
        height * TILESIZE * this.zoom
      );
    },
    getAutotileId(layer, id, x, y) {
      return this.autotiles[id - 1] ? autotileId(layer, id, x, y) : 0;
    },
    applyHistory(item, after) {
      const layer = toRaw(this.maps[item.map].data[item.layer]);
      for (let i = 0; i < item.cells.length; i += 3) {
        const x = item.cells[i] % item.width,
          y = Math.floor(item.cells[i] / item.width);
        layer[y][x] = item.cells[i + (after ? 2 : 1)];
        this.invalidateTile?.(x, y);
      }
    },
    async undo() {
      if (this.tileAddStart) return null;
      const item = await this.removeMapHistory();
      if (item) {
        this.applyHistory(item, false);
        this.ADD_MAP_FUTURE(item);
      }
      return item;
    },
    async redo() {
      if (this.tileAddStart) return null;
      const item = await this.removeMapFuture();
      if (item) {
        this.applyHistory(item, true);
        this.ADD_MAP_HISTORY(item);
      }
      return item;
    },
    getEventHandler(id, event, callback) {
      return this.$el.querySelector(id).addEventListener(event, callback);
    },
    removeEventHandler(id, event, callback) {
      return this.$el.querySelector(id).removeEventListener(event, callback);
    },
    drawRect(canvasId, x, y, width, height) {
      this.overlayRect = { x, y, width, height, dashed: false };
      this.scheduleFrame();
    },
    drawDotRect(x, y, width, height) {
      this.overlayRect = { x, y, width, height, dashed: true };
      this.cursorTile = null;
      this.scheduleFrame();
    },
    getPreview(event) {
      let preview = null;
      switch (this.mode) {
        case TOOLS.BRUSH:
          preview = this.getBrush(event, this.layer, []);
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
      e.target.setPointerCapture?.(e.pointerId);
      const point = this.getTileLocation(e);
      e = {
        ...e,
        button: e.button,
        buttons: e.buttons,
        shiftKey: e.shiftKey,
        tilePosition: point,
      };
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
            this.beforeEdit = markRaw(
              transaction(
                this.activeMap,
                this.activeLayer - 1,
                this.maps[this.activeMap].width
              )
            );
            this.tileAddStart = true;
            const preview = this.getPreview(e);
            this.addTiles(e, this.layer, preview);
            this.draw();
          }
        } else if (this.mode === TOOLS.SELECT) {
          if (e.button === 2 || e.which === 3) return;
          if (this.select[0].length > 0) {
            const i = this.select[0][0];
            const l = this.select[0][this.select[0].length - 1];
            if (
              this.mouseX >= i.x &&
              this.mouseX <= l.x &&
              this.mouseY >= i.y &&
              this.mouseY <= l.y
            ) {
              this.isMove = true;
            } else {
              this.selectStart = this.getSelect(e)[0][0];
            }
          } else {
            this.selectStart = this.getSelect(e)[0][0];
          }
        }
      }
    },
    pointerMoveEvent(e) {
      const point = this.getTileLocation(e);
      const previousX = this.mouseX,
        previousY = this.mouseY;
      e = {
        button: e.button,
        buttons: e.buttons,
        which: e.which,
        shiftKey: e.shiftKey,
        tilePosition: point,
      };
      if (this.mouseX !== point.tx || this.mouseY !== point.ty) {
        this.mouseX = point.tx;
        this.mouseY = point.ty;
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
                if (this.mode !== TOOLS.BRUSH) this.rollbackPreview();
                let preview;
                if (this.mode === TOOLS.BRUSH && previousX !== undefined) {
                  preview = [];
                  const steps = Math.max(
                    Math.abs(point.tx - previousX),
                    Math.abs(point.ty - previousY)
                  );
                  for (let i = 1; i <= steps; i++) {
                    preview.push(
                      ...this.getPreview({
                        ...e,
                        tilePosition: {
                          tx: Math.round(
                            previousX + ((point.tx - previousX) * i) / steps
                          ),
                          ty: Math.round(
                            previousY + ((point.ty - previousY) * i) / steps
                          ),
                        },
                      })
                    );
                  }
                } else preview = this.getPreview(e);
                this.addTiles(e, this.layer, preview);
                this.draw();
              } else {
                this.previewSelectedTile(e);
              }
            }
          } else if (this.mode === TOOLS.SELECT) {
            if (e.button === 2 || e.which === 3) return;
            if (this.selectStart) {
              this.drawSelect(
                Math.min(this.selectStart.x, point.tx),
                Math.min(this.selectStart.y, point.ty),
                Math.abs(this.selectStart.x - point.tx) + 1,
                Math.abs(this.selectStart.y - point.ty) + 1
              );
            }
          }
        }
      }
    },
    cancelStroke() {
      this.rollbackPreview();
      this.tileAddStart = false;
      this.beforeEdit = null;
      this.cursorTile = null;
      this.overlayRect = null;
      this.draw();
    },
    pointerUpEvent(e) {
      if (this.drawable && this.tileAddStart) {
        if (
          this.mode === TOOLS.BRUSH ||
          this.mode === TOOLS.SQUARE ||
          this.mode === TOOLS.CIRCLE ||
          this.mode === TOOLS.FILL
        ) {
          this.draw();
        }
        const item = pack(this.beforeEdit);
        if (item) {
          this.INIT_MAP_FUTURE();
          this.ADD_MAP_HISTORY(item);
        }
        this.previewSelectedTile(e);
      }
      this.tileAddStart = false;
      this.beforeEdit = null;
      // 마우스 우클릭
      if (this.drawable && (e.button === 2 || e.which === 3)) {
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
      if (this.drawable && this.mode === TOOLS.SELECT) {
        if (e.button === 2 || e.which === 3) return;
        if (this.isMove) {
          // TODO
          this.isMove = false;
        } else {
          const selection = this.getSelect(e);
          this.selectStart = null;
          this.select = selection;
        }
      }
    },
    mouseLeaveEvent() {
      this.cursorTile = null;
      this.overlayRect = null;
      this.scheduleFrame();
      this.select = [[], [], []];
      this.mouseX = undefined;
      this.mouseY = undefined;
    },
    isCtrlZ(e) {
      return (
        ((e.ctrlKey && navigator.userAgentData?.platform !== "macOS") ||
          e.metaKey) &&
        e.key?.toLowerCase() === "z"
      );
    },
    async keyDownEvent(e) {
      // undo
      if (this.isCtrlZ(e)) {
        e.preventDefault();
        if (e.shiftKey) {
          await this.redo(e);
          this.draw();
        } else {
          await this.undo(e);
          this.draw();
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
