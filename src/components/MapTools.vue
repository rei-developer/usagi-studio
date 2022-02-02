<template>
  <div>
    <ui-button size="lg" />
    <span v-if="isInside">{{ `마우스 좌표: (${x}, ${y})` }}</span>
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
  computed: {
    x() {
      return this.pointer[0];
    },
    y() {
      return this.pointer[1];
    },
    isInside() {
      return this.x !== undefined && this.y !== undefined;
    },
  },
  methods: {
    ...mapMutations(["updateFields"]),
  },
};
</script>
