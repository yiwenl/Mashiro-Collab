const subtract = (a, b) => a.map((value, i) => value - b[i]);
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const pointOnSegment = (a, direction, t) => a.map((value, i) => value + direction[i] * t);

function pointSegmentDistanceSquared(point, a, b) {
  const direction = subtract(b, a);
  const lengthSquared = dot(direction, direction);
  const t = lengthSquared > 0
    ? Math.max(0, Math.min(1, dot(subtract(point, a), direction) / lengthSquared)) : 0;
  const delta = subtract(point, pointOnSegment(a, direction, t));
  return dot(delta, delta);
}

function segmentDistanceSquared(a, b, c, d) {
  // The minimum lies at an endpoint projection, or inside both segments.
  let minimum = Math.min(
    pointSegmentDistanceSquared(a, c, d), pointSegmentDistanceSquared(b, c, d),
    pointSegmentDistanceSquared(c, a, b), pointSegmentDistanceSquared(d, a, b),
  );
  const u = subtract(b, a);
  const v = subtract(d, c);
  const w = subtract(a, c);
  const uu = dot(u, u), uv = dot(u, v), vv = dot(v, v);
  const uw = dot(u, w), vw = dot(v, w);
  const denominator = uu * vv - uv * uv;
  if (denominator > 1e-12 * uu * vv) {
    const s = (uv * vw - vv * uw) / denominator;
    const t = (uu * vw - uv * uw) / denominator;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      const delta = subtract(pointOnSegment(a, u, s), pointOnSegment(c, v, t));
      minimum = Math.min(minimum, dot(delta, delta));
    }
  }
  return minimum;
}

export function enclosingRadius(spec) {
  return spec.kind === "sphere" ? spec.size / 2 : Math.hypot(...spec.dimensions) / 2;
}

export function placementBounds(spec, position) {
  if (spec.kind !== "rod") {
    return { a: position, b: position, radius: enclosingRadius(spec) };
  }
  const [x, y, z, w] = spec.quaternion;
  const axis = [2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)];
  const halfLength = spec.dimensions[1] / 2;
  // A capsule enclosing the whole rotated cuboid, including its square corners.
  return {
    a: pointOnSegment(position, axis, -halfLength),
    b: pointOnSegment(position, axis, halfLength),
    radius: Math.hypot(spec.dimensions[0], spec.dimensions[2]) / 2,
  };
}

export function boundsOverlap(first, second, gap = 0.02) {
  const separation = first.radius + second.radius + gap;
  return segmentDistanceSquared(first.a, first.b, second.a, second.b) < separation ** 2;
}
