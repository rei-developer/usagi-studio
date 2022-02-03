<template>
  <div class="map-tools-wrapper">
    <ui-button size="lg" />
    <div>
      <span>{{ `현재 레이어: ${ACTIVE_LAYER}` }}</span>
    </div>
    <div class="btn-group">
      <ui-button @click="setActiveLayer(0)">레이어 0(preview)</ui-button>
      <ui-button @click="setActiveLayer(1)">레이어 1</ui-button>
      <ui-button @click="setActiveLayer(2)">레이어 2</ui-button>
      <ui-button @click="setActiveLayer(3)">레이어 3</ui-button>
      <ui-button @click="setActiveLayer(4)">레이어 4(event)</ui-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-tools-wrapper {
  width: 100%;
  height: 99px;
  border-bottom: 1px solid #333;
  background: var(--primary);
}

.btn-group {
  width: 460px;
  border: 1px solid #ccc;
  border-radius: 3px;
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr 1.5fr;
}
</style>

<script>
import { mapMutations } from "vuex";
import UiButton from "@/components/common/Button";

export default {
  name: "MapTools",
  components: { UiButton },
  data: () => ({
    ACTIVE_TOOL: 0,
    ACTIVE_LAYER: 1,
  }),
  watch: {
    ACTIVE_TOOL() {
      this.$emit("toolSelected", this.ACTIVE_TOOL);
    },
    ACTIVE_LAYER() {
      this.$emit("activeLayer", this.ACTIVE_LAYER);
    },
  },
  methods: {
    ...mapMutations(["updateFields"]),
    setActiveLayer(layer) {
      this.ACTIVE_LAYER = layer;
    },
  },
};
</script>
