import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire, register } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// issue #537：<up-datetime-picker format="yyyy-mm-dd"> 选完日期后并没有按 format 显示。
//
// 两处成因，本脚本各自守住：
// 1. format 直接交给 dayjs 格式化。dayjs 的 token 是大写的 YYYY-MM-DD，而 uview-ultra
//    自己的 timeFormat($u.timeFormat) 用的是小写 yyyy-mm-dd（默认值就是 'yyyy-mm-dd'，
//    up-text 的 format 也是同一套写法），于是用户按库里的写法传 'yyyy-mm-dd' 时，
//    dayjs 只认得其中的 mm(分钟) 和 dd(星期)，输入框显示成 'yyyy-00-Th' / 'yyyy-13-Su 09:04'。
// 2. correctValue 用 test.date(value) 判断绑定值是否合法。test.date 只接受长度为 10/13 的
//    时间戳与 yyyy-mm-dd 形态的字符串，Date 对象与 12 位(2001 年前)毫秒时间戳都被判为非法，
//    被替换成 minDate（默认当前年份-10），选择器于是停在十年前。
//
// 本脚本对 Vue 版做真实挂载断言（未修的代码上成因 1 的四个用例都会失败），
// UVue 版无法在 Node 里跑 UTS，退化为源码断言。

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')

// 本仓库的 node_modules 是空的（依赖由 HBuilderX 提供），vue、compiler-sfc 与预处理器
// 都取自相邻的 uview-plus 仓库；注册解析钩子把裸 'vue' 指过去，以便直接跑真实挂载
const NEIGHBOUR_HOST = resolve(root, '..', 'uview-plus', 'package.json')
assert.ok(
    existsSync(NEIGHBOUR_HOST),
    `需要相邻的 uview-plus 仓库提供 vue 与 @dcloudio/uni-cli-shared：${NEIGHBOUR_HOST}`
)
const neighbourRequire = createRequire(NEIGHBOUR_HOST)
const VUE_URL = pathToFileURL(neighbourRequire.resolve('vue')).href
register(
    'data:text/javascript,' +
        encodeURIComponent(`
import { existsSync } from 'node:fs'
const VUE_URL = ${JSON.stringify(VUE_URL)}
export async function resolve(specifier, context, next) {
	if (specifier === 'vue') return { url: VUE_URL, shortCircuit: true }
	try {
		return await next(specifier, context)
	} catch (err) {
		// 组件库源码用无扩展名的相对导入（uni-app 编译器会补全），Node 原生 ESM 不会
		if (specifier.startsWith('.') && context.parentURL) {
			for (const suffix of ['.js', '/index.js']) {
				if (existsSync(new URL(specifier + suffix, context.parentURL))) {
					return next(specifier + suffix, context)
				}
			}
		}
		throw err
	}
}
`)
)

const SFC_FILE = 'uni_modules/uview-ultra/components/up-datetime-picker/up-datetime-picker.vue'
const UVUE_FILE = 'uni_modules/uview-ultra/components/up-datetime-picker/up-datetime-picker.uvue'
const DEMO_FILE = 'pages/componentsC/datetimePicker/datetimePicker.uvue'
const sfcPath = resolve(root, SFC_FILE)

assert.equal(
    JSON.parse(read('package.json')).scripts['verify:datetime-picker-format'],
    'node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verify-datetime-picker-format.mjs',
    'package.json 应暴露 verify:datetime-picker-format'
)

globalThis.uni = {
    $on() {}, $off() {}, $once() {}, $emit() {},
    getStorageSync: () => '',
    setStorageSync() {},
    getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667 }),
    getWindowInfo: () => ({ windowWidth: 375, windowHeight: 667 }),
    requireNativePlugin: () => ({}),
    showToast() {},
    createSelectorQuery() {
        const q = { in: () => q, select: () => q, selectAll: () => q, boundingClientRect: () => q, exec: () => q }
        return q
    }
}

// __BODY__

// --- 编译 Vue 版组件用于真实挂载。
// 组件里 VUE2/VUE3 两套绑定值(value / modelValue)靠条件编译二选一，
// 直接按源码加载两条分支都会执行，先按真实构建那样做一次条件编译
const { parse, compileScript, compileTemplate } = neighbourRequire('vue/compiler-sfc')
const pre = neighbourRequire('@dcloudio/uni-cli-shared/dist/preprocess/index.js')

const { descriptor: rawDescriptor, errors: parseErrors } = parse(read(SFC_FILE), { filename: sfcPath })
assert.deepEqual(parseErrors, [], 'up-datetime-picker.vue 应该能正常解析')

