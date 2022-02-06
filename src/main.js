import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "@/assets/style.scss";

const app = createApp(App);

// Import Font Awesome Icons
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCopyright,
  faFileImport,
  faFileExport,
  faSave,
  faCut,
  faCopy,
  faPaste,
  faTimes,
  faUndo,
  faRedo,
  faMountain,
  faLayerGroup,
  faStreetView,
  faPencilAlt,
  faSquareFull,
  faCircle,
  faFillDrip,
  faVectorSquare,
  faTable,
  faDatabase,
  faFolderOpen,
  faMusic,
  faChartPie,
  faInfoCircle,
  faCog,
  faEye,
  faEyeSlash,
  faSearchPlus,
  faSearchMinus,
  faBullseye,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const libraries = [
  faCopyright,
  faFileImport,
  faFileExport,
  faSave,
  faCut,
  faCopy,
  faPaste,
  faTimes,
  faUndo,
  faRedo,
  faMountain,
  faLayerGroup,
  faStreetView,
  faPencilAlt,
  faSquareFull,
  faCircle,
  faFillDrip,
  faVectorSquare,
  faTable,
  faDatabase,
  faFolderOpen,
  faMusic,
  faChartPie,
  faInfoCircle,
  faCog,
  faEye,
  faEyeSlash,
  faSearchPlus,
  faSearchMinus,
  faBullseye,
  faChevronRight,
];

for (const icon of libraries) library.add(icon);

app.use(store).use(router).mount("#app");

// Use Components
app.component("font-awesome-icon", FontAwesomeIcon);
