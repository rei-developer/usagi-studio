<template>
  <div class="container">
    <div class="map-management">
      <label
        >맵
        <select
          aria-label="맵 선택"
          :value="activeMap"
          :disabled="structureBusy"
          @change="selectMap"
        >
          <option v-for="(map, id) in maps" :key="id" :value="id">
            {{ map.name }} ({{ id }})
          </option>
        </select></label
      >
      <button :disabled="structureBusy" @click="openMapDialog('new')">
        새 맵
      </button>
      <button :disabled="structureBusy" @click="openMapDialog('resize')">
        크기 변경
      </button>
      <input
        ref="importFile"
        type="file"
        accept=".json,application/json"
        hidden
        @change="importFile"
      />
    </div>
    <ui-dialog
      v-if="dialogMode"
      :header="dialogMode === 'new' ? '새 맵' : '맵 크기 변경'"
      :width="360"
      :callback="submitMapDialog"
      @onClosePopup="dialogMode = null"
    >
      <div class="map-form">
        <label v-if="dialogMode === 'new'"
          >이름 <input aria-label="맵 이름" v-model="draft.name"
        /></label>
        <label
          >너비
          <input
            aria-label="맵 너비"
            type="number"
            min="1"
            max="256"
            v-model.number="draft.width"
        /></label>
        <label
          >높이
          <input
            aria-label="맵 높이"
            type="number"
            min="1"
            max="256"
            v-model.number="draft.height"
        /></label>
        <p v-if="dialogMode === 'resize'">
          {{ maps[activeMap].width }} × {{ maps[activeMap].height }} →
          {{ draft.width }} × {{ draft.height }}<br />잘리는 타일:
          {{ cropCount }}개. 이 맵의 실행 취소·다시 실행 이력이 초기화됩니다.
        </p>
        <p role="alert" v-if="dialogError">{{ dialogError }}</p>
      </div>
    </ui-dialog>
    <div class="row">
      <tools
        :resetKey="viewKey"
        :activeMap="activeMap"
        :busy="busy || saving || !!dialogMode"
        @import="$refs.importFile.click()"
        :mapWidth="maps[activeMap]?.width || 1"
        :mapHeight="maps[activeMap]?.height || 1"
        :saving="saving"
        :exporting="exporting"
        :ready="ready"
        @cancelExport="cancelExport"
        @toolSelected="getSelectedTool"
        @activeLayer="getActiveLayer"
        @undo="undo"
        @redo="redo"
        @save="saveMaps"
        @export="exportMap"
      />
    </div>
    <div role="status" class="file-status">
      {{ fileMessage }} {{ $store.state.historyNotice }}
    </div>
    <div v-if="ready" class="row editor-body">
      <tileset-view
        :locked="busy || snapshotting || !!dialogMode"
        :key="viewKey"
        :mapName="mapName"
        :mapWidth="maps[activeMap].width"
        :mapHeight="maps[activeMap].height"
        :tilesetName="tilesetName"
        :tileset="tileset"
        :autotiles="autotiles"
        :backgroundColor="backgroundColor"
        @selectionChanged="getSelectedTile"
      />
      <map-view
        ref="mapView"
        :key="viewKey"
        :locked="busy || snapshotting || !!dialogMode"
        :autotileAtlases="autotileAtlases"
        :tileset="tileset"
        :activeMap="activeMap"
        :activeLayer="activeLayer"
        :maps="maps"
        :autotiles="autotiles"
        :mode="activeTool"
        :backgroundColor="backgroundColor"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-management {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
}
.map-form {
  width: 100%;
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }
  input {
    flex: 1;
    min-width: 0;
  }
}
.file-status {
  flex: 0 0 18px;
  padding: 0 8px;
  font-size: 12px;
}
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  > .row {
    display: flex;
    flex-shrink: 0;
  }
  > .editor-body {
    flex: 1;
    min-height: 0;
  }
}
</style>

<script>
import { loadAssets, releaseAssets } from "@/utils/mapAssets";
import {
  nextMapId,
  newMap,
  resizeMap,
  croppedCells,
  importMap,
  checkTileIds,
  snapshotMaps,
  MAX_IMPORT_BYTES,
} from "@/utils/mapOperations";
import UiDialog from "@/components/common/Dialog";
import { toRaw } from "vue";
import { readProject, saveProject } from "@/utils/projectStorage";
import { SAVE_KEY, serializeMap, restoreMaps } from "@/utils/mapFiles";
import Tools from "@/components/Tools.vue";
import TilesetView from "@/components/TilesetView.vue";
import MapView from "@/components/MapView.vue";

