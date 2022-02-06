import { createStore } from "vuex";

export default createStore({
  state: {
    data: {},
    loading: true,
  },
  actions: {},
  mutations: {
    updateFields(state, data) {
      state.data = { ...state.data, ...data };
    },
    setLoading(state, data = false) {
      state.loading = data;
    },
  },
  getters: {
    fields: (state) => state.data,
    loading: (state) => state.loading,
  },
  modules: {},
});
