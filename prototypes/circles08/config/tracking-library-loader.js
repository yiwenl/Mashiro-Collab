const ts = require("typescript");

module.exports = function trackingLibraryLoader(source) {
  const { visionVersion } = this.getOptions();
  // Keep the vendored source intact while matching its installed JS/WASM versions.
  const aligned = visionVersion ? source.replace(
    /https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision@[\d.]+\/wasm/g,
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${visionVersion}/wasm`,
  ) : source;
  return ts.transpileModule(aligned, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    fileName: this.resourcePath,
  }).outputText;
};
