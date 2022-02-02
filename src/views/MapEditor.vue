<template>
  <div class="container">
    <div class="maptools-container border">
      <map-tools @toolSelected="getSelectedTool" />
    </div>
    <div class="border">
      <tileset-view
        :tilesetName="tilesetName"
        :autotiles="autotiles"
        @selectionChanged="getSelectedTile"
      />
    </div>
    <div class="border">
      <map-view
        :activeMap="activeMap"
        :maps="maps"
        :autotiles="autotiles"
        :selectedTile="selectedTile"
        :mode="activeTool"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  margin: 20px auto;
  width: 95%;
  display: grid;
  grid-template-rows: 50px 800px;
  grid-template-columns: 256px 900px;
  gap: 20px;
}

.maptools-container {
  grid-column: 1 / span 2;
}

.border {
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>

<script>
import MapTools from "@/components/MapTools.vue";
import MapView from "@/components/MapView.vue";
import TilesetView from "@/components/TilesetView.vue";

import map1 from "@/assets/maps/Map001.json"; // 임시

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
    tilesetName: "",
    selectedTile: [],
    autotiles: [],
    activeTool: 0,
  }),
  created() {
    this.activeMap = "Map001";
    this.maps[this.activeMap] = map1;
    this.tilesetName = this.maps[this.activeMap].tileset;
    this.maps[this.activeMap].autotiles.forEach((autotile) => {
      if (autotile) {
        const atImage = new Image();
        atImage.src = require(`@/assets/autotiles/${autotile}.png`);
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
  },
};
</script>
