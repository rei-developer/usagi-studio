<template>
  <div class="ui-button-group">
    <slot />
  </div>
</template>

<style lang="scss">
.ui-button-group {
  display: flex;
}
</style>

<script>
export default {
  name: "UiButtonGroup",
};
</script>
