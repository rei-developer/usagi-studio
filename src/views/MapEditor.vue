<template>
  <div class="container">
    <div class="maptools-container border">
      <map-tools @toolSelected="getSelectedTool" />
    </div>
    <div class="border">
      <tileset-view
        :tilesetName="tilesetName"
        :autotiles="autotiles"
        :backgroundColor="backgroundColor"
        @selectionChanged="getSelectedTile"
      />
    </div>
    <div class="border" style="background-color: #ccc">
      <map-view
        :activeMap="activeMap"
        :maps="maps"
        :autotiles="autotiles"
        :selectedTile="selectedTile"
        :mode="activeTool"
        :backgroundColor="backgroundColor"
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

import map1 from "@/assets/maps/Map079.json"; // 임시

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
    backgroundColor: "rgba(255,255,255,1)",
  }),
  created() {
    this.activeMap = "Map001";
    this.maps[this.activeMap] = map1;
    this.maps[this.activeMap].data = this.getMaps(
      this.maps[this.activeMap].data,
      this.maps[this.activeMap].width
    );
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
  },
};
</script>
