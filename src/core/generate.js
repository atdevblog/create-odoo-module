// Orchestrator: option spec -> { spec, files, warnings, tree }.
// `files` is a map of relative path -> contents. No disk I/O (the CLI writes).

import { normalizeOptions } from './options.js'
import * as t from './templates.js'
import * as i18n from './i18n.js'
import { iconDesign, iconSvg } from './icon.js'

function renderTree(paths) {
  return [...paths].sort().join('\n')
}

export function generateModule(raw) {
  const spec = normalizeOptions(raw)
  const base = spec.name
  const files = {}

  files[`${base}/__init__.py`] = t.rootInit(spec)
  files[`${base}/__manifest__.py`] = t.manifest(spec)
  files[`${base}/static/description/index.html`] = t.descriptionHtml(spec)
  files[`${base}/README.md`] = t.readme(spec)

  // Model-bound files only when a model was given (a module needn't define one).
  if (spec.hasModel) {
    files[`${base}/models/__init__.py`] = t.modelsInit(spec)
    files[`${base}/models/${spec.modelFile}`] = t.modelPy(spec)
    files[`${base}/views/${spec.table}_views.xml`] = t.viewsXml(spec)
    files[`${base}/views/${spec.table}_menus.xml`] = t.menusXml(spec)
    files[`${base}/security/ir.model.access.csv`] = t.securityCsv(spec)
  }

  // Auto-generated module icon. The SVG is written here (pure); the PNG that
  // Odoo's Apps list actually loads is rendered by the caller (CLI: png-icon.js,
  // web: <canvas>) from `design`, since that needs Node/browser APIs.
  const design = iconDesign(spec)
  files[`${base}/static/description/icon.svg`] = iconSvg(design)

  const warnings = []
  // i18n sample strings come from the model — skip (with a note) when there is none.
  if (spec.i18n === 'vi' && spec.hasModel) {
    files[`${base}/i18n/${spec.name}.pot`] = i18n.pot(spec)
    files[`${base}/i18n/vi.po`] = i18n.viPo(spec)
  } else if (spec.i18n === 'vi' && !spec.hasModel) {
    warnings.push('Skipped i18n — a module with no model has no sample strings to translate.')
  }
  const iconNote = design.emblem
    ? `Auto-generated icon (emblem: ${design.emblem}) — review static/description/icon.*`
    : `Auto-generated icon (initials "${design.initials}") — review static/description/icon.*`

  return { spec, files, iconDesign: design, warnings, iconNote, tree: renderTree(Object.keys(files)) }
}
