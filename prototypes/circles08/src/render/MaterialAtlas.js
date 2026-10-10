import { GL, GLTexture } from "alfrid";
import { getPalette } from "./palettes.js";
import { patternGenerators } from "../patterns/index.js";
import { createCanvas, seededPatternRandom } from "../patterns/helpers.js";

const TILE_SIZE = 256;
const PADDING = 2;
const CELL_SIZE = TILE_SIZE + PADDING * 2;
const COLUMNS = 8;
const ROWS = 4;
const PATTERN_COUNT = 15;

function brightness(hex) {
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrastColor(background, colors) {
  return colors.reduce((best, color) => Math.abs(brightness(color) - brightness(background))
    > Math.abs(brightness(best) - brightness(background)) ? color : best);
}

function writeTile(ctx, tile, index) {
  const x = (index % COLUMNS) * CELL_SIZE + PADDING;
  const y = Math.floor(index / COLUMNS) * CELL_SIZE + PADDING;
  const end = TILE_SIZE - 1;
  ctx.drawImage(tile, x, y);
  // Duplicate edge texels into gutters; linear filtering cannot pick up another material.
  ctx.drawImage(tile, 0, 0, 1, TILE_SIZE, x - PADDING, y, PADDING, TILE_SIZE);
  ctx.drawImage(tile, end, 0, 1, TILE_SIZE, x + TILE_SIZE, y, PADDING, TILE_SIZE);
  ctx.drawImage(tile, 0, 0, TILE_SIZE, 1, x, y - PADDING, TILE_SIZE, PADDING);
  ctx.drawImage(tile, 0, end, TILE_SIZE, 1, x, y + TILE_SIZE, TILE_SIZE, PADDING);
  for (const [sx, sy, dx, dy] of [
    [0, 0, -PADDING, -PADDING], [end, 0, TILE_SIZE, -PADDING],
    [0, end, -PADDING, TILE_SIZE], [end, end, TILE_SIZE, TILE_SIZE],
  ]) ctx.drawImage(tile, sx, sy, 1, 1, x + dx, y + dy, PADDING, PADDING);
}

export default class MaterialAtlas {
  constructor(seed) {
    this.seed = `${seed}:materials`;
    const { canvas, ctx } = createCanvas(COLUMNS * CELL_SIZE, ROWS * CELL_SIZE);
    this.canvas = canvas;
    this.ctx = ctx;
    this.patternCount = PATTERN_COUNT;
  }

  update(paletteName) {
    if (this.texture && this.paletteName === paletteName) return;
    const { colors: [paper, ...colors] } = getPalette(paletteName);
    this.solidCount = colors.length;
    if (1 + this.solidCount + PATTERN_COUNT > COLUMNS * ROWS) {
      throw new Error("The selected palette has too many colors for the material atlas.");
    }
    const rng = seededPatternRandom(this.seed);
    const { ctx } = this;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const { canvas: tile, ctx: tileContext } = createCanvas(TILE_SIZE, TILE_SIZE);

    [paper, ...colors].forEach((color, index) => {
      tileContext.fillStyle = color;
      tileContext.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      writeTile(ctx, tile, index);
    });

    for (let i = 0; i < PATTERN_COUNT; i++) {
      const background = i % 3 === 0 ? paper : colors[(i * 5 + 3) % colors.length];
      const foreground = contrastColor(background, [paper, ...colors]);
      const generate = patternGenerators[i % patternGenerators.length];
      const pattern = generate(TILE_SIZE, TILE_SIZE, 1, foreground, background, rng);
      tileContext.fillStyle = background;
      tileContext.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      tileContext.save();
      tileContext.translate(TILE_SIZE / 2, TILE_SIZE / 2);
      tileContext.rotate((i % 4) * Math.PI / 2);
      tileContext.drawImage(pattern, -TILE_SIZE / 2, -TILE_SIZE / 2);
      tileContext.restore();
      writeTile(ctx, tile, 1 + this.solidCount + i);
    }

    if (this.texture) {
      this.texture.updateTexture(this.canvas);
    } else {
      this.texture = new GLTexture(this.canvas, {
        minFilter: GL.LINEAR, magFilter: GL.LINEAR, mipmap: false, type: GL.UNSIGNED_BYTE,
      });
      this.texture.createTexture(GL);
    }
    this.paletteName = paletteName;
  }

  get tileInfo() { return [TILE_SIZE, PADDING, COLUMNS, ROWS]; }

  dispose() { this.texture?.destroy(); }
}