pre.initPreContext('h5', undefined, undefined, false)
const preScript = pre.preJs(rawDescriptor.scriptSetup.content, sfcPath)
assert.match(preScript, /correctValue\(props\.modelValue\)/, '条件编译后应该保留 VUE3 分支')
assert.doesNotMatch(preScript, /correctValue\(props\.value\)/, '条件编译后应该去掉 VUE2 分支')

const rebuilt = `<template>${rawDescriptor.template.content}</template>\n<script setup>${preScript}</scr` + `ipt>`
const { descriptor } = parse(rebuilt, { filename: sfcPath })
const compiled = compileScript(descriptor, { id: 'updp', inlineTemplate: false })

// script 走 data: 模块加载，data: URL 没有基准路径，相对导入先改写成绝对 file URL
const componentOptions = (await import('data:text/javascript,' + encodeURIComponent(
    compiled.content.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (match, head, specifier, tail) => {
        const base = resolve(dirname(sfcPath), specifier)
        const target = [base, `${base}.js`, resolve(base, 'index.js')].find(candidate => existsSync(candidate))
        assert.ok(target, `${specifier} 应该能解析到真实文件`)
        return head + pathToFileURL(target).href + tail
    })
))).default

const { code: renderCode, errors: templateErrors } = compileTemplate({
    source: descriptor.template.content,
    filename: sfcPath,
    id: 'updp'
})
assert.deepEqual(templateErrors, [], '模板应该能正常编译')
componentOptions.render = (await import('data:text/javascript,' + encodeURIComponent(
    renderCode.replace(/from "vue"/, `from "${VUE_URL}"`)
))).render

const { createRenderer, h } = await import('vue')
const nodeOps = {
    createElement: tag => ({ tag, props: {}, children: [], parent: null }),
    createText: text => ({ tag: 'text', text, props: {} }),
    createComment: text => ({ tag: 'comment', text, props: {} }),
    setText(node, text) { node.text = text },
    setElementText(node, text) { node.text = text },
    insert(child, parent) { child.parent = parent; parent.children.push(child) },
    remove(child) {
        const parent = child.parent
        parent && parent.children.splice(parent.children.indexOf(child), 1)
    },
    parentNode: node => node.parent,
    nextSibling: () => null,
    querySelector: () => null,
    setScopeId() {},
    patchProp(node, key, prev, next) { node.props[key] = next }
}
const { createApp } = createRenderer(nodeOps)
const stub = { render: () => h('view') }

function mountPicker(props) {
    const app = createApp(componentOptions, props)
    app.component('up-picker', stub)
    app.component('up-input', stub)
    app.config.warnHandler = () => {}
    app.mount(nodeOps.createElement('root'))
    return app._instance.setupState
}

console.log('验证 #537：up-datetime-picker 的 format 兼容库自身 yyyy-mm-dd 写法')
console.log()

// 默认 minDate/maxDate 是「当前年份±10」，用固定日期做断言会随年份漂移，
// 这里显式给一个宽区间，让用例与运行年份无关
const bounds = { minDate: new Date(2000, 0, 1).getTime(), maxDate: new Date(2050, 0, 1).getTime() }
const stamp = new Date(2024, 3, 28, 9, 13, 7).getTime()

console.log('✓ 用例 1: hasInput 输入框按 format 显示（真实挂载）')
for (const [label, props, expected] of [
    [
        "库自身写法 format='yyyy-mm-dd hh:MM'",
        { ...bounds, modelValue: stamp, mode: 'datetime', hasInput: true, format: 'yyyy-mm-dd hh:MM' },
        '2024-04-28 09:13'
    ],
    [
        "库自身写法 format='yyyy-mm-dd'",
        { ...bounds, modelValue: stamp, mode: 'date', hasInput: true, format: 'yyyy-mm-dd' },
        '2024-04-28'
    ],
    [
        "中文分隔 format='yyyy年mm月dd日'",
        { ...bounds, modelValue: stamp, mode: 'date', hasInput: true, format: 'yyyy年mm月dd日' },
        '2024年04月28日'
    ],
    [
        "dayjs 写法 format='YYYY-MM-DD HH:mm' 保持原样",
        { ...bounds, modelValue: stamp, mode: 'datetime', hasInput: true, format: 'YYYY-MM-DD HH:mm' },
        '2024-04-28 09:13'
    ],
    [
        '不传 format 时按 mode 的默认格式',
        { ...bounds, modelValue: stamp, mode: 'datetime', hasInput: true },
        '2024-04-28 09:13'
    ],
    [
        'time 模式原样透出，不经过日期格式化',
        { modelValue: '05:28', mode: 'time', hasInput: true },
        '05:28'
    ]
]) {
    assert.equal(mountPicker(props).inputValue, expected, `${label} 应该显示为 ${expected}`)
    console.log(`  ✓ ${label} => '${expected}'`)
}
console.log()

