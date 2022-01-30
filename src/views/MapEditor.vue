<template>
    <div>
        <MapTools />
        <MapView :activeMap="activeMap" :maps="maps" />
    </div>
</template>

<script>
import MapTools from '../components/MapTools.vue';
import MapView from '../components/MapView.vue';

import map1 from '../assets/maps/Map001.json'; // 임시

export default {
    name: 'MapEditor',
    components: {
        MapTools,
        MapView,
    },
    data: () => ({
        activeMap: '',
        maps: {},
    }),

    created() {
        this.activeMap = 'Map001';
        this.maps[this.activeMap] = map1;
    },
}
</script>
