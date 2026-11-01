// Bottom and Top fields in the Wall Configuration sheet and the wall palette (which is a WallConfig subclass, so the
// renderWallConfig hook covers both). Three modes:
// - "sheet": one wall. The inputs are named after the flags, so the sheet's own submit saves them; an empty field is
//   submitted as null, which means "no limit".
// - "select": the palette with the Select tool, editing all selected walls. Same input names; core's palette tracks
//   changed fields and applies only those to every selected wall. Differing values show as "Multiple Values".
// - "create": the palette with a drawing tool, editing the height for new walls. The inputs have no name and save to
//   this module's own setting (see defaults.mjs); their change events are kept from the palette's submit-on-change.
// Below the fields, the elevation range of the wall's levels is shown, with a warning when the height doesn't fit it.

import { MOD_ID } from "./constants.mjs";
import { getDefaultHeight, resetDefaultHeight, setDefaultHeight } from "./defaults.mjs";
import { getLevelRanges, isInRanges, overlapsRanges } from "./heights.mjs";

const { createFormGroup, createNumberInput } = foundry.applications.fields;
const KEYS = ["bottom", "top"];
const BOUND = new WeakSet();

function getMode(app) {
  if (!(app instanceof foundry.applications.sheets.palette.WallPalette)) return "sheet";
  return app.isSelect ? "select" : "create";
}

const getFlag = (doc, key) => doc.flags?.[MOD_ID]?.[key] ?? null;

/**
 * The value of each field, and whether the selected walls disagree on it.
 * @returns {Record<"bottom"|"top", {value: number|null, multiple: boolean}>}
 */
function getInitialValues(app, mode) {
  const values = {};
  if (mode === "create") {
    const defaults = getDefaultHeight();
    for (const key of KEYS) values[key] = { value: defaults[key], multiple: false };
    return values;
  }
  const docs = (mode === "select") ? app.controlled : [app.document];
  for (const key of KEYS) {
    const distinct = new Set(docs.map(d => getFlag(d, key)));
    values[key] = (distinct.size > 1) ? { value: null, multiple: true }
      : { value: distinct.values().next().value ?? null, multiple: false };
  }
  return values;
}

function createHeightGroup(app, mode, key, { value, multiple }) {
  const noLimit = game.i18n.localize("NWH.WallConfig.NoLimit");
  const input = createNumberInput({
    name: (mode === "create") ? undefined : `flags.${MOD_ID}.${key}`,
    value,
    placeholder: multiple ? game.i18n.localize("PLACEABLE_PALETTE.MultipleValues") : noLimit,
    disabled: !app.isEditable,
    dataset: { nwhKey: key }
  });
  if (multiple) {
    // Core's palette removes the class and restores this placeholder once the field is changed
    input.classList.add("multiple-values");
    input._originalPlaceholder = noLimit;
  }
  return createFormGroup({
    label: game.i18n.localize(`NWH.WallConfig.${key === "bottom" ? "Bottom" : "Top"}`),
    units: app.document.parent?.grid?.units || undefined,
    rootId: app.id,
    input
  });
}

function readNumber(element, key) {
  const value = element.querySelector(`input[data-nwh-key="${key}"]`)?.valueAsNumber;
  return Number.isFinite(value) ? value : null;
}

function formatRanges(ranges, units) {
  const fmt = z => (z === -Infinity ? "−∞" : (z === Infinity ? "∞" : String(z)));
  const unit = units ? ` ${units}` : "";
  return ranges.map(r => `${fmt(r.bottom)}–${fmt(r.top)}${unit}`).join(", ");
}

/**
 * The IDs of the levels the edited wall(s) are on; an empty list means every level. Taken from the Levels field
 * while it has a value (it is missing in the palette of a single-level scene), else from the walls themselves.
 */
function getLevelIds(app, element, mode) {
  const input = element.querySelector("[name=\"levels\"]");
  if (input && !input.classList.contains("multiple-values")) return input.value ?? [];
  const docs = (mode === "select") ? app.controlled : [app.document];
  if (!docs.length || docs.some(d => !d.levels?.size)) return [];
  return docs.flatMap(d => Array.from(d.levels));
}

