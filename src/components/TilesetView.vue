<template>
  <div class="tileset-view-wrapper">
    <div class="content custom-scroll-box">
      <canvas id="autotileCanvas" width="256" height="32">
        자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
      </canvas>
      <canvas id="tilesetCanvas" width="256" :height="height">
        자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
      </canvas>
    </div>
    <div class="bottom">
      1: {{ mapName }} ({{ mapWidth }} x {{ mapHeight }})
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tileset-view-wrapper {
  display: flex;
  flex-direction: column;
  width: 266px;
  height: calc(100vh - 100px);
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
import { mapMutations } from "vuex";

const TILESET_CANVAS_ID = "#tilesetCanvas";
const AUTOTILE_CANVAS_ID = "#autotileCanvas";

const TILESIZE = 32;

export default {
  name: "TilesetView",
  props: {
    mapName: String,
    mapWidth: Number,
    mapHeight: Number,
    tilesetName: String,
    autotiles: Array,
    backgroundColor: String,
  },
  data: () => ({
    tileset: null,
    tileSelectStart: null,
  }),
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
  },
  computed: {
    width() {
      return this.tileset?.width;
    },
    height() {
      return this.tileset?.height;
    },
    selectedTiles() {
      return this.$store.state.data.selectedTiles;
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
          this.updateFields({ selectedTiles: [{ id: 0, x: 0, y: 0 }] });
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
    drawRect(canvasId, x, y, width, height, style = "rgba(0, 0, 0, 1)") {
      const ctx = this.getContext(canvasId);
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = style;
      ctx.rect(x, y, width, height);
      ctx.stroke();
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
        this.updateFields({ selectedTiles: selection });
        this.$emit("selectionChanged", selection);
      }
    },
    tilesetPointerUpEvent(e) {
      const selection = this.getSelectedTile(e);
      this.tileSelectStart = null;
      const width = selection[selection.length - 1].x - selection[0].x + 1;
      const height = selection[selection.length - 1].y - selection[0].y + 1;
      this.drawSelectedTile(selection[0].x, selection[0].y, width, height);
      this.updateFields({ selectedTiles: selection });
      this.$emit("selectionChanged", selection);
    },
    autotilePointerMoveEvent(e) {
      if (this.tileSelectStart) {
        const selection = this.getSelectedAutotile(e);
        this.drawSelectedAutotile(selection[0].x, selection[0].y);
        this.updateFields({ selectedTiles: selection });
        this.$emit("selectionChanged", selection);
      }
    },
    autotilePointerUpEvent(e) {
      const selection = this.getSelectedAutotile(e);
      this.tileSelectStart = null;
      this.drawSelectedAutotile(selection[0].x, selection[0].y);
      this.updateFields({ selectedTiles: selection });
      this.$emit("selectionChanged", selection);
    },
  },
};
</script>
