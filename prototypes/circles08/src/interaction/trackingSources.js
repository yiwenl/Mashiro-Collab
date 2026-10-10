import { palmSamples } from "./handMapping.js";
import { skeletonHandSamples } from "./kineticMapping.js";

export const trackingSources = {
  digit: {
    label: "Digit", event: "hand-detected", prompt: "show your hands",
    create: library => new library.HandLandmarkManager({ numHands: 2, mirror: false }),
    samples: palmSamples,
  },
  kinetic: {
    label: "Kinetic", event: "skeleton-detected", prompt: "show your upper body and hands",
    create: library => new library.SkeletonManager({ modelType: "full", mirror: false }),
    samples: skeletonHandSamples,
  },
};

export async function loadTrackingSource(source) {
  if (source === "digit") return Promise.all([import("digit"), import("digit-camera")]);
  if (source === "kinetic") {
    const library = await import("kinetic");
    return [library, library];
  }
  throw new Error(`Unknown tracking source: ${source}`);
}
