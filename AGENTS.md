# Repository Guidelines

## Project Structure & Module Organization

Usagi Studio is a Vue 3 tile-map editor built with Vue CLI, Vue Router, and Vuex.

- `src/main.js` and `src/App.vue` initialize the application; `src/router/index.js` defines routes.
- `src/views/` contains the main screen and map-editor composition.
- `src/components/` contains canvas views and tools; `common/` holds reusable controls, and `popups/` holds dialogs and database editors.
- `src/store/index.js` manages shared fields, loading state, and undo/redo history.
- `src/utils/` defines tile sizes, autotile mappings, canvas selectors, and tool identifiers. Reuse these constants instead of duplicating them.
- `src/assets/` contains shared SCSS and sample map JSON; `public/tilesets/` and `public/autotiles/` contain runtime PNG assets.

## Build, Test, and Development Commands

Use Node.js 22.18+ and Yarn Classic, matching the committed `yarn.lock`:

- `yarn install`: install dependencies.
- `yarn serve`: start the development server with hot reload.
- `yarn build`: create the production bundle in `dist/`.
- `yarn lint`: run ESLint and apply automatic fixes; review the resulting diff.

## Coding Style & Naming Conventions

Follow the existing Vue Options API and single-file component patterns. Use two-space indentation, double-quoted JavaScript strings, semicolons, and trailing commas where the formatter permits. ESLint flat configuration in `eslint.config.mjs` combines Vue essential rules, recommended JavaScript rules, and Prettier.

Use PascalCase component filenames (`TilesetView.vue`), camelCase variables and methods, and uppercase constants and Vuex mutation names (`TILESIZE`, `ADD_MAP_HISTORY`). Prefer `@/` imports for source modules. Reuse controls in `components/common/`, preserve Korean UI text, and scope component-specific SCSS.

## Testing Guidelines

Run lint and build for code changes. `scripts/editor-smoke.pw` is a Playwright CLI regression check for the development server; `scripts/production-smoke.pw` checks the served production build. See README for commands. They cover selection, drawing, layers, zoom, undo/redo, and browser errors. There is no coverage threshold. Record reproduction steps and actual results in the pull request.

## Commit & Pull Request Guidelines

Recent commits use short, descriptive Korean subjects, such as `SELECT 모드에서 드래그 구현`; no Conventional Commits convention is evident. Keep commits focused and describe the concrete change.

Pull requests should explain the problem and resulting behavior, link relevant issues, list validation performed, and include screenshots or short recordings for visual or interaction changes. Preserve sample maps and asset filenames unless intentionally changing their references. Do not commit `node_modules/`, `dist/`, or secrets in local environment files.
