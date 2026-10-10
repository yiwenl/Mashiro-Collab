#version 300 es
precision highp float;
uniform sampler2D uDifference;
uniform vec2 uResolution;
uniform vec2 uOffset;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float center = texture(uDifference, uv).r;
  // Compare eight directions. Linear filtering gives fractional-pixel coverage.
  const vec2 directions[8] = vec2[8](
    vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0),
    vec2(0.707107, 0.707107), vec2(-0.707107, 0.707107),
    vec2(0.707107, -0.707107), vec2(-0.707107, -0.707107)
  );
  float edge = 0.0;
  vec2 radiusPixels = uOffset * uResolution;
  int steps = max(1, int(ceil(max(radiusPixels.x, radiusPixels.y))));
  // Include the path to each offset: endpoint-only sampling can jump over thin rods.
  for (int stepIndex = 1; stepIndex <= steps; stepIndex++) {
    vec2 offset = uOffset * (float(stepIndex) / float(steps));
    for (int i = 0; i < 8; i++) {
      edge = max(edge, abs(center - texture(uDifference, uv + directions[i] * offset).r));
    }
  }
  fragColor = vec4(vec3(0.08), edge);
}
