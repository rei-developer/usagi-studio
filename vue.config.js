module.exports = {
  configureWebpack: { optimization: { runtimeChunk: "single" } },
  pages: {
    index: {
      entry: "src/main.js",
      title: "USAGI STUDIO",
    },
  },
};
