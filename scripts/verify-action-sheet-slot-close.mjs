import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')

const packageJson = JSON.parse(read('package.json'))
const actionSheetVue = read('uni_modules/uview-ultra/components/up-action-sheet/up-action-sheet.vue')
const actionSheetUvue = read('uni_modules/uview-ultra/components/up-action-sheet/up-action-sheet.uvue')
const cellVue = read('uni_modules/uview-ultra/components/up-cell/up-cell.vue')

assert.equal(
	packageJson.scripts['verify:action-sheet-slot-close'],
	'node scripts/verify-action-sheet-slot-close.mjs',
	'expected package.json to expose verify:action-sheet-slot-close'
)

for (const [source, name] of [
	[actionSheetVue, 'Vue'],
	[actionSheetUvue, 'UVue']
]) {
	assert.match(
		source,
		/<view[\s\S]*action-sheet__slot[\s\S]*@tap="slotClickHandler"[\s\S]*>\s*<slot[^>]*>\s*<\/slot>\s*<\/view>/,
		`expected ${name} action-sheet custom slot content to be wrapped by slotClickHandler`
	)
	assert.match(
		source,
		/<template v-else>[\s\S]*<scroll-view scroll-y class="up-action-sheet__item-wrap"/,
		`expected ${name} action-sheet built-in actions renderer to remain the fallback`
	)
	assert.match(
		source,
		/slotClickHandler[\s\S]*closeOnClickAction[\s\S]*emit\('update:show'\)[\s\S]*emit\('close'\)/,
		`expected ${name} slotClickHandler to honor closeOnClickAction`
	)
}

assert.match(
	actionSheetVue,
	/provide\('upActionSheet',[\s\S]*slotClickHandler/,
	'expected Vue action-sheet to provide its slot closer'
)
assert.match(
	cellVue,
	/inject\('upActionSheet', null\)/,
	'expected Vue up-cell to optionally inject an action-sheet slot closer'
)
assert.match(
	cellVue,
	/props\.stop && typeof upActionSheet\?\.slotClickHandler === 'function'[\s\S]*upActionSheet\.slotClickHandler\(\)/,
	'expected Vue up-cell to close an ancestor action-sheet before stopping propagation'
)

console.log('action-sheet slot close assertions passed')
