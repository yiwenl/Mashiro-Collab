import assert from "node:assert/strict";

export function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 2 ** 32;
  };
}

export function near(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
}

export function assertPosesNear(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((pose, i) => {
    assert.equal(pose.id, expected[i].id);
    pose.position.forEach((value, j) => near(value, expected[i].position[j]));
    pose.quaternion.forEach((value, j) => near(value, expected[i].quaternion[j]));
  });
}
