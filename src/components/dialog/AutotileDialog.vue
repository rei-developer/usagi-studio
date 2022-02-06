<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    <canvas id="autotileDialogCanvas" :width="256" :height="192">
      자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
    </canvas>
  </ui-dialog>
</template>

<script>
import { mapMutations } from "vuex";
import UiDialog from "@/components/common/Dialog";

const TILESIZE = 32;
const AUTOTILE_DIALOG_CANVAS_ID = "#autotileDialogCanvas";
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
  name: "AutotileDialog",
  components: { UiDialog },
  props: {
    autotileId: {
      type: Number,
      default: 0,
    },
    autotiles: {
      type: Array,
      default: () => [],
    },
    mouseX: {
      type: Number,
      default: 0,
    },
    mouseY: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    dialogOptions() {
      return {
        header: "SELECT AUTOTILE",
        icon: "layer-group",
        width: 266,
        height: 248,
        mouseX: this.mouseX,
        mouseY: this.mouseY + 20,
        callback: () => this.doEvent(),
      };
    },
    context() {
      const canvas = this.$el.querySelector(AUTOTILE_DIALOG_CANVAS_ID);
      return canvas.getContext("2d");
    },
  },
  mounted() {
    this.draw();
    this.getEventHandler(
      AUTOTILE_DIALOG_CANVAS_ID,
      "pointerdown",
      this.pointerDownEvent
    );
    this.getEventHandler(
      AUTOTILE_DIALOG_CANVAS_ID,
      "dblclick",
      this.doubleClickEvent
    );
  },
  beforeUnmount() {
    this.removeEventHandler(
      AUTOTILE_DIALOG_CANVAS_ID,
      "pointerdown",
      this.pointerDownEvent
    );
    this.removeEventHandler(
      AUTOTILE_DIALOG_CANVAS_ID,
      "dblclick",
      this.doubleClickEvent
    );
  },
  methods: {
    ...mapMutations(["updateFields"]),
    doEvent() {
      this.$emit("onCloseDialog");
    },
    draw() {
      this.context.clearRect(0, 0, 256, 192);
      for (let i = 0; i < 48; i++) {
        const parts = AUTOTILES[parseInt(i / 8)][i % 8];
        for (let j = 0; j < 5; j++) {
          const tile_position = parts[j] - 1;
          this.context.drawImage(
            this.autotiles[this.autotileId],
            (tile_position % 6) * 16,
            parseInt(tile_position / 6) * 16,
            16,
            16,
            (i % 8) * TILESIZE + (j % 2) * 16,
            parseInt(i / 8) * TILESIZE + parseInt(j / 2) * 16,
            16,
            16
          );
        }
      }
    },
    drawRect(x, y, width, height, _style = "rgba(0, 0, 0, 1)") {
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
    getTileLocation(event) {
      const { x, y } = event.target.getBoundingClientRect();
      const tx = Math.floor(Math.max(event.clientX - x, 0) / TILESIZE);
      const ty = Math.floor(Math.max(event.clientY - y, 0) / TILESIZE);
      return { x: tx, y: ty };
    },
    getSelectedTile(_id, x, y) {
      const id = x + y * 8 + _id * 48;
      return [{ id, x, y, shiftKey: true }];
    },
    getEventHandler(id, event, callback) {
      return this.$el.querySelector(id).addEventListener(event, callback);
    },
    removeEventHandler(id, event, callback) {
      return this.$el.querySelector(id).removeEventListener(event, callback);
    },
    pointerDownEvent(event) {
      const { x, y } = this.getTileLocation(event);
      const selection = this.getSelectedTile(this.autotileId + 1, x, y);
      this.draw();
      this.drawRect(x * TILESIZE, y * TILESIZE, TILESIZE, TILESIZE);
      this.updateFields({ selectedTiles: selection });
    },
    doubleClickEvent() {
      this.$emit("onCloseDialog");
    },
  },
};
</script>
