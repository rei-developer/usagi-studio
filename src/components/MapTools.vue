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
                <v-icon>mdi-square-rounded-outline</v-icon>
            </v-btn>
        </v-btn-toggle>
    </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
    name: 'MapTools',

    data: () => ({
        ACTIVE_TOOL: 0,
    }),

    watch: {
        ACTIVE_TOOL() {
            this.$emit('toolSelected', this.ACTIVE_TOOL);
        },
    },

    methods: {
        ...mapMutations([
            'updateFields',
        ]),
    }
}
</script>
