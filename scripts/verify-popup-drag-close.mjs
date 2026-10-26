import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const component = name => `uni_modules/uview-ultra/components/${name}/${name}`

const packageJson = JSON.parse(read('package.json'))

assert.equal(
	packageJson.scripts['verify:popup-drag-close'],
	'node scripts/verify-popup-drag-close.mjs',
	'expected package.json to expose verify:popup-drag-close'
)

// .vue 写 function name(){}，.uvue 写 const name = (): void => {}，
// 断言只关心函数体，不关心声明形式
const bodyOf = (source, name) => {
	const opener = new RegExp(`(?:function ${name}\\s*\\(|const ${name}\\s*=[^{;]*?=>\\s*)`)
	const at = source.search(opener)
	if (at === -1) return null
	const from = source.indexOf('{', at)
	if (from === -1) return null
	let depth = 0
	for (let i = from; i < source.length; i++) {
		if (source[i] === '{') depth++
		else if (source[i] === '}' && --depth === 0) return source.slice(from + 1, i)
	}
	return null
}

// 两个变体都要改到：.vue 走各端，.uvue 走 uni-app x
const POPUP_VARIANTS = [
	['Vue', read(`${component('up-popup')}.vue`)],
	['UVue', read(`${component('up-popup')}.uvue`)]
]

runChecks(() => {
	for (const [variant, source] of POPUP_VARIANTS) {
		console.log(`checking up-popup ${variant}`)

		// 模板把拖动手势接到 content 上，且样式合并 dragStyle
		assert.match(source, /@touchstart="onDragTouchStart"/)
		assert.match(source, /@touchmove="onDragTouchMove"/)
		assert.match(source, /@touchend="onDragTouchEnd"/)
		assert.match(source, /@touchcancel="onDragTouchEnd"/)
		assert.match(source, /:style="\[contentStyle, dragStyle\]"/)

		// .uvue 的 props 内联在组件里；.vue 走 props.js（循环外统一断言）

		// 仅 bottom 且非 pageInline 生效（.vue 是单表达式 computed，直接对源码断言）
		assert.match(source, /props\.dragClose\s*&&\s*props\.mode === ['"]bottom['"]\s*&&\s*!props\.pageInline/)

		// 跟手位移：向下才进入拖动态；松手超阈值走 close，否则回弹
		const move = bodyOf(source, 'onDragTouchMove')
		assert.ok(move, `${variant}: onDragTouchMove missing`)
		assert.match(move, /delta\s*<=\s*0/)
		assert.match(move, /dragOffset\.value\s*=\s*delta/)

		const end = bodyOf(source, 'onDragTouchEnd')
		assert.ok(end, `${variant}: onDragTouchEnd missing`)
		assert.match(end, /offset >= threshold/)
		assert.match(end, /close\(/)
		assert.match(end, /dragOffset\.value\s*=\s*0/)

		// 阈值 prop 默认值也要进 props 声明（.vue 走 props.js）
	}

	// .vue 的 props 来自 props.js，那里也要有同名的两项
	const propsJs = read('uni_modules/uview-ultra/components/up-popup/props.js')
	assert.match(propsJs, /dragClose:\s*{[\s\S]*?default:\s*false/)
	assert.match(propsJs, /dragCloseThreshold:\s*{[\s\S]*?default:\s*80/)
})

function runChecks(fn) {
	fn()
	console.log('verify-popup-drag-close: all assertions passed')
}
