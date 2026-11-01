// Compatibility with other modules.
//
// Monk's Wall Enhancement:
// - Its freehand walls and double-click wall splitting copy the drawing preview or the split wall, so they keep
//   the height without help.
// - "Convert To Walls" (Drawings controls) builds walls from core's palette setting, bypassing the drawing preview
//   that adds the default height. Walls created while that button's action runs get the palette's default height.
//   Its "Wall Scene" button (Scene Configuration) is left alone: walls around the scene edge should be full height.
// - It wraps ClockwiseSweepPolygon#_testEdgeInclusion for one-way doors and may return true without calling the
//   wrapped method. The height check therefore has to wrap outside of it; see the setup hook in the entry point.
//
// Monk's Little Details: nothing needed. Its "move ignoring walls" key bypasses wall collision in core entirely.

import { MOD_ID } from "./constants.mjs";
import { getDefaultHeightFlags } from "./defaults.mjs";

const MWE_ID = "monks-wall-enhancement";
let converting = 0;

function onGetSceneControlButtons(controls) {
  const tool = controls.drawings?.tools?.converttowalls;
  if (typeof tool?.onChange !== "function") return;
  const original = tool.onChange;
  tool.onChange = async function (...args) {
    converting++;
    try {
      return await original.apply(this, args);
    } finally {
      converting--;
    }
  };
}

// Same rule as drawn walls: the palette's default height replaces any height in core's palette setting.
function onPreCreateWall(doc) {
  if (!converting) return;
  const flags = getDefaultHeightFlags();
  if (flags) doc.updateSource({ flags: { [MOD_ID]: flags } });
  else if (doc._source.flags?.[MOD_ID]) doc.updateSource({ flags: { [MOD_ID]: _del } });
}

export function registerCompatibility() {
  if (game.modules.get(MWE_ID)?.active) {
    // Registered in init, so this runs after Wall Enhancement's top-level listener has added the tool
    Hooks.on("getSceneControlButtons", onGetSceneControlButtons);
    Hooks.on("preCreateWall", onPreCreateWall);
  }
}
