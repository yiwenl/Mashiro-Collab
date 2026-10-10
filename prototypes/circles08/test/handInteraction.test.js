import test from "node:test";
import assert from "node:assert/strict";
import { mat4, vec3 } from "gl-matrix";
import Config from "../src/Config.js";
import PhysicsWorld from "../src/physics/PhysicsWorld.js";
import { palmSamples, mapHandToScene } from "../src/interaction/handMapping.js";
import { skeletonHandSamples } from "../src/interaction/kineticMapping.js";
import { near } from "./helpers.js";

const STEP = 1 / 60;
const digitConfig = Config.tracking.digit;
const view = mat4.lookAt(mat4.create(), [6, 4, 12], [0, 0, 0], [0, 1, 0]);
const projection = mat4.perspective(mat4.create(), Math.PI / 4, 4 / 3, 0.1, 200);
const landmarks = (x, y, z) => Array.from({ length: 21 }, () => ({ x, y, z }));
const target = position => [{ id: "Left", position }];

test("palm samples retain hand identity without modifying detector results", () => {
  const result = { landmarks: [landmarks(0.2, 0.3, -0.1), landmarks(0.8, 0.6, 0.1)],
    handedness: [[{ categoryName: "Right" }], [{ categoryName: "Left" }]] };
  const original = structuredClone(result);
  const samples = palmSamples(result);
  assert.deepEqual(samples.map(sample => sample.id), ["Right", "Left"]);
  samples[0].point.forEach((value, i) => near(value, [0.2, 0.3, -0.1][i]));
  assert.deepEqual(result, original);
  result.landmarks[0][9].x = NaN;
  assert.deepEqual(palmSamples(result).map(sample => sample.id), ["Left"]);
  assert.deepEqual(palmSamples({ landmarks: [] }), []);
});

test("hand mapping projects back to mirrored, scaled screen coordinates at relative depth", () => {
  const centered = mapHandToScene([0.5, 0.5, 0], view, projection, digitConfig);
  centered.forEach(value => near(value, 0, 2e-6));
  for (const mirror of [true, false]) {
    const config = { ...digitConfig, handMirror: mirror, handScale: 1.5, handDepthOffset: 2 };
    const world = mapHandToScene([0.2, 0.7, -0.25], view, projection, config);
    const camera = vec3.transformMat4(vec3.create(), world, view);
    const screen = vec3.transformMat4(vec3.create(), camera, projection);
    near(screen[0], (mirror ? 0.6 : -0.6) * 1.5, 2e-6);
    near(screen[1], -0.4 * 1.5, 2e-6);
    near(camera[2], -11, 2e-6);
  }
});

test("depth zero fixes the plane and extreme relative z stays within the depth limit", () => {
  const depth = (z, config = digitConfig) => vec3.transformMat4(vec3.create(),
    mapHandToScene([0.5, 0.5, z], view, projection, config), view)[2];
  near(depth(-100), -8, 2e-6);
  near(depth(100), -20, 2e-6);
  near(depth(-100, { ...digitConfig, handDepthScale: 0 }), -14, 2e-6);
});

test("Kinetic uses native image hands rather than compatibility pixels or world metres", () => {
  const points = Array.from({ length: 33 }, (_, index) => ({ x: index / 40, y: 0.4,
    z: -0.2, visibility: 0.9, presence: 0.9 }));
  const detail = { result: { landmarks: [points] }, poses: [{ keypoints: [{ x: 999 }] }] };
  const before = structuredClone(detail);
  const samples = skeletonHandSamples(detail);
  assert.deepEqual(samples.map(sample => sample.id), ["Left", "Right"]);
  near(samples[0].point[0], 18 / 40);
  near(samples[1].point[0], 19 / 40);
  near(samples[0].point[2], -0.2);
  assert.deepEqual(detail, before);
});

test("Kinetic drops occluded wrists and falls back to a visible wrist for missing fingertips", () => {
  const points = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.1 }));
  points[15] = { x: 0.3, y: 0.4, z: -0.2, visibility: 0.9, presence: 0.9 };
  const detail = { result: { landmarks: [points] } };
  assert.deepEqual(skeletonHandSamples(detail), [{ id: "Left", point: [0.3, 0.4, -0.2] }]);
  points[15].presence = 0.2;
  assert.deepEqual(skeletonHandSamples(detail), []);
  assert.deepEqual(skeletonHandSamples({ result: { landmarks: [] } }), []);
});

function world(t, kind) {
  const physics = new PhysicsWorld({ spawnRadius: 4, specs: kind ? [{ id: 0, kind,
    size: 1, dimensions: kind === "rod" ? [0.05, 50, 0.05] : [1, 1, 1],
    position: [0, 0, 0], quaternion: [0, 0, 0, 1] }] : [] },
  { ...Config, attraction: 0, linearDamping: 0, angularDamping: 0 });
  t.after(() => physics.dispose());
  return physics;
}

for (const kind of ["sphere", "cube", "rod"]) {
  test(`a moving hand pushes a ${kind} without entering render poses`, t => {
    const physics = world(t, kind);
    let contacts = 0;
    physics.bodies[0].addEventListener("collide", () => contacts++);
    for (let frame = 0; frame < 180; frame++) {
      physics.setHandTargets(target([-2 + frame / 60, 0, 0]), 0.75);
      physics.advance(STEP);
    }
    assert.ok(contacts > 0);
    assert.ok(physics.bodies[0].position.x > 0.5, "hand should push the body to the right");
    assert.equal(physics.getPoses().length, 1);
    assert.equal(physics.layout.specs.length, 1);
    assert.equal(physics.world.bodies.length, 2);
  });
}

test("markers read actual limited movement, and caller cannot mutate collider positions", t => {
  const physics = world(t);
  physics.setHandTargets(target([0, 0, 0]), 0.15);
  physics.setHandTargets(target([100, 0, 0]), 0.15);
  physics.advance(STEP);
  const positions = physics.getHandPositions();
  assert.ok(positions[0][0] > 0 && positions[0][0] <= 0.075 + 1e-9);
  positions[0][0] = 999;
  assert.ok(physics.getHandPositions()[0][0] < 1);
});

test("hand radius updates contact bounds; loss, replay and disposal remove hands", t => {
  const physics = world(t, "sphere");
  physics.setHandTargets(target([3, 0, 0]), 0.25);
  const hand = physics.world.bodies.find(body => !physics.bodies.includes(body));
  physics.setHandTargets(target([3, 0, 0]), 1.5);
  near(hand.boundingRadius, 1.5);
  physics.setHandTargets([], 1.5);
  assert.equal(physics.world.bodies.length, 1);
  assert.deepEqual(physics.getHandPositions(), []);
  physics.setHandTargets(target([3, 0, 0]), 1);
  physics.replay();
  assert.equal(physics.world.bodies.length, 1);
  assert.deepEqual(physics.getHandPositions(), []);
  physics.setHandTargets(target([3, 0, 0]), 1);
  const previousWorld = physics.world;
  physics.dispose();
  assert.equal(previousWorld.bodies.length, 0);
});
