// Reading wall heights and deciding whether an elevation range passes a wall.

import { MOD_ID } from "./constants.mjs";

/**
 * The height range of a wall, or null if the wall has none (it then blocks at every elevation of its levels).
 * A range whose top is below its bottom is invalid and ignored.
 * @param {WallDocument|Wall|Edge["object"]} object   The wall document or placeable (an Edge's `object`)
 * @returns {{bottom: number, top: number}|null}
 */
export function getWallHeight(object) {
  const doc = object?.document ?? object;
  if (doc?.documentName !== "Wall") return null;
  const flags = doc.flags?.[MOD_ID];
  if (!flags) return null;
  const bottom = Number.isFinite(flags.bottom) ? flags.bottom : -Infinity;
  const top = Number.isFinite(flags.top) ? flags.top : Infinity;
  if (bottom === -Infinity && top === Infinity) return null;
  if (top < bottom) return null;
  return { bottom, top };
}

/**
 * The elevation ranges of the levels a wall is on, sorted by bottom. A wall without levels is on every level.
 * @param {Scene} scene
 * @param {Iterable<string>} levelIds   The wall's level IDs
 * @returns {{bottom: number, top: number}[]}
 */
export function getLevelRanges(scene, levelIds) {
  const ids = new Set(levelIds);
  const levels = ids.size ? scene.levels.filter(l => ids.has(l.id)) : Array.from(scene.levels);
  return levels.map(l => ({ bottom: l.elevation.bottom, top: l.elevation.top })).sort((a, b) => a.bottom - b.bottom);
}

/** Is the elevation inside one of the ranges (bounds included)? */
export function isInRanges(ranges, z) {
  return ranges.some(r => (z >= r.bottom) && (z <= r.top));
}

/** Does the range [bottom, top] overlap one of the ranges? */
export function overlapsRanges(ranges, bottom, top) {
  return ranges.some(r => (bottom < r.top) && (top > r.bottom));
}

/**
 * Does something centred at elevation `z` and extending `half` above and below it miss the wall's height range?
 * With `half` 0 this is a point test: the wall blocks from its bottom (inclusive) to its top (exclusive),
 * so a token standing exactly on top of a wall passes it.
 * @param {{bottom: number, top: number}} height
 * @param {number} z
 * @param {number} [half=0]
 * @returns {boolean}
 */
export function passesWall(height, z, half = 0) {
  return ((z - half) >= height.top) || ((z + half) < height.bottom);
}
