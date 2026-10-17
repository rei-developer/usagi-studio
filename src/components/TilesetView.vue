<template>
  <div class="tileset-view-wrapper">
    <div id="tileset" class="content custom-scroll-box">
      <canvas id="autotileCanvas" :width="256" :height="32">
        자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
      </canvas>
      <canvas id="tilesetCanvas" :width="256" :height="height">
        자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
      </canvas>
    </div>
    <div class="bottom">
      1: {{ mapName }} ({{ mapWidth }} x {{ mapHeight }})
    </div>
    <autotile-popup
      v-if="isAutotilePopupOpened"
      :autotileId="autotileId"
      :autotiles="autotiles"
      :mouseX="mouseX"
      :mouseY="mouseY"
      @onClosePopup="onCloseAutotilePopup"
    />
  </div>
</template>

<style lang="scss" scoped>
.tileset-view-wrapper {
  display: flex;
  flex-direction: column;
  width: 266px;
  height: 100%;
  min-height: 0;
  > .content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    background: #000;
    overflow-y: auto;
  }
  > .bottom {
    display: flex;
    justify-content: flex-end;
    height: 19px;
    line-height: 19px;
    padding: 0 4px;
    font-size: 11px;
    border-top: 1px solid #333;
    background: var(--primary);
  }
}
</style>

<script>
import { mapGetters, mapMutations } from "vuex";
import {
  TILESIZE,
  TILESET_CANVAS_ID,
  AUTOTILE_CANVAS_ID,
} from "@/utils/tileset";
import AutotilePopup from "@/components/popups/AutotilePopup";

const D = { DOWN: 2, LEFT: 4, RIGHT: 6, UP: 8 };

