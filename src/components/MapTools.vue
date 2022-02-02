<template>
  <div>
    <ui-button size="lg" />
    <span>{{
      pointer[0] !== undefined
        ? `마우스 좌표: (${pointer[0]}, ${pointer[1]})`
        : ""
    }}</span>
    <div>{{ `너비: ${width}, 높이: ${height}` }}</div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import UiButton from "@/components/common/Button";

export default {
  name: "MapTools",
  components: { UiButton },
  props: {
    pointer: Array,
    width: Number,
    height: Number,
  },
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
