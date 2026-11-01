// The height for newly drawn walls, set in the wall palette.
//
// Kept in this module's own client setting instead of core's palette preset (`core.wallPalette`): clicking a wall
// type in the scene controls (Wall, Terrain, Window…) replaces the whole preset, which would reset the height.

import { MOD_ID } from "./constants.mjs";
import { wrapMethod } from "./wrap.mjs";

const SETTING = "defaultHeight";
const EMPTY = Object.freeze({ bottom: null, top: null });

// The palette re-renders right after a change, before the async setting write is guaranteed to be done.
let cached = null;

const clean = v => (Number.isFinite(v) ? v : null);

/** @returns {{bottom: number|null, top: number|null}} */
export function getDefaultHeight() {
  if (!cached) {
    const stored = game.settings.get(MOD_ID, SETTING) ?? {};
    cached = { bottom: clean(stored.bottom), top: clean(stored.top) };
  }
  return { ...cached };
}

/** Update one or both values. Missing keys keep their value, null clears one. */
export function setDefaultHeight(changes) {
  cached = { ...getDefaultHeight(), ...changes };
  cached.bottom = clean(cached.bottom);
  cached.top = clean(cached.top);
  return game.settings.set(MOD_ID, SETTING, cached);
}

export function resetDefaultHeight() {
  return setDefaultHeight(EMPTY);
}

// New walls start from the palette's creation data; add the default height to it.
function createDragPreviewData(wrapped, ...args) {
  const data = wrapped(...args);
  const { bottom, top } = getDefaultHeight();
  if (data.flags?.[MOD_ID]) delete data.flags[MOD_ID];
  if ((bottom !== null) || (top !== null)) {
    data.flags ??= {};
    data.flags[MOD_ID] = { bottom, top };
  }
  return data;
}

export function registerDefaults() {
  game.settings.register(MOD_ID, SETTING, {
    scope: "client",
    config: false,
    type: Object,
    default: { ...EMPTY },
    onChange: () => { cached = null; }
  });
  wrapMethod("foundry.canvas.layers.WallsLayer.prototype._createDragPreviewData", createDragPreviewData);
}
