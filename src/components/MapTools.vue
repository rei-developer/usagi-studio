<template>
  <div>BUTTONS</div>
</template>

<script>
import { mapMutations } from "vuex";

export default {
  name: "MapTools",
  data: () => ({
    ACTIVE_TOOL: 0,
  }),
  watch: {
    ACTIVE_TOOL() {
      this.$emit("toolSelected", this.ACTIVE_TOOL);
    },
  },
  methods: {
    ...mapMutations(["updateFields"]),
  },
};
</script>
