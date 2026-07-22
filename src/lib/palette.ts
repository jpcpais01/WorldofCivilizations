export const REGION_PALETTE = [
  "#e63946", // red
  "#f4a261", // orange
  "#e9c46a", // yellow
  "#2a9d8f", // teal
  "#264653", // dark slate
  "#6a4c93", // purple
  "#1982c4", // blue
  "#8ac926", // green
  "#ff6b6b", // coral
  "#4d908e", // muted teal
  "#f3722c", // burnt orange
  "#577590", // steel blue
  "#b5838d", // dusty rose
  "#43aa8b", // sea green
  "#9d4edd", // violet
  "#ffca3a", // gold
];

export const DEFAULT_BORDER_COLOR = "#000000";

export function nextPaletteColor(usedColors: string[]): string {
  const unused = REGION_PALETTE.find((c) => !usedColors.includes(c));
  if (unused) return unused;
  // All base colors used - pick a random one, still looks fine.
  return REGION_PALETTE[Math.floor(Math.random() * REGION_PALETTE.length)];
}
