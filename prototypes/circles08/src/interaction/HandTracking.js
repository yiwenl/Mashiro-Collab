import { trackingSources, loadTrackingSource } from "./trackingSources.js";

const MAX_SAMPLE_AGE = 250;

export default class HandTracking {
  constructor({ onStatus, onVideo = () => {}, source = "digit", getConfig = () => ({}), load = loadTrackingSource }) {
    this.onStatus = onStatus;
    this.onVideo = onVideo;
    this.load = load;
    this.source = source;
    this.getConfig = getConfig;
    this.samples = [];
    this.sampleTime = -Infinity;
    this.session = null;
    this.disposed = false;
    document.addEventListener("visibilitychange", this.onVisibility);
    this.status(`${trackingSources[this.source].label} off`);
  }

  status(message) {
    if (message === this.lastStatus) return;
    this.lastStatus = message;
    this.onStatus(message);
  }

  async start() {
    if (this.session || this.disposed) return;
    const backend = trackingSources[this.source];
    const session = { camera: null, manager: null, ready: false, backend };
    this.session = session;
    this.status(`Loading ${backend.label}…`);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera requires HTTPS or localhost.");
      const [library, { CameraManager }] = await this.load(this.source);
      if (this.session !== session) return;
      session.camera = new CameraManager({ width: 640, height: 480, fps: 30, facingMode: "user" });
      session.camera.video.muted = true;
      this.status("Waiting for camera…");
      await session.camera.start();
      if (this.session !== session) { this.release(session); return; }
      this.onVideo(session.camera.video);
      session.manager = backend.create(library);
      session.onResult = event => {
        if (this.session !== session || document.hidden) return;
        this.samples = backend.samples(event.detail, this.getConfig());
        this.sampleTime = performance.now();
        this.status(this.samples.length ? `${backend.label} · ${this.samples.length} hand${this.samples.length > 1 ? "s" : ""}`
          : `${backend.label} · ${backend.prompt}`);
      };
      session.onError = () => {
        if (this.session !== session) return;
        this.stop();
        this.status(`${backend.label} stopped · please restart`);
      };
      session.manager.addEventListener(backend.event, session.onResult);
      session.manager.addEventListener("error", session.onError);
      for (const track of session.camera.video.srcObject.getVideoTracks()) {
        track.addEventListener("ended", session.onError, { once: true });
      }
      this.status(`Loading ${backend.label} model…`);
      await session.manager.init(session.camera);
      if (this.session !== session) { this.release(session); return; }
      session.ready = true;
      this.onVisibility();
    } catch (error) {
      if (this.session === session) {
        this.stop();
        const message = error.name === "NotAllowedError" ? "Camera permission denied · press Start to retry"
          : error.name === "NotFoundError" ? "No camera found"
          : `Hand tracking unavailable · ${error.message}`;
        this.status(message);
      } else this.release(session);
    }
  }

  getSamples(now = performance.now()) {
    if (!this.session?.ready || document.hidden || now - this.sampleTime > MAX_SAMPLE_AGE) return [];
    return this.samples;
  }

  async setSource(source) {
    if (this.disposed || source === this.source) return;
    if (!trackingSources[source]) throw new Error(`Unknown tracking source: ${source}`);
    const restart = !!this.session;
    this.stop();
    this.source = source;
    this.status(`${trackingSources[source].label} off`);
    if (restart) await this.start();
  }

  clearSamples() { this.samples = []; this.sampleTime = -Infinity; }

  onVisibility = () => {
    this.clearSamples();
    if (!this.session?.ready) return;
    if (document.hidden) {
      this.session.manager.stop();
      this.status(`${this.session.backend.label} paused · tab hidden`);
    } else {
      this.session.manager.start();
      this.status(`${this.session.backend.label} · ${this.session.backend.prompt}`);
    }
  };

  release(session) {
    if (session.manager) {
      session.manager.removeEventListener(session.backend.event, session.onResult);
      session.manager.removeEventListener("error", session.onError);
      session.manager.dispose();
    }
    // Both managers leave a caller-owned camera untouched.
    session.camera?.dispose();
  }

  stop() {
    const session = this.session;
    this.session = null;
    this.clearSamples();
    this.onVideo(null);
    if (session) this.release(session);
    this.status(`${trackingSources[this.source].label} off`);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    document.removeEventListener("visibilitychange", this.onVisibility);
  }
}
