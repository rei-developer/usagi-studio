<template>
  <div class="tools-wrapper">
    <div class="row">
      <div v-for="(menu, menuIndex) in menuGroup" :key="menuIndex" class="item">
        <ui-button-group>
          <ui-button
            v-for="(item, index) in menu"
            :key="index"
            :description="item.description"
            :icon="item.icon"
            :active="item.active"
            :unnamed="!item.label"
            :disabled="item.disabled"
            @click="item.click"
          >
            {{ item.label }}
          </ui-button>
        </ui-button-group>
        <ui-select
          v-if="menuIndex === 0"
          aria-label="내보내기 형식"
          :value="exportFormat"
          @onChange="exportFormat = $event"
        >
          <option value="json">JSON</option>
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="webp">WebP</option>
        </ui-select>
      </div>
      <div v-if="exportFormat !== 'json'" class="item">
        <ui-select
          aria-label="이미지 배율"
          :value="exportScale"
          @onChange="exportScale = Number($event)"
          :disabled="exporting"
        >
          <option
            v-for="scale in scales"
            :key="scale"
            :value="scale"
            :disabled="!canExport(mapWidth, mapHeight, scale)"
          >
            {{ scale * 100 }}%
          </option>
        </ui-select>
        <span>{{ outputSize.width }} × {{ outputSize.height }} px</span>
        <ui-button v-if="exporting" @click="$emit('cancelExport')"
          >취소</ui-button
        >
      </div>
      <div class="item">
        <font-awesome-icon icon="music" />
        Field of your story 재생중...
      </div>
    </div>
    <database-popup
      v-if="isDatabasePopupOpened"
      @onClosePopup="onCloseDatabasePopup"
    />
    <info-popup v-if="isInfoPopupOpened" @onClosePopup="onCloseInfoPopup" />
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
import { mapGetters, mapMutations } from "vuex";
import { EXPORT_SCALES, canExport, imageSize } from "@/utils/imageExport";
import { TOOLS } from "@/utils/tools";
import DatabasePopup from "@/components/popups/database/DatabasePopup";
import InfoPopup from "@/components/popups/InfoPopup";
import UiButton from "@/components/common/Button";
import UiSelect from "@/components/common/Select";
import UiButtonGroup from "@/components/common/ButtonGroup";

