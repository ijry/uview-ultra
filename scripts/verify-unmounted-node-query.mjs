import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire, register } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

// 本仓库的 node_modules 是空的（依赖由 HBuilderX 提供），vue 与预处理器都取自相邻的
// uview-plus 仓库；注册解析钩子把裸 'vue' 指过去，以便直接跑真实 Vue 挂载/卸载
const NEIGHBOUR_HOST = resolve(root, '..', 'uview-plus', 'package.json')
const neighbourRequire = createRequire(NEIGHBOUR_HOST)
const VUE_URL = pathToFileURL(neighbourRequire.resolve('vue')).href
register(
    'data:text/javascript,' +
        encodeURIComponent(`
const VUE_URL = ${JSON.stringify(VUE_URL)}
export async function resolve(specifier, context, next) {
	if (specifier === 'vue') return { url: VUE_URL, shortCircuit: true }
	return next(specifier, context)
}
`)
)

const FUNCTION_FILE = 'uni_modules/uview-ultra/libs/function/index.js'
const COMPOSABLE_FILE = 'uni_modules/uview-ultra/libs/composable/useUltraUI.js'
const functionPath = resolve(root, FUNCTION_FILE)
const composablePath = resolve(root, COMPOSABLE_FILE)
const functionSource = read(FUNCTION_FILE)
const composableSource = read(COMPOSABLE_FILE)
const packageJson = JSON.parse(read('package.json'))

assert.equal(
    packageJson.scripts['verify:unmounted-node-query'],
    'node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verify-unmounted-node-query.mjs',
    'package.json 应暴露 verify:unmounted-node-query'
)

const EMPTY_RECT = { width: 0, height: 0, left: 0, right: 0, top: 0, bottom: 0 }
const LIVE_RECT = { width: 100, height: 20, left: 0, right: 100, top: 0, bottom: 20 }

