<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    <div class="input-wrapper">
      <div class="label">갯수</div>
      <div class="container">
        <ui-input
          type="number"
          :value="inputValue"
          block
          @onInput="onInputMaximum"
        />
      </div>
    </div>
  </ui-dialog>
</template>

<style lang="scss" scoped>
.input-wrapper {
  display: flex;
  > .label {
    display: flex;
    align-items: center;
    width: 45px;
    height: 19px;
  }
}
</style>

<script>
import UiInput from "@/components/common/Input";
import UiDialog from "@/components/common/Dialog";

export default {
  name: "MaximumPopup",
  components: {
    UiInput,
    UiDialog,
  },
  props: {
    value: {
      type: [String, Number],
      default: 0,
    },
    mouseX: {
      type: Number,
      default: 0,
    },
    mouseY: {
      type: Number,
      default: 0,
    },
  },
  data: () => ({
    inputValue: null,
  }),
  created() {
    this.inputValue = this.value;
  },
  computed: {
    dialogOptions() {
      return {
        header: "CONTROL MAXIMUM",
        icon: "sort",
        width: 200,
        height: 75,
        mouseX: this.mouseX,
        mouseY: this.mouseY - 95,
        callback: () => this.submit(),
      };
    },
  },
  methods: {
    submit() {
      this.$emit("onSubmitPopup", this.inputValue);
    },
    onInputMaximum(value) {
      this.inputValue = Number(value);
    },
  },
};
</script>
