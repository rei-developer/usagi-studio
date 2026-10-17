const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
execFileSync(process.execPath, [path.join(__dirname, "build-wasm.cjs")], {
  cwd: root,
  stdio: "inherit",
});
let source = fs.readFileSync(
  path.join(root, "src/components/MapView.vue"),
  "utf8"
);
const start = source.indexOf("        for (const index of affected) {");
const end = source.indexOf("\n      }", start);
if (start < 0 || end < 0)
  throw Error(
    "Autotile call site changed; update experiment injection before benchmarking"
  );
const original = source.slice(start, end);
source =
  source.slice(0, start) +
  `        const batch = batchAutotileIds(layer, affected);
        if (batch) {
          for (let i = 0; i < batch.indices.length; i++) {
            const index = batch.indices[i];
            write(index % width, Math.floor(index / width), batch.ids[i]);
          }
        } else {
${original}
        }` +
  source.slice(end);
source = source
  .replace(
    "<script>",
    '<script>\nimport { warmTileKernel, batchAutotileIds } from "../experiments/tileKernel";'
  )
  .replace("  mounted() {", "  mounted() {\n    warmTileKernel();");
fs.writeFileSync(path.join(root, "output/MapView.wasm.vue"), source);
execFileSync(
  process.execPath,
  [
    require.resolve("@vue/cli-service/bin/vue-cli-service.js"),
    "build",
    "--dest",
    "output/wasm-editor",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, USAGI_WASM_EXPERIMENT: "1" },
  }
);
