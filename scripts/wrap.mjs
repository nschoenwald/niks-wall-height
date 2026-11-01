import { MOD_ID } from "./constants.mjs";

/**
 * Wrap a method given by its global path ("foundry.canvas.layers.WallsLayer.prototype._createDragPreviewData").
 * Uses libWrapper when it is active, otherwise wraps the method directly. `fn(wrapped, ...args)` is called with
 * the instance as `this` and must pass everything on, so other modules' wrappers and subclasses keep working.
 */
export function wrapMethod(path, fn) {
  if (game.modules.get("lib-wrapper")?.active && globalThis.libWrapper) {
    globalThis.libWrapper.register(MOD_ID, path, fn, "WRAPPER");
    return;
  }
  const index = path.lastIndexOf(".");
  const owner = foundry.utils.getProperty(globalThis, path.slice(0, index));
  const method = path.slice(index + 1);
  const original = owner[method];
  owner[method] = function (...args) {
    return fn.call(this, original.bind(this), ...args);
  };
}
