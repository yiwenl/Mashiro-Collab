import test from "node:test";
import assert from "node:assert/strict";
import Config from "../src/Config.js";
import { createBodies } from "../src/physics/createBodies.js";
import PhysicsWorld from "../src/physics/PhysicsWorld.js";
import { near, seededRandom, assertPosesNear } from "./helpers.js";

const STEP = 1 / 60;
const sphere = (position, size = 1) => ({
  kind: "sphere", size, position, quaternion: [0, 0, 0, 1],
});
const box = (position, dimensions = [1, 1, 1], angle = 0) => ({
  kind: "cube", dimensions, position,
  quaternion: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
});
const layout = specs => ({ spawnRadius: 4, specs: specs.map((spec, id) => ({ ...spec, id })) });
const defaultLayout = seed => createBodies({ ...Config, rng: seededRandom(seed) });
function world(t, initialLayout, options = {}) {
  const physics = new PhysicsWorld(initialLayout, { ...Config, ...options });
  t.after(() => physics.dispose());
  return physics;
}
function advance(physics, frames, dt = STEP) {
  for (let frame = 0; frame < frames; frame++) physics.advance(dt);
}

test("colliders, mass and orientation match spheres, cuboids and long rods", t => {
  const initial = layout([
    sphere([-2, 0, 0], 2), box([2, 0, 0], [1, 2, 3], Math.PI / 4),
    { ...box([8, 0, 0], [0.05, 50, 0.05], Math.PI / 6), kind: "rod" },
  ]);
  const physics = world(t, initial);
  const [ball, cuboid, rod] = physics.bodies;
  near(ball.shapes[0].radius, 1);
  near(ball.mass, 4 / 3 * Math.PI);
  assert.deepEqual(cuboid.shapes[0].halfExtents.toArray(), [0.5, 1, 1.5]);
  near(cuboid.mass, 6);
  assert.deepEqual(rod.shapes[0].halfExtents.toArray(), [0.025, 25, 0.025]);
  near(rod.mass, 0.125);
  assertPosesNear(physics.getPoses(), initial.specs);
});

test("central attraction produces equal acceleration for different masses", t => {
  const small = world(t, layout([sphere([3, 0, 0], 1)]), { linearDamping: 0 });
  const large = world(t, layout([sphere([3, 0, 0], 2)]), { linearDamping: 0 });
  small.advance(STEP);
  large.advance(STEP);
  near(small.bodies[0].velocity.x, -3 * Config.attraction * STEP);
  near(large.bodies[0].velocity.x, small.bodies[0].velocity.x);
  assertPosesNear(small.getPoses(), large.getPoses());
});

test("the exact center and empty scenes remain finite and stationary", t => {
  const centered = world(t, layout([sphere([0, 0, 0])]));
  const empty = world(t, layout([]));
  advance(centered, 600);
  advance(empty, 600);
  assert.deepEqual(centered.getPoses()[0].position, [0, 0, 0]);
  assert.deepEqual(centered.getPoses()[0].quaternion, [0, 0, 0, 1]);
  assert.deepEqual(empty.getPoses(), []);
});

test("30, 60 and 120 Hz input produce the same fixed-step simulation", t => {
  const poses = [30, 60, 120].map(hz => {
    const physics = world(t, defaultLayout(42));
    advance(physics, hz * 3, 1 / hz);
    return structuredClone(physics.getPoses());
  });
  assertPosesNear(poses[0], poses[1]);
  assertPosesNear(poses[1], poses[2]);
});

test("long frames are capped at five steps without accumulating a catch-up backlog", t => {
  const initial = layout([sphere([3, 0, 0])]);
  const delayed = world(t, initial);
  const reference = world(t, initial);
  for (const dt of [0, -1, NaN, Infinity]) delayed.advance(dt);
  assertPosesNear(delayed.getPoses(), initial.specs);
  delayed.advance(100);
  advance(reference, 5);
  assertPosesNear(delayed.getPoses(), reference.getPoses());
  delayed.advance(STEP);
  reference.advance(STEP);
  assertPosesNear(delayed.getPoses(), reference.getPoses());
});

test("resetClock discards partial time when pausing or returning to the tab", t => {
  const initial = layout([sphere([3, 0, 0])]);
  const physics = world(t, initial);
  physics.advance(STEP / 2);
  physics.resetClock();
  physics.advance(STEP / 2);
  assertPosesNear(physics.getPoses(), initial.specs);
  physics.advance(STEP / 2);
  assert.ok(physics.getPoses()[0].position[0] < 3);
});

