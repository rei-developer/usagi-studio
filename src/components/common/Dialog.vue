<template>
  <div class="backdrop" @click.self="onCloseDialog">
    <div class="dialog-wrapper" :style="{ left: `${x}px`, top: `${y}px` }">
      <div
        ref="dialog"
        class="dialog"
        :style="{ width: `${width}px`, height: height && `${height}px` }"
      >
        <div class="header">
          <font-awesome-icon :icon="icon" v-if="icon" />
          {{ header }}
          <div class="close" @click="onCloseDialog">
            <font-awesome-icon icon="times" />
          </div>
        </div>
        <div class="content">
          <slot />
        </div>
        <div class="footer">
          <ui-button @onClick="onSubmitDialog">Submit</ui-button>
          <ui-button @onClick="onCloseDialog">Close</ui-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UiButton from "@/components/common/Button";

export default {
  name: "UiDialog",
  components: { UiButton },
  props: {
    header: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    width: {
      type: Number,
      default: 200,
    },
    height: {
      type: Number,
      default: null,
    },
    mouseX: {
      type: Number,
      default: null,
    },
    mouseY: {
      type: Number,
      default: null,
    },
    callback: {
      type: Function,
      default: null,
    },
  },
  data: () => ({
    x: 0,
    y: 0,
  }),
  async mounted() {
    if (!this.mouseX && !this.mouseY) {
      await this.$nextTick();
      const width = this.$refs.dialog?.clientWidth;
      const height = this.$refs.dialog?.clientHeight;
      this.x = window.innerWidth / 2 - width / 2;
      this.y = window.innerHeight / 2 - height / 2;
    } else {
      this.x = this.mouseX;
      this.y = this.mouseY;
    }
    window.addEventListener("keydown", this.onKeyDownEvent);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeyDownEvent);
  },
  methods: {
    onSubmitDialog() {
      if (this.callback) this.callback();
      this.onCloseDialog();
    },
    onCloseDialog() {
      this.$emit("onCloseDialog");
    },
    onKeyDownEvent(e) {
      if (e.key === "Esc") this.close();
    },
  },
};
</script>
