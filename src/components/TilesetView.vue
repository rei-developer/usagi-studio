<template>
    <div>
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
    }),

    created() {
        console.log(this.tilesetName);
    },

    methods: {

    },
}
</script>