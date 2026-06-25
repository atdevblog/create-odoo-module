// Deterministic icon DESIGN for a generated module (pure, no I/O).
//
// From the module name + category + depends + model we derive:
//   - a stable 2-stop gradient (hash of the name -> curated palette + a darker
//     shade), and
//   - either a purpose EMBLEM (when the deps/category/name match a known
//     domain) or the module's INITIALS (default "custom module" identity).
//
// The design renders to SVG here, and to PNG by png-icon.js (CLI) / <canvas>
// (web) — all three consume the SAME emblem primitives, so the icon looks
// identical everywhere.

const PALETTE = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#db2777', '#4f46e5', '#0d9488', '#ea580c',
]

function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
/** Darken a hex colour by fraction f (0..1) for the gradient's bottom stop. */
function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - f), g * (1 - f), b * (1 - f))
}

function initialsOf(name) {
  const words = String(name).split(/[_-]+/).filter(Boolean)
  const raw = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] || 'm').slice(0, 2)
  return raw.toUpperCase()
}

// keyword (substring) -> emblem key. First match wins, so order = priority.
const EMBLEM_RULES = [
  // Specific intents first so e.g. "sales_report" -> chart (not cart).
  [['report', 'dashboard', 'analytic', 'kpi', 'statistic', 'metric', 'insight', 'forecast'], 'chart'],
  [['calendar', 'event', 'appointment', 'booking', 'schedul', 'rental', 'timesheet', 'leave', 'holiday'], 'calendar'],
  [['mail', 'mailing', 'marketing', 'newsletter', 'email', 'sms', 'campaign'], 'mail'],
  [['payment', 'stripe', 'paypal', 'wallet', 'subscription', 'recurring', 'membership', 'donation', 'billing'], 'card'],
  [['account', 'invoic', 'expense', 'bank', 'tax', 'ledger', 'budget'], 'receipt'],
  [['pos', 'sale', 'crm', 'ecommerce', 'order', 'shop', 'retail', 'restaurant', 'quotation', 'lead', 'opportunity'], 'cart'],
  [['stock', 'inventory', 'purchase', 'delivery', 'warehouse', 'product', 'shipping', 'logistics', 'barcode'], 'box'],
  [['mrp', 'manufactur', 'maintenance', 'automation', 'connector', 'integration', 'webhook', 'sync', 'config', 'import', 'export'], 'gear'],
  [['document', 'dms', 'contract', 'knowledge', 'attachment', 'signature', 'esign'], 'file'],
  [['website', 'web', 'portal', 'seo', 'blog', 'forum', 'social', 'landing', 'snippet'], 'globe'],
  [['hr', 'employee', 'recruit', 'payroll', 'attendance', 'contact', 'partner', 'member', 'signup'], 'person'],
  [['project', 'task', 'todo', 'helpdesk', 'ticket', 'survey', 'quiz', 'quality', 'approval'], 'check'],
]

function detectEmblem(spec) {
  const hay = [spec.name, spec.category, spec.summary, spec.model, (spec.depends || []).join(' ')]
    .join(' ')
    .toLowerCase()
  for (const [keys, emblem] of EMBLEM_RULES) {
    if (keys.some((k) => hay.includes(k))) return emblem
  }
  return null
}

// ---- emblem geometry (0..100 design space) ----------------------------------
// primitives: r=roundRect, c=circle, e=ellipse, p=polygon. White-ish fills with
// light-grey shades for depth.
const W = '#ffffff'
const G1 = '#eef2f7'
const G2 = '#cbd5e1'
const G3 = '#94a3b8'
const SKY = '#cfe0f4'

function gearPoly(cx, cy, rOut, rIn, teeth) {
  const pts = []
  const n = teeth * 2
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 ? rIn : rOut
    pts.push([Math.round((cx + Math.cos(a) * r) * 10) / 10, Math.round((cy + Math.sin(a) * r) * 10) / 10])
  }
  return pts
}

