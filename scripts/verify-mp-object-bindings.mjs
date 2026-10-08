import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const components = resolve(root, 'uni_modules/uview-ultra/components')
const readerFile = resolve(components, 'up-novel-reader/up-novel-reader.vue')
const contentFile = resolve(components, 'up-novel-reader/reader-content.vue')
const compilerRequire = createRequire(resolve(
    process.env.HBUILDERX_ROOT || 'C:/ProgramData/HBuilderX',
    'plugins/uniapp-cli-vite/package.json'
))
const { parse, compileTemplate } = compilerRequire('@vue/compiler-sfc')
const { baseParse } = compilerRequire('@vue/compiler-dom')
const { compile } = compilerRequire('@dcloudio/uni-mp-compiler')
const { initPreContext, preHtml, preJs } = compilerRequire('@dcloudio/uni-cli-shared/dist/preprocess/index.js')
const { build } = compilerRequire('esbuild')
const Vue = compilerRequire('vue')

function vueFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(directory, entry.name)
        if (entry.isDirectory()) return vueFiles(path)
        return entry.isFile() && entry.name.endsWith('.vue') ? [path] : []
    })
}

function descriptor(filename) {
    const { descriptor, errors } = parse(preHtml(readFileSync(filename, 'utf8'), filename), { filename })
    assert.deepEqual(errors, [], relative(root, filename) + ' should parse')
    return descriptor
}

// Keep the fixed reader in the suite after its v-bind disappears, and discover
// other object bindings automatically. Component v-bind is supported and must
// not be removed indiscriminately just to avoid native-element/slot errors.
initPreContext('mp-weixin')
for (const filename of vueFiles(components).sort()) {
    const platformSource = preHtml(readFileSync(filename, 'utf8'), filename)
    if (filename !== readerFile && !/\bv-bind\s*=/.test(platformSource)) continue
    const source = descriptor(filename)
    test(relative(components, filename) + ' compiles for WeChat', () => {
        initPreContext('mp-weixin')
        const errors = []
        const warnings = []
        let wxml = ''
        compile(preHtml(source.template.content, filename), {
            filename,
            mode: 'module',
            onError: error => errors.push(error.message),
            onWarn: warning => warnings.push(warning.message),
            miniProgram: {
                directive: 'wx:',
                class: { array: true },
                slot: { fallbackContent: false, dynamicSlotNames: true },
                event: { key: true },
                component: { dir: 'wxcomponents' },
                emitFile: asset => { wxml = asset.source }
            }
        })
        assert.deepEqual(errors, [], 'real WeChat compilation should accept this template')
        assert.deepEqual(warnings, [])
        assert.ok(wxml.trim(), 'the component should emit a non-empty WeChat template')
    })
}

function h5Render(source, filename) {
    const { code, errors } = compileTemplate({
        source: preHtml(source, filename), filename, id: 'reader-slot-regression',
        compilerOptions: { mode: 'function', isCustomElement: tag => tag !== 'reader-content' }
    })
    assert.deepEqual(errors, [])
    return new Function('Vue', code)(Vue)
}

async function loadReaderContent() {
    const source = descriptor(contentFile)
    const { outputFiles } = await build({
        stdin: {
            contents: preJs(source.script.content, contentFile),
            resolveDir: dirname(contentFile), sourcefile: contentFile + '.js', loader: 'js'
        },
        bundle: true, platform: 'node', format: 'cjs', external: ['vue'], write: false, logLevel: 'silent',
        plugins: [{ name: 'uni-h5-preprocess', setup(builder) {
            builder.onLoad({ filter: /\.js$/ }, args => ({
                contents: preJs(readFileSync(args.path, 'utf8'), args.path), loader: 'js'
            }))
        } }]
    })
    const mod = { exports: {} }
    new Function('module', 'exports', 'require', outputFiles[0].text)(mod, mod.exports, compilerRequire)
    return { ...mod.exports.default, render: h5Render(source.template.content, contentFile) }
}

