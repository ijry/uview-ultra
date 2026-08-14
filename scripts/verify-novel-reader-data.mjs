import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const normalizerJs = read('uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.js')
const normalizerUts = read('uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.uts')
const coreJs = read('uni_modules/uview-ultra/components/up-novel-reader/reader-core.js')
const coreUts = read('uni_modules/uview-ultra/components/up-novel-reader/reader-core.uts')
const persistenceJs = read('uni_modules/uview-ultra/components/up-novel-reader/persistence.js')
const persistenceUts = read('uni_modules/uview-ultra/components/up-novel-reader/persistence.uts')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
    packageJson.scripts['verify:novel-reader-data'],
    'node scripts/verify-novel-reader-data.mjs'
)

for (const source of [normalizerJs, normalizerUts]) {
    assert.match(source, /normalizeContent/)
    assert.match(source, /normalizeProgress/)
    assert.match(source, /startOffset/)
    assert.match(source, /endOffset/)
}

for (const source of [coreJs, coreUts]) {
    for (const name of [
        'mergeReaderSettings',
        'normalizeMode',
        'setProgress',
        'toggleBookmark',
        'createBookmark',
        'startReading',
        'pauseReading',
        'consumeReadingTime'
    ]) {
        assert.match(source, new RegExp(name))
    }
    assert.match(source, /fontSize/)
    assert.match(source, /paragraphSpacing/)
}

for (const source of [persistenceJs, persistenceUts]) {
    assert.match(source, /STORAGE_VERSION/)
    assert.match(source, /DEFAULT_STORAGE_PREFIX/)
    assert.match(source, /createStorageKey/)
    assert.match(source, /readPersistedState/)
    assert.match(source, /writePersistedState/)
    assert.match(source, /removeStorageSync/)
}

console.log('novel reader data assertions passed')
