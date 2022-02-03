import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "@/assets/style.scss";

const app = createApp(App);

// Import Font Awesome Icons
import { library } from "@fortawesome/fontawesome-svg-core";
import { faUserSecret } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faUserSecret);

app.use(store).use(router).mount("#app");

// Use Components
app.component("font-awesome-icon", FontAwesomeIcon);
