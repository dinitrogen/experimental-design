import { randomInt } from "node:crypto";

export const GUIDE_THEMES = [
  { id: "dissolving", independentVar: "Water temperature (°C)", dependentVar: "Dissolving time (s)", context: "Dissolve the same amount of sugar in equal volumes of water at different temperatures." },
  { id: "insulation", independentVar: "Insulation layers (layers)", dependentVar: "Water temperature decrease (°C)", context: "Compare how layers of the same insulating material affect the cooling of equal amounts of warm water over a fixed time." },
  { id: "pendulum", independentVar: "Pendulum length (cm)", dependentVar: "Time for ten swings (s)", context: "Measure the time for ten swings of the same small pendulum bob at different string lengths." },
  { id: "absorption", independentVar: "Paper towel layers (layers)", dependentVar: "Water absorbed (mL)", context: "Compare water absorbed by equal-sized stacks of the same paper towel with different numbers of layers." },
  { id: "light", independentVar: "Distance from lamp (cm)", dependentVar: "Light intensity (lux)", context: "Measure the light intensity at different distances from the same lamp." },
  { id: "evaporation", independentVar: "Exposed water surface area (cm²)", dependentVar: "Water evaporated (mL)", context: "Compare water evaporation from containers with different exposed surface areas over the same time." },
  { id: "springs", independentVar: "Hanging mass (g)", dependentVar: "Spring extension (cm)", context: "Measure the extension of a small spring under different safe hanging masses." },
  { id: "filters", independentVar: "Number of coffee filters (filters)", dependentVar: "Fall time (s)", context: "Measure how long nested coffee filters take to fall from the same height." },
  { id: "parachute", independentVar: "Parachute diameter (cm)", dependentVar: "Fall time (s)", context: "Compare fall times for small paper parachutes of different diameters carrying the same load." },
  { id: "friction", independentVar: "Load mass (g)", dependentVar: "Force needed to start sliding (N)", context: "Measure the force needed to start sliding the same block with different loads over the same surface." },
  { id: "solution", independentVar: "Salt concentration (g per 100 mL)", dependentVar: "Solution density (g/mL)", context: "Compare the density of salt solutions prepared at different concentrations." },
  { id: "ball-bounce", independentVar: "Drop height (cm)", dependentVar: "Bounce height (cm)", context: "Measure the bounce height of the same ball dropped from different heights onto the same surface." },
] as const;

export type GuideTheme = (typeof GUIDE_THEMES)[number];

export function selectGuideTheme(lastId: string | undefined, choose = randomInt): GuideTheme {
  const choices = GUIDE_THEMES.filter((theme) => theme.id !== lastId);
  return choices[choose(choices.length)];
}

export function isGuideThemeId(id: string): boolean {
  return GUIDE_THEMES.some((theme) => theme.id === id);
}
