import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const buttonVue = read('uni_modules/uview-ultra/components/up-button/up-button.vue')
const buttonUvue = read('uni_modules/uview-ultra/components/up-button/up-button.uvue')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
    packageJson.scripts['verify:button-plain-background'],
    'node scripts/verify-button-plain-background.mjs'
)

for (const [label, source] of [
    ['vue', buttonVue],
    ['uvue', buttonUvue],
]) {
    assert.match(
        source,
        /\$up-button-plain-background-color:\s*transparent\s*!default;/,
        `expected ${label} plain button background to default to transparent`
    )
    assert.doesNotMatch(
        source,
        /\$up-button-plain-background-color:\s*#fff(?:fff)?\s*!default;/i,
        `expected ${label} plain button background not to default to white`
    )
    assert.match(
        source,
        /&--plain\s*\{[\s\S]*background-color:\s*\$up-button-plain-background-color/,
        `expected ${label} plain class to keep using the plain background variable`
    )
}

console.log('uview-ultra button plain background assertions passed')
