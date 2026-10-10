import { GUI } from "dat.gui";
import { palettes } from "../render/palettes.js";

export default function addControls({ config, supportsColor, rebuild, configurePhysics, setPaused, replay, saveImage,
  startHands, stopHands, setTrackingSource }) {
  const gui = new GUI({ width: 280 });
  const hands = gui.addFolder("Tracking");
  const source = hands.add(config, "trackingSource", { Digit: "digit", Kinetic: "kinetic" }).name("Source");
  hands.add({ startHands }, "startHands").name("Start tracking");
  hands.add({ stopHands }, "stopHands").name("Stop camera");
  let mappingFolder;
  const showMapping = () => {
    if (mappingFolder) hands.removeFolder(mappingFolder);
    const kinetic = config.trackingSource === "kinetic";
    const settings = config.tracking[config.trackingSource];
    mappingFolder = hands.addFolder(kinetic ? "Kinetic mapping" : "Digit mapping");
    mappingFolder.add(settings, "handScale", 0.25, 3, 0.05).name("Position scale");
    mappingFolder.add(settings, "handDepthScale", 0, 20, 0.5).name("Depth scale");
    mappingFolder.add(settings, "handDepthOffset", -6, 6, 0.1).name("Depth offset");
    mappingFolder.add(settings, "handRadius", 0.15, 2, 0.05).name("Sphere radius");
    mappingFolder.add(settings, "handMirror").name("Mirror");
    if (kinetic) mappingFolder.add(settings, "minVisibility", 0, 1, 0.05).name("Min visibility");
    mappingFolder.open();
  };
  showMapping();
  source.onChange(value => { showMapping(); setTrackingSource(value); });
  hands.open();
  const objects = gui.addFolder("Objects");
  objects.add(config, "sphereCount", 0, 16, 1).name("Spheres").onFinishChange(rebuild);
  objects.add(config, "cubeCount", 0, 16, 1).name("Boxes").onFinishChange(rebuild);
  objects.add(config, "minSize", 0.3, 2, 0.05).name("Min size").onFinishChange(() => {
    config.maxSize = Math.max(config.minSize, config.maxSize);
    rebuild();
    gui.updateDisplay();
  });
  objects.add(config, "maxSize", 0.3, 4, 0.05).name("Max size").onFinishChange(() => {
    config.minSize = Math.min(config.minSize, config.maxSize);
    rebuild();
    gui.updateDisplay();
  });
  objects.add(config, "spawnRadius", 2, 8, 0.1).name("Scatter radius").onFinishChange(rebuild);
  objects.open();

  const rods = gui.addFolder("Lines / rods");
  rods.add(config, "rodCount", 0, 8, 1).name("Rods").onFinishChange(rebuild);
  rods.add(config, "rodLength", 3, 50, 0.5).name("Length").onFinishChange(rebuild);
  rods.add(config, "rodWidth", 0.025, 0.2, 0.005).name("Width").onFinishChange(rebuild);
  rods.open();

  const motion = gui.addFolder("Motion");
  motion.add(config, "attraction", 0, 2, 0.05).name("Center pull").onChange(configurePhysics);
  motion.add(config, "linearDamping", 0, 0.95, 0.01).name("Linear damping").onChange(configurePhysics);
  motion.add(config, "angularDamping", 0, 0.95, 0.01).name("Angular damping").onChange(configurePhysics);
  motion.add(config, "restitution", 0, 0.8, 0.01).name("Bounce").onChange(configurePhysics);
  motion.open();

  const display = gui.addFolder("Display");
  const modes = { ...(supportsColor ? { Color: "color" } : {}), Difference: "difference", Normal: "normal" };
  display.add(config, "mode", modes).name("Mode");
  if (supportsColor) {
    display.add(config, "palette", Object.fromEntries(Object.entries(palettes)
      .map(([key, palette]) => [palette.name, key]))).name("Palette");
    display.add(config, "patternAmount", 0, 1, 0.05).name("Pattern amount");
    display.add(config, "patternScale", 48, 320, 4).name("Pattern size");
  }
  display.add(config, "shading", 0, 1, 0.01).name("Difference shading");
  display.open();

  const contours = gui.addFolder("Contour");
  contours.add(config, "contour").name("Enabled");
  contours.add(config, "contourWidth", 0.5, 2, 0.25).name("Width");
  contours.open();

  const actions = { paused: false, replay, saveImage };
  gui.add(actions, "paused").name("Pause").onChange(setPaused);
  gui.add(actions, "replay").name("Replay same layout");
  gui.add(actions, "saveImage").name("Save image");
  return { dispose: () => gui.destroy() };
}
