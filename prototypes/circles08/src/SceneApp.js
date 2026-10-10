import { GL, CameraPerspective, OrbitalControl } from "alfrid";
import Config from "./Config.js";
import { createBodies } from "./physics/createBodies.js";
import PhysicsWorld from "./physics/PhysicsWorld.js";
import DifferenceRenderer from "./render/DifferenceRenderer.js";
import addControls from "./utils/addControl.js";
import { saveImage } from "./utils/download.js";
import HandTracking from "./interaction/HandTracking.js";
import { mapHandToScene } from "./interaction/handMapping.js";
import HandMarkers from "./render/HandMarkers.js";
import FpsMeter from "./utils/FpsMeter.js";

const CAMERA_DISTANCE = 14;
const MAX_CAMERA_DISTANCE = 150;

export default class SceneApp {
  constructor() {
    this.config = structuredClone(Config);
    this.randomValues = [];
    this.paused = false;
    this.fpsMeter = new FpsMeter(document.querySelector("#fps-meter"));
    this.camera = new CameraPerspective(Math.PI / 4, 1, 0.1, 200);
    this.orbitalControl = new OrbitalControl(this.camera, CAMERA_DISTANCE, GL.canvas);
    this.orbitalControl.rx.setTo(-0.6);
    this.orbitalControl.ry.setTo(-0.5);
    this.orbitalControl.radius.limit(2, MAX_CAMERA_DISTANCE);
    this.orbitalControl.lock();
    this.orbitalControl.update();
    this.resize();
    this.renderer = new DifferenceRenderer(GL.width, GL.height);
    this.handMarkers = new HandMarkers();
    this.cameraFeed = document.querySelector("#camera-feed");
    if (!this.renderer.supportsColor) this.config.mode = "difference";
    this.rebuild();
    this.handTracking = new HandTracking({
      source: this.config.trackingSource,
      getConfig: () => this.trackingConfig,
      onStatus: message => { document.querySelector("#hand-status").textContent = message; },
      onVideo: video => {
        this.cameraFeed.replaceChildren(...(video ? [video] : []));
        this.cameraFeed.hidden = !video;
      },
    });
    this.controls = addControls({
      config: this.config,
      supportsColor: this.renderer.supportsColor,
      rebuild: () => this.rebuild(),
      configurePhysics: () => this.physics?.configure(this.config),
      setPaused: value => this.setPaused(value),
      replay: () => this.replay(),
      saveImage: () => this.saveImage(),
      startHands: () => this.handTracking.start(),
      stopHands: () => { this.handTracking.stop(); this.physics?.clearHands(); },
      setTrackingSource: source => {
        this.physics?.clearHands();
        this.handTracking.setSource(source);
      },
    });
    if (!this.renderer.supportsColor) {
      this.showError("Color mode is unavailable on this device. Difference mode is active.");
    }
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.resetClock);
    this.frameId = requestAnimationFrame(this.frame);
  }

  rebuild() {
    let cursor = 0;
    const rng = () => {
      if (cursor === this.randomValues.length) this.randomValues.push(window.fxrand());
      return this.randomValues[cursor++];
    };
    try {
      const layout = createBodies({ ...this.config, rng });
      const next = new PhysicsWorld(layout, this.config);
      this.physics?.dispose();
      this.physics = next;
      this.layout = layout;
      this.resetClock();
      // Keep the fixed camera distance; long rods may extend beyond the frame.
      this.camera.setPerspective(Math.PI / 4, GL.aspectRatio, 0.1,
        Math.max(200, MAX_CAMERA_DISTANCE + layout.spawnRadius * 2));
      this.showError("");
    } catch (error) {
      this.showError(error.message);
    }
  }

  resize = () => {
    const ratio = 1.5;
    GL.setSize(Math.max(1, Math.round(innerWidth * ratio)), Math.max(1, Math.round(innerHeight * ratio)));
    GL.canvas.style.width = "100%";
    GL.canvas.style.height = "100%";
    this.camera.setAspectRatio(GL.aspectRatio);
    this.renderer?.resize(GL.width, GL.height);
    if (process.env.NODE_ENV === "development" && this.renderer) {
      console.debug("[circles08] resize", JSON.stringify({ width: GL.width, height: GL.height,
        framebuffers: GL.frameBufferCount, textures: GL.textureCount }));
    }
  };

  resetClock = () => {
    this.lastTime = null;
    this.fpsMeter.reset();
    this.physics?.resetClock();
    this.physics?.clearHands();
  };

  setPaused(value) {
    this.paused = value;
    this.resetClock();
  }

  replay() {
    this.physics?.replay();
    this.resetClock();
  }

  render() {
    if (!this.physics) return;
    this.orbitalControl.update();
    const poses = this.physics.getPoses();
    if (this.config.mode === "normal") {
      this.renderer.renderNormal(this.layout.specs, poses, this.camera);
    } else {
      this.renderer.render(this.layout.specs, poses, this.camera, this.config);
    }
    // Final overlay: markers never enter the difference/pattern/contour passes.
    this.handMarkers.draw(this.physics.getHandPositions(), this.camera);
    this.cameraFeed.classList.toggle("mirrored", this.trackingConfig.handMirror);
  }

  get trackingConfig() { return this.config.tracking[this.config.trackingSource]; }

  frame = time => {
    const samples = this.paused ? [] : this.handTracking.getSamples(time);
    const targets = samples.map(({ id, point }) => ({ id,
      position: mapHandToScene(point, this.camera.viewMatrix, this.camera.projectionMatrix,
        this.trackingConfig, CAMERA_DISTANCE),
    }));
    this.physics?.setHandTargets(targets, this.trackingConfig.handRadius);
    if (this.lastTime !== null && !this.paused && !document.hidden) {
      this.physics?.advance((time - this.lastTime) / 1000);
    }
    this.lastTime = time;
    this.render();
    if (!document.hidden) this.fpsMeter.update(time);
    this.frameId = requestAnimationFrame(this.frame);
  };

  saveImage() {
    this.render();
    saveImage(GL.canvas);
  }

  onKey = event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      this.saveImage();
    }
  };

  showError(message) {
    const status = document.querySelector("#status");
    status.textContent = message;
    status.hidden = !message;
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("visibilitychange", this.resetClock);
    this.controls?.dispose();
    this.handTracking?.dispose();
    this.handMarkers?.dispose();
    this.physics?.dispose();
    this.renderer?.dispose();
    this.orbitalControl.dispose();
  }
}