test("replay restores the saved layout and repeats the trajectory with current options", t => {
  const initial = defaultLayout(2026);
  const saved = structuredClone(initial);
  const physics = world(t, initial);
  initial.specs[0].position[0] = 999;
  physics.configure({ attraction: 0.5, linearDamping: 0.2, angularDamping: 0.3, restitution: 0.4 });
  advance(physics, 180);
  const firstRun = structuredClone(physics.getPoses());
  const previousWorld = physics.world;
  physics.replay();
  assert.equal(previousWorld.bodies.length, 0);
  assertPosesNear(physics.getPoses(), saved.specs);
  near(physics.contact.restitution, 0.4);
  physics.bodies.forEach(body => {
    near(body.linearDamping, 0.2);
    near(body.angularDamping, 0.3);
  });
  advance(physics, 180);
  assertPosesNear(physics.getPoses(), firstRun);
});

test("reading poses repeatedly for rendering does not advance or mutate the simulation", t => {
  const physics = world(t, defaultLayout(1));
  advance(physics, 60);
  const poses = structuredClone(physics.getPoses());
  const velocities = physics.bodies.map(body => body.velocity.toArray());
  for (let i = 0; i < 20; i++) assertPosesNear(physics.getPoses(), poses);
  assert.deepEqual(physics.bodies.map(body => body.velocity.toArray()), velocities);
});

const collisionCases = [
  ["sphere / sphere", sphere([-2, 0, 0]), sphere([2, 0, 0])],
  ["sphere / rotated cuboid", sphere([-2, 0, 0]), box([2, 0, 0], [1.2, 0.8, 1], Math.PI / 4)],
  ["rotated cuboid / cuboid", box([-2, 0, 0], [1.2, 0.8, 1], Math.PI / 4), box([2, 0, 0])],
];
for (const [name, left, right] of collisionCases) {
  test(`${name} collides and separates instead of passing through`, t => {
    const physics = world(t, layout([left, right]), {
      attraction: 0, linearDamping: 0, angularDamping: 0, restitution: 1,
    });
    physics.bodies[0].velocity.set(2, 0, 0);
    physics.bodies[1].velocity.set(-2, 0, 0);
    let contacts = 0;
    physics.bodies[0].addEventListener("collide", () => contacts++);
    let closest = Infinity;
    for (let frame = 0; frame < 120; frame++) {
      physics.advance(STEP);
      const [a, b] = physics.bodies;
      closest = Math.min(closest, a.position.distanceTo(b.position));
      assert.ok(a.position.x < b.position.x, "bodies crossed through each other");
    }
    const [a, b] = physics.bodies;
    assert.ok(contacts > 0);
    assert.ok(b.velocity.x - a.velocity.x > 0, "bodies should move apart after impact");
    assert.ok(a.position.distanceTo(b.position) > closest + 0.5);
    if (name !== "sphere / sphere") {
      assert.ok(physics.bodies.some(body => body.angularVelocity.length() > 0.01),
        "off-center contact should produce rotation");
    }
  });
}

test("three seeded scenes stay finite and gather toward the center over 60 seconds", t => {
  for (const seed of [1, 42, 2026]) {
    const physics = world(t, defaultLayout(seed));
    const meanRadius = () => physics.bodies.reduce((sum, body) => sum + body.position.length(), 0)
      / physics.bodies.length;
    const initialRadius = meanRadius();
    for (let frame = 0; frame < 3600; frame++) {
      physics.advance(STEP);
      for (const body of physics.bodies) {
        assert.ok([...body.position.toArray(), ...body.quaternion.toArray()].every(Number.isFinite));
        assert.ok(body.position.length() < physics.layout.spawnRadius * 2, "body escaped the cluster");
      }
    }
    assert.ok(meanRadius() < initialRadius, "attraction should reduce the average distance to center");
  }
});

test("dispose releases every body and is safe to repeat", t => {
  const physics = world(t, defaultLayout(1));
  const previousWorld = physics.world;
  physics.dispose();
  physics.dispose();
  assert.equal(previousWorld.bodies.length, 0);
  assert.equal(physics.world, null);
  assert.deepEqual(physics.getPoses(), []);
});
