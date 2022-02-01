import { createStore } from "vuex";

export default createStore({
  state: {
    data: {},
  },
  mutations: {
    updateFields(state, data) {
      state.data = { ...state.data, ...data };
    },
  },
  actions: {},
  modules: {},
});
