<template>
    <div>
        <MapTools />
        <MapView />
    </div>
</template>

<script>
import MapTools from '../components/MapTools.vue';
import MapView from '../components/MapView.vue';

export default {
    name: 'MapEditor',
    components: {
        MapTools,
        MapView,
    }
}
</script>
