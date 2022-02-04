<template>
  <input
    ref="input"
    :class="['ui-input-range', size, block && 'block']"
    type="range"
    :value="value"
    :min="min"
    :max="max"
    :step="step"
    @input="onInputRange"
  />
</template>

<style lang="scss" scoped>
input[type="range"].ui-input-range {
  margin: 0;
  background: transparent;
  -webkit-appearance: none;
  &:focus {
    outline: none;
  }
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 15px;
    padding: 0 4px;
    border: 1px solid var(--primary);
    border-radius: 500rem;
    background: #333;
    cursor: pointer;
  }
  &::-webkit-slider-thumb {
    width: 9px;
    height: 9px;
    margin-top: 2px;
    border: 0 solid #000000;
    background: var(--primary);
    cursor: pointer;
    -webkit-appearance: none;
  }
  /* &:focus::-webkit-slider-runnable-track {
    background: #000;
  } */
  &::-moz-range-track {
    width: 100%;
    height: 12.8px;
    border: 0 solid #000101;
    border-radius: 25px;
    background: #333;
    cursor: pointer;
  }
  &::-moz-range-thumb {
    width: 39px;
    height: 20px;
    border: 0 solid #000000;
    border-radius: 7px;
    background: var(--primary);
    cursor: pointer;
  }
  &::-ms-track {
    width: 100%;
    height: 12.8px;
    color: transparent;
    background: transparent;
    border-color: transparent;
    border-width: 39px 0;
    cursor: pointer;
  }
  &::-ms-fill-lower,
  &::-ms-fill-upper {
    background: #333;
    border: 0 solid #000101;
    border-radius: 50px;
  }
  &::-ms-thumb {
    width: 39px;
    height: 20px;
    border: 0 solid #000000;
    background: var(--primary);
    cursor: pointer;
  }
  &:focus::-ms-fill-lower,
  &:focus::-ms-fill-upper {
    background: #333;
  }
}
</style>

<script>
export default {
  name: "UiInputRange",
  props: {
    size: {
      type: String,
      default: "sm",
    },
    value: {
      type: Number,
      default: null,
    },
    min: {
      type: Number,
      default: 1.0,
    },
    max: {
      type: Number,
      default: 1.0,
    },
    step: {
      type: Number,
      default: 0.1,
    },
    block: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onInputRange(event) {
      this.$emit("onInputRange", parseFloat(event.target.value));
    },
    focus() {
      this.$refs.input.focus();
    },
  },
};
</script>
