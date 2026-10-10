import wave from "./generateWavePattern.js";
import dotWave from "./generateDotWavePattern.js";
import hex from "./generateHexPattern.js";
import hexGrid from "./generateHexGridPattern.js";
import flower from "./generateFlowerPattern0.js";
import diamond from "./generateDiamondPattern0.js";
import maze from "./generateMazePattern.js";

// Deliberately include every family, then generate color/shape variants of each.
export const patternGenerators = [wave, dotWave, hex, hexGrid, flower, diamond, maze];