export default {
  name: "MapEditor",
  components: {
    UiDialog,
    Tools,
    TilesetView,
    MapView,
  },
  data: () => ({
    busy: false,
    snapshotting: false,
    viewKey: 0,
    dialogMode: null,
    dialogError: "",
    draft: { name: "새 맵", width: 50, height: 20 },
    ready: false,
    saving: false,
    exporting: false,
    fileMessage: "",
    activeMap: "",
    maps: {},
    mapName: "",
    tilesetName: "",
    tileset: null,
    selectedTile: [],
    autotiles: [],
    autotileAtlases: [],
    activeTool: 0,
    activeLayer: 1,
    backgroundColor: "#333",
  }),
  async created() {
    this.activeMap = "Map001";
    const sample = require("@/assets/maps/Map001.json");
    this.maps = restoreMaps({
      version: 1,
      activeMap: this.activeMap,
      maps: { Map001: sample },
    });
    let saved;
    try {
      saved = await readProject();
      if (saved) {
        this.maps = restoreMaps(saved);
        this.activeMap = saved.activeMap;
        this.fileMessage = "저장한 맵을 복원했습니다.";
      }
    } catch {
      saved = undefined;
      this.fileMessage =
        "저장 데이터를 복원하지 못했습니다. 기존 저장 데이터는 유지됩니다.";
    }
    if (!saved) {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const legacy = JSON.parse(raw);
          this.maps = restoreMaps(legacy);
          this.activeMap = legacy.activeMap;
          try {
            await saveProject(legacy);
            this.fileMessage = "기존 저장 데이터를 새 저장소로 이전했습니다.";
          } catch {
            this.fileMessage =
              "기존 맵을 복원했지만 저장소 이전에 실패했습니다. 기존 저장 데이터는 유지됩니다.";
          }
        }
      } catch {
        this.fileMessage =
          "저장 데이터를 복원하지 못했습니다. 기본 맵을 표시합니다. 기존 저장 데이터는 유지됩니다.";
      }
    }
    if (this.disposed) return;
    try {
      const assets = await loadAssets(this.maps[this.activeMap]);
      if (this.disposed) return releaseAssets(assets);
      Object.assign(this, assets);
      this.syncMapFields();
      this.ready = true;
    } catch (error) {
      this.fileMessage = error.message;
      this.$store.commit("SET_LOADING", false);
    }
  },
  computed: {
    structureBusy() {
      return (
        !this.ready ||
        this.busy ||
        this.saving ||
        this.exporting ||
        !!this.dialogMode
      );
    },
    cropCount() {
      return croppedCells(
        toRaw(this.maps[this.activeMap]),
        this.draft.width,
        this.draft.height
      );
    },
  },
  mounted() {
    document.addEventListener("keydown", this.saveShortcut);
  },
  beforeUnmount() {
    this.disposed = true;
    releaseAssets(this);
    this.cancelExport();
    document.removeEventListener("keydown", this.saveShortcut);
  },
  methods: {
    syncMapFields() {
      const map = this.maps[this.activeMap];
      this.mapName = map.name;
      this.tilesetName = map.tileset;
      this.activeLayer = 1;
      this.activeTool = 0;
      this.$store.commit("UPDATE_FIELDS", {
        activeMap: this.activeMap,
        selectedTiles: [],
        activeCanvas: null,
      });
    },
    async activateMap(id, map, assets) {
      this.$refs.mapView?.cancelStroke();
      const previous = { autotileAtlases: this.autotileAtlases };
      if (assets) Object.assign(this, assets);
      this.maps[id] = map;
      this.activeMap = id;
      this.syncMapFields();
      this.viewKey++;
      await this.$nextTick();
      if (assets) releaseAssets(previous);
    },
    async prepareAssets(map) {
      const current = this.maps[this.activeMap];
      if (
        map.tileset === current.tileset &&
        JSON.stringify(map.autotiles) === JSON.stringify(current.autotiles)
      )
        return null;
      return loadAssets(map);
    },
    async selectMap(event) {
      await this.switchMap(event.target.value);
      event.target.value = this.activeMap;
    },
    async switchMap(id) {
      if (this.structureBusy || id === this.activeMap || !this.maps[id]) return;
      this.busy = true;
      let assets;
      try {
        assets = await this.prepareAssets(this.maps[id]);
        if (this.disposed) return releaseAssets(assets);
        await this.activateMap(id, this.maps[id], assets);
      } catch (error) {
        releaseAssets(assets);
        this.fileMessage = error.message;
      } finally {
        this.busy = false;
      }
    },
    openMapDialog(mode) {
      if (this.structureBusy) return;
      if (mode === "resize" && this.maps[this.activeMap].events?.length) {
        this.fileMessage = "이벤트가 있는 맵은 크기를 변경할 수 없습니다.";
        return;
      }
      this.$refs.mapView.cancelStroke();
      this.draft =
        mode === "new"
          ? { name: "새 맵", width: 50, height: 20 }
          : {
              width: this.maps[this.activeMap].width,
              height: this.maps[this.activeMap].height,
            };
      this.dialogError = "";
      this.dialogMode = mode;
    },
    async submitMapDialog() {
      try {
        const current = toRaw(this.maps[this.activeMap]);
        const { name, width, height } = this.draft;
        if (this.dialogMode === "new") {
          const map = newMap(current, name, width, height);
          await this.activateMap(nextMapId(this.maps), map, null);
        } else if (width !== current.width || height !== current.height) {
          const map = resizeMap(current, width, height);
          this.$store.commit("CLEAR_MAP_HISTORY", this.activeMap);
          await this.activateMap(this.activeMap, map, null);
        }
        return true;
      } catch (error) {
        this.dialogError = error.message;
        return false;
      }
    },
    async importFile(event) {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || this.structureBusy) return;
      this.busy = true;
      let assets;
      try {
        if (file.size > MAX_IMPORT_BYTES)
          throw new Error("JSON 파일은 16MiB 이하여야 합니다.");
        const map = importMap(await file.text());
        assets = await this.prepareAssets(map);
        if (this.disposed) return releaseAssets(assets);
        checkTileIds(map, assets || this);
        await this.activateMap(nextMapId(this.maps), map, assets);
        this.fileMessage = "맵을 추가했습니다. 저장 버튼으로 보관하세요.";
      } catch (error) {
        releaseAssets(assets);
        this.fileMessage = `가져오기 실패: ${error.message}`;
      } finally {
        this.busy = false;
      }
    },
    getSelectedTile(event) {
      this.selectedTile = event;
    },
    getSelectedTool(event) {
      this.activeTool = event;
    },
    saveShortcut(event) {
      if (
        event.target?.closest?.(
          "input, textarea, select, [contenteditable], [role=dialog]"
        )
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.saveMaps();
      }
    },
    async saveMaps() {
      if (this.saving || !this.ready || this.busy || this.dialogMode) return;
      this.$refs.mapView?.cancelStroke();
      this.snapshotting = true;
      this.saving = true;
      this.fileMessage = "맵을 저장하는 중입니다…";
      try {
        const maps = await snapshotMaps(toRaw(this.maps), (progress) => {
          this.fileMessage = `저장 준비 ${progress}%`;
        });
        this.snapshotting = false;
        await saveProject({ version: 1, activeMap: this.activeMap, maps });
        this.fileMessage = "모든 맵을 이 브라우저에 저장했습니다.";
      } catch {
        this.fileMessage =
          "저장하지 못했습니다. 브라우저 저장 공간 또는 권한을 확인하고 JSON으로 내보내세요.";
      } finally {
        this.snapshotting = false;
        this.saving = false;
      }
    },
    cancelExport() {
      this.exportController?.abort();
    },
    async exportMap(format = "json", scale = 1) {
      if (
        this.exporting ||
        !this.ready ||
        this.busy ||
        this.saving ||
        this.dialogMode
      )
        return;
      this.exporting = true;
      this.exportController = new AbortController();
      const signal = this.exportController.signal;
      this.fileMessage = "내보내기 준비 중…";
      let url;
      try {
        const blob =
          format === "json"
            ? new Blob(
                [
                  JSON.stringify(
                    serializeMap(toRaw(this.maps[this.activeMap])),
                    null,
                    2
                  ),
                ],
                { type: "application/json" }
              )
            : await this.$refs.mapView.exportImage(
                format,
                scale,
                (progress) => {
                  this.fileMessage = `이미지 내보내기 ${progress}%`;
                },
                signal
              );
        if (signal.aborted) throw new DOMException("취소", "AbortError");
        url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.activeMap}.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        this.fileMessage = `현재 맵 ${format.toUpperCase()} 다운로드를 요청했습니다.`;
      } catch (error) {
        this.fileMessage =
          error.name === "AbortError"
            ? "내보내기를 취소했습니다."
            : "맵을 내보내지 못했습니다. 이미지 로딩과 브라우저의 형식 지원을 확인하고 다시 시도해주세요.";
      } finally {
        this.exporting = false;
        this.exportController = null;
        if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    },
    getActiveLayer(e) {
      this.activeLayer = e;
    },
    async undo(e) {
      await this.$refs.mapView.undo(e);
      this.$refs.mapView.draw();
    },
    async redo(e) {
      await this.$refs.mapView.redo(e);
      this.$refs.mapView.draw();
    },
  },
};
</script>