export const EMBLEMS = {
  cart: [
    { t: 'r', x: 19, y: 32, w: 12, h: 5, rx: 2.5, fill: W },
    { t: 'p', pts: [[28, 38], [76, 38], [70, 60], [38, 60]], fill: W },
    { t: 'c', cx: 42, cy: 70, r: 5, fill: W },
    { t: 'c', cx: 64, cy: 70, r: 5, fill: W },
  ],
  receipt: [
    { t: 'p', pts: [[31, 24], [69, 24], [69, 70], [64, 74], [59, 70], [54, 74], [50, 70], [46, 74], [41, 70], [36, 74], [31, 70]], fill: W },
    { t: 'r', x: 37, y: 33, w: 26, h: 3.6, rx: 1.8, fill: G2 },
    { t: 'r', x: 37, y: 42, w: 26, h: 3.6, rx: 1.8, fill: G2 },
    { t: 'r', x: 37, y: 51, w: 16, h: 3.6, rx: 1.8, fill: G2 },
  ],
  card: [
    { t: 'r', x: 20, y: 33, w: 60, h: 38, rx: 5, fill: W },
    { t: 'r', x: 20, y: 40, w: 60, h: 8, fill: G3 },
    { t: 'r', x: 27, y: 55, w: 13, h: 10, rx: 2, fill: '#fbbf24' },
    { t: 'r', x: 46, y: 58, w: 27, h: 3.4, rx: 1.7, fill: G2 },
    { t: 'r', x: 46, y: 64, w: 18, h: 3.4, rx: 1.7, fill: G2 },
  ],
  box: [
    { t: 'p', pts: [[28, 64], [50, 76], [50, 52], [28, 40]], fill: G2 },
    { t: 'p', pts: [[72, 64], [50, 76], [50, 52], [72, 40]], fill: G1 },
    { t: 'p', pts: [[50, 28], [72, 40], [50, 52], [28, 40]], fill: W },
  ],
  gear: [
    { t: 'p', pts: gearPoly(50, 52, 26, 19, 8), fill: W },
    { t: 'c', cx: 50, cy: 52, r: 8, fill: 'rgba(0,0,0,0)' }, // hole punched by bg via overlay below
  ],
  chart: [
    { t: 'r', x: 27, y: 50, w: 11, h: 22, rx: 1.5, fill: W, opacity: 0.7 },
    { t: 'r', x: 44, y: 40, w: 11, h: 32, rx: 1.5, fill: W, opacity: 0.85 },
    { t: 'r', x: 61, y: 30, w: 11, h: 42, rx: 1.5, fill: W },
    { t: 'r', x: 22, y: 73, w: 56, h: 3.4, rx: 1.7, fill: W },
  ],
  mail: [
    { t: 'r', x: 22, y: 33, w: 56, h: 34, rx: 4, fill: W },
    { t: 'p', pts: [[24, 36], [50, 54], [76, 36]], fill: G2 },
    { t: 'p', pts: [[24, 35], [50, 52], [76, 35], [76, 38], [50, 56], [24, 38]], fill: G3 },
  ],
  calendar: [
    { t: 'r', x: 33, y: 25, w: 4.5, h: 9, rx: 2, fill: W },
    { t: 'r', x: 62, y: 25, w: 4.5, h: 9, rx: 2, fill: W },
    { t: 'r', x: 24, y: 30, w: 52, h: 44, rx: 5, fill: W },
    { t: 'r', x: 24, y: 30, w: 52, h: 11, rx: 5, fill: G3 },
    { t: 'r', x: 31, y: 48, w: 7, h: 6, rx: 1.2, fill: G2 },
    { t: 'r', x: 46, y: 48, w: 7, h: 6, rx: 1.2, fill: '#fbbf24' },
    { t: 'r', x: 61, y: 48, w: 7, h: 6, rx: 1.2, fill: G2 },
    { t: 'r', x: 31, y: 60, w: 7, h: 6, rx: 1.2, fill: G2 },
    { t: 'r', x: 46, y: 60, w: 7, h: 6, rx: 1.2, fill: G2 },
  ],
  globe: [
    { t: 'c', cx: 50, cy: 52, r: 25, fill: W },
    { t: 'e', cx: 50, cy: 52, rx: 9.5, ry: 25, fill: SKY },
    { t: 'e', cx: 50, cy: 52, rx: 25, ry: 8.5, fill: SKY },
    { t: 'e', cx: 50, cy: 52, rx: 18.5, ry: 25, fill: '#e3eefa' },
  ],
  person: [
    { t: 'c', cx: 50, cy: 37, r: 12, fill: W },
    { t: 'p', pts: [[27, 78], [32, 59], [68, 59], [73, 78]], fill: W },
  ],
  check: [
    { t: 'c', cx: 50, cy: 52, r: 25, fill: W, opacity: 0.16 },
    { t: 'p', pts: [[33, 52], [44, 63], [69, 33], [74, 38], [44, 71], [28, 56]], fill: W },
  ],
  file: [
    { t: 'p', pts: [[30, 24], [58, 24], [70, 36], [70, 76], [30, 76]], fill: W },
    { t: 'p', pts: [[58, 24], [58, 36], [70, 36]], fill: G2 },
    { t: 'r', x: 38, y: 42, w: 24, h: 3.6, rx: 1.8, fill: G2 },
    { t: 'r', x: 38, y: 51, w: 24, h: 3.6, rx: 1.8, fill: G2 },
    { t: 'r', x: 38, y: 60, w: 16, h: 3.6, rx: 1.8, fill: G2 },
  ],
  // Default "custom module": stacked module blocks (a puzzle-ish mark).
  blocks: [
    { t: 'r', x: 28, y: 28, w: 18, h: 18, rx: 4, fill: W },
    { t: 'r', x: 54, y: 28, w: 18, h: 18, rx: 4, fill: W, opacity: 0.82 },
    { t: 'r', x: 28, y: 54, w: 18, h: 18, rx: 4, fill: W, opacity: 0.82 },
    { t: 'r', x: 54, y: 54, w: 18, h: 18, rx: 4, fill: W, opacity: 0.64 },
  ],
}

