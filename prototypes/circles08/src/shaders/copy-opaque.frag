#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uSource;
out vec4 fragColor;

void main() {
  // Accumulation alpha stores the black/white difference, not display transparency.
  fragColor = vec4(texelFetch(uSource, ivec2(gl_FragCoord.xy), 0).rgb, 1.0);
}
