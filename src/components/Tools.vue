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
            :unnamed="!item.label"
            :disabled="item.disabled"
            @click="item.click"
          >
            {{ item.label }}
          </ui-button>
        </ui-button-group>
      </div>
      <div class="item">
        <font-awesome-icon icon="music" />
        Field of your story 재생중...
      </div>
    </div>
    <database-dialog
      v-if="isDatabaseDialogOpened"
      @onCloseDialog="onCloseDatabaseDialog"
    />
    <info-dialog v-if="isInfoDialogOpened" @onCloseDialog="onCloseInfoDialog" />
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
      align-items: center;
      padding: 2px;
      > svg {
        margin-right: 4px;
      }
    }
    > .item:not(:last-child) {
      border-right: 1px dashed var(--primary);
    }
  }
}
</style>

<script>
import { mapMutations } from "vuex";
import DatabaseDialog from "@/components/dialog/database/DatabaseDialog";
import InfoDialog from "@/components/dialog/InfoDialog";
import UiButton from "@/components/common/Button";
import UiButtonGroup from "@/components/common/ButtonGroup";

export default {
  name: "Tools",
  components: {
    DatabaseDialog,
    InfoDialog,
    UiButton,
    UiButtonGroup,
  },
  data: () => ({
    ACTIVE_TOOL: 0,
    ACTIVE_LAYER: 1,
    isDatabaseDialogOpened: false,
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
          icon: "save",
          active: null,
          click: () => {},
        },
      ];
    },
    editMenus() {
      return [
        {
          icon: "cut",
          active: null,
          click: () => {},
        },
        {
          icon: "copy",
          active: null,
          click: () => {},
        },
        {
          icon: "paste",
          active: null,
          click: () => {},
        },
        {
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
          icon: "pencil-alt",
          active: this.ACTIVE_TOOL === 0,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(0),
        },
        {
          icon: "square-full",
          active: this.ACTIVE_TOOL === 1,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(1),
        },
        {
          icon: "circle",
          active: this.ACTIVE_TOOL === 2,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(2),
        },
        {
          icon: "fill-drip",
          active: this.ACTIVE_TOOL === 3,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(3),
        },
        {
          icon: "vector-square",
          active: this.ACTIVE_TOOL === 4,
          disabled: this.isNotPossibleEditMap,
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
          active: this.isDatabaseDialogOpened,
          click: () => (this.isDatabaseDialogOpened = true),
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
          icon: "info-circle",
          active: this.isInfoDialogOpened,
          click: () => (this.isInfoDialogOpened = true),
        },
        {
          icon: "cog",
          active: null,
          click: () => {},
        },
      ];
    },
    isNotPossibleEditMap() {
      return this.ACTIVE_LAYER === 0 || this.ACTIVE_LAYER === 4;
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
    onCloseDatabaseDialog() {
      this.isDatabaseDialogOpened = false;
    },
    onCloseInfoDialog() {
      this.isInfoDialogOpened = false;
    },
  },
};
</script>
