// Token detection across wall heights: lets a token see a token standing on a ledge (or flying) behind a wall whose
// top is above the viewer's eyes, when the line between the two passes over the wall.
//
// Core's DetectionMode._testCollision tests the part of the line in the viewer's level against the vision source's
// LOS polygon (`los.contains`). That polygon is computed at the viewer's eye elevation, so a wall the eyes are below
// cuts it off entirely, whatever the target's elevation. Only the part of the line in another level is cast as a ray,
// where polygon.mjs checks walls at the elevation the ray crosses them.
// When the polygon test says "blocked", the target point is at another elevation than the eyes and the scene has walls
// with heights, the test is repeated with the polygon's configuration instead of the polygon. Core then casts the
// whole line as a ray (its own path for detection modes that ignore the vision angle), which applies the vision angle
// and the level split itself.

import { MOD_ID } from "./constants.mjs";
import { getWallHeight } from "./heights.mjs";
import { wrapMethod } from "./wrap.mjs";

/** World setting "seeOverWalls", cached because the wrapper runs for every visibility test point. */
let enabled = true;

/** Does the scene have walls with a height? Cached per scene, cleared when walls change. */
const heightWallScenes = new Map();

function sceneHasHeightWalls(scene) {
  if (!scene) return false;
  let has = heightWallScenes.get(scene.id);
  if (has === undefined) {
    has = scene.walls.some(w => getWallHeight(w));
    heightWallScenes.set(scene.id, has);
  }
  return has;
}

function clearCache(doc) {
  heightWallScenes.delete(doc.parent?.id);
}

function testCollision(wrapped, visionSource, test, configOrLos, ...args) {
  const collides = wrapped(visionSource, test, configOrLos, ...args);
  if (!enabled || !collides || !(configOrLos instanceof foundry.canvas.geometry.PointSourcePolygon)) return collides;
  const z0 = visionSource.origin?.elevation;
  const z1 = test.point?.elevation;
  // At the eyes' elevation the ray drops the same walls as the polygon did
  if (!Number.isFinite(z0) || !Number.isFinite(z1) || (z0 === z1)) return collides;
  if (!sceneHasHeightWalls(canvas.scene)) return collides;
  return wrapped(visionSource, test, configOrLos.config, ...args);
}

export function registerDetectionSetting() {
  game.settings.register(MOD_ID, "seeOverWalls", {
    name: "NWH.Settings.seeOverWalls.Name",
    hint: "NWH.Settings.seeOverWalls.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: value => {
      enabled = value;
      if (canvas.ready) canvas.perception.update({ refreshVision: true });
    }
  });
  enabled = game.settings.get(MOD_ID, "seeOverWalls");
}

export function registerDetectionHooks() {
  for (const hook of ["createWall", "updateWall", "deleteWall"]) Hooks.on(hook, clearCache);
  Hooks.on("canvasTearDown", () => heightWallScenes.clear());
}

// Subclasses (core and module detection modes) call this.constructor._testCollision and inherit the wrapper.
export function registerDetectionPatches() {
  wrapMethod("foundry.canvas.perception.DetectionMode._testCollision", testCollision);
}
