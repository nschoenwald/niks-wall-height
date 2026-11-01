// Height-aware edge filtering for the polygon backend used by vision, light, darkness, sound and movement.
//
// Core collects the walls of the polygon's Level in ClockwiseSweepPolygon#_testEdgeInclusion, which already knows
// the origin's elevation but never compares it with anything. Polygons (LOS, light areas) drop walls the origin is
// above or below. Collision tests (token movement, token detection, checkCollision) instead use the elevation at
// which the ray crosses the wall, so a ray that rises over a low wall passes it.

import { MOD_ID } from "./constants.mjs";
import { getWallHeight, passesWall } from "./heights.mjs";
import { wrapMethod } from "./wrap.mjs";

const DESTINATION = Symbol(`${MOD_ID}.destination`);
const SWEEP_PATH = "foundry.canvas.geometry.ClockwiseSweepPolygon.prototype";

/**
 * Half the height of the token a movement polygon belongs to, in grid units, so movement tests the whole body
 * from feet to head. The movement origin is the token's centre (elevation + half its depth). Vision, light and
 * sound sources are points.
 * @param {PointSourcePolygon} polygon
 * @returns {number}
 */
function getHalfDepth(polygon) {
  const source = polygon.config.source;
  if (!(source instanceof foundry.canvas.sources.PointMovementSource)) return 0;
  const doc = source.object?.document;
  const distance = doc?.parent?.grid?.distance ?? 0;
  return ((doc?.depth ?? 0) * distance) / 2;
}

/**
 * Should the polygon ignore this edge because of the wall's height?
 * @param {ClockwiseSweepPolygon} polygon
 * @param {Edge} edge
 * @returns {boolean}
 */
function ignoresEdge(polygon, edge) {
  const height = getWallHeight(edge.object);
  if (!height) return false;
  const origin = polygon.origin;
  const destination = polygon[DESTINATION];
  let z = origin.elevation;
  if (destination && (destination.elevation !== origin.elevation)) {
    const x = foundry.utils.lineSegmentIntersection(origin, destination, edge.a, edge.b);
    if (x) z = Math.mix(origin.elevation, destination.elevation, x.t0);
  }
  return passesWall(height, z, getHalfDepth(polygon));
}

function testEdgeInclusion(wrapped, edge, edgeTypes) {
  if (!wrapped(edge, edgeTypes)) return false;
  return !ignoresEdge(this, edge);
}

// _testCollision collects its edges through _testEdgeInclusion; remember the destination for it meanwhile.
function testCollision(wrapped, ray, mode, destination, ...args) {
  this[DESTINATION] = destination;
  try {
    return wrapped(ray, mode, destination, ...args);
  } finally {
    delete this[DESTINATION];
  }
}

// Polygon backends that subclass ClockwiseSweepPolygon inherit the wrappers.
export function registerPolygonPatches() {
  wrapMethod(`${SWEEP_PATH}._testEdgeInclusion`, testEdgeInclusion);
  wrapMethod(`${SWEEP_PATH}._testCollision`, testCollision);
}
