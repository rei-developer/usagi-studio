import { markRaw } from "vue";
import { trimHistory } from "@/utils/editHistory";
import { createStore } from "vuex";

export default createStore({
  state: {
    data: {},
    historyNotice: "",
    historySequence: 0,
    mapHistory: [],
    mapFuture: [],
    loading: true,
  },
  actions: {
    removeMapHistory({ commit, state }, map) {
      const index = state.mapHistory.findLastIndex(
        (item) => !map || item.map === map
      );
      if (index < 0) return null;
      const item = state.mapHistory[index];
      commit("REMOVE_MAP_HISTORY", index);
      return item;
    },
    removeMapFuture({ commit, state }, map) {
      const index = state.mapFuture.findLastIndex(
        (item) => !map || item.map === map
      );
      if (index < 0) return null;
      const item = state.mapFuture[index];
      commit("REMOVE_MAP_FUTURE", index);
      return item;
    },
  },
  mutations: {
    UPDATE_FIELDS: (state, data) => (state.data = { ...state.data, ...data }),
    INIT_MAP_FUTURE: (state, map) =>
      (state.mapFuture = state.mapFuture.filter(
        (item) => map && item.map !== map
      )),
    CLEAR_MAP_HISTORY: (state, map) => {
      state.mapHistory = state.mapHistory.filter((item) => item.map !== map);
      state.mapFuture = state.mapFuture.filter((item) => item.map !== map);
    },
    ADD_MAP_HISTORY: (state, data) => {
      if (!data.sequence) data.sequence = ++state.historySequence;
      state.mapHistory.push(markRaw(data));
      trimHistory(state);
    },
    ADD_MAP_FUTURE: (state, data) => {
      state.mapFuture.push(markRaw(data));
      trimHistory(state);
    },
    REMOVE_MAP_HISTORY: (state, index) => state.mapHistory.splice(index, 1),
    REMOVE_MAP_FUTURE: (state, index) => state.mapFuture.splice(index, 1),
    SET_LOADING: (state, data = false) => (state.loading = data),
  },
  getters: {
    fields: (state) => state.data,
    loading: (state) => state.loading,
    hasMapHistory: (state) =>
      state.mapHistory.filter((item) => item.map === state.data.activeMap)
        .length,
    hasMapFuture: (state) =>
      state.mapFuture.filter((item) => item.map === state.data.activeMap)
        .length,
  },
  modules: {},
});
