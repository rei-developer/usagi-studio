<template>
  <div class="tools-wrapper">
    <div class="row">
      <div v-for="(menu, menuIndex) in menuGroup" :key="menuIndex" class="item">
        <ui-button-group>
          <ui-button
            v-for="(item, index) in menu"
            :key="index"
            :icon="item.icon"
            :active="item.active"
            @click="item.click"
          >
            {{ item.label }}
          </ui-button>
        </ui-button-group>
      </div>
      <div class="item">테스트</div>
    </div>
    <info-dialog
      v-if="isInfoDialogOpened"
      ref="info-dialog"
      @onCloseDialog="onCloseInfoDialog"
    />
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
import InfoDialog from "@/components/dialog/InfoDialog";

export default {
  name: "Tools",
  components: {
    UiButton,
    UiButtonGroup,
    InfoDialog,
  },
  data: () => ({
    ACTIVE_TOOL: 0,
    ACTIVE_LAYER: 1,
    isInfoDialogOpened: false,
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
    menuGroup() {
      return [
        this.fileMenus,
        this.editMenus,
        this.layerMenus,
        this.toolMenus,
        this.adminMenus,
        this.helpMenus,
      ];
    },
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
    adminMenus() {
      return [
        {
          label: "Admin",
          icon: "table",
          active: null,
          click: () => {},
        },
        {
          label: "Database",
          icon: "database",
          active: null,
          click: () => {},
        },
        {
          label: "Assets",
          icon: "folder-open",
          active: null,
          click: () => {},
        },
        {
          label: "Music",
          icon: "music",
          active: null,
          click: () => {},
        },
        {
          label: "Analyst",
          icon: "chart-pie",
          active: null,
          click: () => {},
        },
      ];
    },
    helpMenus() {
      return [
        {
          label: "Info",
          icon: "info-circle",
          active: null,
          click: () => (this.isInfoDialogOpened = true),
        },
        {
          label: "Setting",
          icon: "cog",
          active: null,
          click: () => {},
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
    onCloseInfoDialog() {
      this.isInfoDialogOpened = false;
    },
  },
};
</script>