export default {
  name: "EditorTools",
  components: {
    DatabasePopup,
    InfoPopup,
    UiButton,
    UiButtonGroup,
    UiSelect,
  },
  props: {
    mapWidth: Number,
    mapHeight: Number,
    saving: Boolean,
    exporting: Boolean,
    ready: Boolean,
    busy: Boolean,
    activeMap: String,
    resetKey: Number,
  },
  data: () => ({
    scales: EXPORT_SCALES,
    exportScale: 1,
    exportFormat: "json",
    ACTIVE_TOOL: 0,
    ACTIVE_LAYER: 1,
    isDatabasePopupOpened: false,
    isInfoPopupOpened: false,
  }),
  watch: {
    resetKey() {
      this.ACTIVE_LAYER = 1;
      this.ACTIVE_TOOL = 0;
    },
    activeMap() {
      this.ACTIVE_LAYER = 1;
      this.ACTIVE_TOOL = 0;
    },
    mapWidth: {
      immediate: true,
      handler() {
        this.chooseScale();
      },
    },
    mapHeight() {
      this.chooseScale();
    },
    ACTIVE_TOOL() {
      this.$emit("toolSelected", this.ACTIVE_TOOL);
    },
    ACTIVE_LAYER() {
      this.$emit("activeLayer", this.ACTIVE_LAYER);
    },
  },
  computed: {
    outputSize() {
      return imageSize(this.mapWidth, this.mapHeight, this.exportScale);
    },
    ...mapGetters(["hasMapHistory", "hasMapFuture"]),
    menuGroup() {
      return [
        this.fileMenus,
        this.editMenus,
        this.historyMenus,
        this.layerMenus,
        this.toolMenus,
        this.adminMenus,
        this.helpMenus,
      ];
    },
    fileMenus() {
      return [
        {
          description: "맵 가져오기",
          icon: "file-import",
          disabled: this.busy || !this.ready || this.exporting,
          active: null,
          click: () => this.$emit("import"),
        },
        {
          description: "선택한 형식으로 현재 맵 내보내기",
          icon: "file-export",
          disabled:
            !this.ready ||
            this.busy ||
            this.exporting ||
            (this.exportFormat !== "json" &&
              !canExport(this.mapWidth, this.mapHeight, this.exportScale)),
          active: null,
          click: () =>
            this.$emit("export", this.exportFormat, this.exportScale),
        },
        {
          description: "모두 저장 (Ctrl+S)",
          icon: "save",
          disabled: !this.ready || this.saving || this.busy,
          active: null,
          click: () => this.$emit("save"),
        },
      ];
    },
    editMenus() {
      return [
        {
          description: "잘라내기",
          icon: "cut",
          active: null,
          click: () => {},
        },
        {
          description: "복사하기",
          icon: "copy",
          active: null,
          click: () => {},
        },
        {
          description: "붙여넣기",
          icon: "paste",
          active: null,
          click: () => {},
        },
        {
          description: "삭제하기",
          icon: "times",
          active: null,
          click: () => {},
        },
      ];
    },
    historyMenus() {
      return [
        {
          description: "실행 취소",
          icon: "undo",
          active: null,
          disabled: this.busy || !this.hasMapHistory,
          click: (e) => this.undo(e),
        },
        {
          description: "다시 실행",
          icon: "redo",
          active: null,
          disabled: this.busy || !this.hasMapFuture,
          click: (e) => this.redo(e),
        },
      ];
    },
    layerMenus() {
      return [
        {
          description: "미리보기",
          icon: "mountain",
          active: this.ACTIVE_LAYER === 0,
          click: () => this.setActiveLayer(0),
        },
        {
          description: "레이어 1",
          label: "Layer 1",
          icon: "layer-group",
          active: this.ACTIVE_LAYER === 1,
          click: () => this.setActiveLayer(1),
        },
        {
          description: "레이어 2",
          label: "Layer 2",
          icon: "layer-group",
          active: this.ACTIVE_LAYER === 2,
          click: () => this.setActiveLayer(2),
        },
        {
          description: "레이어 3",
          label: "Layer 3",
          icon: "layer-group",
          active: this.ACTIVE_LAYER === 3,
          click: () => this.setActiveLayer(3),
        },
        {
          description: "이벤트 레이어",
          icon: "street-view",
          active: this.ACTIVE_LAYER === 4,
          click: () => this.setActiveLayer(4),
        },
      ];
    },
    toolMenus() {
      return [
        {
          description: "그리기",
          icon: "pencil-alt",
          active: this.ACTIVE_TOOL === TOOLS.BRUSH,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(0),
        },
        {
          description: "사각형",
          icon: "square-full",
          active: this.ACTIVE_TOOL === TOOLS.SQUARE,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(1),
        },
        {
          description: "원형",
          icon: "circle",
          active: this.ACTIVE_TOOL === TOOLS.CIRCLE,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(2),
        },
        {
          description: "채우기",
          icon: "fill-drip",
          active: this.ACTIVE_TOOL === TOOLS.FILL,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(3),
        },
        {
          description: "선택하기",
          icon: "vector-polygon",
          active: this.ACTIVE_TOOL === TOOLS.SELECT,
          disabled: this.isNotPossibleEditMap,
          click: () => this.setActiveTool(4),
        },
      ];
    },
    adminMenus() {
      return [
        {
          description: "관리자",
          label: "Admin",
          icon: "table",
          active: null,
          click: () => {},
        },
        {
          description: "데이터베이스",
          label: "Database",
          icon: "database",
          active: this.isDatabasePopupOpened,
          click: () => (this.isDatabasePopupOpened = true),
        },
        {
          description: "에셋",
          label: "Assets",
          icon: "folder-open",
          active: null,
          click: () => {},
        },
        {
          description: "음원",
          label: "Music",
          icon: "music",
          active: null,
          click: () => {},
        },
        {
          description: "통계",
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
          description: "툴 정보",
          icon: "info-circle",
          active: this.isInfoPopupOpened,
          click: () => (this.isInfoPopupOpened = true),
        },
        {
          description: "환경설정",
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
    canExport,
    chooseScale() {
      this.exportScale =
        EXPORT_SCALES.find((scale) =>
          canExport(this.mapWidth, this.mapHeight, scale)
        ) || 0.125;
    },
    ...mapMutations(["UPDATE_FIELDS"]),
    setActiveTool(tool) {
      this.ACTIVE_TOOL = tool;
    },
    setActiveLayer(layer) {
      this.ACTIVE_LAYER = layer;
    },
    onCloseDatabasePopup() {
      this.isDatabasePopupOpened = false;
    },
    onCloseInfoPopup() {
      this.isInfoPopupOpened = false;
    },
    undo(e) {
      this.$parent.undo(e);
    },
    redo(e) {
      this.$parent.redo(e);
    },
  },
};
</script>
