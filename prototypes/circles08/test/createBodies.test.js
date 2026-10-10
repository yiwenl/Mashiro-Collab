import test from "node:test";
import assert from "node:assert/strict";
import Config from "../src/Config.js";
import { createBodies } from "../src/physics/createBodies.js";
import { placementBounds, boundsOverlap } from "../src/physics/placementBounds.js";
import { near, seededRandom } from "./helpers.js";

const generate = (seed = 1, options = {}) => createBodies({
  ...Config, rodCount: 0, ...options, rng: seededRandom(seed),
});
const bound = spec => spec.kind === "sphere"
  ? spec.size / 2 : Math.hypot(...spec.dimensions) / 2;

test("the same seed reproduces every shape, position and orientation", () => {
  assert.deepEqual(generate(123), generate(123));
  assert.notDeepEqual(generate(123), generate(124));
});

test("sphere diameters and independent cuboid sides stay in the requested range", () => {
  const { specs } = generate(42, { minSize: 0.3, maxSize: 4 });
  assert.equal(specs.length, 12);
  assert.equal(specs.filter(spec => spec.kind === "sphere").length, 6);
  specs.forEach((spec, i) => {
    assert.equal(spec.id, i);
    const sizes = spec.kind === "sphere" ? [spec.size] : spec.dimensions;
    assert.equal(sizes.length, spec.kind === "sphere" ? 1 : 3);
    sizes.forEach(size => assert.ok(size >= 0.3 && size <= 4));
    if (spec.kind === "cube") assert.equal(new Set(sizes).size, 3);
    near(Math.hypot(...spec.quaternion), 1);
  });
});

test("all rotated shapes fit inside the scatter radius without initial overlaps", () => {
  for (const seed of [1, 42, 2026]) {
    for (const options of [{}, { maxSize: 4 }, { sphereCount: 16, cubeCount: 16 }]) {
      const { specs, spawnRadius } = generate(seed, options);
      assert.ok(spawnRadius <= Config.spawnRadius * 1.2 ** 4 + 1e-9);
      specs.forEach((spec, i) => {
        assert.ok(Math.hypot(...spec.position) + bound(spec) <= spawnRadius + 1e-9);
        specs.slice(0, i).forEach(other => {
          const distance = Math.hypot(...spec.position.map((v, j) => v - other.position[j]));
          assert.ok(distance >= bound(spec) + bound(other) + 0.02 - 1e-9);
        });
      });
    }
  }
});

test("empty scenes and fixed-size objects are supported", () => {
  assert.deepEqual(generate(1, { sphereCount: 0, cubeCount: 0 }), {
    specs: [], spawnRadius: Config.spawnRadius,
  });
  const { specs } = generate(1, { minSize: 1, maxSize: 1, sphereCount: 1, cubeCount: 1 });
  assert.equal(specs[0].size, 1);
  assert.deepEqual(specs[1].dimensions, [1, 1, 1]);
});

test("invalid counts, sizes and scatter radii are rejected", () => {
  for (const options of [
    { sphereCount: -1 }, { sphereCount: 17 }, { sphereCount: 1.5 },
    { cubeCount: -1 }, { cubeCount: 17 }, { cubeCount: NaN },
    { minSize: 0 }, { minSize: 2 }, { maxSize: Infinity }, { minSize: NaN },
    { spawnRadius: 0 }, { spawnRadius: Infinity },
  ]) assert.throws(() => generate(1, options), /Invalid/);
});

test("placement retries are bounded and never silently omit objects", () => {
  let calls = 0;
  assert.throws(() => createBodies({
    ...Config, sphereCount: 2, cubeCount: 0, rodCount: 0, minSize: 1, maxSize: 1,
    rng: () => {
      assert.ok(++calls <= 3100, "placement exceeded its finite retry budget");
      return 0.5;
    },
  }), /could not fit/);
  assert.throws(() => generate(1, {
    sphereCount: 0, cubeCount: 1, minSize: 20, maxSize: 20, spawnRadius: 1,
  }), /could not fit/);
});

test("long rods have reproducible dimensions and normalized random orientations", () => {
  const options = { rodCount: 4, rodLength: 50, rodWidth: 0.05 };
  const initial = generate(2026, options);
  assert.deepEqual(initial, generate(2026, options));
  const rods = initial.specs.filter(spec => spec.kind === "rod");
  assert.equal(rods.length, 4);
  for (const rod of rods) {
    const [width, length, depth] = rod.dimensions;
    assert.ok(length >= 40 && length <= 60);
    assert.ok(width >= 0.0425 && width <= 0.0575);
    near(width, depth);
    near(Math.hypot(...rod.quaternion), 1);
  }
  assert.equal(new Set(rods.map(rod => rod.quaternion.join(","))).size, rods.length);
});

test("40 mixed objects with long rods fit without overlapping placement bounds", () => {
  for (const seed of [1, 42, 2026]) {
    const { specs, spawnRadius } = generate(seed, {
      sphereCount: 16, cubeCount: 16, rodCount: 8, rodLength: 50,
    });
    assert.equal(specs.length, 40);
    const bounds = specs.map(spec => placementBounds(spec, spec.position));
    specs.forEach((spec, i) => {
      assert.equal(spec.id, i);
      assert.ok(Math.hypot(...spec.position) + bound(spec) <= spawnRadius + 1e-9);
      for (let j = 0; j < i; j++) {
        assert.equal(boundsOverlap(bounds[i], bounds[j]), false, `overlap: ${i}, ${j}`);
      }
    });
  }
});

test("rod-only scenes are supported and invalid rod settings are rejected", () => {
  const { specs } = generate(42, { sphereCount: 0, cubeCount: 0, rodCount: 8 });
  assert.equal(specs.length, 8);
  assert.ok(specs.every(spec => spec.kind === "rod"));
  for (const options of [
    { rodCount: -1 }, { rodCount: 9 }, { rodCount: 0.5 }, { rodCount: NaN },
    { rodLength: 0 }, { rodLength: Infinity }, { rodWidth: 0 }, { rodWidth: NaN },
  ]) assert.throws(() => generate(1, options), /Invalid/);
});
