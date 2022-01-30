<template>
    <div class="container">
        <div class="maptools-container border">
            <MapTools />
        </div>
        <div class="border">
            <TilesetView :tilesetName="tilesetName"/>
        </div>
        <div class="border">
            <MapView :activeMap="activeMap" :maps="maps" />
        </div>
    </div>
</template>

<script>
import MapTools from '../components/MapTools.vue';
import MapView from '../components/MapView.vue';
import TilesetView from '../components/TilesetView.vue';

import map1 from '../assets/maps/Map001.json'; // 임시

export default {
    name: 'MapEditor',
    components: {
        MapTools,
        MapView,
        TilesetView,
    },
    data: () => ({
        activeMap: '',
        maps: {},
        tilesetName: '',
    }),

    created() {
        this.activeMap = 'Map001';
        this.maps[this.activeMap] = map1;
        this.tilesetName = this.maps[this.activeMap].tileset;
    },
}
</script>

<style>
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
