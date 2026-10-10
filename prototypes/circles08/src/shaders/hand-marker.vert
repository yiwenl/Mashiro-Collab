precision highp float;
attribute vec3 aVertexPosition;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uPosition;
uniform float uSize;

void main() {
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(uPosition + aVertexPosition, 1.0);
  gl_PointSize = uSize;
}
