// Render an icon design to a real PNG buffer — pure Node (node:zlib built-in,
// no external deps). Node-only (uses Buffer/zlib): the CLI imports this; the
// web tool rasterises the same design with <canvas> instead.

import zlib from 'node:zlib'
import { EMBLEMS, HOLE } from './icon.js'

// ---- PNG encoder ------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---- raster primitives ------------------------------------------------------
function hexRgb(hex) {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
function blend(buf, size, x, y, [r, g, b], a) {
  if (x < 0 || y < 0 || x >= size || y >= size || a <= 0) return
  const i = (y * size + x) * 4
  const da = buf[i + 3] / 255
  const sa = a
  const oa = sa + da * (1 - sa)
  if (oa <= 0) return
  buf[i] = (r * sa + buf[i] * da * (1 - sa)) / oa
  buf[i + 1] = (g * sa + buf[i + 1] * da * (1 - sa)) / oa
  buf[i + 2] = (b * sa + buf[i + 2] * da * (1 - sa)) / oa
  buf[i + 3] = oa * 255
}
function inRoundRect(px, py, x, y, w, h, r) {
  if (px < x || px >= x + w || py < y || py >= y + h) return false
  const rx0 = x + r, ry0 = y + r, rx1 = x + w - r, ry1 = y + h - r
  let cx = px, cy = py
  if (px < rx0 && py < ry0) { cx = rx0; cy = ry0 } else if (px > rx1 && py < ry0) { cx = rx1; cy = ry0 }
  else if (px < rx0 && py > ry1) { cx = rx0; cy = ry1 } else if (px > rx1 && py > ry1) { cx = rx1; cy = ry1 }
  else return true
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
}
function fillRoundRect(buf, size, x, y, w, h, r, rgb, a) {
  for (let py = Math.max(0, Math.floor(y)); py < Math.min(size, y + h); py++)
    for (let px = Math.max(0, Math.floor(x)); px < Math.min(size, x + w); px++)
      if (inRoundRect(px + 0.5, py + 0.5, x, y, w, h, r)) blend(buf, size, px, py, rgb, a)
}
function fillCircle(buf, size, cx, cy, r, rgb, a) {
  for (let py = Math.max(0, Math.floor(cy - r)); py < Math.min(size, cy + r); py++)
    for (let px = Math.max(0, Math.floor(cx - r)); px < Math.min(size, cx + r); px++)
      if ((px + 0.5 - cx) ** 2 + (py + 0.5 - cy) ** 2 <= r * r) blend(buf, size, px, py, rgb, a)
}
function fillEllipse(buf, size, cx, cy, rx, ry, rgb, a) {
  for (let py = Math.max(0, Math.floor(cy - ry)); py < Math.min(size, cy + ry); py++)
    for (let px = Math.max(0, Math.floor(cx - rx)); px < Math.min(size, cx + rx); px++) {
      const dx = (px + 0.5 - cx) / rx, dy = (py + 0.5 - cy) / ry
      if (dx * dx + dy * dy <= 1) blend(buf, size, px, py, rgb, a)
    }
}
function fillPolygon(buf, size, pts, rgb, a) {
  let minY = Infinity, maxY = -Infinity
  for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
  for (let y = Math.max(0, Math.ceil(minY)); y <= Math.min(size - 1, Math.floor(maxY)); y++) {
    const xs = []
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y + 0.5 - y1) / (y2 - y1)) * (x2 - x1))
    }
    xs.sort((p, q) => p - q)
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.max(0, Math.ceil(xs[i])); x <= Math.min(size - 1, Math.floor(xs[i + 1])); x++)
        blend(buf, size, x, y, rgb, a)
  }
}
function drawPrimitives(buf, size, prims, s) {
  for (const p of prims) {
    if (typeof p.fill !== 'string' || p.fill[0] !== '#') continue // skip placeholders
    const a = p.opacity != null ? p.opacity : 1
    const rgb = hexRgb(p.fill)
    if (p.t === 'r') fillRoundRect(buf, size, p.x * s, p.y * s, p.w * s, p.h * s, (p.rx || 0) * s, rgb, a)
    else if (p.t === 'c') fillCircle(buf, size, p.cx * s, p.cy * s, p.r * s, rgb, a)
    else if (p.t === 'e') fillEllipse(buf, size, p.cx * s, p.cy * s, p.rx * s, p.ry * s, rgb, a)
    else if (p.t === 'p') fillPolygon(buf, size, p.pts.map(([x, y]) => [x * s, y * s]), rgb, a)
  }
}

// ---- 5x7 uppercase font (for the default "initials" icon) -------------------
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
}
function drawInitials(buf, size, text, rgb) {
  const glyphs = [...text].map((c) => FONT[c]).filter(Boolean)
  if (!glyphs.length) return
  const cols = glyphs.length * 5 + (glyphs.length - 1)
  const cell = (size * 0.42) / 7
  const w = cols * cell, h = 7 * cell
  const x0 = (size - w) / 2
  const y0 = (size - h) / 2 - size * 0.04
  glyphs.forEach((g, gi) => {
    const gx = x0 + gi * 6 * cell
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (g[r][c] === '#') fillRoundRect(buf, size, gx + c * cell, y0 + r * cell, cell + 0.6, cell + 0.6, 0, rgb, 1)
  })
}

/** Render the icon design to a PNG Buffer (default 128x128). */
export function renderIconPng(design, size = 128) {
  const s = size / 100
  const buf = Buffer.alloc(size * size * 4)
  // background (rounded square, vertical gradient bg -> bg2)
  const c1 = hexRgb(design.bg), c2 = hexRgb(design.bg2 || design.bg)
  const r = 22 * s
  for (let y = 0; y < size; y++) {
    const t = y / size
    const col = [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]
    for (let x = 0; x < size; x++) {
      if (!inRoundRect(x + 0.5, y + 0.5, 0, 0, size, size, r)) continue
      const i = (y * size + x) * 4
      buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = 255
    }
  }
  // top sheen for a little depth
  for (let y = 0; y < size * 0.5; y++) {
    const a = 0.13 * (1 - y / (size * 0.5))
    for (let x = 0; x < size; x++) blend(buf, size, x, y, [255, 255, 255], a)
  }
  if (design.emblem) {
    drawPrimitives(buf, size, EMBLEMS[design.emblem], s)
    const hole = HOLE[design.emblem]
    if (hole) {
      const t = hole.cy / 100
      const col = [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]
      fillCircle(buf, size, hole.cx * s, hole.cy * s, hole.r * s, col, 1)
    }
  } else {
    drawInitials(buf, size, design.initials || 'M', hexRgb(design.fg))
    // small module mark bottom-right
    const m = hexRgb('#ffffff')
    fillRoundRect(buf, size, 72 * s, 72 * s, 7 * s, 7 * s, 1.5 * s, m, 0.85)
    fillRoundRect(buf, size, 82 * s, 72 * s, 7 * s, 7 * s, 1.5 * s, m, 0.6)
    fillRoundRect(buf, size, 72 * s, 82 * s, 7 * s, 7 * s, 1.5 * s, m, 0.6)
  }
  return encodePng(size, buf)
}
