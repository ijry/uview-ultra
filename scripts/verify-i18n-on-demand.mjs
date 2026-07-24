import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const i18nRoot = path.join(repoRoot, 'uni_modules/uview-ultra/libs/i18n')
const localesDir = path.join(i18nRoot, 'locales')
const indexPath = path.join(i18nRoot, 'index.js')
const indexUtsPath = path.join(i18nRoot, 'index.uts')
const packsPath = path.join(i18nRoot, 'locale-packs.js')
const packsUtsPath = path.join(i18nRoot, 'locale-packs.uts')
const mainIndexPath = path.join(repoRoot, 'uni_modules/uview-ultra/index.js')
const mainIndexUtsPath = path.join(repoRoot, 'uni_modules/uview-ultra/index.uts')
const changelogPath = path.join(repoRoot, 'uni_modules/uview-ultra/changelog.md')

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8')
}

function listLocaleFiles(ext) {
    if (!fs.existsSync(localesDir)) return []
    return fs.readdirSync(localesDir).filter((name) => name.endsWith(ext)).sort()
}

function assertNoOptionalLocaleImport(source, label) {
    assert.match(source, /zh-Hans/, `${label}: expected zh-Hans default locale`)
    assert.doesNotMatch(
        source,
        /from\s+['"]\.\/locales\/(?!zh-Hans(?:\.(?:js|uts))?['"])[^'"]+['"]/,
        `${label}: must not statically import non zh-Hans locale files`
    )
    assert.doesNotMatch(
        source,
        /export\s+\{[^}]*\ben\b/,
        `${label}: must not re-export optional locale packs`
    )
}

// ---------- static ----------
const indexSource = read(indexPath)
const indexUtsSource = read(indexUtsPath)
const mainIndexSource = read(mainIndexPath)
const mainIndexUtsSource = read(mainIndexUtsPath)
const changelog = read(changelogPath)

assertNoOptionalLocaleImport(indexSource, 'i18n/index.js')
assertNoOptionalLocaleImport(indexUtsSource, 'i18n/index.uts')

const requiredLocaleJs = [
    'zh-Hans.js',
    'zh-Hant.js',
    'en.js',
    'es.js',
    'fr.js',
    'de.js',
    'ko.js',
    'ja.js',
    'ru.js',
    'th.js',
    'all.js'
]
const requiredLocaleUts = requiredLocaleJs.map((name) => name.replace(/\.js$/, '.uts'))
for (const name of requiredLocaleJs) {
    assert.ok(fs.existsSync(path.join(localesDir, name)), `missing locale module: ${name}`)
}
for (const name of requiredLocaleUts) {
    assert.ok(fs.existsSync(path.join(localesDir, name)), `missing locale module: ${name}`)
}
assert.ok(fs.existsSync(packsPath), 'missing locale-packs.js')
assert.ok(fs.existsSync(packsUtsPath), 'missing locale-packs.uts')

const packsSource = read(packsPath)
const packsUtsSource = read(packsUtsPath)
for (const name of ['en', 'ja', 'zhHant', 'all']) {
    assert.match(packsSource, new RegExp(name), `locale-packs.js should export ${name}`)
    assert.match(packsUtsSource, new RegExp(name), `locale-packs.uts should export ${name}`)
}

assert.match(mainIndexSource, /registerLocale/, 'main index.js must export registerLocale')
assert.match(mainIndexSource, /allLocales|all as allLocales/, 'main index.js must export allLocales')
assert.match(mainIndexSource, /\ben\b/, 'main index.js must export en locale pack')
assert.match(mainIndexSource, /locale-packs\.js/, 'main index.js must import locale-packs.js')
assert.match(mainIndexUtsSource, /locale-packs\.uts/, 'main index.uts must import locale-packs.uts')
assert.match(mainIndexUtsSource, /registerLocale/, 'main index.uts must export registerLocale')
assert.match(mainIndexUtsSource, /allLocales|all as allLocales/, 'main index.uts must export allLocales')
assert.match(changelog, /feat!|重大变更|按需/, 'changelog must mark breaking on-demand i18n change')
assert.match(changelog, /#908/, 'changelog should reference #908')

// ---------- behavioral (sandbox import JS only) ----------
function installUniMock(initialLocale = 'zh-Hans') {
    const listeners = []
    globalThis.uni = {
        __locale: initialLocale,
        getLocale() {
            return this.__locale
        },
        setLocale(locale) {
            this.__locale = locale
            listeners.forEach((fn) => fn(locale))
        },
        onLocaleChange(fn) {
            listeners.push(fn)
        }
    }
    return listeners
}

async function importI18nFresh() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uview-ultra-i18n-'))
    const target = path.join(tempDir, `i18n-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`)
    let source = read(indexPath)
    source = source.replace(
        /from\s+['"](\.\/locales\/[^'"]+)['"]/g,
        (full, rel) => {
            const abs = pathToFileURL(path.resolve(i18nRoot, rel)).href
            return `from '${abs}'`
        }
    )
    fs.writeFileSync(target, source, 'utf8')
    return import(pathToFileURL(target).href + `?t=${Date.now()}`)
}

async function importLocalePack(relName) {
    const filePath = path.join(localesDir, relName)
    return import(pathToFileURL(filePath).href + `?t=${Date.now()}`)
}

async function runBehavior() {
    installUniMock('zh-Hans')
    const mod = await importI18nFresh()
    const {
        t,
        registerLocale,
        hasLocale,
        getLocale,
        setLocale
    } = mod

    assert.equal(typeof t, 'function')
    assert.equal(typeof registerLocale, 'function')
    assert.equal(hasLocale('zh-Hans'), true)
    assert.equal(hasLocale('en'), false)
    // ultra maps dotted keys to underscore keys
    assert.equal(t('up.common.cancel'), '取消')
    assert.equal(t('up_common_cancel'), '取消')

    setLocale('en')
    assert.equal(getLocale(), 'en')
    assert.equal(t('up.common.cancel'), '取消')

    const enMod = await importLocalePack('en.js')
    registerLocale('en', enMod.default)
    assert.equal(hasLocale('en'), true)
    assert.equal(t('up.common.cancel'), 'Cancel')

    const jaMod = await importLocalePack('ja.js')
    registerLocale({ ja: jaMod.default })
    setLocale('ja')
    assert.equal(t('up.common.cancel'), jaMod.default['up_common_cancel'])

    setLocale('zh-Hans')
    const withParam = t('up.calendar.daysExceed', { days: 3 })
    assert.match(String(withParam), /3/)

    const allMod = await importLocalePack('all.js')
    assert.equal(typeof allMod.default, 'object')
    assert.ok(allMod.default.en || allMod.default['en'])
    registerLocale(allMod.default)
    assert.equal(hasLocale('ru'), true)
    assert.equal(hasLocale('th'), true)
}

await runBehavior()
console.log('i18n on-demand assertions passed')

