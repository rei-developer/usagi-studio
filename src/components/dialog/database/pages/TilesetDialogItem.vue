<template>
  <div class="ui-grid">
    <section class="w-180">
      <div class="label">Tileset</div>
      <ui-select
        :value="selectedIndex"
        :rows="items.length"
        :mutiple="true"
        @onChange="onChangeIndex"
      >
        <option
          v-for="(item, index) in items"
          :key="index"
          :value="index"
          :selected="index === selectedIndex"
        >
          {{ index }}: {{ item.label }}
        </option>
      </ui-select>
    </section>
    <section class="container custom-scroll-box">aa</section>
  </div>
</template>

<style lang="scss" scoped>
.ui-grid {
  display: flex;
  width: 100%;
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
        width: calc(100% - 2px);
        height: 28px;
        margin-bottom: 5px;
        color: #fff;
        font-size: 16px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: linear-gradient(#555, #333);
      }
    }
    &.container {
      flex: 1;
      padding: 5px;
      border: 1px solid var(--primary);
    }
  }
}
</style>

<script>
import UiSelect from "@/components/common/Select";

export default {
  name: "TilesetDialogItem",
  components: {
    UiSelect,
  },
  data: () => ({
    selectedIndex: 0,
    items: new Array(100).fill({ label: "테스트입니다" }),
  }),
  methods: {
    onChangeIndex(value) {
      this.selectedIndex = Number(value);
    },
  },
};
</script>
