import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const packageJson = JSON.parse(read('package.json'))
const tabbarItemVue = read('uni_modules/uview-ultra/components/up-tabbar-item/up-tabbar-item.vue')
const tabbarItemUvue = read('uni_modules/uview-ultra/components/up-tabbar-item/up-tabbar-item.uvue')
const tabbarVue = read('uni_modules/uview-ultra/components/up-tabbar/up-tabbar.vue')
const tabbarUvue = read('uni_modules/uview-ultra/components/up-tabbar/up-tabbar.uvue')
const propsVue = read('uni_modules/uview-ultra/components/up-tabbar-item/props.js')
const propsUts = read('uni_modules/uview-ultra/components/up-tabbar-item/props.uts')
const defaultsVue = read('uni_modules/uview-ultra/components/up-tabbar-item/tabbarItem.js')
const defaultsUts = read('uni_modules/uview-ultra/components/up-tabbar-item/tabbarItem.uts')
const types = read('uni_modules/uview-ultra/types/comps/tabbarItem.d.ts')

assert.equal(
	packageJson.scripts['verify:tabbar-mid-button-top-border'],
	'node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verify-tabbar-mid-button-top-border.mjs'
)

for (const [name, source] of [
	['Vue tabbar', tabbarVue],
	['UVue tabbar', tabbarUvue]
]) {
	assert.match(source, /borderColor:\s*props\.borderColor/, `expected ${name} to expose borderColor to items`)
	assert.match(source, /props\.value[\s\S]*props\.activeColor[\s\S]*props\.inactiveColor[\s\S]*props\.borderColor/, `expected ${name} to update items when borderColor changes`)
	assert.match(source, /tabbarContentTop/, `expected ${name} to expose the measured tabbar top to items`)
	assert.match(source, /tabbarContentMeasured/, `expected ${name} to distinguish an unmeasured top from top zero`)
	assert.match(source, /midButtonBorderTopOffset/, `expected ${name} to expose the top-border center offset`)
}

for (const [name, source] of [
	['Vue props', propsVue],
	['UTS props', propsUts],
	['Vue defaults', defaultsVue],
	['UTS defaults', defaultsUts],
	['types', types]
]) {
	assert.match(source, /midButtonBgColor/, `expected ${name} to include midButtonBgColor`)
	assert.match(source, /midButtonIconColor/, `expected ${name} to include midButtonIconColor`)
	assert.match(source, /midButtonIconSize/, `expected ${name} to include midButtonIconSize`)
	assert.match(source, /midButtonBoxShadow/, `expected ${name} to include midButtonBoxShadow`)
	assert.match(source, /midButtonInnerBoxShadow/, `expected ${name} to include midButtonInnerBoxShadow`)
	assert.match(source, /midButtonOffsetY/, `expected ${name} to include midButtonOffsetY`)
}

for (const [name, source] of [
	['Vue tabbar item', tabbarItemVue],
	['UVue tabbar item', tabbarItemUvue]
]) {
	assert.match(source, /class="up-tabbar-item__mid-button-border"/, `expected ${name} to include border clip view`)
	assert.match(source, /class="up-tabbar-item__mid-button-border-circle"/, `expected ${name} to include full circle border view`)
	assert.match(source, /midButtonContentStyle/, `expected ${name} to move content without moving root`)
	assert.match(source, /midButtonIconStyle/, `expected ${name} to pass stable icon z-index style`)
	assert.match(source, /hasMidButtonText/, `expected ${name} to detect text and no-text layouts`)
	assert.match(source, /midButtonBorderStyle/, `expected ${name} to calculate border clip height`)
	assert.match(source, /midButtonInnerStyle/, `expected ${name} to render configurable inner background`)
	assert.match(source, /midButtonShellStyle/, `expected ${name} to render configurable shell shadow`)
	assert.match(source, /midButtonOffsetValue/, `expected ${name} to normalize mid button offset`)
	assert.match(source, /:style="midButtonBorderCircleStyle"/, `expected ${name} to style circle border dynamically`)
	assert.match(source, /borderColor:\s*''/, `expected ${name} to keep parent borderColor in item state`)
	assert.match(source, /midButtonBorderCircleStyle[\s\S]*borderColor/, `expected ${name} to apply parent borderColor to mid button border`)
	assert.match(source, /\.up-tabbar-item__icon--mid-button[\s\S]*width:\s*64px[\s\S]*height:\s*64px/, `expected ${name} to use 64px mid button size`)
	assert.match(source, /\.up-tabbar-item__mid-button-border[\s\S]*overflow:\s*hidden[\s\S]*z-index:\s*0/, `expected ${name} to clip border under inner circle`)
	assert.match(source, /\.up-tabbar-item__mid-button-border-circle[\s\S]*width:\s*64px[\s\S]*height:\s*64px/, `expected ${name} to draw a full 64px circle`)
	assert.match(source, /\.up-tabbar-item__mid-button-inner[\s\S]*z-index:\s*1/, `expected ${name} to place inner circle over border`)
	assert.match(source, /(position:\s*'relative'[\s\S]*zIndex:\s*2|style\['position'\]\s*=\s*'relative'[\s\S]*style\['zIndex'\]\s*=\s*2)/, `expected ${name} to place icon over inner circle via inline style`)
	assert.doesNotMatch(source, /15\.5[\s\S]*7/, `expected ${name} not to derive clipping from fixed text baselines`)
	assert.match(source, /calculateMidButtonBorderClipHeight/, `expected ${name} to use the shared geometry calculation`)
	assert.match(source, /updateMidButtonBorderClip/, `expected ${name} to update clipping from measured layout`)
	assert.match(source, /midButtonBorderClipHeightValue/, `expected ${name} to render the measured clip height`)
	assert.doesNotMatch(source, /up-tabbar-item--mid-button-cover/, `expected ${name} to remove opaque cover`)
	assert.doesNotMatch(source, /transform:\s*translateY\(-10px\)/, `expected ${name} to avoid moving the item root`)
	assert.doesNotMatch(source, /width:\s*70px|height:\s*70px/, `expected ${name} to avoid the old 70px mid button size`)
}

const geometryUts = read('uni_modules/uview-ultra/components/up-tabbar-item/midButtonGeometry.uts')

assert.match(geometryUts, /calculateMidButtonBorderClipHeight/, 'expected UTS to provide the same geometry calculation')
assert.match(geometryUts, /Math\.min\(Math\.max\(/, 'expected UTS geometry to clamp the clip height')

const { calculateMidButtonBorderClipHeight } = await import('../uni_modules/uview-ultra/components/up-tabbar-item/midButtonGeometry.js')

assert.equal(calculateMidButtonBorderClipHeight(0, -23.5, 0.25), 23.75)
assert.equal(calculateMidButtonBorderClipHeight({ contentTop: 0, circleTop: -23.5, borderTopOffset: 0.25 }), 23.75)
assert.equal(calculateMidButtonBorderClipHeight(0, -12.25, 0), 12.25)
assert.equal(calculateMidButtonBorderClipHeight(10, -100, 0.25), 64)
assert.equal(calculateMidButtonBorderClipHeight(10, 100, 0.25), 0)
assert.equal(calculateMidButtonBorderClipHeight(Number.NaN, 0, 0.25), 0)

console.log('uview-ultra tabbar mid-button top border assertions passed')
