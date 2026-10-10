const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const ZipperPlugin = require("./ZipperPlugin");
const config = require("./webpack.config");

module.exports = {
  ...config,
  mode: "production",
  plugins: [
    ...config.plugins,
    new CopyPlugin({ patterns: [{
      from: "public",
      filter: file => path.basename(file) !== "index.html",
    }] }),
    new ZipperPlugin(),
  ],
};
