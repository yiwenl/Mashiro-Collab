const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const vendor = path.resolve(__dirname, "../vendor");
const libraries = [
  { name: "digit", runtime: path.dirname(require.resolve("mediapipe-digit")) },
  { name: "kinetic", runtime: path.dirname(require.resolve("mediapipe-kinetic")) },
  { name: "camera-manager" },
];

module.exports = {
  entry: "./src/index.js",
  output: { path: path.resolve(__dirname, "../dist"), filename: "bundle.js", clean: true },
  module: {
    rules: [
      ...libraries.map(({ name, runtime }) => ({
        test: /\.ts$/, include: path.join(vendor, name, "src"),
        use: { loader: path.resolve(__dirname, "tracking-library-loader.js"), options: {
          ...(runtime ? { visionVersion: require(path.join(runtime, "package.json")).version } : {}),
        } },
        // Preserve each tracker’s MediaPipe version without a sibling checkout.
        ...(runtime ? { resolve: { alias: {
          "@mediapipe/tasks-vision$": path.join(runtime, "vision_bundle.mjs"),
        } } } : {}),
      })),
      // Keep MediaPipe's remote WASM helper import native in its worker fallback.
      { test: /vision_bundle\.mjs$/, include: libraries[1].runtime, parser: { import: false } },
      { test: /\.(glsl|vert|frag)$/, use: "raw-loader" },
      { test: /\.js$/, resolve: { fullySpecified: false } },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: "./public/index.html", publicPath: "./" })],
  resolve: {
    extensions: [".js", ".ts", ".json"],
    alias: {
      alfrid: path.resolve(__dirname, "../src/alfrid"),
      "digit$": path.join(vendor, "digit/src/index.ts"),
      "kinetic$": path.join(vendor, "kinetic/src/index.ts"),
      "camera-manager$": path.join(vendor, "camera-manager/src/CameraManager.ts"),
      "digit-camera$": path.join(vendor, "camera-manager/src/CameraManager.ts"),
    },
    fallback: { events: require.resolve("events/") },
  },
};
