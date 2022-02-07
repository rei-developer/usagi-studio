import { createStore } from "vuex";

export default createStore({
  state: {
    data: {},
    mapHistory: [],
    mapFuture: [],
    loading: true,
  },
  actions: {
    async removeMapHistory({ commit, state }) {
      if (state.mapHistory.length < 1) return null;
      const item = state.mapHistory[state.mapHistory.length - 1];
      await commit("REMOVE_MAP_HISTORY");
      return item;
    },
    async removeMapFuture({ commit, state }) {
      if (state.mapFuture.length < 1) return null;
      const item = state.mapFuture[state.mapFuture.length - 1];
      await commit("REMOVE_MAP_FUTURE");
      return item;
    },
  },
  mutations: {
    UPDATE_FIELDS: (state, data) => (state.data = { ...state.data, ...data }),
    INIT_MAP_FUTURE: (state) => (state.mapFuture = []),
    ADD_MAP_HISTORY: (state, data) => state.mapHistory.push(data),
    ADD_MAP_FUTURE: (state, data) => state.mapFuture.push(data),
    REMOVE_MAP_HISTORY: (state) => state.mapHistory.pop(),
    REMOVE_MAP_FUTURE: (state) => state.mapFuture.pop(),
    SET_LOADING: (state, data = false) => (state.loading = data),
  },
  getters: {
    fields: (state) => state.data,
    loading: (state) => state.loading,
    hasMapHistory: (state) => state.mapHistory.length,
    hasMapFuture: (state) => state.mapFuture.length,
  },
  modules: {},
});
