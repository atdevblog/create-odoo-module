import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateModule } from '../src/index.js'
import { renderIconPng } from '../src/core/png-icon.js'

test('generates the core files of a module', () => {
  const { files, spec } = generateModule({
    name: 'library_app',
    model: 'library.book',
    depends: ['base'],
  })
  assert.equal(spec.table, 'library_book')
  assert.equal(spec.className, 'LibraryBook')

  assert.ok(files['library_app/__manifest__.py'])
  assert.match(files['library_app/__manifest__.py'], /'version': '18\.0\.1\.0\.0'/)
  assert.match(files['library_app/models/library_book.py'], /class LibraryBook\(models\.Model\)/)
  assert.match(files['library_app/models/library_book.py'], /_name = "library\.book"/)

  // Security access line must be pre-filled (the classic forgotten file).
  const csv = files['library_app/security/ir.model.access.csv']
  assert.match(csv, /access_library_book_user,library\.book\.user,model_library_book,base\.group_user,1,1,1,0/)

  // Odoo 18 (default) list view tag + view_mode + version.
  assert.equal(spec.series, 18)
  assert.match(files['library_app/views/library_book_views.xml'], /<list>/)
  assert.match(files['library_app/views/library_book_views.xml'], /list,form/)
  assert.match(files['library_app/__manifest__.py'], /'version': '18\.0\.1\.0\.0'/)

  // No i18n by default.
  assert.ok(!files['library_app/i18n/vi.po'])
})

test('targets Odoo 17 with <tree> view and 17.x version', () => {
  const { files, spec } = generateModule({
    name: 'library_app',
    model: 'library.book',
    odoo: 17,
  })
  assert.equal(spec.series, 17)
  assert.equal(spec.listTag, 'tree')
  const views = files['library_app/views/library_book_views.xml']
  assert.match(views, /<tree>/)
  assert.match(views, /tree,form/)
  assert.ok(!views.includes('<list>'))
  assert.match(files['library_app/__manifest__.py'], /'version': '17\.0\.1\.0\.0'/)
})

test('targets Odoo 19 with <list> view and 19.x version', () => {
  const { files, spec } = generateModule({
    name: 'library_app',
    model: 'library.book',
    odoo: '19',
  })
  assert.equal(spec.series, 19)
  assert.match(files['library_app/views/library_book_views.xml'], /<list>/)
  assert.match(files['library_app/__manifest__.py'], /'version': '19\.0\.1\.0\.0'/)
})

test('infers the series from an explicit --version', () => {
  const { spec } = generateModule({
    name: 'library_app',
    model: 'library.book',
    version: '17.0.2.0.0',
  })
  assert.equal(spec.series, 17)
  assert.equal(spec.listTag, 'tree')
})

test('rejects an unsupported Odoo version', () => {
  assert.throws(
    () => generateModule({ name: 'library_app', model: 'library.book', odoo: 16 }),
    /Unsupported Odoo version/,
  )
})

test('--i18n vi adds a pre-filled vi.po and a .pot template', () => {
  const { files } = generateModule({
    name: 'library_app',
    model: 'library.book',
    i18n: 'vi',
  })
  const po = files['library_app/i18n/vi.po']
  assert.ok(po, 'vi.po should exist')
  assert.ok(po.includes('"Language: vi\\n"'))
  assert.ok(po.includes('msgid "Customer"\nmsgstr "Khách hàng"'))
  assert.ok(po.includes('msgid "Status"\nmsgstr "Trạng thái"'))

  const pot = files['library_app/i18n/library_app.pot']
  assert.ok(pot, '.pot should exist')
  // Template keeps msgstr empty.
  assert.ok(pot.includes('msgid "Customer"\nmsgstr ""'))
})

test('rejects an invalid module name', () => {
  assert.throws(
    () => generateModule({ name: 'Library App', model: 'library.book' }),
    /Invalid module name/,
  )
})

test('rejects an invalid model name', () => {
  assert.throws(
    () => generateModule({ name: 'library_app', model: 'LibraryBook' }),
    /Invalid model name/,
  )
})

test('auto-generates a module icon (svg + design)', () => {
  const { files, iconDesign } = generateModule({ name: 'library_app', model: 'library.book' })
  assert.ok(files['library_app/static/description/icon.svg'])
  assert.equal(iconDesign.emblem, null)
  assert.equal(iconDesign.initials, 'LA')
  assert.match(iconDesign.bg, /^#[0-9a-f]{6}$/)
})

test('picks a purpose emblem from dependencies', () => {
  const sale = generateModule({ name: 'bonus_app', model: 'sale.bonus', depends: ['base', 'sale'] })
  assert.equal(sale.iconDesign.emblem, 'cart')
  const stock = generateModule({ name: 'label_app', model: 'stock.label', depends: ['base', 'stock'] })
  assert.equal(stock.iconDesign.emblem, 'box')
})

test('renders a valid PNG icon', () => {
  const png = renderIconPng({ bg: '#7c3aed', fg: '#ffffff', emblem: null, initials: 'AB' })
  assert.ok(Buffer.isBuffer(png))
  assert.deepEqual([...png.subarray(0, 4)], [137, 80, 78, 71]) // PNG signature
})

test('parses comma-separated depends', () => {
  const { spec } = generateModule({
    name: 'sale_extension',
    model: 'sale.bonus',
    depends: 'base, sale ,account',
  })
  assert.deepEqual(spec.depends, ['base', 'sale', 'account'])
})
