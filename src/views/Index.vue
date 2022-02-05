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
    <div class="logo-wrapper" v-if="loading">
      <div
        class="background"
        :style="{
          backgroundImage: `url(logo.png)`,
        }"
      />
      <div class="logo">
        <div class="image">
          <img src="logo.png" alt="Logo" />
        </div>
        <div class="label">ⓒ USAGI STUDIO - Since 2022.</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  > .logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: #ffffff33;
    > .background {
      width: 200px;
      height: 110px;
      position: absolute;
      border-radius: 20px;
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      background-color: #33333333;
      filter: blur(10px);
      opacity: 0.5;
    }
    > .logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 200px;
      height: 110px;
      border: 3px double #333;
      border-radius: 2px;
      background: #33333311;
      box-shadow: 1px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 1;
      > .image {
        width: 80px;
        height: 80px;
        border-radius: 500rem;
        background: #666;
        overflow: hidden;
        > img {
          width: inherit;
          height: inherit;
        }
      }
      > .label {
        margin-top: 5px;
        color: #333;
        font-size: 13px;
        font-style: italic;
      }
    }
  }
}
</style>

<script>
import MapEditor from "@/views/MapEditor";
import { mapGetters } from "vuex";

export default {
  name: "Index",
  components: { MapEditor },
  computed: {
    ...mapGetters(["loading"]),
  },
};
</script>
