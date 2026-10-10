#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uSource;
out vec4 fragColor;

void main() {
  float difference = texelFetch(uSource, ivec2(gl_FragCoord.xy), 0).a;
  fragColor = vec4(vec3(difference), 1.0);
}
