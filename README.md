# create-odoo-module

Scaffold a ready-to-install **Odoo 17 / 18 / 19** module in one command — models,
list/form views, menus, pre-filled security, an **auto-generated icon**, and optional
**Vietnamese (i18n)**. Zero dependencies.

<p align="center">
  <img src="docs/preview.svg" alt="Auto-generated module icons — a purpose emblem from the deps/category, or the module initials" width="660">
</p>

## ⚡ Quick start

```bash
# 1) Generate a module straight from GitHub (no install). Creates ./addons/sale_bonus/
npx github:atdevblog/create-odoo-module sale_bonus --model sale.bonus -o ./addons

# 2) Install it into Odoo
odoo-bin -c odoo.conf -d mydb -i sale_bonus --stop-after-init
```

That's it. Needs **Node ≥ 18.3** to run the generator; the module it writes is plain
Python/XML for any Odoo 17/18/19.

## 🍳 Recipes (copy-paste)

```bash
# Install once, then use the short command anywhere
npm install -g github:atdevblog/create-odoo-module

# Interactive — prompts for every field
create-odoo-module

# Sales module: extra deps + Vietnamese translations, straight into your addons
create-odoo-module sale_bonus --model sale.bonus --depends base,sale --i18n vi -o ~/odoo/addons

# Target Odoo 17 (emits <tree> + 17.x version)
create-odoo-module legacy_mod --model my.model --odoo 17 -o ./addons

# Mark it as an application, set author + category
create-odoo-module fleet_extra --model fleet.note --app --author "You" --category Fleet

# Just preview the file list — write nothing
create-odoo-module demo --model demo.thing --dry-run
```

## Options

| Flag | What | Default |
|---|---|---|
| `<name>` | Module technical name, snake_case (positional) | **required** |
| `--model <m>` | Main model, dotted (`library.book`) | **required** |
| `--odoo <17\|18\|19>` | Target series (view syntax + version) | `18` |
| `--depends <list>` | Comma-separated dependencies | `base` |
| `--i18n <vi\|none>` | Add a pre-translated Vietnamese `vi.po` | `none` |
| `-o, --output <dir>` | Where to create the module | `.` |
| `--author` · `--version` · `--summary` · `--category` | Manifest fields | sensible |
| `--app` · `--force` · `-y, --yes` · `--dry-run` · `-h, --help` | flags | — |

## What you get

```text
sale_bonus/
├── __manifest__.py · models/ · views/ (list+form+menu) · security/ir.model.access.csv
├── static/description/icon.png   ← auto-generated, shows in the Odoo Apps list
└── README.md · i18n/vi.po        ← vi.po only with --i18n vi
```

- **Icon** is derived from the module: a domain emblem (`sale`→cart, `stock`→box,
  `account`→receipt, `report`→chart, …) or its **initials** when nothing matches.
- **`--i18n vi`** ships a `vi.po` with sample strings already translated
  (Customer → Khách hàng); Odoo loads it for `vi_VN` users.
- View tag + manifest version auto-match the `--odoo` you pick (`<tree>` for 17,
  `<list>` for 18/19).

## 🇻🇳 Tiếng Việt

Lệnh giống hệt phần trên. Chọn `--odoo 17/18/19`, thêm `--i18n vi` để có bản dịch
tiếng Việt, `-o ./addons` để xuất thẳng vào addons:

```bash
npx github:atdevblog/create-odoo-module ten_module --model my.model --odoo 18 --i18n vi -o ./addons
```

> Đây là **khung khởi đầu** — đọc lại code và chỉnh field/quyền theo nghiệp vụ trước khi cài lên production.

## Dev

```bash
npm test   # node --test, no dependencies
```

The core (`src/core/`) does no disk I/O — it returns a `path → contents` map, reused
by the CLI and the web version at [atdev.blog](https://atdev.blog).

MIT © [atdev.blog](https://atdev.blog)
