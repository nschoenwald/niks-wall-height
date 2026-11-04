# Changelog

All notable changes to this project will be documented in this file.

## 14.2.1
### Removed
- Removed the French, Spanish, Italian, Brazilian Portuguese, Japanese, Polish and Czech translations. They were machine-translated and never checked by a native speaker. Players who use Foundry in one of these languages now see this module in English. Translations by native speakers are welcome as an issue or pull request.

## 14.2.0

- The module is now available in German, French, Spanish, Italian, Brazilian Portuguese, Japanese, Polish and Czech.

## 14.1.0

### Added
- **Monk's Wall Enhancement**: Walls made with Convert To Walls get the height for new walls from the wall palette, like walls you draw. Freehand walls, split walls and one-way doors work with wall heights.
- **Monk's Little Details**: Checked to work together; no changes needed.

### Improved
- **Reliability with Other Modules**: Wall heights now always apply, even when another module changes which walls block vision or movement and libWrapper isn't installed.

## 14.0.0

### Added
- **Wall Height**: Walls get a Bottom and Top elevation in their configuration. Tokens, lights, darkness sources and sounds above or below a wall ignore it for vision, light, sound and movement.
- **Level Range Warning**: The wall configuration shows the elevation range of the wall's levels and warns when the height lies outside it or Top is below Bottom.
- **Wall Palette**: Set the height for new walls in the wall palette; it stays when switching wall types. With the Select tool, the palette changes the height of all selected walls at once.
- **Seeing Over Walls**: Whether a token can see another token takes both elevations into account, so a tall or flying creature behind a low wall can be spotted.
- **Height Labels**: Walls with a height show their range on the Walls layer. Walls shorter than one grid space only show it when hovered, selected or highlighted (the length can be changed). Labels can be turned off in the module settings.
