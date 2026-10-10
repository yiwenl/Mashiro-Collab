#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uAccumulation;
uniform sampler2D uObject;
uniform vec3 uCode;
out vec4 fragColor;

void main() {
  ivec2 pixel = ivec2(gl_FragCoord.xy);
  // Count each complete object once, independently of shading or surface triangles.
  float covered = step(0.5, texelFetch(uObject, pixel, 0).a);
  vec4 accumulated = texelFetch(uAccumulation, pixel, 0);
  vec3 combination = accumulated.rgb + uCode * covered;
  // White paper flips black/white once per object: the original unshaded difference.
  fragColor = vec4(combination, abs(accumulated.a - covered));
}
