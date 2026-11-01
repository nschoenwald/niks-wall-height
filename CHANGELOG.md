# Changelog

All notable changes to this project will be documented in this file.

## 14.0.0

### Added
- **Wall Height**: Walls get a Bottom and Top elevation in their configuration. Tokens, lights, darkness sources and sounds above or below a wall ignore it for vision, light, sound and movement.
- **Level Range Warning**: The wall configuration shows the elevation range of the wall's levels and warns when the height lies outside it or Top is below Bottom.
- **Wall Palette**: Set the height for new walls in the wall palette; it stays when switching wall types. With the Select tool, the palette changes the height of all selected walls at once.
- **Seeing Over Walls**: Whether a token can see another token takes both elevations into account, so a tall or flying creature behind a low wall can be spotted.
- **Height Labels**: Walls with a height show their range on the Walls layer. Walls shorter than one grid space only show it when hovered, selected or highlighted (the length can be changed). Labels can be turned off in the module settings.
