<template>
  <div
    :class="[
      'ui-button',
      variant,
      size,
      active && 'active',
      unnamed && 'unnamed',
      disabled && 'disabled',
      block && 'block',
    ]"
    @click="onClick"
  >
    <font-awesome-icon :icon="icon" v-if="icon" />
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.ui-button {
  width: fit-content;
  height: 19px;
  line-height: 18px;
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
      color: #fff;
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
  &.disabled {
    color: #33333366;
    background-color: var(--primary);
    pointer-events: none;
  }
  &.block {
    width: 100%;
  }
  &.md {
    height: 23px;
    line-height: 21px;
  }
  &.lg {
    height: 28px;
    line-height: 26px;
    padding: 0 10px;
    font-size: 15px;
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
    active: {
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
  methods: {
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
