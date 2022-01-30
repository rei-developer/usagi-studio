<template>
    <div>
        <v-btn-toggle
            v-model="ACTIVE_TOOL"
            rounded
            color="primary"
        >
            <v-btn>
                <v-icon>mdi-lead-pencil</v-icon>
            </v-btn>

            <v-btn>
                <v-icon>mdi-eraser</v-icon>
            </v-btn>

            <v-btn>
                <v-icon>mdi-square-rounded-outline</v-icon>
            </v-btn>
        </v-btn-toggle>
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
