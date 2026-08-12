import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const componentDir = resolve(root, 'uni_modules/uview-ultra/components/up-novel-reader')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
    packageJson.scripts['verify:novel-reader-props'],
    'node scripts/verify-novel-reader-props.mjs'
)

for (const fileName of ['novelReader.js', 'novelReader.uts', 'props.js', 'props.uts']) {
    assert.equal(existsSync(resolve(componentDir, fileName)), true, `${fileName} should exist`)
}

const defaultsJs = read('uni_modules/uview-ultra/components/up-novel-reader/novelReader.js')
const defaultsUts = read('uni_modules/uview-ultra/components/up-novel-reader/novelReader.uts')
const propsJs = read('uni_modules/uview-ultra/components/up-novel-reader/props.js')
const propsUts = read('uni_modules/uview-ultra/components/up-novel-reader/props.uts')
const registryJs = read('uni_modules/uview-ultra/libs/config/props.js')
const registryUts = read('uni_modules/uview-ultra/libs/config/props.uts')

for (const source of [defaultsJs, defaultsUts]) {
    for (const field of [
        'chapters',
        'currentChapter',
        'loading',
        'error',
        'bookId',
        'storageKey',
        'persist',
        'initialProgress',
        'progress',
        'initialBookmarks',
        'bookmarks',
        'defaultSettings',
        'settings',
        'mode',
        'showBack',
        'autoBack',
        'backIcon',
        'safeAreaInsetTop',
        'safeAreaInsetBottom',
        'preloadThreshold',
        'pageAnimation',
        'controlsAutoHide'
    ]) {
        assert.match(source, new RegExp(field), `${field} should be in defaults`)
    }
}

assert.match(propsJs, /defineMixin/)
assert.match(propsUts, /defineMixin/)
assert.match(registryJs, /NovelReader/)
assert.match(registryUts, /novelReader/)
console.log('novel reader props assertions passed')
