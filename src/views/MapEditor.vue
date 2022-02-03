<template>
  <div class="container">
    <div class="row">
      <map-tools
        @toolSelected="getSelectedTool"
        @activeLayer="getActiveLayer"
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
import MapTools from "@/components/MapTools.vue";
import MapView from "@/components/MapView.vue";
import TilesetView from "@/components/TilesetView.vue";

//import map1 from "@/assets/maps/Map079.json"; // 임시

export default {
  name: "MapEditor",
  components: {
    MapTools,
    MapView,
    TilesetView,
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
    this.activeMap = "Map079";
    this.maps[this.activeMap] = require("@/assets/maps/Map079.json");
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
  },
};
</script>
