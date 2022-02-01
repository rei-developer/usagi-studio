<template>
  <div>
    <ui-button size="lg" />
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import UiButton from "@/components/common/Button";

export default {
  name: "MapTools",
  components: { UiButton },
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
