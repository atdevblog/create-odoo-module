// Type declarations for the pure JS core, so TypeScript consumers (e.g. the
// /tools/odoo-module-generator web tool) get full typing while the runtime
// stays plain ESM JavaScript shared with the CLI.

export interface OdooModuleOptions {
  /** Technical module name, snake_case (e.g. "sale_extension"). */
  name: string
  /** Main model, dotted lowercase (e.g. "library.book"). */
  model: string
  /** Target Odoo series: 17 | 18 | 19. Drives the view syntax + version. Default 18. */
  odoo?: 17 | 18 | 19 | '17' | '18' | '19'
  /** Dependencies as an array or comma-separated string. Defaults to ["base"]. */
  depends?: string | string[]
  /** "vi" adds a pre-filled Vietnamese vi.po + .pot; "none" omits i18n. */
  i18n?: 'vi' | 'none'
  author?: string
  version?: string
  summary?: string
  category?: string
  /** Mark the module as an application (application=True). */
  app?: boolean
  displayName?: string
  description?: string
  website?: string
}

export interface OdooModuleSpec {
  name: string
  model: string
  table: string
  className: string
  modelFile: string
  depends: string[]
  i18n: 'vi' | 'none'
  /** Resolved Odoo series (17 | 18 | 19). */
  series: number
  /** List view tag for the series: "list" (18+) or "tree" (17). */
  listTag: 'list' | 'tree'
  /** Window-action view_mode: "list,form" (18+) or "tree,form" (17). */
  viewMode: string
  displayName: string
  description: string
  summary: string
  author: string
  website: string
  version: string
  category: string
  application: boolean
}

export interface IconDesign {
  bg: string
  bg2: string
  fg: string
  emblem: string | null
  initials: string | null
}

export interface GenerateResult {
  spec: OdooModuleSpec
  /** Relative path -> file contents. */
  files: Record<string, string>
  /** Deterministic icon design (render to PNG via canvas / png-icon.js). */
  iconDesign: IconDesign
  warnings: string[]
  iconNote?: string
  /** Sorted newline-joined list of generated paths. */
  tree: string
}

export function generateModule(raw: OdooModuleOptions): GenerateResult

export type IconPrimitive = Record<string, unknown>
export function iconDesign(spec: OdooModuleOptions | OdooModuleSpec): IconDesign
export function iconSvg(design: IconDesign): string
export const EMBLEMS: Record<string, IconPrimitive[]>
export const HOLE: Record<string, { cx: number; cy: number; r: number }>
export function normalizeOptions(raw: OdooModuleOptions): OdooModuleSpec
export function humanize(name: string): string
export function translatableStrings(): Array<{ en: string; vi: string }>
export const SAMPLE_FIELDS: Array<Record<string, unknown>>
