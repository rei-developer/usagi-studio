<template>
  <div class="container">
    <div class="row">
      <tools
        @toolSelected="getSelectedTool"
        @activeLayer="getActiveLayer"
        @undo="undo"
        @redo="redo"
      />
    </div>
    <div class="row">
      <tileset-view
        :mapName="mapName"
        :mapWidth="maps[activeMap].width"
        :mapHeight="maps[activeMap].height"
        :tilesetName="tilesetName"
        :autotiles="autotiles"
        :backgroundColor="backgroundColor"
        @selectionChanged="getSelectedTile"
      />
      <map-view
        ref="mapView"
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
.container {
  display: flex;
  flex-direction: column;
  > .row {
    display: flex;
  }
}
</style>

<script>
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
  created() {
    this.activeMap = "Map001";
    this.maps[this.activeMap] = require("@/assets/maps/Map001.json");
    this.maps[this.activeMap].data = this.getMaps(
      this.maps[this.activeMap].data,
      this.maps[this.activeMap].width
    );
    this.mapName = this.maps[this.activeMap].name;
    this.tilesetName = this.maps[this.activeMap].tileset;
    this.maps[this.activeMap].autotiles.forEach((autotile) => {
      if (autotile) {
        const atImage = new Image();
        atImage.src = `/autotiles/${autotile}.png`;
        this.autotiles.push(atImage);
      }
    });
  },
  methods: {
    getSelectedTile(event) {
      this.selectedTile = event;
    },
    getSelectedTool(event) {
      this.activeTool = event;
    },
    getMaps(data, width) {
      let datas = [];
      data.forEach((layer) => {
        const len = layer.length;
        const cnt =
          Math.floor(len / width) + (Math.floor(len % width) > 0 ? 1 : 0);
        let temp = [];
        for (let i = 0; i < cnt; i++) {
          temp.push(layer.splice(0, width));
        }
        datas.push(temp);
      });
      return datas;
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
