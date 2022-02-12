<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    <canvas id="autotilePopupCanvas" :width="256" :height="192">
      자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
    </canvas>
    <canvas id="autotilePopupCanvasUI" :width="256" :height="192">
      자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
    </canvas>
  </ui-dialog>
</template>

<style lang="scss" scoped>
canvas {
  position: absolute;
}
#autotilePopupCanvas {
  border: 1px solid var(--primary);
  z-index: 1;
}
#autotilePopupCanvasUI {
  border: 1px solid var(--primary);
  z-index: 2;
}
</style>

<script>
import { mapMutations } from "vuex";
import {
  TILESIZE,
  AUTOTILES,
  AUTOTILE_POPUP_CANVAS_ID,
  AUTOTILE_POPUP_CANVAS_UI_ID,
} from "@/utils/tileset";
import UiDialog from "@/components/common/Dialog";

export default {
  name: "AutotilePopup",
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
  data: () => ({
    selection: null,
  }),
  computed: {
    dialogOptions() {
      return {
        header: "SELECT AUTOTILE",
        icon: "layer-group",
        width: 268,
        height: 250,
        mouseX: this.mouseX,
        mouseY: this.mouseY + 20,
        callback: () => this.setSelection(),
      };
    },
    context() {
      const canvas = this.$el.querySelector(AUTOTILE_POPUP_CANVAS_ID);
      return canvas.getContext("2d");
    },
    contextUI() {
      const canvas = this.$el.querySelector(AUTOTILE_POPUP_CANVAS_UI_ID);
      return canvas.getContext("2d");
    },
  },
  mounted() {
    this.draw();
    this.getEventHandler(
      AUTOTILE_POPUP_CANVAS_UI_ID,
      "pointerdown",
      this.pointerDownEvent
    );
    this.getEventHandler(
      AUTOTILE_POPUP_CANVAS_UI_ID,
      "dblclick",
      this.doubleClickEvent
    );
  },
  beforeUnmount() {
    this.removeEventHandler(
      AUTOTILE_POPUP_CANVAS_UI_ID,
      "pointerdown",
      this.pointerDownEvent
    );
    this.removeEventHandler(
      AUTOTILE_POPUP_CANVAS_UI_ID,
      "dblclick",
      this.doubleClickEvent
    );
  },
  methods: {
    ...mapMutations(["UPDATE_FIELDS"]),
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
      this.contextUI.clearRect(0, 0, 256, 192);
      const makefillRect = (x, y, width, height, style = _style) => {
        this.contextUI.fillStyle = style;
        this.contextUI.fillRect(x, y, width, height);
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
    setSelection() {
      if (this.selection) this.UPDATE_FIELDS({ selectedTiles: this.selection });
      console.log(this.selection);
      this.$emit("onClosePopup");
    },
    getEventHandler(id, event, callback) {
      return this.$el.querySelector(id).addEventListener(event, callback);
    },
    removeEventHandler(id, event, callback) {
      return this.$el.querySelector(id).removeEventListener(event, callback);
    },
    pointerDownEvent(event) {
      const { x, y } = this.getTileLocation(event);
      this.selection = this.getSelectedTile(this.autotileId + 1, x, y);
      this.drawRect(x * TILESIZE, y * TILESIZE, TILESIZE, TILESIZE);
    },
    doubleClickEvent() {
      this.setSelection();
    },
  },
};
</script>
