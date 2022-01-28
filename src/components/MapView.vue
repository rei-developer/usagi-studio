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
const AUTOTILES = [
    [ [27, 28, 33, 34], [ 5, 28, 33, 34], [27,  6, 33, 34], [ 5,  6, 33, 34],
      [27, 28, 33, 12], [ 5, 28, 33, 12], [27,  6, 33, 12], [ 5,  6, 33, 12] ],
    [ [27, 28, 11, 34], [ 5, 28, 11, 34], [27,  6, 11, 34], [ 5,  6, 11, 34],
      [27, 28, 11, 12], [ 5, 28, 11, 12], [27,  6, 11, 12], [ 5,  6, 11, 12] ],
    [ [25, 26, 31, 32], [25,  6, 31, 32], [25, 26, 31, 12], [25,  6, 31, 12],
      [15, 16, 21, 22], [15, 16, 21, 12], [15, 16, 11, 22], [15, 16, 11, 12] ],
    [ [29, 30, 35, 36], [29, 30, 11, 36], [ 5, 30, 35, 36], [ 5, 30, 11, 36],
      [39, 40, 45, 46], [ 5, 40, 45, 46], [39,  6, 45, 46], [ 5,  6, 45, 46] ],
    [ [25, 30, 31, 36], [15, 16, 45, 46], [13, 14, 19, 20], [13, 14, 19, 12],
      [17, 18, 23, 24], [17, 18, 11, 24], [41, 42, 47, 48], [ 5, 42, 47, 48] ],
    [ [37, 38, 43, 44], [37,  6, 43, 44], [13, 18, 19, 24], [13, 14, 43, 44],
      [37, 42, 43, 48], [17, 18, 47, 48], [13, 18, 43, 48], [ 1,  2,  7,  8] ]
];

export default {
    name: 'MapView',

    data: () => ({
        width: 0,
        height: 0,
        maps: {},
        activeMap: '',
        tileset: null,
        autotiles: [],
    }),

    mounted() {
        this.activeMap = 'Map001'; // 임시
        this.maps[this.activeMap] = maps;
        this.width = this.maps[this.activeMap].width * TILESIZE;
        this.height = this.maps[this.activeMap].height * TILESIZE;
        this.tileset = new Image();
        this.tileset.src = require(`@/assets/tilesets/${this.maps[this.activeMap].tileset}.png`);
        this.maps[this.activeMap].autotiles.forEach((autotile) => {
            if (autotile) {
                const autotileImage = new Image();
                autotileImage.src = require(`@/assets/autotiles/${autotile}.png`);
                this.autotiles.push(autotileImage);
            }
        });
        console.log(this.maps[this.activeMap]);
        console.log(this.autotiles);
        this.tileset.onload = () => {
            this.draw();
        }
        AUTOTILES[0]
    },

    methods: {
        draw() {
            const ctx = this.getContext();
            ctx.clearRect(0, 0, this.width, this.height);
            
            this.maps[this.activeMap].data.forEach((layer) => {

                layer.forEach((tile, index) => {
                    if (tile >= 384) { // 일반 타일
                        const tileNum = tile - 384; // 오프셋
                        const tileRow = parseInt(tileNum / 8);
                        const tileCol = tileNum % 8;
                        const mapRow = parseInt(index / this.maps[this.activeMap].width);
                        const mapCol = index % this.maps[this.activeMap].width;
                        ctx.drawImage(this.tileset, tileCol * TILESIZE, tileRow * TILESIZE, TILESIZE, TILESIZE, mapCol * TILESIZE, mapRow * TILESIZE, TILESIZE, TILESIZE);
                    }
                });
            });
        },

        getContext() {
            const canvas = this.$el.querySelector('#mapCanvas');
            return canvas.getContext('2d');
        }
    }
}
</script>
