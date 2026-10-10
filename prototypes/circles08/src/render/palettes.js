import solarPalettes from "./solarPalettes.js";

// Entry zero is paper; the rest color object combinations.
export const palettes = {
  drawing: {
    name: "Coral / sage",
    colors: ["#EFE4BF", "#3F4139", "#DF6247", "#D9A14C", "#B0C2BB", "#6F9693", "#AAB58D", "#9B899E"],
  },
  print: {
    name: "Rust / ochre",
    colors: ["#E9DCB5", "#454B44", "#AF4E31", "#CB912D", "#BBC6BC", "#6E8784", "#989D63", "#A99AA9"],
  },
  textile: {
    name: "Red / gold / cyan",
    colors: ["#F0E5D5", "#181917", "#B70E20", "#E3AC23", "#B8D7E1", "#159FC4", "#818B35", "#795982"],
  },
};

const toHex = rgb => `#${rgb.map(value => value.toString(16).padStart(2, "0")).join("")}`;
const luminance = rgb => rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;

solarPalettes.forEach((palette, index) => {
  const colors = palette.theme.flat();
  const lightest = colors.reduce((a, b) => luminance(a) > luminance(b) ? a : b);
  const paper = lightest.map(value => Math.round(value * 0.15 + 255 * 0.85));
  palettes[`solar-${index}`] = {
    name: `isoGrid · ${palette.name}`,
    colors: [toHex(paper), ...colors.map(toHex)],
  };
});

export function getPalette(name) {
  return palettes[name] ?? palettes.drawing;
}
