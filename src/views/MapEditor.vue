<template>
    <div>
        <v-container>
            <v-row>
                <v-col>
                    <v-card outlined>
                        <MapTools />
                    </v-card>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="3">
                    <v-card outlined>
                        <TilesetView :tilesetName="tilesetName"/>
                    </v-card>
                </v-col>
                <v-col cols="9">
                    <v-card outlined>
                        <MapView :activeMap="activeMap" :maps="maps" />
                    </v-card>
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
