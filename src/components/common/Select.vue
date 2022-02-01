<template>
  <select
    :class="['ui-select', size, block && 'block']"
    :value="value"
    @change="onChange"
  >
    <slot />
  </select>
</template>

<style lang="scss" scoped>
.ui-select {
  width: fit-content;
  height: 19px;
  line-height: 18px;
  padding: 0 5px;
  color: #333;
  font-size: 13px;
  border: 0;
  background-color: var(--primary);
  outline: none;
  &:hover {
    opacity: 0.9;
  }
  &:active {
    color: #fff;
    background-color: var(--primary-hover);
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
  name: "UISelect",
  props: {
    value: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      default: "md",
    },
    block: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onChange(event) {
      this.$emit("change", event);
    },
  },
};
</script>
