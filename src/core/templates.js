// Pure renderers: each takes the normalized spec and returns file contents as a
// string. No filesystem access here — that keeps the core reusable by a future
// web tool (which would zip the returned map instead of writing to disk).

import { SAMPLE_FIELDS, LIST_FIELDS } from './sample.js'

function renderFieldLine(f) {
  switch (f.type) {
    case 'Char':
      return `    ${f.name} = fields.Char(string="${f.string}"${f.attrs ? `, ${f.attrs}` : ''})`
    case 'Text':
      return `    ${f.name} = fields.Text(string="${f.string}")`
    case 'Float':
      return `    ${f.name} = fields.Float(string="${f.string}")`
    case 'Date':
      return `    ${f.name} = fields.Date(string="${f.string}")`
    case 'Boolean':
      return `    ${f.name} = fields.Boolean(string="${f.string}"${f.attrs ? `, ${f.attrs}` : ''})`
    case 'Many2one':
      return `    ${f.name} = fields.Many2one("${f.comodel}", string="${f.string}")`
    case 'Selection': {
      const sel = f.selection.map(([k, en]) => `("${k}", "${en}")`).join(', ')
      return [
        `    ${f.name} = fields.Selection(`,
        `        selection=[${sel}],`,
        `        string="${f.string}",`,
        `        default="${f.default}",`,
        `    )`,
      ].join('\n')
    }
    default:
      return `    ${f.name} = fields.Char(string="${f.string}")`
  }
}

export function rootInit(spec) {
  return spec.hasModel ? 'from . import models\n' : '# -*- coding: utf-8 -*-\n'
}

export function modelsInit(spec) {
  return `from . import ${spec.table}\n`
}

export function manifest(spec) {
  const deps = spec.depends.map((d) => `'${d}'`).join(', ')
  const data = spec.hasModel
    ? `'data': [
        'security/ir.model.access.csv',
        'views/${spec.table}_views.xml',
        'views/${spec.table}_menus.xml',
    ],`
    : `'data': [],`
  return `# -*- coding: utf-8 -*-
{
    'name': '${spec.displayName}',
    'version': '${spec.version}',
    'summary': '${spec.summary}',
    'author': '${spec.author}',
    'website': '${spec.website}',
    'license': 'LGPL-3',
    'category': '${spec.category}',
    'depends': [${deps}],
    ${data}
    'installable': True,
    'application': ${spec.application ? 'True' : 'False'},
    'auto_install': False,
}
`
}

export function modelPy(spec) {
  const fields = SAMPLE_FIELDS.map(renderFieldLine).join('\n')
  return `# -*- coding: utf-8 -*-
from odoo import fields, models


class ${spec.className}(models.Model):
    _name = "${spec.model}"
    _description = "${spec.description}"

${fields}
`
}

export function viewsXml(spec) {
  // Odoo 18+ uses <list>; Odoo 17 uses <tree>. spec.listTag / spec.viewMode are
  // resolved from the target series in options.js.
  const tag = spec.listTag
  const listCols = LIST_FIELDS.map((n) => `                <field name="${n}"/>`).join('\n')
  return `<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_${spec.table}_${tag}" model="ir.ui.view">
        <field name="name">${spec.model}.${tag}</field>
        <field name="model">${spec.model}</field>
        <field name="arch" type="xml">
            <${tag}>
${listCols}
            </${tag}>
        </field>
    </record>

    <record id="view_${spec.table}_form" model="ir.ui.view">
        <field name="name">${spec.model}.form</field>
        <field name="model">${spec.model}</field>
        <field name="arch" type="xml">
            <form>
                <header>
                    <field name="state" widget="statusbar"/>
                </header>
                <sheet>
                    <group>
                        <group>
                            <field name="name"/>
                            <field name="partner_id"/>
                        </group>
                        <group>
                            <field name="amount"/>
                            <field name="date"/>
                        </group>
                    </group>
                    <field name="description"/>
                </sheet>
            </form>
        </field>
    </record>

    <record id="action_${spec.table}" model="ir.actions.act_window">
        <field name="name">${spec.displayName}</field>
        <field name="res_model">${spec.model}</field>
        <field name="view_mode">${spec.viewMode}</field>
    </record>
</odoo>
`
}

export function menusXml(spec) {
  return `<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <menuitem id="menu_${spec.table}_root"
              name="${spec.displayName}"
              sequence="10"/>

    <menuitem id="menu_${spec.table}"
              name="${spec.displayName}"
              parent="menu_${spec.table}_root"
              action="action_${spec.table}"
              sequence="10"/>
</odoo>
`
}

export function securityCsv(spec) {
  return `id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_${spec.table}_user,${spec.model}.user,model_${spec.table},base.group_user,1,1,1,0
`
}

export function descriptionHtml(spec) {
  return `<section class="oe_container">
    <div class="oe_row oe_spaced">
        <h2 class="oe_slogan">${spec.displayName}</h2>
        <h3 class="oe_slogan">${spec.summary}</h3>
        <p class="oe_mt32">Generated with create-odoo-module — https://atdev.blog</p>
    </div>
</section>
`
}

export function readme(spec) {
  const i18nSection = spec.i18n === 'vi'
    ? `## Vietnamese (i18n)

This module ships an \`i18n/vi.po\` with the sample strings translated to
Vietnamese. Odoo loads it automatically when the **vi_VN** language is active
and the module is installed or upgraded.

After adding new fields, regenerate the template and merge:

\`\`\`bash
odoo-bin -c odoo.conf -d mydb --i18n-export=i18n/${spec.name}.pot --modules=${spec.name} --stop-after-init
# then merge new msgids into i18n/vi.po and fill the Vietnamese msgstr
\`\`\`

> Convention: keep \`string=\` in the Python code **English**; put Vietnamese in
> \`vi.po\`. Never hardcode Vietnamese into the model.
`
    : `## Translations

This module has no translation files yet. Re-scaffold with \`--i18n vi\` or export
a template with \`odoo-bin ... --i18n-export\` to add one.
`

  return `# ${spec.displayName}

${spec.summary}

- **Technical name:** \`${spec.name}\`
${spec.hasModel ? `- **Model:** \`${spec.model}\` (table \`${spec.table}\`)\n` : ''}- **Odoo version:** ${spec.version}
- **Depends:** ${spec.depends.join(', ')}

## Install

\`\`\`bash
# Install for the first time
odoo-bin -c odoo.conf -d mydb -i ${spec.name} --stop-after-init

# Upgrade after code changes
odoo-bin -c odoo.conf -d mydb -u ${spec.name} --stop-after-init
\`\`\`

> Always back up the database and test \`-u\` on staging before production.

${i18nSection}
---

Scaffolded with [create-odoo-module](https://atdev.blog) · pairs with the
[Odoo custom module lifecycle guide](https://atdev.blog/blog/odoo-custom-module-vong-doi-an-toan).
`
}
