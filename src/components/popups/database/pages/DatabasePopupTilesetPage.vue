<template>
  <div class="ui-grid">
    <section class="w-180">
      <div class="label">타일셋</div>
      <ui-select
        :value="selectedIndex"
        :rows="items.length"
        :mutiple="true"
        :autofocus="true"
        @onChange="onChangeIndex"
      >
        <option
          v-for="(item, index) in items"
          :key="index"
          :value="index"
          :selected="index === selectedIndex"
        >
          {{ index + 1 }}: {{ item.label }}
        </option>
      </ui-select>
      <div class="bottom">
        <ui-button block @click="onClickOpenMaximumPopup">
          최대값 변경
        </ui-button>
      </div>
    </section>
    <section class="container">
      <div class="content w-180">
        <div class="row">이름</div>
        <div class="row">
          <ui-input block />
        </div>
        <div class="row">타일셋 그래픽</div>
        <div class="row">
          <ui-upload id="file-tileset" primary />
        </div>
        <div class="row">오토타일 그래픽</div>
        <div v-for="n in 7" :key="n" class="row">
          <ui-upload :id="`file-autotile${n}`" primary />
        </div>
        <div class="row">파노라마 그래픽</div>
        <div class="row">
          <ui-upload id="file-panorama" primary />
        </div>
        <div class="row">포그 그래픽</div>
        <div class="row">
          <ui-upload id="file-fog" primary />
        </div>
      </div>
      <div id="tilesetPopup" class="content tileset custom-scroll-box">
        <canvas id="autotilePopupCanvas" :width="256" :height="32">
          자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
        </canvas>
        <canvas id="tilesetPopupCanvas" :width="256" :height="height">
          자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
        </canvas>
      </div>
      <div class="content w-100">
        <div class="row">
          <ui-button size="lg" block>통행 설정</ui-button>
        </div>
        <div class="row">
          <ui-button size="lg" block>통행 4 방향</ui-button>
        </div>
        <div class="row">
          <ui-button size="lg" block>우선 순위</ui-button>
        </div>
      </div>
    </section>
    <maximum-popup
      v-if="isMaximumPopupOpened"
      :value="items.length"
      :mouseX="mouseX"
      :mouseY="mouseY"
      @onSubmitPopup="onSubmitMaximumPopup"
      @onClosePopup="onCloseMaximumPopup"
    />
  </div>
</template>

<style lang="scss" scoped>
.ui-grid {
  display: flex;
  width: 100%;
  height: 100%;
  > section {
    display: flex;
    flex-direction: column;
    &.w-180 {
      width: 180px;
      margin-right: 5px;
      > .label {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        margin-bottom: 5px;
        color: #fff;
        font-size: 16px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: linear-gradient(#555, #333);
      }
      > .bottom {
        margin-top: 5px;
      }
    }
    &.container {
      display: flex;
      flex-direction: row;
      flex: 1;
      padding: 5px;
      border: 1px solid var(--primary);
      > .content {
        display: flex;
        flex-direction: column;
        height: 100%;
        &.tileset {
          width: 266px;
          border: 1px solid var(--primary);
          background: #000;
          overflow-y: auto;
        }
        &.w-100 {
          width: 100px;
        }
        &.w-180 {
          width: 180px;
        }
        &:not(:last-child) {
          margin-right: 5px;
        }
        > .row:not(:last-child) {
          margin-bottom: 5px;
        }
      }
    }
  }
}
</style>

<script>
import UiButton from "@/components/common/Button";
import UiInput from "@/components/common/Input";
import UiSelect from "@/components/common/Select";
import UiUpload from "@/components/common/Upload";
import MaximumPopup from "@/components/popups/common/MaximumPopup";

export default {
  name: "DatabasePopupTilesetPage",
  components: {
    UiButton,
    UiInput,
    UiSelect,
    UiUpload,
    MaximumPopup,
  },
  data: () => ({
    selectedIndex: 0,
    items: new Array(100).fill({ label: "테스트입니다" }),
    mouseX: null,
    mouseY: null,
    tileset: null,
    tilesetName: "hospital",
    tileSelectStart: null,
    autotileId: null,
    isMaximumPopupOpened: false,
  }),
  computed: {
    width() {
      return this.tileset?.width;
    },
    height() {
      return this.tileset?.height;
    },
  },
  methods: {
    init() {
      let tileset = new Image();
      tileset.src = `/tilesets/${this.tilesetName}.png`;
      tileset.onload = () => {
        this.tileset = new Image(tileset.width, tileset.height);
        this.tileset.src = tileset.src;
        this.tileset.onload = () => {
          // TODO: draw
          tileset = null;
        };
      };
    },
    onChangeIndex(value) {
      this.selectedIndex = Number(value);
    },
    onClickOpenMaximumPopup(e) {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isMaximumPopupOpened = true;
    },
    onSubmitMaximumPopup(value) {
      // TODO: 개발해야 한다.
      this.items = new Array(value).fill({ label: "테스트입니다" });
      this.onCloseMaximumPopup();
    },
    onCloseMaximumPopup() {
      this.mouseX = null;
      this.mouseY = null;
      this.isMaximumPopupOpened = false;
    },
  },
};
</script>
