<template>
  <div class="container">
    <div class="row">
      <tools
        @toolSelected="getSelectedTool"
        @activeLayer="getActiveLayer"
        @undo="undo"
        @redo="redo"
        @save="saveMaps"
        @export="exportMap"
      />
    </div>
    <div
      v-if="fileMessage || $store.state.historyNotice"
      role="status"
      class="file-status"
    >
      {{ fileMessage || $store.state.historyNotice }}
    </div>
    <div v-if="ready" class="row">
      <tileset-view
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
.file-status {
  position: fixed;
  top: 0;
  left: 8px;
  font-size: 12px;
  z-index: 1;
}
.container {
  display: flex;
  flex-direction: column;
  > .row {
    display: flex;
  }
}
</style>

<script>
import { SAVE_KEY, serializeMap, restoreMaps } from "@/utils/mapFiles";
import Tools from "@/components/Tools.vue";
import TilesetView from "@/components/TilesetView.vue";
import MapView from "@/components/MapView.vue";

export default {
  name: "MapEditor",
  components: {
    Tools,
    TilesetView,
    MapView,
  },
  data: () => ({
    ready: false,
    fileMessage: "",
    activeMap: "",
    maps: {},
    mapName: "",
    tilesetName: "",
    tileset: null,
    selectedTile: [],
    autotiles: [],
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
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.maps = restoreMaps(saved);
        this.activeMap = saved.activeMap;
        this.fileMessage = "저장한 맵을 복원했습니다.";
      }
    } catch {
      this.fileMessage =
        "저장 데이터를 복원하지 못했습니다. 기본 맵을 표시합니다. 기존 저장 데이터는 유지됩니다.";
    }
    this.mapName = this.maps[this.activeMap].name;
    this.tilesetName = this.maps[this.activeMap].tileset;
    try {
      const load = async (url) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image;
      };
      [this.tileset, this.autotiles] = await Promise.all([
        load(`/tilesets/${this.tilesetName}.png`),
        Promise.all(
          this.maps[this.activeMap].autotiles.map((name) =>
            name ? load(`/autotiles/${name}.png`) : null
          )
        ),
      ]);
      this.ready = true;
    } catch {
      this.fileMessage =
        "타일 이미지를 불러오지 못했습니다. 새로고침하여 다시 시도해주세요.";
      this.$store.commit("SET_LOADING", false);
    }
  },
  mounted() {
    document.addEventListener("keydown", this.saveShortcut);
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.saveShortcut);
  },
  methods: {
    getSelectedTile(event) {
      this.selectedTile = event;
    },
    getSelectedTool(event) {
      this.activeTool = event;
    },
    saveShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.saveMaps();
      }
    },
    saveMaps() {
      try {
        const maps = Object.fromEntries(
          Object.entries(this.maps).map(([id, map]) => [id, serializeMap(map)])
        );
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ version: 1, activeMap: this.activeMap, maps })
        );
        this.fileMessage = "모든 맵을 이 브라우저에 저장했습니다.";
      } catch {
        this.fileMessage =
          "저장하지 못했습니다. 브라우저 저장 공간 또는 권한을 확인하고 JSON으로 내보내세요.";
      }
    },
    async exportMap(format = "json") {
      let url;
      try {
        const blob =
          format === "json"
            ? new Blob(
                [
                  JSON.stringify(
                    serializeMap(this.maps[this.activeMap]),
                    null,
                    2
                  ),
                ],
                { type: "application/json" }
              )
            : await this.$refs.mapView.exportImage(format);
        url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.activeMap}.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        this.fileMessage = `현재 맵 ${format.toUpperCase()} 다운로드를 요청했습니다.`;
      } catch {
        this.fileMessage =
          "맵을 내보내지 못했습니다. 이미지 로딩과 브라우저의 형식 지원을 확인하고 다시 시도해주세요.";
      } finally {
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
