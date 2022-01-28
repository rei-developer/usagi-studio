<template>
    <div>
        <canvas
            id="mapCanvas"
            :width="width"
            :height="height"
        >
            자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
        </canvas>
    </div>
</template>

<script>
import maps from '../assets/maps/Map001.json'; // 임시

const TILESIZE = 32;

export default {
    name: 'MapView',

    data: () => ({
        width: 0,
        height: 0,
        maps: {},
        activeMap: '',
        tileset: null,
    }),

    mounted() {
        this.activeMap = 'Map001'; // 임시
        this.maps[this.activeMap] = maps;
        this.width = this.maps[this.activeMap].width * TILESIZE;
        this.height = this.maps[this.activeMap].height * TILESIZE;
        this.draw()
    },

    methods: {
        draw() {
            const ctx = this.getContext();
            ctx.clearRect(0, 0, this.width, this.height);
            
            this.maps[this.activeMap].data.forEach((layer) => {
                console.log(layer);
            })
        },

        getContext() {
            const canvas = this.$el.querySelector('#mapCanvas');
            return canvas.getContext('2d');
        }
    }
}
</script>
