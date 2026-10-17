import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "@/assets/style.scss";

const app = createApp(App);

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

app.component("font-awesome-icon", FontAwesomeIcon);
app.use(store).use(router).mount("#app");
