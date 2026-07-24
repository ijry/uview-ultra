import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')

const sliderVue = read('uni_modules/uview-ultra/components/up-slider/up-slider.vue')
const sliderUvue = read('uni_modules/uview-ultra/components/up-slider/up-slider.uvue')
const sliderDemo = read('pages/componentsB/slider/slider.uvue')
const changelog = read('uni_modules/uview-ultra/changelog.md')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
    packageJson.scripts['verify:slider-decimal-step'],
    'node scripts/verify-slider-decimal-step.mjs',
    'expected package.json to expose verify:slider-decimal-step'
)

for (const [label, source] of [
    ['up-slider.vue', sliderVue],
    ['up-slider.uvue', sliderUvue]
]) {
    assert.doesNotMatch(
        source,
        /parseInt\(\s*props\.step/,
        `${label}: format logic must not parse decimal step with parseInt`
    )
    for (const helper of ['toSliderNumber', 'getSliderStep', 'normalizeSliderValue', 'formatByStep']) {
        assert.match(source, new RegExp(`${helper}\\(`), `${label}: expected ${helper} helper`)
    }
    assert.match(
        source,
        /Math\.round\(\(boundedValue\s*-\s*min\)\s*\/\s*step\)/,
        `${label}: expected step rounding to use min as the step base`
    )
}

assert.match(
    sliderVue,
    /import\s+\{\s*digitLength,\s*strip\s*\}\s+from\s+'..\/..\/libs\/function\/digit\.js'/,
    'expected Vue slider to import decimal precision helpers'
)

const digitLength = value => {
    const eSplit = Number(value).toString().split(/[eE]/)
    const len = (eSplit[0].split('.')[1] || '').length - +(eSplit[1] || 0)
    return len > 0 ? len : 0
}

const strip = (num, precision = 15) => +parseFloat(Number(num).toPrecision(precision))

const normalize = (...values) => {
    const value = values[0]
    const precision = Math.min(15, Math.max(...values.map(item => digitLength(item))))
    return Number(strip(value).toFixed(precision))
}

const formatByStep = ({ value, min = 0, max = 100, step = 1, lower = min, upper = max }) => {
    const safeStep = Number.isFinite(Number(step)) && Number(step) > 0 ? Number(step) : 1
    const safeMin = Number(min)
    const safeMax = Number(max)
    const safeLower = Math.min(Math.max(Number(lower), safeMin), safeMax)
    const safeUpper = Math.max(Math.min(Number(upper), safeMax), safeLower)
    const boundedValue = Math.max(safeLower, Math.min(Number(value), safeUpper))
    const steps = Math.round((boundedValue - safeMin) / safeStep)
    const formatted = normalize(safeMin + steps * safeStep, safeMin, safeMax, safeStep, boundedValue)
    return normalize(Math.max(safeLower, Math.min(formatted, safeUpper)), safeMin, safeMax, safeStep, boundedValue)
}

assert.equal(formatByStep({ value: 0.34, min: 0, max: 1, step: 0.1 }), 0.3)
assert.equal(formatByStep({ value: 0.36, min: 0, max: 1, step: '0.1' }), 0.4)
assert.equal(formatByStep({ value: 2.74, min: 1, max: 4, step: 0.5 }), 2.5)
assert.equal(formatByStep({ value: 0.16, min: 0.05, max: 0.35, step: 0.1 }), 0.15)
assert.equal(formatByStep({ value: 0.95, min: 0, max: 1, step: 0 }), 1)
assert.equal(formatByStep({ value: 0.92, min: 0, max: 1, step: 0.1, lower: 0, upper: 0.7 }), 0.7)
assert.equal(formatByStep({ value: 0.08, min: 0, max: 1, step: 0.1, lower: 0.3, upper: 1 }), 0.3)

assert.match(sliderDemo, /:step="0\.1"/, 'expected demo page to include a decimal step example')
assert.match(sliderDemo, /value3\s*=\s*ref\(0\.3\)/, 'expected demo decimal value to initialize at 0.3')
assert.match(changelog, /slider[\s\S]*小数步长|小数步长[\s\S]*slider/, 'expected changelog to mention slider decimal step')

console.log('slider decimal step assertions passed')
