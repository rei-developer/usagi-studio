import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "@/assets/style.scss";

const app = createApp(App);

// Import Font Awesome Icons
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faSave,
  faCut,
  faCopy,
  faPaste,
  faTimes,
  faUndo,
  faRedo,
  faMountain,
  faLayerGroup,
  faBolt,
  faPencilAlt,
  faSquareFull,
  faCircle,
  faFillDrip,
  faVectorSquare,
  faSearchPlus,
  faSearchMinus,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faSave);
library.add(faCut);
library.add(faCopy);
library.add(faPaste);
library.add(faTimes);
library.add(faUndo);
library.add(faRedo);
library.add(faMountain);
library.add(faLayerGroup);
library.add(faBolt);
library.add(faPencilAlt);
library.add(faSquareFull);
library.add(faCircle);
library.add(faFillDrip);
library.add(faVectorSquare);
library.add(faSearchPlus);
library.add(faSearchMinus);
library.add(faBullseye);

app.use(store).use(router).mount("#app");

// Use Components
app.component("font-awesome-icon", FontAwesomeIcon);
