precision highp float;
varying vec3 vNormal;
uniform float uShading;

void main() {
  vec3 light = normalize(vec3(-0.5, 0.8, 1.0));
  float diffuse = 0.22 + 0.78 * max(dot(normalize(vNormal), light), 0.0);
  float shade = mix(1.0, diffuse, uShading);
  gl_FragColor = vec4(vec3(shade), 1.0);
}
