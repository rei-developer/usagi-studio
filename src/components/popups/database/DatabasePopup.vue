<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    <div class="tab-wrapper">
      <div class="header">
        <ui-button-group>
          <ui-button
            v-for="(item, index) in components"
            :key="index"
            :passive="activatedPage !== item.name"
            @onClick="onClickPage($event, item.name)"
          >
            {{ item.name }}
          </ui-button>
        </ui-button-group>
      </div>
      <div class="container">
        <div v-is="component" />
      </div>
    </div>
  </ui-dialog>
</template>

<style lang="scss" scoped>
.tab-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  > .header {
    height: 29px;
    padding-left: 6px;
  }
  > .container {
    width: calc(100% - 12px);
    height: calc(100% - 31px);
    padding: 5px;
    border: 1px solid #ffffff33;
  }
}
</style>

<script>
import UiButton from "@/components/common/Button";
import UiButtonGroup from "@/components/common/ButtonGroup";
import UiDialog from "@/components/common/Dialog";
import DatabasePopupItemPage from "@/components/popups/database/pages/DatabasePopupItemPage";
import DatabasePopupTilesetPage from "@/components/popups/database/pages/DatabasePopupTilesetPage";

export default {
  name: "DatabasePopup",
  components: {
    UiButton,
    UiButtonGroup,
    UiDialog,
  },
  data: () => ({
    activatedPage: "타일셋",
  }),
  computed: {
    dialogOptions() {
      return {
        header: "DATABASE",
        icon: "database",
        width: 1000,
        height: 600,
        callback: () => this.doEvent(),
      };
    },
    components() {
      return [
        {
          name: "직업",
        },
        {
          name: "스킬",
        },
        {
          name: "아이템",
          component: DatabasePopupItemPage,
        },
        {
          name: "몬스터",
        },
        {
          name: "상태",
        },
        {
          name: "타일셋",
          component: DatabasePopupTilesetPage,
        },
        {
          name: "시스템",
        },
      ];
    },
    component() {
      return this.components?.find((item) => item.name === this.activatedPage)
        ?.component;
    },
  },
  methods: {
    doEvent() {
      alert("허걱 콜백을 실행했군요 바보군");
    },
    onClickPage(event, name) {
      this.activatedPage = name;
    },
  },
};
</script>
