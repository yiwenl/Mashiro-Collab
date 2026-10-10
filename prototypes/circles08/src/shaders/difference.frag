precision highp float;
varying vec2 vTextureCoord;
uniform sampler2D uAccumulation;
uniform sampler2D uObject;

void main() {
  vec4 accumulated = texture2D(uAccumulation, vTextureCoord);
  vec4 object = texture2D(uObject, vTextureCoord);
  vec3 color = mix(accumulated.rgb, abs(accumulated.rgb - object.rgb), object.a);
  // Keep a pure binary silhouette in alpha, even when the visible fill is shaded.
  gl_FragColor = vec4(color, abs(accumulated.a - step(0.5, object.a)));
}
