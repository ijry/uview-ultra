import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')

const swipeVue = read('uni_modules/uview-ultra/components/up-swipe-action-item/up-swipe-action-item.vue')
const swipeUvue = read('uni_modules/uview-ultra/components/up-swipe-action-item/up-swipe-action-item.uvue')
const swipeProps = read('uni_modules/uview-ultra/components/up-swipe-action-item/props.js')
const swipePropsUts = read('uni_modules/uview-ultra/components/up-swipe-action-item/props.uts')
const swipeDefaults = read('uni_modules/uview-ultra/components/up-swipe-action-item/swipeActionItem.js')
const swipeDefaultsUts = read('uni_modules/uview-ultra/components/up-swipe-action-item/swipeActionItem.uts')
const swipeWxs = read('uni_modules/uview-ultra/components/up-swipe-action-item/index.wxs')
const swipeTypes = read('uni_modules/uview-ultra/types/comps/swipeActionItem.d.ts')
const swipeDemo = read('pages/componentsA/swipeAction/swipeAction.uvue')
const changelog = read('uni_modules/uview-ultra/changelog.md')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
	packageJson.scripts['verify:swipe-action-scrolling'],
	'node scripts/verify-swipe-action-scrolling.mjs',
	'expected package.json to expose verify:swipe-action-scrolling'
)

for (const [name, source] of [
	['Vue default config', swipeDefaults],
	['UTS default config', swipeDefaultsUts]
]) {
	assert.match(source, /scrolling\s*:\s*false/, `expected ${name} to include scrolling: false`)
}

for (const [name, source] of [
	['Vue props', swipeProps],
	['UTS props', swipePropsUts],
	['UVue component props', swipeUvue]
]) {
	assert.match(source, /scrolling\s*:\s*\{[\s\S]*type:\s*Boolean/, `expected ${name} to declare scrolling Boolean prop`)
}

for (const [name, source] of [
	['Vue component', swipeVue],
	['UVue component', swipeUvue]
]) {
	assert.match(
		source,
		/defineEmits\(\[[\s\S]*['"]update:scrolling['"][\s\S]*['"]scrolling['"][\s\S]*\]\)/,
		`expected ${name} emits to include update:scrolling and scrolling`
	)
	assert.match(
		source,
		/setScrolling[\s\S]*emit\(['"]update:scrolling['"][\s\S]*emit\(['"]scrolling['"]/,
		`expected ${name} to emit both model and event updates`
	)
	assert.match(source, /setScrolling\(true\)/, `expected ${name} to set scrolling true during horizontal swipe`)
	assert.match(source, /setScrolling\(false\)/, `expected ${name} to release scrolling`)
	assert.match(source, /touchcancel/, `expected ${name} to support touchcancel release`)
}

assert.match(
	swipeVue,
	/@touchcancel="wxs\.touchcancel"/,
	'expected Vue WXS template branch to bind touchcancel'
)
assert.match(
	swipeVue,
	/@touchcancel="touchcancel"/,
	'expected Vue normal JS template branch to bind touchcancel'
)
assert.match(
	swipeUvue,
	/@touchcancel="touchcancel"/,
	'expected UVue template branch to bind touchcancel'
)

assert.match(
	swipeWxs,
	/callMethod\(['"]setScrolling['"],\s*true\)/,
	'expected WXS branch to set scrolling true during horizontal swipe'
)
assert.match(
	swipeWxs,
	/callMethod\(['"]setScrolling['"],\s*false\)/,
	'expected WXS branch to release scrolling'
)
assert.match(swipeWxs, /function touchcancel/, 'expected WXS branch to define touchcancel')

assert.match(swipeTypes, /scrolling\?\s*:\s*boolean/, 'expected TypeScript definition to include scrolling?: boolean')
assert.match(
	swipeTypes,
	/\['onUpdate:scrolling'\]\?\s*:\s*\(value:\s*boolean\)\s*=>\s*any/,
	'expected TypeScript definition to include onUpdate:scrolling'
)
assert.match(swipeTypes, /onScrolling\?\s*:\s*\(value:\s*boolean\)\s*=>\s*any/, 'expected TypeScript definition to include onScrolling')
assert.match(swipeDemo, /v-model:scrolling="swipeScrolling"/, 'expected demo page to bind v-model:scrolling')
assert.match(swipeDemo, /:scroll-y="!swipeScrolling"/, 'expected demo scroll-view to pause while swipe scrolling')
assert.match(
	changelog,
	/swipe-action-item[\s\S]*(v-model:scrolling|scrolling)|scrolling[\s\S]*swipe-action-item/,
	'expected changelog to mention swipe-action-item scrolling support'
)

console.log('uview-ultra swipe action scrolling assertions passed')
