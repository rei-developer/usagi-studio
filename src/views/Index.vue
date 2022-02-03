<template>
  <div class="editor-wrapper">
    <div class="editor-header">
      <div class="rows">
        <div class="item"></div>
      </div>
    </div>
    <div class="editor-container">
      <map-editor class="map-editor" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>

<script>
import MapEditor from "@/views/MapEditor";

export default {
  name: "Index",
  components: { MapEditor },
};
</script>
