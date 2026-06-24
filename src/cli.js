#!/usr/bin/env node
// Thin CLI over the core generator: parse flags (or prompt interactively),
// then write the returned file map to disk.

import { parseArgs } from 'node:util'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { generateModule } from './index.js'
import { renderIconPng } from './core/png-icon.js'

const HELP = `create-odoo-module — scaffold a standards-compliant Odoo 18 module

Usage:
  create-odoo-module <name> --model <model> [options]
  create-odoo-module                       (interactive)

Options:
  --model <m>        Main model, dotted (e.g. library.book)   [required]
  --odoo <17|18|19>  Target Odoo series (view syntax+version) [default: 18]
  --depends <list>   Comma-separated dependencies             [default: base]
  --i18n <vi|none>   Add a pre-filled Vietnamese vi.po         [default: none]
  --author <name>    Manifest author                           [default: atdev.blog]
  --version <v>      Manifest version                          [default: 18.0.1.0.0]
  --summary <text>   Short manifest summary
  --category <text>  Odoo category                             [default: Uncategorized]
  --app              Mark as an application (application=True)
  -o, --output <dir> Where to create the module folder         [default: .]
  --force            Overwrite if the target folder exists
  -y, --yes          Non-interactive; use flags/defaults only
  --dry-run          Print the file list without writing
  -h, --help         Show this help

Example:
  create-odoo-module sale_extension --model sale.bonus --depends base,sale --i18n vi
`

function parse() {
  return parseArgs({
    allowPositionals: true,
    options: {
      model: { type: 'string' },
      odoo: { type: 'string' },
      depends: { type: 'string' },
      i18n: { type: 'string' },
      author: { type: 'string' },
      version: { type: 'string' },
      summary: { type: 'string' },
      category: { type: 'string' },
      app: { type: 'boolean' },
      output: { type: 'string', short: 'o' },
      force: { type: 'boolean' },
      yes: { type: 'boolean', short: 'y' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  })
}

async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function interactiveFill(values, positionals) {
  const rl = createInterface({ input, output })
  try {
    const ask = async (q, def) => {
      const a = (await rl.question(def ? `${q} (${def}): ` : `${q}: `)).trim()
      return a || def || ''
    }
    const name = positionals[0] || (await ask('Module technical name (e.g. sale_extension)'))
    const model = values.model || (await ask('Main model (e.g. library.book)'))
    const odoo = values.odoo || (await ask('Target Odoo version (17/18/19)', '18'))
    const depends = values.depends || (await ask('Depends (comma-separated)', 'base'))
    const wantI18n = values.i18n
      ? values.i18n
      : (await ask('Add Vietnamese i18n? (y/N)', 'N')).toLowerCase().startsWith('y')
        ? 'vi'
        : 'none'
    const author = values.author || (await ask('Author', 'atdev.blog'))
    return { name, model, odoo, depends, i18n: wantI18n, author }
  } finally {
    rl.close()
  }
}

async function main() {
  let parsed
  try {
    parsed = parse()
  } catch (e) {
    console.error(`✖ ${e.message}`)
    process.exit(1)
  }
  const { values, positionals } = parsed

  if (values.help) {
    console.log(HELP)
    return
  }

  const haveRequired = positionals[0] && values.model
  let raw
  if (values.yes || haveRequired) {
    raw = {
      name: positionals[0],
      model: values.model,
      odoo: values.odoo,
      depends: values.depends,
      i18n: values.i18n,
      author: values.author,
    }
  } else {
    raw = await interactiveFill(values, positionals)
  }
  // Options without an interactive prompt always come from flags.
  raw.version = values.version
  raw.summary = values.summary
  raw.category = values.category
  raw.app = values.app

  let result
  try {
    result = generateModule(raw)
  } catch (e) {
    console.error(`\n✖ ${e.message}`)
    process.exit(1)
  }
  const { spec, files, warnings, tree, iconDesign, iconNote } = result

  const outRoot = resolve(values.output || '.')
  const moduleDir = join(outRoot, spec.name)

  if (values['dry-run']) {
    console.log(`\nDry run — would create ${Object.keys(files).length} files under ${moduleDir}:\n`)
    console.log(tree)
    return
  }

  if ((await fileExists(moduleDir)) && !values.force) {
    console.error(`\n✖ ${moduleDir} already exists. Use --force to overwrite.`)
    process.exit(1)
  }

  for (const [rel, content] of Object.entries(files)) {
    const full = join(outRoot, rel)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, content, 'utf8')
  }

  // Binary icon.png (Odoo's Apps list loads this) — rendered from the design.
  const pngPath = join(outRoot, spec.name, 'static', 'description', 'icon.png')
  await mkdir(dirname(pngPath), { recursive: true })
  await writeFile(pngPath, renderIconPng(iconDesign))

  const total = Object.keys(files).length + 1
  console.log(`\n✔ Created Odoo module "${spec.name}" (${total} files)\n`)
  console.log(tree.split('\n').map((l) => `  ${l}`).join('\n'))
  console.log(`  ${spec.name}/static/description/icon.png`)
  console.log(`\nNotes:`)
  if (iconNote) console.log(`  • ${iconNote}`)
  for (const w of warnings) console.log(`  • ${w}`)
  console.log('\nNext steps:')
  console.log(`  odoo-bin -c odoo.conf -d mydb -i ${spec.name} --stop-after-init`)
  if (spec.i18n === 'vi') {
    console.log('  # Switch the user language to Vietnamese (vi_VN) to see translations.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
