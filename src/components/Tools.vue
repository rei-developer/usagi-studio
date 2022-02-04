<template>
  <div class="tools-wrapper">
    <div class="row">
      <div class="item">테스트</div>
      <div class="item">
        <ui-button-group>
          <ui-button
            v-for="(item, index) in fileMenus"
            :key="index"
            :icon="item.icon"
            :active="item.active"
            @click="item.click"
          >
            {{ item.label }}
          </ui-button>
        </ui-button-group>
      </div>
      <div class="item">
        <ui-button-group>
          <ui-button
            v-for="(item, index) in editMenus"
            :key="index"
            :icon="item.icon"
            :active="item.active"
            @click="item.click"
          >
            {{ item.label }}
          </ui-button>
        </ui-button-group>
      </div>
      <div class="item">
        <ui-button-group>
          <ui-button
            v-for="(item, index) in layerMenus"
            :key="index"
            :icon="item.icon"
            :active="item.active"
            @click="item.click"
          >
            {{ item.label }}
          </ui-button>
        </ui-button-group>
      </div>
      <div class="item">
        <ui-button-group>
          <ui-button
            v-for="(item, index) in toolMenus"
            :key="index"
            :icon="item.icon"
            :active="item.active"
            @click="item.click"
          >
            {{ item.label }}
          </ui-button>
        </ui-button-group>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tools-wrapper {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 49px;
  border-bottom: 1px solid #333;
  background: var(--primary);
  > .row {
    display: flex;
    width: inherit;
    height: 23px;
    line-height: 19px;
    color: var(--primary);
    font-size: 11px;
    border-top: 1px solid var(--primary);
    border-bottom: 1px solid var(--primary);
    background: #333;
    > .item {
      display: flex;
      padding: 2px;
    }
    > .item:not(:last-child) {
      border-right: 1px dashed var(--primary);
    }
  }
}
</style>

<script>
import { mapMutations } from "vuex";
import UiButton from "@/components/common/Button";
import UiButtonGroup from "@/components/common/ButtonGroup";

export default {
  name: "Tools",
  components: {
    UiButton,
    UiButtonGroup,
  },
  data: () => ({
    ACTIVE_TOOL: 0,
    ACTIVE_LAYER: 1,
  }),
  watch: {
    ACTIVE_TOOL() {
      this.$emit("toolSelected", this.ACTIVE_TOOL);
    },
    ACTIVE_LAYER() {
      this.$emit("activeLayer", this.ACTIVE_LAYER);
    },
  },
  computed: {
    fileMenus() {
      return [
        {
          label: "Save",
          icon: "save",
          active: null,
          click: () => {},
        },
      ];
    },
    editMenus() {
      return [
        {
          label: "Cut",
          icon: "cut",
          active: null,
          click: () => {},
        },
        {
          label: "Copy",
          icon: "copy",
          active: null,
          click: () => {},
        },
        {
          label: "Paste",
          icon: "paste",
          active: null,
          click: () => {},
        },
        {
          label: "Remove",
          icon: "times",
          active: null,
          click: () => {},
        },
      ];
    },
    layerMenus() {
      return [
        {
          label: "Preview",
          icon: "mountain",
          active: this.ACTIVE_LAYER === 0,
          click: () => this.setActiveLayer(0),
        },
        {
          label: "Layer 1",
          icon: "layer-group",
          active: this.ACTIVE_LAYER === 1,
          click: () => this.setActiveLayer(1),
        },
        {
          label: "Layer 2",
          icon: "layer-group",
          active: this.ACTIVE_LAYER === 2,
          click: () => this.setActiveLayer(2),
        },
        {
          label: "Layer 3",
          icon: "layer-group",
          active: this.ACTIVE_LAYER === 3,
          click: () => this.setActiveLayer(3),
        },
        {
          label: "Event",
          icon: "bolt",
          active: this.ACTIVE_LAYER === 4,
          click: () => this.setActiveLayer(4),
        },
      ];
    },
    toolMenus() {
      return [
        {
          label: "Draw",
          icon: "pencil-alt",
          active: this.ACTIVE_TOOL === 0,
          click: () => this.setActiveTool(0),
        },
        {
          label: "Square",
          icon: "square-full",
          active: this.ACTIVE_TOOL === 1,
          click: () => this.setActiveTool(1),
        },
        {
          label: "Circle",
          icon: "circle",
          active: this.ACTIVE_TOOL === 2,
          click: () => this.setActiveTool(2),
        },
        {
          label: "Fill",
          icon: "fill-drip",
          active: this.ACTIVE_TOOL === 3,
          click: () => this.setActiveTool(3),
        },
        {
          label: "Select",
          icon: "vector-square",
          active: this.ACTIVE_TOOL === 4,
          click: () => this.setActiveTool(4),
        },
      ];
    },
  },
  methods: {
    ...mapMutations(["updateFields"]),
    setActiveTool(tool) {
      this.ACTIVE_TOOL = tool;
    },
    setActiveLayer(layer) {
      this.ACTIVE_LAYER = layer;
    },
  },
};
</script>
