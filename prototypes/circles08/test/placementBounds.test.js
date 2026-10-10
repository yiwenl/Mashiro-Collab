import test from "node:test";
import assert from "node:assert/strict";
import { placementBounds, boundsOverlap } from "../src/physics/placementBounds.js";
import { near } from "./helpers.js";

const capsule = (a, b, radius = 0.05) => ({ a, b, radius });
const horizontal = capsule([-25, 0, 0], [25, 0, 0]);

test("crossing and skew rods detect interior contacts far from their endpoints", () => {
  assert.equal(boundsOverlap(horizontal, capsule([0, -25, 0], [0, 25, 0])), true);
  assert.equal(boundsOverlap(horizontal, capsule([0, -25, 0.1], [0, 25, 0.1])), true);
  assert.equal(boundsOverlap(horizontal, capsule([0, -25, 0.2], [0, 25, 0.2])), false);
});

test("parallel and nearly parallel rods keep the requested clearance", () => {
  for (const drift of [0, 1e-8]) {
    assert.equal(boundsOverlap(horizontal, capsule([-20, 0.11, 0], [20, 0.11 + drift, 0])), true);
    assert.equal(boundsOverlap(horizontal, capsule([-20, 0.13, 0], [20, 0.13 + drift, 0])), false);
  }
});

test("rod tips and sphere bounds use the closest point on the finite segment", () => {
  assert.equal(boundsOverlap(horizontal, capsule([25.1, 0, 0], [30, 0, 0])), true);
  assert.equal(boundsOverlap(horizontal, capsule([25.2, 0, 0], [30, 0, 0])), false);
  assert.equal(boundsOverlap(horizontal, capsule([0, 0.11, 0], [0, 0.11, 0])), true);
  assert.equal(boundsOverlap(horizontal, capsule([0, 0.13, 0], [0, 0.13, 0])), false);
  assert.equal(boundsOverlap(horizontal, capsule([25.2, 0, 0], [25.2, 0, 0])), false);
});

test("capsule endpoints follow rod rotation and enclose the square cross section", () => {
  const rod = { kind: "rod", dimensions: [0.06, 50, 0.08],
    quaternion: [0, 0, Math.SQRT1_2, Math.SQRT1_2] };
  const bounds = placementBounds(rod, [1, 2, 3]);
  [26, 2, 3].forEach((value, i) => near(bounds.a[i], value));
  [-24, 2, 3].forEach((value, i) => near(bounds.b[i], value));
  near(bounds.radius, 0.05);
});