/** The warning for the entered height, or null if it fits the wall's levels. */
function getWarning(ranges, bottom, top, rangeText) {
  if ((bottom !== null) && (top !== null) && (top < bottom)) return game.i18n.localize("NWH.WallConfig.WarnInverted");
  if ((bottom === null) && (top === null)) return null;
  if (!overlapsRanges(ranges, bottom ?? -Infinity, top ?? Infinity)) {
    return game.i18n.format("NWH.WallConfig.WarnNoOverlap", { ranges: rangeText });
  }
  const outside = [];
  if ((bottom !== null) && !isInRanges(ranges, bottom)) outside.push(game.i18n.localize("NWH.WallConfig.Bottom"));
  if ((top !== null) && !isInRanges(ranges, top)) outside.push(game.i18n.localize("NWH.WallConfig.Top"));
  if (!outside.length) return null;
  const key = outside.length > 1 ? "NWH.WallConfig.WarnOutsideBoth" : "NWH.WallConfig.WarnOutside";
  return game.i18n.format(key, { field: outside[0], ranges: rangeText });
}

/** Refresh the level range hint and the warning from the current form values. */
function updateLevelInfo(app, element) {
  const fieldset = element.querySelector(`fieldset.${MOD_ID}`);
  const scene = app.document.parent;
  if (!fieldset || !scene) return;
  const ranges = getLevelRanges(scene, getLevelIds(app, element, getMode(app)));
  const rangeText = formatRanges(ranges, scene.grid?.units);

  const info = fieldset.querySelector(".levels-range");
  info.innerText = ranges.length ? game.i18n.format("NWH.WallConfig.LevelRange", { ranges: rangeText }) : "";

  const warning = fieldset.querySelector(".notification");
  const text = ranges.length ? getWarning(ranges, readNumber(element, "bottom"), readNumber(element, "top"), rangeText)
    : null;
  warning.innerText = text ?? "";
  if (warning.hidden !== !text) {
    warning.hidden = !text;
    app.setPosition({ height: "auto" });
  }
}

/** Palette with a drawing tool: save the fields as the height for new walls. */
function onChangeCreateField(event) {
  const key = event.target.dataset?.nwhKey;
  if (!key) return;
  if (event.type === "change") event.stopPropagation();
  const value = event.target.valueAsNumber;
  setDefaultHeight({ [key]: Number.isFinite(value) ? value : null });
}

/** Palette with the Select tool: "Clone Settings" copies the selected walls' shared height to new walls. */
function onCloneSettings(app) {
  const values = getInitialValues(app, "select");
  const changes = {};
  for (const key of KEYS) if (!values[key].multiple) changes[key] = values[key].value;
  setDefaultHeight(changes);
}

function onRenderWallConfig(app, element) {
  if (element.querySelector(`fieldset.${MOD_ID}`)) return;
  const mode = getMode(app);
  const values = getInitialValues(app, mode);
  const fieldset = document.createElement("fieldset");
  fieldset.classList.add(MOD_ID);
  const legend = document.createElement("legend");
  legend.innerText = game.i18n.localize("NWH.WallConfig.Legend");
  fieldset.append(legend, ...KEYS.map(key => createHeightGroup(app, mode, key, values[key])));
  if (mode === "sheet") {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.innerText = game.i18n.localize("NWH.WallConfig.Hint");
    fieldset.append(hint);
  }
  const info = document.createElement("p");
  info.className = "hint levels-range";
  const warning = document.createElement("p");
  warning.className = "notification warning";
  warning.hidden = true;
  fieldset.append(info, warning);

  // Directly after the Levels selection, before the Restrictions
  const anchor = element.querySelector(".standard-form > fieldset");
  if (anchor) anchor.before(fieldset);
  else (element.querySelector(".standard-form") ?? element).append(fieldset);

  if (mode === "create") {
    fieldset.addEventListener("input", onChangeCreateField);
    fieldset.addEventListener("change", onChangeCreateField);
    fieldset.addEventListener("change", () => updateLevelInfo(app, element));
    element.querySelector("[data-action=\"reset\"]")?.addEventListener("click", () => resetDefaultHeight());
  } else if (mode === "select") {
    element.querySelector("[data-action=\"commit\"]")?.addEventListener("click", () => onCloneSettings(app));
  }

  // The application element outlives re-renders, so its listeners are added once
  if (!BOUND.has(element)) {
    BOUND.add(element);
    const update = () => updateLevelInfo(app, element);
    element.addEventListener("input", update);
    element.addEventListener("change", update);
  }
  updateLevelInfo(app, element);
  app.setPosition({ height: "auto" });
}

export function registerWallConfig() {
  Hooks.on("renderWallConfig", onRenderWallConfig);
}
