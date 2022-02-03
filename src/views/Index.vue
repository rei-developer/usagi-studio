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
      <div class="logo">
        <div class="image">
          <img :src="logo" alt="Logo" />
        </div>
        <div class="label">USAGI STUDIO</div>
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
    backdrop-filter: blur(20px);
    background-color: rgba(0, 0, 0, 0.4);
    > .logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 200px;
      height: 120px;
      border: 1px solid #333;
      border-radius: 2px;
      background: var(--primary);
      box-shadow: 1px 0 10px rgba(0, 0, 0, 0.1);
      > .image {
        width: 80px;
        height: 80px;
        margin-top: 8px;
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
        font-size: 24px;
      }
    }
  }
}
</style>

<script>
import Logo from "@/assets/mascot.png";
import MapEditor from "@/views/MapEditor";
import { mapGetters } from "vuex";

export default {
  name: "Index",
  components: { MapEditor },
  data: () => ({
    logo: Logo,
  }),
  computed: {
    ...mapGetters(["loading"]),
  },
};
</script>
