<template>
  <div class="ui-button-group">
    <slot />
  </div>
</template>

<style lang="scss">
.ui-button-group {
  display: flex;
  > .ui-button {
    &:first-child {
      border-top-left-radius: 2px;
      border-bottom-left-radius: 2px;
    }
    &:last-child {
      border-top-right-radius: 2px;
      border-bottom-right-radius: 2px;
    }
  }
}
</style>

<script>
export default {
  name: "UiButtonGroup",
};
</script>
