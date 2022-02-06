<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    <div v-is="component" />
  </ui-dialog>
</template>

<style lang="scss" scoped></style>

<script>
import UiDialog from "@/components/common/Dialog";
import DatabasePopupItemPage from "@/components/popups/database/pages/DatabasePopupItemPage";
import DatabasePopupTilesetPage from "@/components/popups/database/pages/DatabasePopupTilesetPage";

export default {
  name: "DatabasePopup.vue",
  components: { UiDialog },
  data: () => ({
    activatedPage: "Tileset",
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
          name: "Item",
          component: DatabasePopupItemPage,
        },
        {
          name: "Tileset",
          component: DatabasePopupTilesetPage,
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
  },
};
</script>