function createHost() {
    const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
    const remove = child => {
        if (!child.parent) return
        const index = child.parent.children.indexOf(child)
        if (index >= 0) child.parent.children.splice(index, 1)
        child.parent = null
    }
    const { createApp } = Vue.createRenderer({
        createElement: type => node(type),
        createText: text => node('#text', text),
        createComment: text => node('#comment', text),
        setText: (target, text) => { target.text = text },
        setElementText(target, text) {
            for (const child of target.children) child.parent = null
            target.children = []
            target.text = text
        },
        parentNode: target => target.parent,
        nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1] || null,
        patchProp: (target, key, previous, next) => { target.props[key] = next },
        insert(child, parent, anchor = null) {
            remove(child)
            child.parent = parent
            const index = anchor ? parent.children.indexOf(anchor) : -1
            if (index < 0) parent.children.push(child)
            else parent.children.splice(index, 0, child)
        },
        remove
    })
    return { createApp, container: node('root') }
}

function findNode(node, predicate) {
    if (predicate(node)) return node
    for (const child of node.children || []) {
        const match = findNode(child, predicate)
        if (match) return match
    }
    return null
}

async function errorSlotWrapper() {
    initPreContext('h5')
    const template = preHtml(descriptor(readerFile).template.content, readerFile)
    const slot = findNode(baseParse(template), node => node.tag === 'template' &&
        node.props.some(prop => prop.name === 'slot' && prop.arg?.content === 'error'))
    assert.ok(slot, 'the public error slot should exist')
    // Isolate only the real forwarding template from chapter-loading lifecycle.
    // The slot producer remains the real reader-content, including its retry emitter.
    return {
        components: { ReaderContent: await loadReaderContent() },
        props: { error: Object },
        emits: ['retry'],
        methods: { handleRetry() { this.$emit('retry') } },
        render: h5Render(
            `<reader-content :error="error" @retry="handleRetry">${slot.loc.source}</reader-content>`,
            readerFile
        )
    }
}

test('novel-reader forwards the actual error object and working retry callback to a custom slot', async () => {
    const Wrapper = await errorSlotWrapper()
    const error = { message: 'Chapter request failed', code: 503 }
    let received
    let retries = 0
    const { createApp, container } = createHost()
    const app = createApp({ render: () => Vue.h(Wrapper, { error, onRetry: () => retries++ }, {
        error: props => {
            received = props
            return Vue.h('text', { id: 'custom-error' }, props.error.message)
        }
    }) })
    const warnings = []
    app.config.warnHandler = warning => warnings.push(warning)
    try {
        app.mount(container)
        assert.ok(received, 'the consumer error slot should render')
        assert.equal(received.error, error, 'forward the producer error object unchanged')
        assert.equal(typeof received.retry, 'function')
        assert.equal(findNode(container, node => node.props.id === 'custom-error')?.text, 'Chapter request failed')
        received.retry()
        assert.equal(retries, 1, 'the actual reader-content retry emitter should reach the parent once')
        assert.deepEqual(warnings, [])
    } finally { app.unmount() }
})

test('novel-reader retains default error messages and retry actions without a custom slot', async () => {
    const Wrapper = await errorSlotWrapper()
    for (const [error, message] of [
        [{ message: 'Chapter request failed' }, 'Chapter request failed'],
        [{ code: 503 }, '章节加载失败']
    ]) {
        let retries = 0
        const { createApp, container } = createHost()
        const app = createApp(Wrapper, { error, onRetry: () => retries++ })
        const warnings = []
        app.config.warnHandler = warning => warnings.push(warning)
        try {
            app.mount(container)
            assert.ok(findNode(container, node => node.type === 'text' && node.text === message))
            const action = findNode(container, node => node.props.class === 'up-novel-reader__state-action')
            assert.ok(action, 'the default retry action should remain')
            action.props.onTap({ stopPropagation() {} })
            assert.equal(retries, 1)
            assert.deepEqual(warnings, [])
        } finally { app.unmount() }
    }
})
