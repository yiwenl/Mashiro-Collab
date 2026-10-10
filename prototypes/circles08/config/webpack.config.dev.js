const config = require("./webpack.config");

module.exports = {
  ...config,
  mode: "development",
  devServer: {
    port: 8083,
    host: "127.0.0.1",
    hot: false,
    open: false,
    static: "./public",
    client: { overlay: { errors: true, warnings: false } },
  },
};
