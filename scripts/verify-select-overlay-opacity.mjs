import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

const packageJson = JSON.parse(read('package.json'))

assert.equal(
	packageJson.scripts['verify:select-overlay-opacity'],
	'node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verify-select-overlay-opacity.mjs',
	'expected package.json to expose the select overlay opacity verifier'
)

// up-select 的遮罩此前默认 0.01，几乎不可见，用户看不出下拉已经接管了整页点击。
// 默认值改为 0.15：比 up-popup 的 0.5 浅得多，不压暗页面，但能看出遮罩存在。
const EXPECTED_DEFAULT = 0.15
const POPUP_DEFAULT = 0.5

const VARIANTS = [
	['Vue', 'uni_modules/uview-ultra/components/up-select/up-select.vue'],
	['UVue', 'uni_modules/uview-ultra/components/up-select/up-select.uvue']
]

for (const [variant, path] of VARIANTS) {
	const source = read(path)
	const declaration = source.match(/overlayOpacity:\s*\{[\s\S]*?\}/)
	assert.ok(declaration, `${variant}: expected an overlayOpacity prop declaration in up-select`)
	const defaultValue = declaration[0].match(/default:\s*([0-9.]+)/)
	assert.ok(defaultValue, `${variant}: expected overlayOpacity to declare a numeric default`)
	assert.equal(
		Number(defaultValue[1]),
		EXPECTED_DEFAULT,
		`${variant}: expected the up-select overlay default opacity to be ${EXPECTED_DEFAULT}`
	)

	// 遮罩要真的拿到这个 prop，否则改默认值等于没改
	assert.match(
		source,
		/<up-overlay[\s\S]*?:opacity="overlayOpacity"/,
		`${variant}: expected up-select to pass overlayOpacity through to up-overlay`
	)
}

// 保持"浅"的语义：只有明显低于弹窗遮罩才算浅
assert.ok(
	EXPECTED_DEFAULT < POPUP_DEFAULT,
	'the select overlay default must stay lighter than the popup overlay default'
)

for (const [label, path] of [
	['popup.js', 'uni_modules/uview-ultra/components/up-popup/popup.js'],
	['popup.uts', 'uni_modules/uview-ultra/components/up-popup/popup.uts']
]) {
	const source = read(path)
	const value = source.match(/overlayOpacity:\s*([0-9.]+)/)
	assert.ok(value, `${label}: expected a numeric overlayOpacity default`)
	assert.equal(
		Number(value[1]),
		POPUP_DEFAULT,
		`${label}: popup overlay default changed; re-check that the select default is still the lighter one`
	)
}

console.log('select overlay opacity assertions passed')
