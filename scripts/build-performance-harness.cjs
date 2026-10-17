const webpack = require("webpack");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const before = process.argv.includes("--before");
const baseline = path.join(root, "output/worker-before");
if (before) {
  for (const file of [
    "utils/exportImage.js",
    "utils/imageRenderer.js",
    "utils/imageExport.js",
    "utils/tileset.js",
    "workers/imageExport.worker.js",
  ]) {
    const target = path.join(baseline, "src", file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(
      target,
      execFileSync("git", ["show", `1870f26:src/${file}`], { cwd: root })
    );
  }
}
const wasmPath = path.join(
  root,
  "rust/tile-kernel/target/wasm32-unknown-unknown/release/usagi_tile_kernel.wasm"
);
if (fs.existsSync(wasmPath))
  fs.copyFileSync(wasmPath, path.join(root, "dist/tile-kernel.wasm"));
fs.copyFileSync(
  path.join(root, "src/assets/maps/Map001.json"),
  path.join(root, "dist/bench-fixture.json")
);
webpack(
  {
    mode: "production",
    entry: path.join(__dirname, "performance-harness.js"),
    output: {
      path: path.join(root, "dist"),
      filename: before ? "performance-before.js" : "performance-harness.js",
      chunkFilename: "export-bench.[id].[contenthash].js",
      publicPath: "auto",
      uniqueName: "usagiBenchmark",
    },
    resolve: { alias: { "@": path.join(root, "src") } },
    plugins: before
      ? [
          new webpack.NormalModuleReplacementPlugin(
            /src\/utils\/exportImage$/,
            path.join(baseline, "src/utils/exportImage.js")
          ),
        ]
      : [],
  },
  (error, stats) => {
    if (error || stats.hasErrors()) {
      console.error(error || stats.toString({ all: false, errors: true }));
      process.exitCode = 1;
    } else
      console.log(
        "Built isolated performance harness in dist (not part of yarn build)"
      );
  }
);
