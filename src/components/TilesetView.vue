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
  height: calc(100vh - 50px);
  > .content {
    display: flex;
    flex-direction: column;
    height: 100%;
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
import AutotilePopup from "@/components/popups/AutotilePopup";

const TILESET_CANVAS_ID = "#tilesetCanvas";
const AUTOTILE_CANVAS_ID = "#autotileCanvas";

const TILESIZE = 32;

export default {
  name: "TilesetView",
  components: { AutotilePopup },
  props: {
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
    mouseX: null,
    mouseY: null,
    tileset: null,
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
  created() {
    this.init();
  },
  mounted() {
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
    ...mapMutations(["updateFields"]),
    init() {
      let tileset = new Image();
      tileset.src = `/tilesets/${this.tilesetName}.png`;
      tileset.onload = () => {
        this.tileset = new Image(tileset.width, tileset.height);
        this.tileset.src = tileset.src;
        this.tileset.onload = () => {
          this.draw();
          this.drawSelectedAutotile(0, 0);
          this.updateFields({
            selectedTiles: [{ id: 0, x: 0, y: 0 }],
            activeCanvas: AUTOTILE_CANVAS_ID,
          });
          tileset = null;
        };
      };
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
    getSelectedTile(event) {
      const offset = 384;
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
            const tileid = iy * 8 + ix + offset;
            newSelection.push({ id: tileid, x: ix, y: iy });
          }
        }
      }
      if (newSelection.length > 0) return newSelection;
      const tileid = ty * 8 + tx + offset;
      return [{ id: tileid, x: tx, y: ty }];
    },
    getSelectedAutotile(event) {
      const { tx, ty } = this.getTileLocation(event);
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
    getTileLocation(event) {
      const { x, y } = event.target.getBoundingClientRect();
      const tx = Math.floor(Math.max(event.clientX - x, 0) / TILESIZE);
      const ty = Math.floor(Math.max(event.clientY - y, 0) / TILESIZE);
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
      this.tileSelectStart = this.getSelectedTile(e)[0];
    },
    tilesetPointerMoveEvent(e) {
      if (this.tileSelectStart) {
        const selection = this.getSelectedTile(e);
        const width = selection[selection.length - 1].x - selection[0].x + 1;
        const height = selection[selection.length - 1].y - selection[0].y + 1;
        this.drawSelectedTile(selection[0].x, selection[0].y, width, height);
        this.updateFields({
          selectedTiles: selection,
          activeCanvas: TILESET_CANVAS_ID,
        });
        this.$emit("selectionChanged", selection);
      }
    },
    tilesetPointerUpEvent(e) {
      const selection = this.getSelectedTile(e);
      this.tileSelectStart = null;
      const width = selection[selection.length - 1].x - selection[0].x + 1;
      const height = selection[selection.length - 1].y - selection[0].y + 1;
      this.drawSelectedTile(selection[0].x, selection[0].y, width, height);
      this.updateFields({
        selectedTiles: selection,
        activeCanvas: TILESET_CANVAS_ID,
      });
      this.$emit("selectionChanged", selection);
    },
    autotilePointerMoveEvent(e) {
      if (this.tileSelectStart) {
        const selection = this.getSelectedAutotile(e);
        this.drawSelectedAutotile(selection[0].x, selection[0].y);
        this.updateFields({
          selectedTiles: selection,
          activeCanvas: AUTOTILE_CANVAS_ID,
        });
        this.$emit("selectionChanged", selection);
      }
    },
    autotilePointerUpEvent(e) {
      const selection = this.getSelectedAutotile(e);
      this.tileSelectStart = null;
      this.drawSelectedAutotile(selection[0].x, selection[0].y);
      this.updateFields({
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
    onCloseAutotilePopup() {
      this.mouseX = null;
      this.mouseY = null;
      this.isAutotilePopupOpened = false;
    },
  },
};
</script>
