<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    데이터베이스 창입니다용
  </ui-dialog>
</template>

<style lang="scss" scoped>

</style>

<script>
import UiDialog from "@/components/common/Dialog";

export default {
  name: "DatabaseDialog",
  components: { UiDialog },
  computed: {
    dialogOptions() {
      return {
        header: "DATABASE",
        icon: "database",
        width: 800,
        height: 600,
        callback: () => this.doEvent(),
      };
    },
  },
  methods: {
    doEvent() {
      alert("허걱 콜백을 실행했군요 바보군");
    },
  },
};
</script>
