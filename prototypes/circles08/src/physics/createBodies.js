// Uniform orientation, stored as x, y, z, w for both cannon and gl-matrix.
function randomQuaternion(rng) {
  const u = rng();
  const a = rng() * Math.PI * 2;
  const b = rng() * Math.PI * 2;
  return [Math.sqrt(1 - u) * Math.sin(a), Math.sqrt(1 - u) * Math.cos(a),
    Math.sqrt(u) * Math.sin(b), Math.sqrt(u) * Math.cos(b)];
}

export function createBodies({ rng, sphereCount, cubeCount, minSize, maxSize, spawnRadius,
  rodCount = 0, rodLength = 50, rodWidth = 0.05 }) {
  if (!Number.isInteger(sphereCount) || !Number.isInteger(cubeCount) || !Number.isInteger(rodCount)
    || sphereCount < 0 || cubeCount < 0 || sphereCount > 16 || cubeCount > 16
    || rodCount < 0 || rodCount > 8
    || ![minSize, maxSize, spawnRadius, rodLength, rodWidth].every(Number.isFinite)
    || minSize <= 0 || maxSize < minSize || spawnRadius <= 0 || rodLength <= 0 || rodWidth <= 0) {
    throw new Error("Invalid object counts, size range or scatter radius.");
  }
  const templates = Array.from({ length: sphereCount + cubeCount + rodCount }, (_, id) => {
    const kind = id < sphereCount ? "sphere" : id < sphereCount + cubeCount ? "cube" : "rod";
    const sampleSize = () => minSize + rng() * (maxSize - minSize);
    let shape;
    if (kind === "sphere") {
      shape = { size: sampleSize() };
    } else if (kind === "rod") {
      const length = rodLength * (0.8 + rng() * 0.4);
      const width = rodWidth * (0.85 + rng() * 0.3);
      shape = { dimensions: [width, length, width] };
    } else {
      shape = { dimensions: [sampleSize(), sampleSize(), sampleSize()] };
    }
    return { id, kind, ...shape, quaternion: randomQuaternion(rng) };
  });
  // Leave space for the full rod, without treating its empty surrounding sphere as solid.
  let radius = templates.reduce((value, spec) => spec.kind === "rod"
    ? Math.max(value, enclosingRadius(spec) * 1.15) : value, spawnRadius);
  for (let round = 0; round < 5; round++, radius *= 1.2) {
    const specs = [];
    const bounds = [];
    for (const template of templates) {
      const bound = enclosingRadius(template);
      let position;
      let acceptedBounds;
      for (let attempt = 0; attempt < 200 && radius >= bound; attempt++) {
        const z = rng() * 2 - 1;
        const theta = rng() * Math.PI * 2;
        const r = Math.cbrt(rng()) * (radius - bound);
        const xy = Math.sqrt(1 - z * z) * r;
        const candidate = [xy * Math.cos(theta), xy * Math.sin(theta), z * r];
        const candidateBounds = placementBounds(template, candidate);
        if (bounds.every(other => !boundsOverlap(candidateBounds, other))) {
          position = candidate;
          acceptedBounds = candidateBounds;
          break;
        }
      }
      if (!position) break;
      specs.push({ ...template, position });
      bounds.push(acceptedBounds);
    }
    if (specs.length === templates.length) return { specs, spawnRadius: radius };
  }
  throw new Error("Objects could not fit. Increase Scatter radius or reduce their size / count.");
}
import { enclosingRadius, placementBounds, boundsOverlap } from "./placementBounds.js";
