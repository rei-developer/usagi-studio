<template>
  <div class="tileset-wrapper">
    <canvas id="autotileCanvas" width="256" height="32">
      자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
    </canvas>
    <canvas id="tilesetCanvas" :width="width" :height="height">
      자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
    </canvas>
  </div>
</template>

<style lang="scss" scoped>
.tileset-wrapper {
  height: 800px;
  overflow-y: auto;
}
</style>

<script>
const TILESIZE = 32;

export default {
  name: "TilesetView",
  props: {
    tilesetName: String,
    autotiles: Array,
    backgroundColor: String,
  },
  data: () => ({
    width: 0,
    height: 0,
    tileset: null,
    tileSelectStart: null,
    selection: [],
  }),
  created() {
    this.init();
  },
  mounted() {
    this.getEventHandler("#tilesetCanvas", "pointerdown", (e) => {
      this.tileSelectStart = this.getSelectedTile(e)[0];
    });
    this.getEventHandler("#autotileCanvas", "pointerdown", (e) => {
      this.tileSelectStart = this.getSelectedAutotile(e)[0];
    });
    this.getEventHandler("#tilesetCanvas", "pointermove", (e) => {
      if (this.tileSelectStart) {
        this.selection = this.getSelectedTile(e);
        const width =
          this.selection[this.selection.length - 1].x - this.selection[0].x + 1;
        const height =
          this.selection[this.selection.length - 1].y - this.selection[0].y + 1;
        this.drawSelectedTile(
          this.selection[0].x,
          this.selection[0].y,
          width,
          height
        );
        this.$emit("selectionChanged", this.selection);
      }
    });
    this.getEventHandler("#autotileCanvas", "pointermove", (e) => {
      if (this.tileSelectStart) {
        this.selection = this.getSelectedAutotile(e);
        this.drawSelectedAutotile(this.selection[0].x, this.selection[0].y);
        this.$emit("selectionChanged", this.selection);
      }
    });
    this.getEventHandler("#tilesetCanvas", "pointerup", (e) => {
      this.selection = this.getSelectedTile(e);
      this.tileSelectStart = null;
      const width =
        this.selection[this.selection.length - 1].x - this.selection[0].x + 1;
      const height =
        this.selection[this.selection.length - 1].y - this.selection[0].y + 1;
      this.drawSelectedTile(
        this.selection[0].x,
        this.selection[0].y,
        width,
        height
      );
      this.$emit("selectionChanged", this.selection);
    });
    this.getEventHandler("#autotileCanvas", "pointerup", (e) => {
      this.selection = this.getSelectedAutotile(e);
      this.tileSelectStart = null;
      this.drawSelectedAutotile(this.selection[0].x, this.selection[0].y);
      this.$emit("selectionChanged", this.selection);
    });
  },
  methods: {
    init() {
      this.tileset = new Image();
      this.tileset.src = require(`@/assets/tilesets/${this.tilesetName}.png`);
      this.width = this.tileset.width;
      this.height = this.tileset.height;
      this.tileset.onload = () => {
        this.draw();
      };
    },
    draw() {
      const ctx = this.getContext();
      const atctx = this.getContext("#autotileCanvas");
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
        : this.$el.querySelector("#tilesetCanvas");
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
      return [{ id: tx, x: tx, y: ty }];
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
        "#tilesetCanvas",
        x * TILESIZE,
        y * TILESIZE,
        width * TILESIZE,
        height * TILESIZE
      );
    },
    drawSelectedAutotile(x, y) {
      this.draw();
      this.drawRect(
        "#autotileCanvas",
        x * TILESIZE,
        y * TILESIZE,
        TILESIZE,
        TILESIZE
      );
    },
    drawRect(canvasId, x, y, width, height, style = "rgba(0, 0, 0, 1") {
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
  },
};
</script>