console.log('✓ 用例 2: 文档里写明支持的绑定值不再被替换成 minDate（真实挂载）')
for (const [label, modelValue, mode, format, expected, extra] of [
    ["String '2024-10-24'", '2024-10-24', 'date', 'yyyy-mm-dd', '2024-10-24'],
    ["String '2024/10/24 15:08:09'", '2024/10/24 15:08:09', 'datetimesecond', 'yyyy-mm-dd hh:MM:ss', '2024-10-24 15:08:09'],
    ['纯数字字符串时间戳', String(stamp), 'date', 'yyyy-mm-dd', '2024-04-28'],
    // 12 位毫秒时间戳(2001-09-09 之前)：test.date 只认 10/13 位，会把它判成非法值。
    // 这类日期天然早于默认 minDate，需要把下界一并放开才能验到解析而不是夹取
    [
        '12 位时间戳(2001 年前)',
        new Date(1990, 5, 15).getTime(),
        'date',
        'yyyy-mm-dd',
        '1990-06-15',
        { minDate: new Date(1980, 0, 1).getTime() }
    ]
]) {
    const state = mountPicker({ ...bounds, ...extra, modelValue, mode, hasInput: true, format })
    assert.equal(state.inputValue, expected, `${label} 应该显示为 ${expected}，而不是回退到 minDate`)
    console.log(`  ✓ ${label} => '${expected}'`)
}

// 非法值仍然要回退到 minDate，这是原有约定，不能被上面的放宽解析吃掉
const fallback = mountPicker({ ...bounds, modelValue: 'not a date', mode: 'date', hasInput: true, format: 'yyyy-mm-dd' })
assert.equal(fallback.inputValue, '2000-01-01', '无法识别的绑定值仍然应该回退到 minDate')
console.log("  ✓ 无法识别的值仍回退 minDate => '2000-01-01'")
console.log()

console.log('✓ 用例 3: 边界夹取仍然生效（真实挂载）')
const clamped = mountPicker({
    minDate: new Date(2020, 0, 1).getTime(),
    maxDate: new Date(2021, 0, 1).getTime(),
    modelValue: '2024-10-24',
    mode: 'date',
    hasInput: true,
    format: 'yyyy-mm-dd'
})
assert.equal(clamped.inputValue, '2021-01-01', '超过 maxDate 的绑定值应该被夹取到 maxDate')
console.log("  ✓ 超出 maxDate 的值被夹取 => '2021-01-01'")
console.log()

console.log('✓ 用例 4: UVue 版本同步修复（UTS 无法在 Node 挂载，退化为源码断言）')
const uvueSource = read(UVUE_FILE)
assert.match(
    uvueSource,
    /import\s*\{[^}]*timeFormat[^}]*\}\s*from\s*['"][^'"]*index\.uts['"]/,
    'UVue 版本应该从 index.uts 导入 timeFormat'
)
assert.match(
    uvueSource,
    /if\s*\(props\.format\.includes\(['"]y['"]\)\)\s*\{\s*[\r\n]+\s*inputValue\.value\s*=\s*timeFormat\(newValue,\s*props\.format\)/,
    'UVue 版本 format 含小写 y 时应该走 timeFormat'
)
assert.match(
    uvueSource,
    /\}\s*else\s*\{\s*[\r\n]+\s*inputValue\.value\s*=\s*dayuts\(newValue\)\.format\(props\.format\)/,
    'UVue 版本 format 为 dayjs 写法时应该保持走 dayuts'
)
console.log('  ✓ UVue 版本 getInputValue 已按同样规则分流')
console.log()

console.log('✓ 用例 5: demo 页面给出了 format 的用法')
const demoSource = read(DEMO_FILE)
assert.match(demoSource, /hasInput/, 'demo 应该有 hasInput 模式的示例')
assert.match(demoSource, /format="yyyy-mm-dd hh:MM"/, 'demo 应该用库自身写法演示 format')
console.log('  ✓ demo 补上了 hasInput + format 示例')
console.log()

console.log('✅ 全部校验通过')
