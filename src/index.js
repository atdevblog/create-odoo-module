// Public API of the core — consumed by the CLI and (later) a /tools web version.
export { generateModule } from './core/generate.js'
export { normalizeOptions, humanize } from './core/options.js'
export { SAMPLE_FIELDS, translatableStrings } from './core/sample.js'
export { iconDesign, iconSvg, EMBLEMS, HOLE } from './core/icon.js'
