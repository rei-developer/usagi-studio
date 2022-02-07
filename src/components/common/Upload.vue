<template>
  <div class="ui-upload">
    <label :for="id" :class="[primary && 'primary']" :style="{ width }">
      {{ filename }}
    </label>
    <div class="icon-wrapper">
      <font-awesome-icon icon="chevron-right" />
    </div>
    <input type="file" :id="id" v-bind="$attrs" @change="onChange" />
  </div>
</template>

<style lang="scss" scoped>
.ui-upload {
  position: relative;
  > label {
    display: flex;
    align-items: center;
    height: 19px;
    padding: 0 5px;
    color: #fff;
    font-size: 13px;
    border: 1px solid var(--primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &.primary {
      &:hover {
        opacity: 0.9;
      }
      &:active {
        color: var(--primary);
        background-color: var(--primary-hover);
      }
    }
  }
  > input[type="file"] {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    clip: rect(0, 0, 0, 0);
    overflow: hidden;
    visibility: hidden;
  }
  > .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 3px;
    right: 3px;
    width: 15px;
    height: 15px;
    color: #333;
    font-size: 11px;
    background-color: var(--primary);
  }
}
</style>

<script>
export default {
  name: "UiUpload",
  props: {
    id: {
      type: String,
      default: null,
    },
    width: {
      type: String,
      default: null,
    },
    primary: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    filename: null,
  }),
  methods: {
    onChange(event) {
      this.filename = event.target?.files[0]?.name;
      this.$emit("onChange", event);
    },
  },
};
</script>
