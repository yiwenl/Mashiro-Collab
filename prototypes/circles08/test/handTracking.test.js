import test from "node:test";
import assert from "node:assert/strict";
import HandTracking from "../src/interaction/HandTracking.js";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function setup(t, { cameraGate, modelGate } = {}) {
  const originals = ["document", "navigator"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  const document = new EventTarget();
  document.hidden = false;
  Object.defineProperty(globalThis, "document", { configurable: true, value: document });
  Object.defineProperty(globalThis, "navigator", { configurable: true,
    value: { mediaDevices: { getUserMedia() {} } } });
  const cameras = [], managers = [], videos = [], statuses = [];
  const cameraStarted = deferred(), modelStarted = deferred();
  class CameraManager {
    constructor() {
      this.track = new EventTarget();
      this.video = { srcObject: { getVideoTracks: () => [this.track] } };
      cameras.push(this);
    }
    async start() {
      cameraStarted.resolve();
      await cameraGate?.promise;
      this.active = true;
    }
    dispose() { this.active = false; }
  }
  class HandLandmarkManager extends EventTarget {
    static EVENTS = { HAND_DETECTED: "hand-detected", ERROR: "error" };
    constructor() { super(); managers.push(this); }
    async init() {
      modelStarted.resolve();
      await modelGate?.promise;
      this.modelOpen = true;
    }
    start() { this.running = true; }
    stop() { this.running = false; }
    dispose() { this.stop(); this.modelOpen = false; }
    detect(hands = 1) {
      const event = new Event("hand-detected");
      event.detail = { landmarks: Array.from({ length: hands }, () =>
        Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))) };
      this.dispatchEvent(event);
    }
  }
  class SkeletonManager extends HandLandmarkManager {
    detect() {
      const event = new Event("skeleton-detected");
      event.detail = { result: { landmarks: [Array.from({ length: 33 }, () =>
        ({ x: 0.5, y: 0.5, z: -0.1, visibility: 0.9 }))] } };
      this.dispatchEvent(event);
    }
  }
  const tracking = new HandTracking({
    load: async () => [{ HandLandmarkManager, SkeletonManager }, { CameraManager }],
    onVideo: video => videos.push(video), onStatus: message => statuses.push(message),
  });
  t.after(() => {
    tracking.dispose();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { tracking, document, cameras, managers, videos, statuses, cameraStarted, modelStarted };
}

test("tracking shares its camera with preview and drops missing or stale samples", async t => {
  const { tracking, cameras, managers, videos } = setup(t);
  await tracking.start();
  assert.equal(videos.at(-1), cameras[0].video);
  assert.equal(cameras[0].video.muted, true);
  managers[0].detect(2);
  assert.equal(tracking.getSamples().length, 2);
  assert.deepEqual(tracking.getSamples(performance.now() + 251), []);
  managers[0].detect(0);
  assert.deepEqual(tracking.getSamples(), []);
  tracking.stop();
  assert.equal(videos.at(-1), null);
  assert.equal(cameras[0].active, false);
  assert.equal(managers[0].modelOpen, false);
});

test("a hidden tab stops detection and requires fresh samples on return", async t => {
  const { tracking, document, managers } = setup(t);
  await tracking.start();
  managers[0].detect();
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(managers[0].running, false);
  assert.deepEqual(tracking.getSamples(), []);
  document.hidden = false;
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(managers[0].running, true);
  assert.deepEqual(tracking.getSamples(), []);
  managers[0].detect();
  assert.equal(tracking.getSamples().length, 1);
});

test("stopping during camera permission cleans a stream that arrives later", async t => {
  const cameraGate = deferred();
  const { tracking, cameras, managers, videos, cameraStarted } = setup(t, { cameraGate });
  const start = tracking.start();
  await cameraStarted.promise;
  await tracking.start();
  assert.equal(cameras.length, 1, "repeated Start must not request a second camera");
  tracking.stop();
  cameraGate.resolve();
  await start;
  assert.equal(cameras[0].active, false);
  assert.equal(managers.length, 0);
  assert.deepEqual(videos, [null]);
});

test("a late model cannot restart an old session or remove the replacement preview", async t => {
  const modelGate = deferred();
  const { tracking, cameras, managers, videos, modelStarted } = setup(t, { modelGate });
  const first = tracking.start();
  await modelStarted.promise;
  tracking.stop();
  const second = tracking.start();
  modelGate.resolve();
  await Promise.all([first, second]);
  assert.equal(cameras[0].active, false);
  assert.equal(managers[0].modelOpen, false);
  assert.equal(managers[0].running, false);
  assert.equal(cameras[1].active, true);
  assert.equal(managers[1].running, true);
  assert.equal(videos.at(-1), cameras[1].video);
});

test("permission failures release resources and report a retryable state", async t => {
  const cameraGate = deferred();
  const { tracking, cameras, statuses, videos, cameraStarted } = setup(t, { cameraGate });
  const start = tracking.start();
  await cameraStarted.promise;
  cameraGate.reject(Object.assign(new Error("Denied"), { name: "NotAllowedError" }));
  await start;
  assert.match(statuses.at(-1), /permission denied/);
  assert.equal(cameras[0].active, false);
  assert.equal(videos.at(-1), null);
  assert.equal(tracking.session, null);
});

test("ending a camera track releases the model and clears the preview", async t => {
  const { tracking, cameras, managers, videos } = setup(t);
  await tracking.start();
  managers[0].detect();
  cameras[0].track.dispatchEvent(new Event("ended"));
  assert.deepEqual(tracking.getSamples(), []);
  assert.equal(videos.at(-1), null);
  assert.equal(cameras[0].active, false);
  assert.equal(managers[0].modelOpen, false);
});

test("switching while off changes the backend without opening a camera", async t => {
  const { tracking, cameras, managers } = setup(t);
  await tracking.setSource("kinetic");
  assert.equal(cameras.length, 0);
  await tracking.start();
  managers[0].detect();
  assert.deepEqual(tracking.getSamples().map(sample => sample.id), ["Left", "Right"]);
});

test("switching active sources clears stale hands and replaces the preview", async t => {
  const { tracking, cameras, managers, videos } = setup(t);
  await tracking.start();
  managers[0].detect();
  await tracking.setSource("kinetic");
  assert.equal(cameras[0].active, false);
  assert.equal(managers[0].running, false);
  managers[0].detect();
  assert.deepEqual(tracking.getSamples(), []);
  assert.equal(videos.at(-1), cameras[1].video);
  managers[1].detect();
  assert.equal(tracking.getSamples().length, 2);
  assert.equal(tracking.source, "kinetic");
});

test("switching during model initialization cannot revive the old backend", async t => {
  const modelGate = deferred();
  const { tracking, cameras, managers, videos, modelStarted } = setup(t, { modelGate });
  const digit = tracking.start();
  await modelStarted.promise;
  const kinetic = tracking.setSource("kinetic");
  modelGate.resolve();
  await Promise.all([digit, kinetic]);
  assert.equal(tracking.source, "kinetic");
  assert.equal(cameras[0].active, false);
  assert.equal(managers[0].modelOpen, false);
  assert.equal(managers[1].running, true);
  assert.equal(videos.at(-1), cameras[1].video);
});
