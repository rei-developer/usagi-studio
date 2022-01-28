import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';

const vuexLocal = new VuexPersistence({
    storage: window.localStorage,
});

Vue.use(Vuex);

export default new Vuex.Store({
    plugins: [vuexLocal.plugin],
  
    state: {
      data: {},
    },
  
    mutations: {
      updateFields(state, data) {
        state.data = { ...state.data, ...data };
      },
    },
  });