// Emblems whose centre hole should be punched with the background gradient
// (so the gear/donut reads as hollow). Handled by each renderer.
export const HOLE = { gear: { cx: 50, cy: 52, r: 8 } }

/** Resolve the deterministic icon design for a module spec. */
export function iconDesign(spec) {
  const name = spec.name || 'module'
  const emblem = detectEmblem(spec)
  const bg = PALETTE[hashStr(name) % PALETTE.length]
  return {
    bg,
    bg2: shade(bg, 0.26),
    fg: '#ffffff',
    emblem,
    initials: emblem ? null : initialsOf(name),
  }
}

function primSvg(p) {
  const op = p.opacity != null ? ` opacity="${p.opacity}"` : ''
  if (p.t === 'r') return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"${p.rx ? ` rx="${p.rx}"` : ''} fill="${p.fill}"${op}/>`
  if (p.t === 'c') return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}"${op}/>`
  if (p.t === 'e') return `<ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}" fill="${p.fill}"${op}/>`
  if (p.t === 'p') return `<polygon points="${p.pts.map((q) => q.join(',')).join(' ')}" fill="${p.fill}"${op}/>`
  return ''
}

/** Inner SVG content (defs + bg + body), without the <svg> wrapper. `idp`
 *  prefixes the gradient ids so several icons can be composed in one document. */
export function iconInner(design, idp = '') {
  let body
  if (design.emblem) {
    const prims = EMBLEMS[design.emblem].filter((p) => p.fill !== 'rgba(0,0,0,0)')
    body = prims.map(primSvg).join('')
    const hole = HOLE[design.emblem]
    if (hole) body += `<circle cx="${hole.cx}" cy="${hole.cy}" r="${hole.r}" fill="url(#${idp}bg)"/>`
  } else {
    body =
      `<text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="${design.fg}">${design.initials}</text>` +
      '<g fill="#ffffff" opacity="0.8"><rect x="72" y="72" width="7" height="7" rx="1.5"/><rect x="82" y="72" width="7" height="7" rx="1.5" opacity="0.7"/><rect x="72" y="82" width="7" height="7" rx="1.5" opacity="0.7"/></g>'
  }
  return `<defs>
    <linearGradient id="${idp}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${design.bg}"/><stop offset="1" stop-color="${design.bg2}"/></linearGradient>
    <linearGradient id="${idp}sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#${idp}bg)"/>
  <rect width="100" height="100" rx="22" fill="url(#${idp}sheen)"/>
  ${body}`
}

/** Render the design to an SVG string (scalable companion to icon.png). */
export function iconSvg(design) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 100 100">
  ${iconInner(design)}
</svg>
`
}
