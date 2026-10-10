// Native pose landmarks are normalized image coordinates, not compatibility pixels/metres.
const HAND_POINTS = { Left: [15, 17, 19, 21], Right: [16, 18, 20, 22] };

export function skeletonHandSamples(detail, { minVisibility = 0.5 } = {}) {
  const landmarks = detail?.result?.landmarks?.[0];
  if (!landmarks) return [];
  const usable = point => point && [point.x, point.y, point.z, point.visibility].every(Number.isFinite)
    && point.visibility >= minVisibility
    && (point.presence === undefined || (Number.isFinite(point.presence) && point.presence >= minVisibility));
  return Object.entries(HAND_POINTS).flatMap(([id, indices]) => {
    // A visible wrist is required; missing/occluded fingertips fall back to the wrist.
    if (!usable(landmarks[indices[0]])) return [];
    const points = indices.map(index => landmarks[index]).filter(usable);
    const sum = points.reduce((sum, p) => [sum[0] + p.x, sum[1] + p.y, sum[2] + p.z], [0, 0, 0]);
    return [{ id, point: sum.map(value => value / points.length) }];
  });
}
