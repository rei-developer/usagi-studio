<template>
    <div class="tileset-wrapper">
        <canvas
            id="tilesetCanvas"
            :width="width"
            :height="height"
        >
            자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
        </canvas>
    </div>
</template>

<script>
// const TILESIZE = 32;

export default {
    name: 'TilesetView',

    props: {
        tilesetName: String,
    },

    data: () => ({
        width: 0,
        height: 0,
        tileset: null,
    }),

    created() {
        this.init();
    },

    methods: {
        init() {
            this.tileset = new Image();
            this.tileset.src = require(`@/assets/tilesets/${this.tilesetName}.png`);
            this.width = this.tileset.width;
            this.height = this.tileset.height;

            this.tileset.onload = () => {
                this.draw();
            };
        },

        draw() {
            const ctx = this.getContext();
            console.log(this.width, this.height);
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.drawImage(this.tileset, 0, 0, this.width, this.height);
        },

        getContext() {
            const canvas = this.$el.querySelector('#tilesetCanvas');
            return canvas.getContext('2d');
        }
    },
}
</script>

<style>
.tileset-wrapper {
    height: 800px;
    overflow-y: auto;
}
</style>
