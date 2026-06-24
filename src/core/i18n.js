// Generate gettext .pot (template, empty msgstr) and vi.po (Vietnamese filled).
// Strings come from sample.js so they always match the scaffolded code.

import { translatableStrings } from './sample.js'

function header(spec, lang) {
  return [
    `# Translation file for the ${spec.name} module.`,
    `# This file is distributed under the same license as the ${spec.name} package.`,
    '#',
    'msgid ""',
    'msgstr ""',
    `"Project-Id-Version: ${spec.name} ${spec.version}\\n"`,
    '"Report-Msgid-Bugs-To: \\n"',
    '"Last-Translator: \\n"',
    '"Language-Team: \\n"',
    '"MIME-Version: 1.0\\n"',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '"Content-Transfer-Encoding: \\n"',
    `"Language: ${lang}\\n"`,
    '"Plural-Forms: \\n"',
    '',
    '',
  ].join('\n')
}

function entries(spec, translated) {
  return translatableStrings()
    .map(({ en, vi }) =>
      [
        `#. module: ${spec.name}`,
        `msgid "${en}"`,
        `msgstr "${translated ? vi : ''}"`,
        '',
      ].join('\n'),
    )
    .join('\n')
}

export function pot(spec) {
  return header(spec, '') + entries(spec, false)
}

export function viPo(spec) {
  return header(spec, 'vi') + entries(spec, true)
}
