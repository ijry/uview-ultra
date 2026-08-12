import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const dir = 'uni_modules/uview-ultra/components/up-novel-reader'
const packageJson = JSON.parse(read('package.json'))

assert.equal(packageJson.scripts['verify:novel-reader-ui'], 'node scripts/verify-novel-reader-ui.mjs')
for (const suffix of ['vue', 'uvue']) {
    const main = read(`${dir}/up-novel-reader.${suffix}`)
    const content = read(`${dir}/reader-content.${suffix}`)
    const toolbar = read(`${dir}/reader-toolbar.${suffix}`)
    const catalog = read(`${dir}/reader-catalog.${suffix}`)
    const settings = read(`${dir}/reader-settings.${suffix}`)
    assert.match(main, /up-novel-reader/)
    for (const event of [
        'chapter-request', 'chapter-prefetch', 'progress-change', 'settings-change',
        'bookmark-change', 'reading-time-change', 'mode-change', 'toolbar-change',
        'layout-ready', 'retry', 'back'
    ]) assert.match(main, new RegExp(event))
    assert.match(content, /scroll-view/)
    assert.match(content, /swiper/)
    assert.match(toolbar, /arrow-left/)
    assert.match(toolbar, /setting/)
    assert.match(catalog, /chapter-select/)
    assert.match(settings, /fontSize/)
    assert.match(settings, /paragraphSpacing/)
}
for (const theme of ['day', 'paper', 'green', 'night', 'dark']) {
    assert.match(read(`${dir}/theme-vars.scss`), new RegExp(theme))
}
console.log('novel reader UI assertions passed')
