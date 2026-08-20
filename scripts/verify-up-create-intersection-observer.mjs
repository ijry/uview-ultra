import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const component = name => `uni_modules/uview-ultra/components/${name}/${name}.vue`

const functionPath = resolve(root, 'uni_modules/uview-ultra/libs/function/index.js')
const functionSource = read('uni_modules/uview-ultra/libs/function/index.js')
const stickySource = read(component('up-sticky'))
const lazyLoadSource = read(component('up-lazy-load'))
const cateTabSource = read(component('up-cate-tab'))
const nodeSource = read('uni_modules/uview-ultra/components/up-parse/node/node.vue')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
	packageJson.scripts['verify:up-create-intersection-observer'],
	'node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verify-up-create-intersection-observer.mjs',
	'expected package.json to expose verify:up-create-intersection-observer'
)

const globalCalls = []
globalThis.uni = {
	createIntersectionObserver(...args) {
		globalCalls.push(args)
		return { source: 'global', args }
	}
}

const functionModule = await import(`${pathToFileURL(functionPath).href}?verify=${Date.now()}`)
const { upCreateIntersectionObserver } = functionModule

assert.equal(
	typeof upCreateIntersectionObserver,
	'function',
	'function module should export upCreateIntersectionObserver'
)
assert.equal(
	functionModule.default.upCreateIntersectionObserver,
	upCreateIntersectionObserver,
	'default function collection should expose upCreateIntersectionObserver'
)

// --- 小程序 / H5：实例上有该方法，Vue 代理必须永远到不了全局 API。
// 这正是 issue #864 的修复点：uni-app 只为 createSelectorQuery 做了 $scope 解包，
// 把代理直传给 uni.createIntersectionObserver 会触发 Vue 开发模式的 ownKeys 告警。
{
	const instanceCalls = []
	const vm = {
		createIntersectionObserver(...args) {
			instanceCalls.push(args)
			return { source: 'instance', args }
		}
	}
	const before = globalCalls.length

	const noOptions = upCreateIntersectionObserver(vm)
	assert.equal(noOptions.source, 'instance', '小程序端应走组件实例方法')
	assert.deepEqual(instanceCalls.at(-1), [], '不传 options 时实例方法应无参调用')

	const options = { thresholds: [0.95, 0.98, 1] }
	const withOptions = upCreateIntersectionObserver(vm, options)
	assert.equal(withOptions.source, 'instance', '传 options 时同样应走实例方法')
	assert.deepEqual(instanceCalls.at(-1), [options], 'options 应作为实例方法的唯一参数透传')

	assert.equal(globalCalls.length, before, '小程序路径不得触碰 uni.createIntersectionObserver')
}

// --- APP 端：实例上没有该方法，回退全局 API，且必须原样传实例。
// 这里守的是修 3.x 时踩到的坑：若改传 comp.$scope，APP 端页面的 $scope 仅为
// { $getAppWebview }，会被全局 API 误判成 options，导致 up-sticky 的 thresholds 被静默丢弃。
{
	const scope = { $getAppWebview() {} }
	const vm = { $scope: scope }

	const noOptions = upCreateIntersectionObserver(vm)
	assert.equal(noOptions.source, 'global', 'APP 端应回退到全局 API')
	assert.deepEqual(globalCalls.at(-1), [vm], '回退时应传组件实例，而非 $scope')

	const options = { thresholds: [0.95, 0.98, 1] }
	upCreateIntersectionObserver(vm, options)
	assert.deepEqual(globalCalls.at(-1), [vm, options], '回退路径必须保留调用方的 options')
	assert.notEqual(globalCalls.at(-1)[0], scope, '$scope 不得作为组件参数被透传')
}

// --- 异常入参也应产出观察器，而不是抛错。
{
	upCreateIntersectionObserver()
	assert.deepEqual(globalCalls.at(-1), [undefined], '缺少实例时仍应到达全局 API')

	upCreateIntersectionObserver({ createIntersectionObserver: 'not-a-function' })
	assert.equal(
		typeof globalCalls.at(-1)[0],
		'object',
		'实例成员不可调用时应回退，而不是直接调用它'
	)
}

// --- 调用点：所有会编译进小程序的组件都必须走该方法。
// 4.x 组件是 <script setup>，实例来自 getCurrentInstance()?.proxy，因此断言按 proxy 匹配。
const stripLineComments = source => source.replace(/^\s*\/\/.*$/gm, '')

for (const [name, source] of [
	['up-sticky', stickySource],
	['up-lazy-load', lazyLoadSource],
	['up-cate-tab', cateTabSource]
]) {
	assert.match(
		source,
		/import \{[\s\S]*?upCreateIntersectionObserver[\s\S]*?\} from ['"]\.\.\/\.\.\/libs\/function\/index(?:\.js)?['"]/,
		`${name} 应导入 upCreateIntersectionObserver`
	)
	assert.match(
		source,
		/upCreateIntersectionObserver\(/,
		`${name} 应通过该方法创建观察器`
	)
	assert.doesNotMatch(
		stripLineComments(source),
		/uni\.createIntersectionObserver\(/,
		`${name} 不应直接调用 uni.createIntersectionObserver`
	)
}

// 观察器拿到的必须是组件实例代理，不能是别的东西（否则 relativeTo 的选择器作用域会错）
assert.match(
	stickySource,
	/upCreateIntersectionObserver\(proxy,\s*\{[\s\S]*?thresholds:\s*\[0\.95,\s*0\.98,\s*1\]/,
	'up-sticky 应继续通过该方法透传自己的 thresholds'
)
assert.match(
	cateTabSource,
	/upCreateIntersectionObserver\(proxy\)/,
	'up-cate-tab 应把组件实例代理交给该方法'
)
assert.match(
	lazyLoadSource,
	/const observerContext = proxy[\s\S]{0,400}?upCreateIntersectionObserver\(observerContext\)/,
	'up-lazy-load 的 observerContext 应取自 proxy 并交给该方法'
)

// up-parse/node 故意不改：它的观察器只在 H5/APP-PLUS 条件编译块内，
// 永远不会编译进出现告警的小程序端。若哪天被移出该块，这条断言会失败以提醒改用该方法。
assert.match(
	nodeSource,
	/#ifdef H5 \|\| APP-PLUS[\s\S]*?uni\.createIntersectionObserver\(proxy\)/,
	'up-parse/node 的观察器应保持在 H5/APP-PLUS 条件编译块内'
)

// .uvue（uni-app x）变体本次不在范围内，故此处不做断言。

assert.match(
	functionSource,
	/export function upCreateIntersectionObserver\(comp,\s*options\)/,
	'该方法应接收组件实例与 options'
)

console.log('upCreateIntersectionObserver assertions passed')
