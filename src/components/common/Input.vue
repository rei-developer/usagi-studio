<template>
  <div>
    <input
      ref="input"
      :class="['ui-input', size, block && 'block', readonly && 'readonly']"
      :type="type"
      :value="value"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :readonly="readonly"
      @input="onInput"
    />
    <span v-if="display && maxlength && value && value.length > 0">
      {{ value.length }}/{{ maxlength }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
input.ui-input {
  color: #fff;
  border: 1px solid var(--primary);
  background: transparent;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }
  &:not(.readonly):focus {
    border-style: dashed;
  }
  &.block {
    width: 100%;
  }
  &.xsm {
    width: 18px;
    height: 18px;
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
  &[type="color"] {
    width: 19px;
    height: 19px;
    margin: 0;
    padding: 0;
    border: 1px solid var(--primary);
    -webkit-appearance: none;
    &.sm {
      width: 18px;
      height: 18px;
    }
    &.md {
      width: 23px;
      height: 23px;
    }
  }
  &[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  &[type="color"]::-webkit-color-swatch {
    border: none;
  }
}
</style>

<script>
export default {
  name: "UIInput",
  props: {
    size: {
      type: String,
      default: "sm",
    },
    type: {
      type: String,
      default: "text",
    },
    value: {
      type: String,
      default: null,
    },
    placeholder: {
      type: String,
      default: null,
    },
    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },
    maxlength: {
      type: Number,
      default: null,
    },
    display: {
      type: Boolean,
      default: false,
    },
    block: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onInput(event) {
      let value = event.target.value;
      try {
        if (this.type === "number") {
          if (this.min && Number(value) < this.min) {
            value = this.min.toString();
            event.target.value = this.min;
          }
          if (this.max && Number(value) > this.max) {
            value = this.max.toString();
            event.target.value = this.max;
          }
        }
        this.$emit("input", value);
      } catch (error) {
        throw new Error(error);
      }
    },
    focus() {
      this.$refs.input.focus();
    },
  },
};
</script>
