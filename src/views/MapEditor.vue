<template>
    <div>
        <v-container>
            <v-row>
                <MapTools />
            </v-row>
            <v-row>
                <v-col col="2">
                    <TilesetView :tilesetName="tilesetName"/>
                </v-col>
                <v-col col="10">
                    <MapView :activeMap="activeMap" :maps="maps" />
                </v-col>
            </v-row>
        </v-container>
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
