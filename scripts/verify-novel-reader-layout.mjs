import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const layoutJs = read('uni_modules/uview-ultra/components/up-novel-reader/layout-engine.js')
const layoutUts = read('uni_modules/uview-ultra/components/up-novel-reader/layout-engine.uts')
const measureJs = read('uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.js')
const measureUts = read('uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.uts')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
    packageJson.scripts['verify:novel-reader-layout'],
    'node scripts/verify-novel-reader-layout.mjs'
)

for (const source of [layoutJs, layoutUts]) {
    for (const name of ['createLayoutKey', 'wrapText', 'paginateParagraphs', 'resolveAnchor']) {
        assert.match(source, new RegExp(name))
    }
    assert.match(source, /startOffset/)
    assert.match(source, /endOffset/)
    assert.match(source, /pageCount/)
    assert.match(source, /charOffsetToPage/)
}

for (const source of [measureJs, measureUts]) {
    assert.match(source, /measureTextWidth/)
    assert.match(source, /createMeasureText/)
    assert.match(source, /measureContainer/)
}

console.log('novel reader layout assertions passed')
