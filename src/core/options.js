// Validate + normalize the raw options into a derived spec the templates use.
// Throws Error with a friendly message on invalid input (the CLI catches it).

const MODULE_RE = /^[a-z][a-z0-9_]*$/
const MODEL_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/
const SUPPORTED_SERIES = new Set([17, 18, 19])

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** library_app -> "Library App" */
export function humanize(name) {
  return name.split('_').filter(Boolean).map(capitalize).join(' ')
}

/** library.book -> "LibraryBook" */
function classNameFor(model) {
  return model
    .split(/[._]/)
    .filter(Boolean)
    .map(capitalize)
    .join('')
}

export function normalizeOptions(raw = {}) {
  const name = String(raw.name || '').trim()
  if (!MODULE_RE.test(name)) {
    throw new Error(
      `Invalid module name "${raw.name}". Use lowercase letters, digits and underscores, ` +
        `starting with a letter (e.g. "sale_extension").`,
    )
  }

  // Model is OPTIONAL — many modules add no new model (inherit views, add data,
  // assets, security, glue, …). When omitted we scaffold a bare module.
  const modelRaw = String(raw.model || '').trim()
  let model = null
  let table = null
  let className = null
  let modelFile = null
  if (modelRaw) {
    if (!MODEL_RE.test(modelRaw)) {
      throw new Error(
        `Invalid model name "${raw.model}". Use dotted lowercase, e.g. "library.book".`,
      )
    }
    model = modelRaw
    table = model.replace(/\./g, '_')
    className = classNameFor(model)
    modelFile = `${table}.py`
  }
  const hasModel = !!model

  let depends = raw.depends ?? ['base']
  if (typeof depends === 'string') {
    depends = depends.split(',').map((d) => d.trim()).filter(Boolean)
  }
  if (!Array.isArray(depends) || depends.length === 0) depends = ['base']

  const i18n = raw.i18n === 'vi' ? 'vi' : 'none'

  // Target Odoo series (17 | 18 | 19). Explicit --odoo wins; otherwise infer the
  // major from --version (e.g. "17.0.1.0.0"); default 18.
  let series
  if (raw.odoo != null && String(raw.odoo).trim() !== '') {
    series = parseInt(String(raw.odoo), 10)
  } else if (raw.version) {
    series = parseInt(String(raw.version), 10)
  } else {
    series = 18
  }
  if (!SUPPORTED_SERIES.has(series)) {
    throw new Error(`Unsupported Odoo version "${raw.odoo ?? raw.version}". Supported: 17, 18, 19.`)
  }

  // Version-sensitive view syntax: Odoo 18+ renamed the list view tag
  // <tree> -> <list> (and view_mode "tree,form" -> "list,form"). Odoo 17 keeps
  // the original <tree>, which is guaranteed valid there.
  const listTag = series >= 18 ? 'list' : 'tree'
  const viewMode = series >= 18 ? 'list,form' : 'tree,form'
  const version = (raw.version && String(raw.version).trim()) || `${series}.0.1.0.0`

  const displayName = (raw.displayName && String(raw.displayName).trim()) || humanize(name)

  return {
    name,
    model,
    table,
    className,
    modelFile,
    hasModel,
    depends,
    i18n,
    series,
    listTag,
    viewMode,
    displayName,
    description: (raw.description && String(raw.description).trim()) || displayName,
    summary: (raw.summary && String(raw.summary).trim()) || `${displayName} for Odoo`,
    author: (raw.author && String(raw.author).trim()) || 'atdev.blog',
    website: (raw.website && String(raw.website).trim()) || 'https://atdev.blog',
    version,
    category: (raw.category && String(raw.category).trim()) || 'Uncategorized',
    application: !!raw.app,
  }
}
