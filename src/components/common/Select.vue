<template>
  <select
    :class="[
      'ui-select',
      size,
      block && 'block',
      mutiple && 'multiple',
      'custom-scroll-box',
    ]"
    :value="value"
    :size="rows"
    :multiple="rows === 1 && mutiple"
    @change="onChange"
  >
    <slot />
  </select>
</template>

<style lang="scss">
.ui-select {
  width: fit-content;
  height: 19px;
  line-height: 18px;
  color: #333;
  font-size: 13px;
  border: 0;
  background-color: var(--primary);
  outline: none;
  &:not(.multiple) {
    padding: 0 5px;
    &:hover {
      opacity: 0.9;
    }
    &:active {
      color: #fff;
      background-color: var(--primary-hover);
    }
  }
  &.multiple {
    width: 100%;
    height: 100%;
    color: #fff;
    border: 1px solid var(--primary);
    border-radius: 0;
    background-color: #333;
    &:focus > option:checked {
      background: var(--primary)
        linear-gradient(0deg, var(--primary) 0%, var(--primary) 100%);
    }
    > option {
      padding: 1px 5px 0;
      &:focus,
      &:checked {
        background-color: var(--primary);
      }
    }
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
  name: "UiSelect",
  props: {
    value: {
      type: [String, Number],
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    rows: {
      type: Number,
      default: 1,
    },
    block: {
      type: Boolean,
      default: false,
    },
    mutiple: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onChange(event) {
      this.$emit("onChange", event.target.value);
    },
  },
};
</script>
