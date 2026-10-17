const webpack = require("webpack");
const path = require("node:path");
const fs = require("node:fs");
const root = path.resolve(__dirname, "..");
fs.copyFileSync(
  path.join(
    root,
    "rust/tile-kernel/target/wasm32-unknown-unknown/release/usagi_tile_kernel.wasm"
  ),
  path.join(root, "dist/tile-kernel.wasm")
);
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
      filename: "performance-harness.js",
      publicPath: "auto",
      uniqueName: "usagiBenchmark",
    },
    resolve: { alias: { "@": path.join(root, "src") } },
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
