import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const filename = resolve(root, 'uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.vue')

// This HBuilderX project has no compiler dependencies in node_modules.
// Set HBUILDERX_ROOT when HBuilderX is installed at a different location.
const compilerRequire = createRequire(resolve(
    process.env.HBUILDERX_ROOT || 'C:/ProgramData/HBuilderX',
    'plugins/uniapp-cli-vite/package.json'
))
const { parse, compileScript } = compilerRequire('@vue/compiler-sfc')
const { compile } = compilerRequire('@dcloudio/uni-mp-compiler')
const { initPreContext, preHtml, preJs } = compilerRequire('@dcloudio/uni-cli-shared/dist/preprocess/index.js')
const { build } = compilerRequire('esbuild')
const Vue = compilerRequire('vue')
const { descriptor, errors } = parse(readFileSync(filename, 'utf8'), { filename })
assert.deepEqual(errors, [], 'up-tabs-pro.vue should parse without errors')

test('up-tabs-pro compiles its real template for WeChat', () => {
    initPreContext('mp-weixin')
    const errors = []
    const warnings = []
    let wxml = ''
    compile(preHtml(descriptor.template.content, filename), {
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
    // A source-string assertion would miss the unsupported native-view v-bind.
    assert.deepEqual(errors, [], 'up-tabs-pro must compile without unsupported v-bind errors')
    assert.deepEqual(warnings, [], 'up-tabs-pro should not produce template warnings')
    assert.match(wxml, /<view\b/, 'the wrapper must still render')
    assert.match(wxml, /<up-tabs\b/, 'the wrapped tabs must still render')
})

async function loadH5Component() {
    initPreContext('h5')
    const script = compileScript(descriptor, {
        id: 'up-tabs-pro-attrs-regression',
        inlineTemplate: true
    })
    const { outputFiles } = await build({
        stdin: {
            contents: script.content,
            resolveDir: dirname(filename),
            sourcefile: filename + '.js',
            loader: 'js'
        },
        bundle: true,
        platform: 'node',
        format: 'cjs',
        external: ['vue'],
        write: false,
        logLevel: 'silent',
        plugins: [{
            name: 'uni-h5-preprocess',
            setup(builder) {
                builder.onLoad({ filter: /\.js$/ }, args => ({
                    contents: preJs(readFileSync(args.path, 'utf8'), args.path),
                    loader: 'js'
                }))
            }
        }]
    })
    const componentModule = { exports: {} }
    new Function('module', 'exports', 'require', outputFiles[0].text)(
        componentModule, componentModule.exports, compilerRequire
    )
    return componentModule.exports.default
}

// A minimal host keeps Vue's actual attribute merging and event fallthrough.
// Only DOM operations and the layout-measuring child tabs are replaced.
function createHost() {
    const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
    const remove = child => {
        if (!child.parent) return
        const siblings = child.parent.children
        siblings.splice(siblings.indexOf(child), 1)
        child.parent = null
    }
    const renderer = Vue.createRenderer({
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
    return { createApp: renderer.createApp, container: node('root') }
}

test('up-tabs-pro preserves H5 root attributes, styles and a single native listener', async () => {
    const component = await loadH5Component()
    const { createApp, container } = createHost()
    const events = []
    const app = createApp(component, {
        list: [{ name: 'First tab' }],
        id: 'tabs-root',
        'data-check': 'root-attrs',
        class: 'external-class',
        style: { marginTop: '7px' },
        customClass: 'custom-root',
        customStyle: { paddingTop: '3px' },
        onTouchstart: event => events.push(event)
    })
    app.component('up-tabs', { render: () => Vue.h('view') })
    const warnings = []
    app.config.warnHandler = message => warnings.push(message)
    try {
        app.mount(container)
        const wrapper = container.children.find(child => child.type === 'view')
        assert.ok(wrapper, 'the real component should render a root view')
        assert.equal(wrapper.props.id, 'tabs-root')
        assert.equal(wrapper.props['data-check'], 'root-attrs')
        assert.deepEqual(wrapper.props.class.split(/\s+/).sort(), [
            'custom-root', 'external-class', 'up-tabs-pro'
        ])
        assert.deepEqual(wrapper.props.style, { paddingTop: '3px', marginTop: '7px' })
        const event = { type: 'touchstart' }
        assert.equal(typeof wrapper.props.onTouchstart, 'function', 'the native listener must not be lost or duplicated')
        wrapper.props.onTouchstart(event)
        assert.deepEqual(events, [event])
        assert.deepEqual(warnings, [], 'the isolated wrapper render should not warn')
    } finally {
        app.unmount()
    }
})
