// Adapted from isoGrid/src/patterns/generateDiamondPattern0.js for small cached material tiles.
import { tileSize, pixelRatio, createCanvas, random, randomInt } from "./helpers.js";
import { tileHex, tileDiamond } from "./tileUtils.js";
const generateDiamondPattern = (width, height, mul, lineColor, bgColor, rng) => {
  const { canvas, ctx: ctxPattern } = createCanvas(width, height);

  const { PI } = Math;
  const ts = (tileSize * mul * pixelRatio) / 2;
  const { canvas: canvasTile, ctx } = createCanvas(ts, ts);
  ctx.fillStyle = bgColor;
  ctx.translate(ts / 2, ts / 2);
  ctx.rotate(PI / 4);
  const r = ts * 0.65;
  ctx.fillRect(-r / 2, -r / 2, r, r);
  let s = r * random(rng, 0.2, 0.5);
  let t = r * random(rng, 0.2, 0.3);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2 * pixelRatio * mul;
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.strokeRect(-s / 2 + t, -s / 2 + t, s, s);
  ctx.strokeRect(-s / 2 - t, -s / 2 + t, s, s);
  ctx.strokeRect(-s / 2 - t, -s / 2 - t, s, s);
  ctx.strokeRect(-s / 2 + t, -s / 2 - t, s, s);

  ctxPattern.fillStyle = lineColor;
  ctxPattern.fillRect(0, 0, width, height);

  tileDiamond(ctxPattern, canvasTile);

  return canvas;
};

export default generateDiamondPattern;
