import assert from 'node:assert/strict'
import fs from 'node:fs'

const TYPES_DIR = 'uni_modules/uview-ultra/types'
const PACKAGE_NAME = 'uview-ultra'
const BARREL_BEGIN = '\t// ---- 组件类型：与 types/comps/*.d.ts 同步，勿手工增删 ----'
const BARREL_END = '\t// ---- 组件类型结束 ----'

function toAbs(relativePath) {
    return new URL('../' + relativePath, import.meta.url)
}

function read(relativePath) {
    return fs.readFileSync(toAbs(relativePath), 'utf8')
}

function assertContains(content, matcher, message) {
    assert.match(content, matcher, message)
}

function collectBarrelExports() {
    const files = fs
        .readdirSync(toAbs(TYPES_DIR + '/comps'))
        .filter((file) => file.endsWith('.d.ts') && file !== '_common.d.ts')
        .sort()

    const lines = []
    for (const file of files) {
        const source = read(TYPES_DIR + '/comps/' + file)
        const module = './comps/' + file.slice(0, -'.d.ts'.length)
        for (const match of source.matchAll(/^declare interface ([A-Za-z][\w$]*)/gm)) {
            if (match[1].startsWith('_')) continue
            lines.push("export type " + match[1] + " = import('" + module + "')['" + match[1] + "']")
        }
        for (const match of source.matchAll(/^export declare const (\w*Ref)\s*:/gm)) {
            lines.push("export type " + match[1] + " = typeof import('" + module + "')['" + match[1] + "']")
        }
    }
    return lines
}

function readBarrelBlock(indexTypes) {
    const begin = indexTypes.indexOf(BARREL_BEGIN)
    const end = indexTypes.indexOf(BARREL_END)
    assert.ok(begin !== -1, 'expected barrel begin marker in types/index.d.ts')
    assert.ok(end > begin, 'expected barrel end marker after begin marker in types/index.d.ts')
    return indexTypes
        .slice(begin + BARREL_BEGIN.length, end)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
}

if (process.argv.includes('--print')) {
    console.log([BARREL_BEGIN, ...collectBarrelExports().map((line) => '\t' + line), BARREL_END].join('\n'))
    process.exit(0)
}

try {
    const indexTypes = read(TYPES_DIR + '/index.d.ts')
    const expected = collectBarrelExports()
    const actual = readBarrelBlock(indexTypes)

    assert.ok(expected.length > 120, 'expected to collect component types, got ' + expected.length)
    assert.deepEqual(
        actual,
        expected,
        "types/index.d.ts barrel is out of sync with types/comps/*.d.ts; regenerate with 'node scripts/verify-types-barrel-exports.mjs --print'"
    )

    assertContains(
        indexTypes,
        /export type FormRef = typeof import\('\.\/comps\/form'\)\['FormRef'\]/,
        'expected FormRef re-export from package entry'
    )
    assertContains(
        indexTypes,
        /export type ButtonProps = import\('\.\/comps\/button'\)\['ButtonProps'\]/,
        'expected ButtonProps re-export from package entry'
    )

    const moduleBody = indexTypes.slice(indexTypes.indexOf("declare module '" + PACKAGE_NAME + "'"))
    assert.ok(
        moduleBody.indexOf(BARREL_BEGIN) !== -1 &&
            moduleBody.indexOf(BARREL_BEGIN) < moduleBody.indexOf('\n}'),
        "expected barrel block inside declare module '" + PACKAGE_NAME + "'"
    )

    const compsTypes = read(TYPES_DIR + '/comps.d.ts')
    assertContains(compsTypes, /interface UviewUltraComponents \{/, 'expected named up- component registry')
    assertContains(
        compsTypes,
        /type UviewUltraAliasComponents<P extends string> = \{/,
        'expected prefix alias mapper'
    )
    assertContains(
        compsTypes,
        /interface GlobalComponents\s+extends UviewUltraComponents,\s+UviewUltraAliasComponents<'u-'>,\s+UviewUltraAliasComponents<'u--'>/,
        'expected GlobalComponents to register up- / u- / u-- prefixes'
    )
    assertContains(
        compsTypes,
        /\['up-root-toast-host'\]: typeof import\('\.\/comps\/rootToastHost'\)\['RootToastHost'\]/,
        'expected up- registry entries to be kept verbatim'
    )

    console.log("verify-types-barrel-exports: OK (" + expected.length + " component types re-exported from '" + PACKAGE_NAME + "')")
} catch (error) {
    console.error('verify-types-barrel-exports: FAILED')
    console.error(error.message)
    process.exit(1)
}