export default {
  name: "TilesetView",
  components: { AutotilePopup },
  props: {
    locked: Boolean,
    tileset: { type: Object, default: null },
    mapName: {
      type: String,
      default: "",
    },
    mapWidth: {
      type: Number,
      default: 20,
    },
    mapHeight: {
      type: Number,
      default: 15,
    },
    tilesetName: {
      type: String,
      default: null,
    },
    autotiles: {
      type: Array,
      default: () => [],
    },
    backgroundColor: {
      type: String,
      default: "#000",
    },
  },
  data: () => ({
    lastPosition: null,
    mouseX: null,
    mouseY: null,

    tileSelectStart: null,
    autotileId: null,
    isAutotilePopupOpened: false,
  }),
  watch: {
    selectedTiles() {
      if (
        this.activeCanvas !== TILESET_CANVAS_ID &&
        this.activeCanvas !== AUTOTILE_CANVAS_ID
      ) {
        this.draw();
        this.focusSelectedTile();
      }
    },
  },

  mounted() {
    this.init();
    this.getEventHandler(
      TILESET_CANVAS_ID,
      "pointerdown",
      this.tilesetPointerDownEvent
    );
    this.getEventHandler(
      AUTOTILE_CANVAS_ID,
      "pointerdown",
      this.tilesetPointerDownEvent
    );
    this.getEventHandler(
      TILESET_CANVAS_ID,
      "pointermove",
      this.tilesetPointerMoveEvent
    );
    this.getEventHandler(
      AUTOTILE_CANVAS_ID,
      "pointermove",
      this.autotilePointerMoveEvent
    );
    this.getEventHandler(
      TILESET_CANVAS_ID,
      "pointerup",
      this.tilesetPointerUpEvent
    );
    this.getEventHandler(
      AUTOTILE_CANVAS_ID,
      "pointerup",
      this.autotilePointerUpEvent
    );
    this.getEventHandler(
      AUTOTILE_CANVAS_ID,
      "dblclick",
      this.autotileDoubleClickEvent
    );
    document.addEventListener("keydown", this.keyDownEvent);
    window.addEventListener("blur", this.cancelSelection);
    for (const id of [TILESET_CANVAS_ID, AUTOTILE_CANVAS_ID])
      this.getEventHandler(id, "pointercancel", this.cancelSelection);
  },
  beforeUnmount() {
    this.removeEventHandler(
      TILESET_CANVAS_ID,
      "pointerdown",
      this.tilesetPointerDownEvent
    );
    this.removeEventHandler(
      AUTOTILE_CANVAS_ID,
      "pointerdown",
      this.tilesetPointerDownEvent
    );
    this.removeEventHandler(
      TILESET_CANVAS_ID,
      "pointermove",
      this.tilesetPointerMoveEvent
    );
    this.removeEventHandler(
      AUTOTILE_CANVAS_ID,
      "pointermove",
      this.autotilePointerMoveEvent
    );
    this.removeEventHandler(
      TILESET_CANVAS_ID,
      "pointerup",
      this.tilesetPointerUpEvent
    );
    this.removeEventHandler(
      AUTOTILE_CANVAS_ID,
      "pointerup",
      this.autotilePointerUpEvent
    );
    this.removeEventHandler(
      AUTOTILE_CANVAS_ID,
      "dblclick",
      this.autotileDoubleClickEvent
    );
    document.removeEventListener("keydown", this.keyDownEvent);
    window.removeEventListener("blur", this.cancelSelection);
    for (const id of [TILESET_CANVAS_ID, AUTOTILE_CANVAS_ID])
      this.removeEventHandler(id, "pointercancel", this.cancelSelection);
  },
  computed: {
    ...mapGetters(["fields"]),
    width() {
      return this.tileset?.width;
    },
    height() {
      return this.tileset?.height;
    },
    selectedTiles() {
      return this.$store.state.data.selectedTiles;
    },
    activeCanvas() {
      return this.$store.state.data.activeCanvas;
    },
  },
  methods: {
    cancelSelection() {
      this.tileSelectStart = null;
      this.lastPosition = null;
    },
    ...mapMutations(["UPDATE_FIELDS"]),
    init() {
      this.drawSelectedAutotile(0, 0);
      this.UPDATE_FIELDS({
        selectedTiles: [{ id: 0, x: 0, y: 0 }],
        activeCanvas: AUTOTILE_CANVAS_ID,
      });
    },
    draw() {
      const ctx = this.getContext();
      const atctx = this.getContext(AUTOTILE_CANVAS_ID);
      ctx.clearRect(0, 0, this.width, this.height);
      atctx.clearRect(0, 0, 256, 32);
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.width, this.height);
      atctx.fillStyle = this.backgroundColor;
      atctx.fillRect(0, 0, 256, 32);
      ctx.drawImage(this.tileset, 0, 0, this.width, this.height);
      this.autotiles.forEach((autotile, index) => {
        if (!autotile) return;
        atctx.drawImage(
          autotile,
          0,
          0,
          TILESIZE,
          TILESIZE,
          (index + 1) * TILESIZE,
          0,
          TILESIZE,
          TILESIZE
        );
      });
    },
    getContext(id) {
      const canvas = id
        ? this.$el.querySelector(id)
        : this.$el.querySelector(TILESET_CANVAS_ID);
      return canvas.getContext("2d");
    },
    getSelectedTile(event, point = this.getTileLocation(event)) {
      const offset = 384;
      const { tx, ty } = point;
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
            const tileid = iy * 8 + ix + offset;
            newSelection.push({ id: tileid, x: ix, y: iy });
          }
        }
      }
      if (newSelection.length > 0) return newSelection;
      const tileid = ty * 8 + tx + offset;
      return [{ id: tileid, x: tx, y: ty }];
    },
    getSelectedAutotile(event, point = this.getTileLocation(event)) {
      const { tx, ty } = point;
      return [{ id: tx * 48 + 47, x: tx, y: ty }];
    },
    focusSelectedTile() {
      if (this.selectedTiles.length === 1) {
        if (this.selectedTiles[0].id >= 384) {
          const tileNum = this.selectedTiles[0].id - 384; // 오프셋
          const tileRow = parseInt(tileNum / 8);
          const tileCol = tileNum % 8;
          this.drawSelectedTile(tileCol, tileRow, 1, 1);
          this.$el.querySelector("#tileset").scrollTo({
            top: (tileRow + 1) * TILESIZE,
            behavior: "smooth",
          });
        } else if (this.selectedTiles[0].id > 0) {
          const autotileId = parseInt(this.selectedTiles[0].id / 48);
          this.drawSelectedAutotile(autotileId, 0);
          this.$el.querySelector("#tileset").scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }
    },
    moveSelectedTile(event, d) {
      event.preventDefault();
      const offset = 384;
      const _selection = this.fields.selectedTiles[0];
      const _activeCanvas = this.fields.activeCanvas;
      switch (d) {
        case D.DOWN:
          if (_selection.y === 0 && _activeCanvas === AUTOTILE_CANVAS_ID) {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: _selection.x + offset,
                  x: _selection.x,
                  y: 0,
                },
              ],
              activeCanvas: TILESET_CANVAS_ID,
            });
            this.focusSelectedTile();
          } else if (
            _selection.y === parseInt((this.height - 1) / TILESIZE) &&
            _activeCanvas === TILESET_CANVAS_ID
          )
            return;
          else {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: (_selection.y + 1) * 8 + _selection.x + offset,
                  x: _selection.x,
                  y: _selection.y + 1,
                },
              ],
            });
            this.focusSelectedTile();
          }
          break;
        case D.LEFT:
          if (_selection.x === 0) return;
          if (_activeCanvas === TILESET_CANVAS_ID) {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: _selection.y * 8 + (_selection.x - 1) + offset,
                  x: _selection.x - 1,
                  y: _selection.y,
                },
              ],
            });
          } else if (_activeCanvas === AUTOTILE_CANVAS_ID) {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: (_selection.x - 1) * 48 + 47,
                  x: _selection.x - 1,
                  y: _selection.y,
                },
              ],
            });
          }
          this.focusSelectedTile();
          break;
        case D.RIGHT:
          if (_selection.x === 7) return;
          if (_activeCanvas === TILESET_CANVAS_ID) {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: _selection.y * 8 + (_selection.x + 1) + offset,
                  x: _selection.x + 1,
                  y: _selection.y,
                },
              ],
            });
          } else if (_activeCanvas === AUTOTILE_CANVAS_ID) {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: (_selection.x + 1) * 48 + 47,
                  x: _selection.x + 1,
                  y: _selection.y,
                },
              ],
            });
          }
          this.focusSelectedTile();
          break;
        case D.UP:
          if (_selection.y === 0 && _activeCanvas === AUTOTILE_CANVAS_ID)
            return;
          else if (_selection.y === 0 && _activeCanvas === TILESET_CANVAS_ID) {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: _selection.x * 48 + 47,
                  x: _selection.x,
                  y: 0,
                },
              ],
              activeCanvas: AUTOTILE_CANVAS_ID,
            });
            this.focusSelectedTile();
          } else {
            this.UPDATE_FIELDS({
              selectedTiles: [
                {
                  id: (_selection.y - 1) * 8 + _selection.x + offset,
                  x: _selection.x,
                  y: _selection.y - 1,
                },
              ],
            });
            this.focusSelectedTile();
          }
          break;
        default:
          break;
      }
    },
    getTileLocation(event) {
      const canvas = event.target;
      const { x, y, width, height } = canvas.getBoundingClientRect();
      const tx = Math.min(
        Math.ceil(canvas.width / TILESIZE) - 1,
        Math.floor(
          (Math.max(event.clientX - x, 0) * canvas.width) / width / TILESIZE
        )
      );
      const ty = Math.min(
        Math.ceil(canvas.height / TILESIZE) - 1,
        Math.floor(
          (Math.max(event.clientY - y, 0) * canvas.height) / height / TILESIZE
        )
      );
      return { tx, ty };
    },
    drawSelectedTile(x, y, width, height) {
      this.draw();
      this.drawRect(
        TILESET_CANVAS_ID,
        x * TILESIZE,
        y * TILESIZE,
        width * TILESIZE,
        height * TILESIZE
      );
    },
    drawSelectedAutotile(x, y) {
      this.draw();
      this.drawRect(
        AUTOTILE_CANVAS_ID,
        x * TILESIZE,
        y * TILESIZE,
        TILESIZE,
        TILESIZE
      );
    },
    drawRect(canvasId, x, y, width, height, _style = "rgba(0, 0, 0, 1)") {
      const ctx = this.getContext(canvasId);
      const makefillRect = (x, y, width, height, style = _style) => {
        ctx.fillStyle = style;
        ctx.fillRect(x, y, width, height);
      };
      makefillRect(x, y, width, 4, "#000");
      makefillRect(x, y, 4, height, "#000");
      makefillRect(x + width - 4, y, 4, height, "#000");
      makefillRect(x, y + height - 4, width, 4, "#000");
      makefillRect(x + 1, y + 1, width - 2, 2, "#fff");
      makefillRect(x + 1, y + 1, 2, height - 2, "#fff");
      makefillRect(x + width - 3, y + 1, 2, height - 2, "#fff");
      makefillRect(x + 1, y + height - 3, width - 2, 2, "#fff");
      if (this.fields.viewTileId) {
        const tileId = (x / 32 + (y / 32) * 8 + 384).toString();
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "#333";
        ctx.fillText(tileId, x + width + 1, y + height + 14);
        ctx.fillText(tileId, x + width - 1, y + height + 14);
        ctx.fillText(tileId, x + width, y + height + 1 + 14);
        ctx.fillText(tileId, x + width, y + height - 1 + 14);
        ctx.fillStyle = "#fff";
        ctx.fillText(tileId, x + width, y + height + 14);
      }
    },
    getEventHandler(id, event, callback) {
      return this.$el.querySelector(id).addEventListener(event, callback);
    },
    removeEventHandler(id, event, callback) {
      return this.$el.querySelector(id).removeEventListener(event, callback);
    },
    tilesetPointerDownEvent(e) {
      if (this.locked) return;
      this.lastPosition = null;
      this.tileSelectStart = this.getSelectedTile(e)[0];
    },
    tilesetPointerMoveEvent(e) {
      if (this.locked) return;
      const point = this.getTileLocation(e);
      if (
        this.lastPosition?.tx === point.tx &&
        this.lastPosition?.ty === point.ty
      )
        return;
      this.lastPosition = point;
      if (this.tileSelectStart) {
        const selection = this.getSelectedTile(e, point);
        const width = selection[selection.length - 1].x - selection[0].x + 1;
        const height = selection[selection.length - 1].y - selection[0].y + 1;
        this.drawSelectedTile(selection[0].x, selection[0].y, width, height);
        this.UPDATE_FIELDS({
          selectedTiles: selection,
          activeCanvas: TILESET_CANVAS_ID,
        });
        this.$emit("selectionChanged", selection);
      }
    },
    tilesetPointerUpEvent(e) {
      if (this.locked) return;
      const selection = this.getSelectedTile(e);
      this.tileSelectStart = null;
      const width = selection[selection.length - 1].x - selection[0].x + 1;
      const height = selection[selection.length - 1].y - selection[0].y + 1;
      this.drawSelectedTile(selection[0].x, selection[0].y, width, height);
      this.UPDATE_FIELDS({
        selectedTiles: selection,
        activeCanvas: TILESET_CANVAS_ID,
      });
      this.$emit("selectionChanged", selection);
    },
    autotilePointerMoveEvent(e) {
      if (this.locked) return;
      const point = this.getTileLocation(e);
      if (
        this.lastPosition?.tx === point.tx &&
        this.lastPosition?.ty === point.ty
      )
        return;
      this.lastPosition = point;
      if (this.tileSelectStart) {
        const selection = this.getSelectedAutotile(e, point);
        this.drawSelectedAutotile(selection[0].x, selection[0].y);
        this.UPDATE_FIELDS({
          selectedTiles: selection,
          activeCanvas: AUTOTILE_CANVAS_ID,
        });
        this.$emit("selectionChanged", selection);
      }
    },
    autotilePointerUpEvent(e) {
      if (this.locked) return;
      const selection = this.getSelectedAutotile(e);
      this.tileSelectStart = null;
      this.drawSelectedAutotile(selection[0].x, selection[0].y);
      this.UPDATE_FIELDS({
        selectedTiles: selection,
        activeCanvas: AUTOTILE_CANVAS_ID,
      });
      this.$emit("selectionChanged", selection);
    },
    autotileDoubleClickEvent(e) {
      const autotileId = this.getTileLocation(e).tx - 1;
      if (this.autotiles[autotileId]) {
        this.autotileId = autotileId;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.isAutotilePopupOpened = true;
      }
    },
    keyDownEvent(e) {
      if (this.locked) return;
      if (
        e.target?.closest?.(
          "input, textarea, select, [contenteditable], [role=dialog]"
        )
      )
        return;
      const _id = this.fields.selectedTiles?.[0]?.id;
      switch (e.key) {
        case "ArrowUp":
          this.moveSelectedTile(e, D.UP);
          break;
        case "ArrowDown":
          this.moveSelectedTile(e, D.DOWN);
          break;
        case "ArrowLeft":
          this.moveSelectedTile(e, D.LEFT);
          break;
        case "ArrowRight":
          this.moveSelectedTile(e, D.RIGHT);
          break;
        case "Enter":
          if (_id < 384) {
            const autotileId = parseInt(_id / 48) - 1;
            if (this.autotiles[autotileId]) {
              e.preventDefault();
              this.autotileId = autotileId;
              this.isAutotilePopupOpened = true;
            }
          }
          break;
        default:
          break;
      }
    },
    onCloseAutotilePopup() {
      this.mouseX = null;
      this.mouseY = null;
      this.isAutotilePopupOpened = false;
    },
  },
};
</script>
