<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    <div v-is="component" />
  </ui-dialog>
</template>

<style lang="scss" scoped></style>

<script>
import UiDialog from "@/components/common/Dialog";
import DatabaseDialogItem from "@/components/dialog/database/pages/DatabaseDialogItem";
import TilesetDialogItem from "@/components/dialog/database/pages/TilesetDialogItem";

export default {
  name: "DatabaseDialog",
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
          component: DatabaseDialogItem,
        },
        {
          name: "Tileset",
          component: TilesetDialogItem,
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
