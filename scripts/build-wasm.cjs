const { execFileSync } = require("node:child_process");
const { copyFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
execFileSync(
  "cargo",
  [
    "build",
    "--manifest-path",
    "rust/tile-kernel/Cargo.toml",
    "--target",
    "wasm32-unknown-unknown",
    "--release",
    "--offline",
  ],
  { cwd: root, stdio: "inherit" }
);
mkdirSync(path.join(root, "output"), { recursive: true });
copyFileSync(
  path.join(
    root,
    "rust/tile-kernel/target/wasm32-unknown-unknown/release/usagi_tile_kernel.wasm"
  ),
  path.join(root, "output/tile-kernel.wasm")
);
console.log(
  "Built experimental WASM in output; normal app build does not require Rust"
);
