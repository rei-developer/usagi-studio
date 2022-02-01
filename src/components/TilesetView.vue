<template>
    <div class="tileset-wrapper">
        <canvas
            id="autotileCanvas"
            width="256"
            height="32"
        >
            자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
        </canvas>
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
const TILESIZE = 32;

export default {
    name: 'TilesetView',

    props: {
        tilesetName: String,
        autotiles: Array,
    },

    data: () => ({
        width: 0,
        height: 0,
        tileset: null,
        tileSelectStart: null,
        selection: [],
    }),

    created() {
        this.init();
    },

    mounted() {
        this.$el.querySelector('#tilesetCanvas').addEventListener('pointerdown', (e) => {
            this.tileSelectStart = this.getSelectedTile(e)[0];
        });
        this.$el.querySelector('#autotileCanvas').addEventListener('pointerdown', (e) => {
            this.tileSelectStart = this.getSelectedAutotile(e)[0];
        });
        this.$el.querySelector('#tilesetCanvas').addEventListener('pointermove', (e) => {
            if (this.tileSelectStart) {
                this.selection = this.getSelectedTile(e);
                const width = this.selection[this.selection.length - 1].x - this.selection[0].x + 1
                const height = this.selection[this.selection.length - 1].y - this.selection[0].y + 1
                this.drawSelectedTile(this.selection[0].x, this.selection[0].y, width, height);
                this.$emit('selectionChanged', this.selection);
            }
        });
        this.$el.querySelector('#autotileCanvas').addEventListener('pointermove', (e) => {
            if (this.tileSelectStart) {
                this.selection = this.getSelectedAutotile(e);
                console.log(this.selection);
                this.drawSelectedAutotile(this.selection[0].x, this.selection[0].y);
                this.$emit('selectionChanged', this.selection);
            }
        });
        this.$el.querySelector('#tilesetCanvas').addEventListener('pointerup', (e) => {
            this.selection = this.getSelectedTile(e);
            this.tileSelectStart = null;
            const width = this.selection[this.selection.length - 1].x - this.selection[0].x + 1
            const height = this.selection[this.selection.length - 1].y - this.selection[0].y + 1
            this.drawSelectedTile(this.selection[0].x, this.selection[0].y, width, height);
            this.$emit('selectionChanged', this.selection);
        });
        this.$el.querySelector('#autotileCanvas').addEventListener('pointerup', (e) => {
            this.selection = this.getSelectedAutotile(e);
            this.tileSelectStart = null;
            this.drawSelectedAutotile(this.selection[0].x, this.selection[0].y);
            this.$emit('selectionChanged', this.selection);
        });
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
            const atctx = this.getContext('#autotileCanvas');
            ctx.clearRect(0, 0, this.width, this.height);
            atctx.clearRect(0, 0, 256, 32);
            ctx.drawImage(this.tileset, 0, 0, this.width, this.height);
            this.autotiles.forEach((autotile, index) => {
                atctx.drawImage(autotile, 0, 0, TILESIZE, TILESIZE, (index + 1) * TILESIZE, 0, TILESIZE, TILESIZE);
            });
        },

        getContext(id) {
            const canvas = id ? this.$el.querySelector(id) : this.$el.querySelector('#tilesetCanvas');
            return canvas.getContext('2d');
        },
        
        // TODO: 우에서 좌로 드래그
        getSelectedTile(event) {
            const offset = 384;
            const { x, y } = event.target.getBoundingClientRect();
            const tx = Math.floor(Math.max(event.clientX - x, 0) / TILESIZE);
            const ty = Math.floor(Math.max(event.clientY - y, 0) / TILESIZE);

            const newSelection = [];
            if (this.tileSelectStart) {
                for (let ix = this.tileSelectStart.x; ix < tx + 1; ix++) {
                    for (let iy = this.tileSelectStart.y; iy < ty + 1; iy++) {
                        const tileid = iy * 8 + ix + offset;
                        newSelection.push({id: tileid, x: ix, y: iy});
                    }
                }
            }
            if (newSelection.length > 0) return newSelection;

            const tileid = ty * 8 + tx + offset;
            return [{id: tileid, x: tx, y: ty}]
        },

        getSelectedAutotile(event) {
            const { x, y } = event.target.getBoundingClientRect();
            const tx = Math.floor(Math.max(event.clientX - x, 0) / TILESIZE);
            const ty = Math.floor(Math.max(event.clientY - y, 0) / TILESIZE);

            return [{id: tx, x: tx, y: ty}];
        },

        drawSelectedTile(x, y, width, height) {
            const ctx = this.getContext();
            this.draw();
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            ctx.rect(x * TILESIZE, y * TILESIZE, width * TILESIZE, height * TILESIZE);
            ctx.stroke();
        },

        drawSelectedAutotile(x, y) {
            const ctx = this.getContext('#autotileCanvas');
            this.draw();
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            ctx.rect(x * TILESIZE, y * TILESIZE, TILESIZE, TILESIZE);
            ctx.stroke();
        },
    },
}
</script>

<style>
.tileset-wrapper {
    height: 800px;
    overflow-y: auto;
}
</style>