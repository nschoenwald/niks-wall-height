import { registerCompatibility } from "./compat.mjs";
import { MOD_ID } from "./constants.mjs";
import { patchWallCreation, registerDefaults } from "./defaults.mjs";
import { refreshAllLabels, refreshLabel, registerLabels } from "./labels.mjs";
import { registerPolygonPatches } from "./polygon.mjs";
import { registerWallConfig } from "./wall-config.mjs";

function registerSettings() {
  game.settings.register(MOD_ID, "showLabels", {
    name: "NWH.Settings.showLabels.Name",
    hint: "NWH.Settings.showLabels.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => refreshAllLabels()
  });
  game.settings.register(MOD_ID, "labelMinLength", {
    name: "NWH.Settings.labelMinLength.Name",
    hint: "NWH.Settings.labelMinLength.Hint",
    scope: "client",
    config: true,
    type: new foundry.data.fields.NumberField({ required: true, nullable: false, min: 0, max: 5, step: 0.25,
      initial: 1 }),
    onChange: () => refreshAllLabels()
  });
}

/**
 * Core only re-initializes a wall's edge (and with it vision, lighting, sound and planned movement) when one of
 * the wall's own fields changes. A height change is a flag change, so refresh everything that depends on walls.
 * Debounced, because the wall palette updates many walls at once.
 */
const refreshPerception = foundry.utils.debounce(() => {
  if (!canvas.ready) return;
  canvas.perception.update({
    initializeVision: true,
    initializeLighting: true,
    initializeSounds: true,
    refreshVision: true
  });
  canvas.tokens.recalculatePlannedMovementPaths();
}, 20);

function onUpdateWall(doc, changed) {
  const flagsChanged = Object.keys(changed.flags ?? {}).some(k => k.includes(MOD_ID));
  if (!flagsChanged || (doc.parent !== canvas.scene)) return;
  refreshPerception();
  refreshLabel(doc.object);
}

Hooks.once("init", () => {
  registerSettings();
  registerDefaults();
  registerWallConfig();
  registerLabels();
  registerCompatibility();
  Hooks.on("updateWall", onUpdateWall);
});

// Wrapped in setup, after every module's init: without libWrapper the last wrapper is the outermost, and the height
// check must stay outside wrappers that can answer without calling the wrapped method (Monk's Wall Enhancement's
// one-way doors). With libWrapper, WRAPPER-type wrappers always run outside MIXED ones anyway.
Hooks.once("setup", () => {
  registerPolygonPatches();
  patchWallCreation();
});
