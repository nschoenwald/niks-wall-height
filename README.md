# Nik's Wall Height

![Foundry v14](https://img.shields.io/badge/Foundry-v14-orange)

**Nik's Wall Height** gives walls a bottom and a top elevation. Anything above or below a wall ignores it: a token
flying over a hedge, a lantern hanging above a low wall, a giant looking over a fence.

Foundry V14's Scene Levels split a scene into floors, but within a level every wall reaches from the floor to the
ceiling. This module adds the missing part: walls that are only as tall as you say.

---

## Compatibility

- **Foundry VTT**: V14
- **System**: System-agnostic
- **Optional**: [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) is used when active
- **Languages**: English. All text is in `lang/en.json`, so the module can be translated.

---

## Features

### Wall Height in the Wall Configuration

Open a wall's configuration. A **Wall Height** section below the Levels selection has two fields, in the scene's grid
units:

- **Bottom**: the wall starts at this elevation. Empty means it reaches all the way down.
- **Top**: the wall ends at this elevation. Empty means it reaches all the way up.

A wall with both fields empty behaves exactly as in core Foundry. The height is an absolute elevation, the same scale
as token elevation, and applies on every level the wall belongs to. A top below the bottom is ignored.

Examples:

| Wall | Bottom | Top |
|---|---|---|
| Low wall, hedge, fence (1.5 m / 5 ft) | empty | 1.5 / 5 |
| Wall of a raised platform at elevation 10 | empty | 10 |
| Overhang or balcony floor edge from 10 to 12 | 10 | 12 |

Below the fields, the sheet shows the elevation range of the wall's levels (a wall without levels is on every level).
It warns while you type when:

- **Top is below Bottom**: the height is ignored and the wall blocks at every elevation.
- **Bottom or Top lies outside the wall's levels**: a wall never reaches into a level it isn't assigned to, so the
  value only matters for tokens and sources whose elevation is outside their own level's range (token elevation isn't
  tied to the level, so a token can fly above its level's top). To make a wall reach into another level, assign it to
  that level too.
- **The whole range lies outside the wall's levels**: the wall then blocks nothing at elevations within those levels.

Saving is never prevented.

### Wall Palette: New Walls and Several Walls at Once

The **Wall Height** section also appears in Foundry's wall palette (the palette button in the Walls controls).

- **New walls**: With a drawing tool active, the Bottom and Top in the palette are the height for the walls you draw
  next. The height stays when you switch between wall types (Wall, Terrain, Window…). **Reset** clears it. The
  height is stored per browser, like the rest of the palette.
- **Several walls at once**: With the **Select** tool, select walls and open the palette. Fields where the selected
  walls differ show *Multiple Values*. Change Bottom or Top and click **Apply**: only the fields you changed are applied
  to every selected wall. Clearing a field and applying removes that limit.
- **Clone Settings** copies the height the selected walls share to the height for new walls.

### What the Height Affects

The wall height applies to everything that walls restrict: sight, light, darkness, sound and movement.

- **Vision**: A token sees past a wall when its eyes are above the top or below the bottom. Foundry places a token's
  eyes at half the token's height (its elevation plus half its depth), so a medium token standing on the ground does
  not see over a 1.5 m wall, but a token standing on a crate does.
- **Seeing other tokens**: Whether a token can see another token also takes the target's elevation into account. A
  tall or flying creature behind a low wall can be seen when the line between the two passes over the wall.
- **Lights, darkness and sounds**: A light, darkness source or sound above the top or below the bottom of a wall
  shines or is heard past it.
- **Movement**: A token can move past a wall when its whole body, from its feet to its head, is above the top or
  below the bottom at the point where it crosses the wall. A token standing exactly on top of a wall passes it.
  Movement that climbs or descends is checked at the elevation where it crosses the wall.

A wall is either in the way or not. The module does not work out partial sight lines, such as seeing the ground far
behind a low wall but not right behind it.

Changing a wall's height updates vision, lighting, sound and planned movement right away.

### Height Labels

On the Walls layer, walls with a height show their range at their midpoint (`≤ 5 ft`, `≥ 10 ft`, `10–12 ft`). The
labels can be turned off with the client setting **Show Wall Height Labels**.

To keep curves and round towers made of many short walls readable, walls shorter than one grid space don't show a
label. Their label still appears while the wall is hovered or selected, or while all objects are highlighted (hold
**Alt**). The client setting **Minimum Wall Length for Labels** changes the length in grid spaces; 0 labels every
wall.

---

## Notes

- Works within Foundry's native Scene Levels: a wall still only exists on the levels it is assigned to, and floors and
  ceilings (level surfaces) are handled by core as before.
- Other modules that compute vision through Foundry's polygon backend (for example vision and detection mode modules)
  get the wall heights automatically.
