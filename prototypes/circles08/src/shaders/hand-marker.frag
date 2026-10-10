precision highp float;
uniform float uSize;

void main() {
  float radius = length(gl_PointCoord * 2.0 - 1.0);
  float aa = 2.0 / uSize;
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, radius);
  if (alpha <= 0.0) discard;
  vec3 color = mix(vec3(1.0), vec3(0.12), smoothstep(0.76 - aa, 0.76 + aa, radius));
  color = mix(vec3(0.95, 0.18, 0.32), color, smoothstep(0.48 - aa, 0.48 + aa, radius));
  gl_FragColor = vec4(color, alpha);
}
