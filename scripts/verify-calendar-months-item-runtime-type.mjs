import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

const packageJson = JSON.parse(read('package.json'))
const calendarUvue = read('uni_modules/uview-ultra/components/up-calendar/up-calendar.uvue')
const monthUvue = read('uni_modules/uview-ultra/components/up-calendar/month.uvue')

assert.equal(
    packageJson.scripts['verify:calendar-months-item-runtime-type'],
    'node scripts/verify-calendar-months-item-runtime-type.mjs',
    'expected package.json to expose the calendar months-item runtime type verifier'
)

// Regression: `{ ... } as SomeAlias` compiles to `new SomeAlias({ ... })`, a runtime
// constructor call. A local alias to an IMPORTED type erases at compile time, so the
// emitted `new monthsItem(...)` had no runtime binding and threw
// "ReferenceError: monthsItem is not defined" in setMonth() on H5.
// Object-literal casts must name the imported type directly so the compiler keeps the
// value-level import (and types.js keeps exporting the class).
for (const [label, source] of [['up-calendar.uvue', calendarUvue], ['month.uvue', monthUvue]]) {
    assert.doesNotMatch(
        source,
        /^\s*type\s+monthsItem\s*=/m,
        `${label} must not alias an imported type as monthsItem; casts to the alias erase to an undefined runtime constructor`
    )
    assert.doesNotMatch(
        source,
        /\bas\s+monthsItem\b/,
        `${label} must cast to UPCalendarMonthsItem directly, not to the erased monthsItem alias`
    )
}

assert.match(
    calendarUvue,
    /months\.value\.push\(\{[\s\S]*?\}\s*as\s+UPCalendarMonthsItem\)/,
    'setMonth() must build months entries via a cast to the imported UPCalendarMonthsItem'
)
assert.match(
    calendarUvue,
    /import\s*\{[^}]*\bUPCalendarMonthsItem\b[^}]*\}\s*from\s*'\.\/types\.uts'/,
    'up-calendar.uvue must import UPCalendarMonthsItem as a value from ./types.uts'
)
assert.match(
    monthUvue,
    /import\s*\{[^}]*\bUPCalendarMonthsItem\b[^}]*\}\s*from\s*'\.\/types\.uts'/,
    'month.uvue must import UPCalendarMonthsItem from ./types.uts'
)

// Guard the whole component tree against the same trap: any `type X = Y` alias whose
// right-hand side is a bare named type (not an inline `{...}` literal, which does get a
// runtime class emitted in the same file) is unsafe to use in an object-literal cast.
const componentsDir = resolve(root, 'uni_modules/uview-ultra/components')
const offenders = []
const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.uvue')) inspect(full)
    }
}
const inspect = file => {
    const source = readFileSync(file, 'utf8')
    const aliasPattern = /^[ \t]*type\s+(\w+)\s*=\s*([^\n=]+)$/gm
    for (const match of source.matchAll(aliasPattern)) {
        const alias = match[1]
        const target = match[2].trim()
        // Inline structural/union/function types emit their own runtime class or are
        // never used as constructors; only bare `type A = B` identifier aliases are risky.
        if (!/^[A-Za-z_]\w*$/.test(target)) continue
        const literalCast = new RegExp(`\\}\\s*as\\s+${alias}\\b|\\{[^{}\\n]*\\}\\s*as\\s+${alias}\\b`)
        if (literalCast.test(source)) {
            offenders.push(`${file.slice(root.length + 1).replace(/\\/g, '/')}: '${alias}' (alias of ${target})`)
        }
    }
}
walk(componentsDir)

assert.deepEqual(
    offenders,
    [],
    `object-literal casts to a bare type alias compile to 'new <alias>(...)' and throw ReferenceError at runtime; cast to the underlying type instead:\n  ${offenders.join('\n  ')}`
)

console.log('calendar months-item runtime type assertions passed')
