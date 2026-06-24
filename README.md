# create-odoo-module

> Scaffold a **standards-compliant Odoo 17 / 18 / 19 custom module** in one command —
> with an optional, pre-filled **Vietnamese (i18n)** translation file.

<p align="center">
  <img src="docs/preview.svg" alt="Auto-generated module icons — a purpose emblem from the deps/category, or the module initials" width="660">
</p>

<p align="center"><em>Every module gets an auto-generated icon — a purpose emblem when the deps/category match a known domain, otherwise its initials.</em></p>

`odoo-bin scaffold` gives you a bare skeleton: empty access rights, no views, no
menus, no translations. **create-odoo-module** fills exactly those gaps and hands
you a clean, install-ready module.

Made by [atdev.blog](https://atdev.blog) — a hands-on dev blog & free developer tools.

---

## Requirements

- **Node.js ≥ 18.3** (only on the machine where you run the generator).
- The generated module is plain Python/XML — drop it into the `addons/` of any
  **Odoo 17, 18 or 19** project. The Odoo server itself does **not** need Node.
  Pick the target with `--odoo` (it adapts the view syntax + manifest version).

Check your Node version:

```bash
node -v
```

---

## Quick start (no install)

Run it straight from GitHub with `npx` — nothing to install:

```bash
npx github:atdevblog/create-odoo-module sale_bonus \
  --model sale.bonus --depends base,sale --i18n vi -o ./addons
```

That creates `./addons/sale_bonus/` ready to install.

> If you fork this, replace `atdevblog` with your own GitHub username.

---

## Install

Pick whichever fits your workflow:

**A. Global command from GitHub**

```bash
npm install -g github:atdevblog/create-odoo-module
create-odoo-module --help
```

**B. Clone and link (for hacking on it)**

```bash
git clone https://github.com/atdevblog/create-odoo-module.git
cd create-odoo-module
npm link            # exposes `create-odoo-module` globally
```

**C. Just clone and run (zero install)**

```bash
git clone https://github.com/atdevblog/create-odoo-module.git
node create-odoo-module/src/cli.js --help
```

---

## Usage

```bash
# With flags
create-odoo-module <name> --model <model> [options]

# Interactive — prompts for each field
create-odoo-module
```

### Options

| Flag | Description | Default |
|---|---|---|
| `<name>` | Module technical name, snake_case (positional) | — (required) |
| `--model <m>` | Main model, dotted (`library.book`) | — (required) |
| `--odoo <17\|18\|19>` | Target Odoo series — sets view syntax + version | `18` |
| `--depends <list>` | Comma-separated dependencies | `base` |
| `--i18n <vi\|none>` | Add a pre-filled Vietnamese `vi.po` | `none` |
| `--author <name>` | Manifest author | `atdev.blog` |
| `--version <v>` | Manifest version | `18.0.1.0.0` |
| `--summary <text>` | Short manifest summary | derived |
| `--category <text>` | Odoo category | `Uncategorized` |
| `--app` | Mark as an application (`application=True`) | off |
| `-o, --output <dir>` | Where to create the module folder | `.` (current dir) |
| `--force` | Overwrite the target folder if it exists | off |
| `-y, --yes` | Non-interactive; use flags/defaults only | off |
| `--dry-run` | Print the file list without writing | off |
| `-h, --help` | Show help | — |

> Tip: run from inside your Odoo project and pass `-o ./addons` (or `-o .` if you
> are already in the addons folder) so the module lands in the right place.

---

## What it generates

```text
<name>/
├── __init__.py
├── __manifest__.py             # version 18.0.1.0.0, depends, data, LGPL-3
├── models/
│   ├── __init__.py
│   └── <model>.py              # sample model: Char, Text, Many2one, Float, Date, Selection
├── views/
│   ├── <model>_views.xml        # list + form + window action (<list> on 18/19, <tree> on 17)
│   └── <model>_menus.xml        # root menu + action menu item
├── security/
│   └── ir.model.access.csv     # access line PRE-FILLED (the file devs forget)
├── static/description/
│   ├── icon.png                # auto-generated icon (Odoo Apps list loads this)
│   ├── icon.svg                # scalable companion
│   └── index.html
├── README.md
└── i18n/                       # only with --i18n vi
    ├── <name>.pot              # translation template (empty msgstr)
    └── vi.po                   # Vietnamese, sample strings pre-translated
```

---

## Vietnamese i18n (`--i18n vi`)

Following the Odoo convention, source strings stay **English** in the code and the
translation lives in `i18n/vi.po`. With `--i18n vi` the generator writes a `vi.po`
whose sample strings are already translated:

```po
msgid "Customer"
msgstr "Khách hàng"

msgid "Status"
msgstr "Trạng thái"
```

Odoo loads `vi.po` automatically when the user's language is **vi_VN** and the
module is installed or upgraded. After you add fields, re-export the template and
merge the new strings:

```bash
odoo-bin -c odoo.conf -d mydb \
  --i18n-export=i18n/<name>.pot --modules=<name> --stop-after-init
```

---

## After scaffolding

```bash
# Install for the first time
odoo-bin -c odoo.conf -d mydb -i <name> --stop-after-init

# Upgrade after code changes
odoo-bin -c odoo.conf -d mydb -u <name> --stop-after-init
```

> Always back up the database and test the upgrade (`-u`) on staging before
> running it on production.

## Auto-generated module icon

The generator writes `static/description/icon.png` (the image Odoo's Apps list
loads) plus a scalable `icon.svg`. The icon is derived from the module:

- **Background** is a stable two-stop gradient hashed from the module name.
- **A purpose emblem** is picked when the name/category/dependencies/model match a
  known domain: `report`/`dashboard` → bar chart, `calendar`/`event` → calendar,
  `mail`/`marketing` → envelope, `payment` → card, `account`/`invoice` → receipt,
  `sale`/`pos`/`crm` → cart, `stock`/`purchase` → box, `mrp`/`automation` → gear,
  `website` → globe, `hr`/`contact` → person, `project`/`task` → checklist.
- Otherwise the icon shows the module's **initials** + a small "module" mark
  (the default *custom module* look).

Replace the files if you have real artwork — they are just a sensible default.

---

## 🇻🇳 Tiếng Việt — bắt đầu nhanh

`create-odoo-module` tạo nhanh một module **Odoo 17 / 18 / 19 đúng chuẩn** (manifest,
model, view list/form, menu, phân quyền điền sẵn) kèm tùy chọn **i18n tiếng Việt** dịch sẵn.
Chọn phiên bản bằng `--odoo` (tự đổi cú pháp view: `<list>` cho 18/19, `<tree>` cho 17).

```bash
# Chạy thẳng từ GitHub, không cần cài
npx github:atdevblog/create-odoo-module ten_module \
  --model my.model --odoo 18 --i18n vi -o ./addons
```

Module sinh ra là Python/XML thuần — bỏ vào `addons/` của Odoo 18 bất kỳ rồi cài:

```bash
odoo-bin -c odoo.conf -d mydb -i ten_module --stop-after-init
```

> Đây là **khung khởi đầu** — hãy đọc lại code và chỉnh field/quyền theo nghiệp vụ
> thật trước khi cài lên hệ thống production.

---

## Development

```bash
npm test     # node --test (no dependencies)
```

The generator core (`src/core/`) does no filesystem I/O — it returns a
`path → contents` map, so it can be reused by a web UI or a build step. The CLI is a
thin wrapper that writes that map to disk.

## License

[MIT](./LICENSE) © [Anh Tran](https://atdev.blog)
