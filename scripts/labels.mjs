// Height range labels on walls, shown on the Walls layer.

import { MOD_ID } from "./constants.mjs";
import { getWallHeight } from "./heights.mjs";

const LABEL = Symbol(`${MOD_ID}.label`);

/**
 * The label settings. Client settings build a new Setting document on every read, and this runs for every wall
 * refresh. Dropped in refreshAllLabels, which both settings call when they change.
 * @type {{show: boolean, minLength: number}|null}
 */
let labelSettings = null;

function getLabelSettings() {
  labelSettings ??= {
    show: game.settings.get(MOD_ID, "showLabels"),
    minLength: game.settings.get(MOD_ID, "labelMinLength")
  };
  return labelSettings;
}

function formatRange({ bottom, top }, units) {
  const unit = units ? ` ${units}` : "";
  if (bottom === -Infinity) return `≤ ${top}${unit}`;
  if (top === Infinity) return `≥ ${bottom}${unit}`;
  return `${bottom}–${top}${unit}`;
}

/**
 * Is the wall long enough for a label? Short walls (curves and round towers are often made of many) would clutter
 * the map; their label still shows while the wall is hovered or selected, or all objects are highlighted.
 */
function isLongEnough(wall) {
  if (wall.hover || wall.controlled || wall.layer?.highlightObjects) return true;
  const minLength = getLabelSettings().minLength * (wall.document.parent?.dimensions?.size ?? 100);
  const [x0, y0, x1, y1] = wall.document.c;
  return Math.hypot(x1 - x0, y1 - y0) >= minLength;
}

/**
 * Create, update or remove the height label of a Wall placeable. Only GMs get labels: players can't open the Walls
 * layer. Not gated on the active layer, because Monk's Wall Enhancement can show the walls outside of it.
 */
export function refreshLabel(wall) {
  if (!wall || wall.destroyed) return;
  const show = game.user.isGM && getLabelSettings().show && isLongEnough(wall);
  const height = show ? getWallHeight(wall.document) : null;
  let label = wall[LABEL];
  if (!height) {
    if (label) label.visible = false;
    return;
  }
  if (!label || label.destroyed) {
    const size = wall.document.parent?.dimensions?.size ?? 100;
    const style = foundry.canvas.containers.PreciseText.getTextStyle({ fontSize: Math.max(12, Math.round(size / 4)) });
    label = wall[LABEL] = wall.addChild(new foundry.canvas.containers.PreciseText("", style));
    label.anchor.set(0.5, 0.5);
    label.eventMode = "none";
  }
  const [x0, y0, x1, y1] = wall.document.c;
  label.text = formatRange(height, wall.document.parent?.grid?.units);
  label.position.set((x0 + x1) / 2, (y0 + y1) / 2);
  label.visible = true;
}

export function refreshAllLabels() {
  labelSettings = null;
  for (const wall of canvas.walls?.placeables ?? []) refreshLabel(wall);
}

export function registerLabels() {
  Hooks.on("refreshWall", wall => refreshLabel(wall));
}
