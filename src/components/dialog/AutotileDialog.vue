<template>
  <ui-dialog v-bind="{ ...dialogOptions }">
    <canvas id="autotileDialogCanvas" :width="256" :height="192">
      자바스크립트를 지원하지 않는 브라우저입니다. 다시 시도해 주세요.
    </canvas>
  </ui-dialog>
</template>

<script>
import UiDialog from "@/components/common/Dialog";

export default {
  name: "AutotileDialog",
  components: { UiDialog },
  computed: {
    dialogOptions() {
      return {
        header: "SELECT AUTOTILE",
        icon: "layer-group",
        width: 266,
        height: 248,
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
