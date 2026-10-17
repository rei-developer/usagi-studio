import { createApp, defineAsyncComponent } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "@/assets/style.scss";

const app = createApp(App);

app.component(
  "font-awesome-icon",
  defineAsyncComponent(() =>
    import("@fortawesome/vue-fontawesome").then(
      (module) => module.FontAwesomeIcon
    )
  )
);
app.use(store).use(router).mount("#app");
