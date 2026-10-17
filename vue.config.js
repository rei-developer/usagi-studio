module.exports = {
  configureWebpack: {
    optimization: { runtimeChunk: "single" },
    plugins: process.env.USAGI_WASM_EXPERIMENT
      ? [
          new (require("webpack").NormalModuleReplacementPlugin)(
            /MapView\.vue$/,
            require("path").resolve(__dirname, "output/MapView.wasm.vue")
          ),
        ]
      : [],
  },
  pages: {
    index: {
      entry: "src/main.js",
      title: "USAGI STUDIO",
    },
  },
};
