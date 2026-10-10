import { GL } from "alfrid";
import SceneApp from "./SceneApp.js";

try {
  const canvas = document.querySelector("#main-canvas");
  GL.init(canvas, { alpha: false, preserveDrawingBuffer: true });
  if (!GL.webgl2) throw new Error("This experiment requires WebGL 2.");
  const scene = new SceneApp();
  scene.render();
  // Development inspection only; the exported page has no debug surface.
  if (process.env.NODE_ENV === "development") window.scene = scene;
  window.addEventListener("pagehide", event => { if (!event.persisted) scene.dispose(); });
  window.fxpreview?.();
} catch (error) {
  const status = document.querySelector("#status");
  status.textContent = error.message;
  status.hidden = false;
  console.error(error);
}
