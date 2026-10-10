#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
uniform sampler2D uCombinations;
uniform sampler2D uMaterials;
uniform vec4 uTileInfo; // content size, padding, columns, rows
uniform int uSolidCount;
uniform int uPatternCount;
uniform float uPatternAmount;
uniform vec3 uRodMask;
uniform float uPatternScale;
uniform vec2 uPixelRatio;
uniform vec2 uViewport;
out vec4 fragColor;

uint hashCombination(uint value) {
  value ^= value >> 16u;
  value *= 0x7feb352du;
  value ^= value >> 15u;
  value *= 0x846ca68bu;
  return value ^ (value >> 16u);
}

void main() {
  // R/G retain the first 32 objects; B adds up to eight rods without losing any bits.
  uvec3 halves = uvec3(round(texelFetch(uCombinations, ivec2(gl_FragCoord.xy), 0).rgb));
  uint combination = halves.x | (halves.y << 16u);
  bool empty = combination == 0u && halves.z == 0u;
  uint colorHash = hashCombination(combination ^ hashCombination(halves.z));
  uint selectionHash = hashCombination(colorHash ^ 0x9e3779b9u);
  float choice = float(selectionHash & 65535u) / 65536.0;
  // Any region containing a rod stays solid, including intersections with other objects.
  bool containsRod = any(notEqual(halves & uvec3(uRodMask), uvec3(0u)));
  bool usePattern = !empty && !containsRod && choice < uPatternAmount;
  int index = empty ? 0 : 1 + int(colorHash % uint(uSolidCount));
  if (usePattern) index = 1 + uSolidCount + int(selectionHash % uint(uPatternCount));

  // Screen-space CSS pixels: density stays constant through resize and 1.5x rendering.
  vec2 screenPixel = vec2(gl_FragCoord.x, uViewport.y - gl_FragCoord.y) / uPixelRatio;
  vec2 tileUV = screenPixel / uPatternScale;
  // Mirror each tile independently to avoid a discontinuity at repeated tile edges.
  tileUV = 1.0 - abs(fract(tileUV * 0.5) * 2.0 - 1.0);
  float cellSize = uTileInfo.x + 2.0 * uTileInfo.y;
  vec2 cell = vec2(mod(float(index), uTileInfo.z), floor(float(index) / uTileInfo.z));
  vec2 atlasPixel = cell * cellSize + uTileInfo.y + 0.5 + tileUV * (uTileInfo.x - 1.0);
  vec2 atlasUV = atlasPixel / (uTileInfo.zw * cellSize);
  // Canvas sources are uploaded with UNPACK_FLIP_Y_WEBGL.
  atlasUV.y = 1.0 - atlasUV.y;
  fragColor = texture(uMaterials, atlasUV);
}
