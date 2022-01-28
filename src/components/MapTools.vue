<template>
    <div>
        MapTools
    </div>
</template>

<script>
import { mapMutations } from 'vuex';
/*
const TOOLS = {
    BRUSH: 0,
    ERASE: 1,
    PAN: 2,
    PICK: 3,
    RAND: 4,
    FILL: 5,
}
*/

export default {
    name: 'MapTools',

    data: () => ({
        ACTIVE_TOOL: 0,
    }),

    methods: {
        ...mapMutations([
            'updateFields',
        ]),

        setActiveTool(index) {
            this.ACTIVE_TOOL = index;
            this.updateFields(this.ACTIVE_TOOL);
        },
    }
}
</script>
