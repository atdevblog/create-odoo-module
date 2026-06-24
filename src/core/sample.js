// Single source of truth for the sample model the generator scaffolds.
//
// Both the Python model + XML views AND the i18n (.pot / vi.po) are rendered
// from this list, so the translatable strings always match what actually
// appears in the code — no drift between `string=` and `msgid`.
//
// `vi` holds the Vietnamese translation pre-filled into i18n/vi.po (per the
// Odoo convention that source strings stay English and translations live in
// .po files — we never hardcode Vietnamese into `string=`).

export const SAMPLE_FIELDS = [
  { name: 'name', type: 'Char', string: 'Name', vi: 'Tên', attrs: 'required=True' },
  { name: 'description', type: 'Text', string: 'Description', vi: 'Mô tả' },
  { name: 'partner_id', type: 'Many2one', comodel: 'res.partner', string: 'Customer', vi: 'Khách hàng' },
  { name: 'amount', type: 'Float', string: 'Amount', vi: 'Số tiền' },
  { name: 'date', type: 'Date', string: 'Date', vi: 'Ngày' },
  {
    name: 'state',
    type: 'Selection',
    string: 'Status',
    vi: 'Trạng thái',
    default: 'draft',
    // [technical key, English label, Vietnamese label]
    selection: [
      ['draft', 'Draft', 'Nháp'],
      ['done', 'Done', 'Hoàn thành'],
    ],
  },
  { name: 'active', type: 'Boolean', string: 'Active', vi: 'Đang hoạt động', attrs: 'default=True' },
]

/** Fields shown as columns in the list view. */
export const LIST_FIELDS = ['name', 'partner_id', 'amount', 'date', 'state']

/**
 * Every translatable English string in the scaffold paired with its Vietnamese
 * translation, de-duplicated. Drives both the .pot template and vi.po.
 */
export function translatableStrings() {
  const seen = new Map()
  const add = (en, vi) => {
    if (en && !seen.has(en)) seen.set(en, vi || '')
  }
  for (const f of SAMPLE_FIELDS) {
    add(f.string, f.vi)
    if (f.type === 'Selection') {
      for (const [, en, vi] of f.selection) add(en, vi)
    }
  }
  return [...seen.entries()].map(([en, vi]) => ({ en, vi }))
}
