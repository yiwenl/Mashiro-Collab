import { mat4, vec3 } from "gl-matrix";

const PALM_POINTS = [0, 5, 9, 13, 17];

export function palmSamples(result) {
  const used = new Set();
  return (result?.landmarks ?? []).slice(0, 2).flatMap((landmarks, index) => {
    const points = PALM_POINTS.map(i => landmarks[i]);
    if (!points.every(point => point && [point.x, point.y, point.z].every(Number.isFinite))) return [];
    const label = result.handedness?.[index]?.[0]?.categoryName;
    const id = label === "Left" || label === "Right" ? label : `hand-${index}`;
    // Avoid moving one collider twice if the detector assigns the same label to both hands.
    if (used.has(id)) return [];
    used.add(id);
    const point = points.reduce((sum, p) => [sum[0] + p.x, sum[1] + p.y, sum[2] + p.z], [0, 0, 0]);
    return [{ id, point: point.map(value => value / points.length) }];
  });
}

export function mapHandToScene(point, viewMatrix, projectionMatrix, config, distance = 14) {
  const [x, y, z] = point;
  // Both sources use relative image z, with independent depth calibration per source.
  const depth = Math.max(-6, Math.min(6, config.handDepthOffset - z * config.handDepthScale));
  const viewDistance = Math.max(1, distance - depth);
  const mirroredX = config.handMirror ? 1 - x : x;
  const local = [
    (mirroredX * 2 - 1) * viewDistance / projectionMatrix[0] * config.handScale,
    (1 - y * 2) * viewDistance / projectionMatrix[5] * config.handScale,
    -viewDistance,
  ];
  const inverseView = mat4.invert(mat4.create(), viewMatrix);
  return Array.from(vec3.transformMat4(vec3.create(), local, inverseView));
}