// --- 守卫必须在每个平台的预处理输出里都存在。
// 条件编译块在 app-harmony 上会整段消失，若守卫写进 #ifdef 就等于鸿蒙上没有守卫。
{
    const pre = neighbourRequire('@dcloudio/uni-cli-shared/dist/preprocess/index.js')
    for (const platform of ['app', 'app-harmony', 'app-plus', 'h5', 'mp-weixin']) {
        pre.initPreContext(platform, undefined, undefined, false)

        const functionOut = pre.preJs(functionSource, functionPath)
        assert.match(
            functionOut,
            /export function isCompUnmounted\(comp\)/,
            `${platform}: 应保留 isCompUnmounted 辅助函数`
        )
        assert.equal(
            (functionOut.match(/if \(isCompUnmounted\(comp\)\) \{/g) || []).length,
            1,
            `${platform}: upCreateIntersectionObserver 的守卫应保留`
        )

        const composableOut = pre.preJs(composableSource, composablePath)
        assert.equal(
            (composableOut.match(/if \(isCompUnmounted\(proxy\)\) \{/g) || []).length,
            1,
            `${platform}: $uGetRect 的守卫应保留`
        )
        assert.match(
            composableOut,
            /proxy\.__upUnmounted = true/,
            `${platform}: 卸载标记置位应保留`
        )
    }

    // nvue 分支同样要有守卫：nvue 走 dom.getComponentRect，节点被移除后同样不该再查
    pre.initPreContext('app-plus', undefined, undefined, false)
    const nvueOut = pre.preNVueJs(composableSource, composablePath)
    assert.equal(
        (nvueOut.match(/if \(isCompUnmounted\(proxy\)\) \{/g) || []).length,
        1,
        'app-nvue: $uGetRect 的守卫应保留'
    )
    assert.doesNotMatch(nvueOut, /createSelectorQuery\(\)/, 'app-nvue 输出仍应裁掉 selector query')
}

// --- 真实 Vue 生命周期下的行为验证。
// 只断言"卸载后不查询"是不够的：组件彻底不工作时也满足该断言。
// 因此每条用例都成对断言：挂载期间必须真的发起查询，卸载后必须完全不发起。
let execCount = 0
let observerCalls = 0
globalThis.uni = {
    $on() {},
    $off() {},
    $once() {},
    $emit() {},
    upx2px: v => v,
    getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667 }),
    getWindowInfo: () => ({ windowWidth: 375, windowHeight: 667 }),
    requireNativePlugin: () => ({ getComponentRect() {} }),
    createIntersectionObserver(...args) {
        observerCalls += 1
        return { source: 'global', args, relativeTo() { return this }, relativeToViewport() { return this }, observe() {}, disconnect() {} }
    },
    createSelectorQuery() {
        let isAll = false
        let callback = null
        const query = {
            in() { return query },
            select() { return query },
            selectAll() { isAll = true; return query },
            boundingClientRect(cb) { callback = cb; return query },
            exec() {
                execCount += 1
                callback && callback(isAll ? [LIVE_RECT] : LIVE_RECT)
                return query
            }
        }
        return query
    }
}

const { upCreateIntersectionObserver, isCompUnmounted } = await import(pathToFileURL(functionPath).href)
const { useUltraUI } = await import(pathToFileURL(composablePath).href)

// 用 @vue/runtime-core 自建渲染器，无需浏览器即可跑真实挂载/卸载
const { createRenderer, h } = await import('vue')
const nodeOps = {
    createElement: tag => ({ tag, children: [], parent: null }),
    createText: text => ({ tag: 'text', text }),
    createComment: text => ({ tag: 'comment', text }),
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
    patchProp() {}
}
const { createApp } = createRenderer(nodeOps)

// 复刻 4.x 组件的真实形态：<script setup> 里调 useUltraUI(props)，再自己注册钩子
const { getCurrentInstance } = await import('vue')

function mountProbe(setupExtra) {
    let probe
    const Child = {
        setup() {
            const instance = getCurrentInstance()
            const api = useUltraUI({})
            probe = { ...api, get proxy() { return instance.proxy } }
            setupExtra && setupExtra(probe)
            return () => h('div')
        }
    }
    const app = createApp({ render() { return h(Child) } })
    app.mount(nodeOps.createElement('root'))
    return { app, get probe() { return probe } }
}

// 挂载期间：查询必须真的打到原生层，否则组件测不到尺寸，布局会坏掉
{
    const { app, probe } = mountProbe()
    execCount = 0
    assert.deepEqual(await probe.$uGetRect('.live'), LIVE_RECT, '挂载中的组件应解析出真实尺寸')
    assert.equal(execCount, 1, '挂载中的组件必须真的发起 selector query')
    assert.deepEqual(await probe.$uGetRect('.live', true), [LIVE_RECT], 'all=true 查询应解析出真实尺寸数组')
    assert.equal(execCount, 2, 'all=true 查询也必须真的打到原生层')
    app.unmount()
}

// 卸载后：一次查询都不许发出，否则 APP 端会拿失效 nodeId 去查已删除的视图节点
{
    const { app, probe } = mountProbe()
    const proxy = probe.proxy
    app.unmount()
    execCount = 0
    assert.equal(proxy.__upUnmounted, true, '卸载后守卫标记应已置位')
    assert.deepEqual(await probe.$uGetRect('.gone'), EMPTY_RECT, '卸载后单节点查询应返回零尺寸')
    assert.deepEqual(await probe.$uGetRect('.gone', true), [], '卸载后 all=true 查询应返回空数组')
    assert.equal(
        execCount,
        0,
        '卸载后不得发起任何 selector query：APP 端会在 uni-app-view.umd.js 里查已移除的组件，'
            + '抛 Cannot read properties of undefined (reading \'$\')'
    )
}

// issue 的真实形态：mounted 里排的异步测量在切页卸载后才跑到
{
    let pending
    const { app } = mountProbe(probe => {
        pending = new Promise(done => {
            setTimeout(() => { probe.$uGetRect('.deferred').then(done) }, 10)
        })
    })
    execCount = 0
    app.unmount()
    assert.deepEqual(await pending, EMPTY_RECT, '卸载后才落地的延迟查询应返回零尺寸')
    assert.equal(execCount, 0, '卸载后才落地的延迟查询不得打到原生层')
}

// 交叉观察器走的是同一条 window.__$__(id).$ 查表路径
{
    const { app, probe } = mountProbe()
    const proxy = probe.proxy
    observerCalls = 0
    const live = upCreateIntersectionObserver(proxy, { thresholds: [1] })
    assert.equal(live.source, 'global', '挂载中的组件应拿到真实观察器')
    assert.equal(observerCalls, 1, '挂载中的组件必须真的创建观察器')

    app.unmount()
    const dead = upCreateIntersectionObserver(proxy, { thresholds: [1] })
    assert.equal(observerCalls, 1, '卸载后不得创建原生观察器')
    assert.equal(dead.relativeToViewport({ bottom: 0 }), dead, '空观察器应保持链式可调用')
    assert.equal(dead.relativeTo('.x', {}), dead, '空观察器应保持链式可调用')
    assert.doesNotThrow(() => { dead.observe('.x', () => {}); dead.disconnect() }, '空观察器应吸收后续调用')
}

// 未套用 useUltraUI 的组件（up-cate-tab、up-lazy-load 只取了 commonProps）退回 Vue 自身的 isUnmounted
{
    observerCalls = 0
    assert.equal(isCompUnmounted({ $: { isUnmounted: true } }), true, '公开实例应读 $.isUnmounted')
    assert.equal(isCompUnmounted({ isUnmounted: true }), true, '内部实例应直接读 isUnmounted')
    assert.equal(isCompUnmounted({ $: { isUnmounted: false } }), false, '存活实例不得被判为卸载')
    assert.equal(isCompUnmounted(null), false, '无实例时不拦截，保持页面级查询可用')

    upCreateIntersectionObserver({ $: { isUnmounted: true } })
    assert.equal(observerCalls, 0, 'Vue 自身的卸载标记也应拦住观察器创建')
    upCreateIntersectionObserver({ $: { isUnmounted: false } })
    assert.equal(observerCalls, 1, '存活实例仍应创建真实观察器')
}

// 调用点：报错组件 up-tabs 的测量必须经由 useUltraUI 的 $uGetRect，否则绕过守卫
{
    const tabsSource = read('uni_modules/uview-ultra/components/up-tabs/up-tabs.vue')
    assert.match(
        tabsSource,
        /const \{[^}]*\$uGetRect[^}]*\} = useUltraUI\(/,
        'up-tabs.vue 应从 useUltraUI 取 $uGetRect'
    )
    assert.doesNotMatch(
        tabsSource.replace(/^\s*\/\/.*$/gm, ''),
        /uni\.createSelectorQuery\(/,
        'up-tabs.vue 不应绕过 $uGetRect 直接查询节点'
    )
}

// 仍有组件因需要 fields/context/computedStyle 而直接建查询，$uGetRect 表达不了这些形态。
// 它们各自的守卫不在本次范围内，此处记录当前名单：新增成员会失败，提醒同步加守卫。
{
    const { readdirSync, existsSync } = await import('node:fs')
    const componentsDir = resolve(root, 'uni_modules/uview-ultra/components')
    const direct = []
    for (const name of readdirSync(componentsDir)) {
        const file = resolve(componentsDir, name, `${name}.vue`)
        if (!existsSync(file)) continue
        const source = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')
        if (/uni\.createSelectorQuery\(/.test(source)) direct.push(name)
    }
    assert.deepEqual(
        direct,
        [
            'up-canvas', 'up-cate-tab', 'up-color-picker', 'up-dragsort', 'up-parse',
            'up-qrcode', 'up-sticky', 'up-swipe-action-item', 'up-upload', 'up-virtual-list'
        ],
        '直接建 selector query 的组件名单发生变化：新增者需自行用 isCompUnmounted 守卫'
    )
}

console.log('unmounted node query assertions passed')
