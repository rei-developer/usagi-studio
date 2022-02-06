<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    본 툴 개발자는 누구냐: 데란, 마니아
  </ui-dialog>
</template>

<style lang="scss" scoped></style>

<script>
import UiDialog from "@/components/common/Dialog";

export default {
  name: "InfoPopup",
  components: { UiDialog },
  computed: {
    dialogOptions() {
      return {
        header: "INFO",
        icon: "info-circle",
        width: 300,
        height: 400,
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
