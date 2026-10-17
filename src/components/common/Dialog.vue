<template>
  <div class="backdrop" @click.self="onClosePopup">
    <div class="dialog-wrapper" :style="{ left: `${x}px`, top: `${y}px` }">
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="header"
        tabindex="-1"
        ref="dialog"
        class="dialog"
        :style="{ width: `${width}px`, height: height && `${height}px` }"
      >
        <div class="header">
          <font-awesome-icon :icon="icon" v-if="icon" />
          {{ header }}
          <button
            type="button"
            aria-label="닫기"
            class="close"
            @click="onClosePopup"
          >
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="content">
          <slot />
        </div>
        <div class="footer">
          <button type="button" :disabled="submitting" @click="onSubmitPopup">
            {{ confirmLabel }}
          </button>
          <button type="button" :disabled="submitting" @click="onClosePopup">
            {{ cancelLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "UiDialog",

  props: {
    confirmLabel: { type: String, default: "확인" },
    cancelLabel: { type: String, default: "취소" },
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
    submitting: false,
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
    this.previousFocus = document.activeElement;
    (
      this.$refs.dialog.querySelector("input, select, textarea") ||
      this.$refs.dialog
    ).focus();
    window.addEventListener("keydown", this.onKeyDownEvent);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeyDownEvent);
    this.previousFocus?.focus();
  },
  methods: {
    async onSubmitPopup() {
      if (this.submitting) return;
      this.submitting = true;
      try {
        if (this.callback && (await this.callback()) === false) return;
        this.$emit("onClosePopup");
      } finally {
        this.submitting = false;
      }
    },
    onClosePopup() {
      if (!this.submitting) this.$emit("onClosePopup");
    },
    onKeyDownEvent(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        this.onClosePopup();
      }
      if (e.key !== "Tab") return;
      const elements = [
        ...this.$refs.dialog.querySelectorAll(
          "button, input, select, textarea, [tabindex='0']"
        ),
      ].filter((el) => !el.disabled);
      const first = elements[0],
        last = elements.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === this.$refs.dialog)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    },
  },
};
</script>

<style scoped>
.header > .close {
  flex: 0;
  margin-left: auto;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.footer {
  gap: 6px;
}
</style>
