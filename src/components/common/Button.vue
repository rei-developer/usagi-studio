<template>
  <div
    :class="[
      'ui-button',
      variant,
      size,
      active && 'active',
      passive && 'passive',
      unnamed && 'unnamed',
      disabled && 'disabled',
      block && 'block',
    ]"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave"
    @click="onClick"
  >
    <font-awesome-icon :icon="icon" v-if="icon" />
    <slot />
    <div
      v-if="description && x && y"
      class="description"
      :style="{ left: `${x}px`, top: `${y}px` }"
    >
      {{ description }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ui-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: 19px;
  padding: 0 5px;
  color: #333;
  font-size: 11px;
  cursor: default;
  &:not(.unnamed) > svg {
    margin-right: 4px;
  }
  &.primary {
    background-color: var(--primary);
    &:hover {
      opacity: 0.9;
    }
    &:active {
      color: var(--primary);
      background-color: var(--primary-hover);
    }
  }
  &.gray {
    color: #fff;
    background-color: #666;
    &:hover {
      opacity: 0.9;
    }
    &:active {
      background-color: var(--primary-hover);
    }
  }
  &.active {
    color: #fff;
    background-color: var(--primary-hover);
  }
  &.passive {
    color: #999;
    background-color: #666;
  }
  &.disabled {
    color: #33333366;
    background-color: var(--primary);
    pointer-events: none;
  }
  &.block {
    width: inherit;
  }
  &.md {
    height: 23px;
  }
  &.lg {
    height: 28px;
    padding: 0 10px;
    font-size: 13px;
  }
  > .description {
    position: absolute;
    width: fit-content;
    height: 19px;
    padding: 2px 4px;
    color: #fff;
    font-size: 11px;
    border: 1px solid #ffffff33;
    background-color: #333;
    z-index: 100;
  }
}
</style>

<script>
export default {
  name: "UiButton",
  props: {
    variant: {
      type: String,
      default: "primary",
    },
    size: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
    passive: {
      type: Boolean,
      default: false,
    },
    unnamed: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    block: {
      type: Boolean,
      default: false,
    },
    beep: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    x: null,
    y: null,
  }),
  methods: {
    onMouseOver(event) {
      if (!this.description) return;
      this.x = event.clientX;
      this.y = event.clientY + 20;
    },
    onMouseLeave() {
      if (!this.description) return;
      this.x = null;
      this.y = null;
    },
    onClick(event) {
      if (this.beep) {
        const sound = new Audio("/sound/done.mp3");
        sound.play();
      }
      this.$emit("onClick", event);
    },
  },
};
</script>
