import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { setImmediate } from 'node:timers/promises'
import { test } from 'node:test'

const read = ext => readFileSync(new URL('../uni_modules/uview-ultra/components/up-barcode/up-barcode.' + ext, import.meta.url), 'utf8')
function gate() {
    let release
    const promise = new Promise(resolve => { release = resolve })
    return { promise, release }
}
// Mini-program host commits may still be pending after Vue's global queue drains.
function host(view) {
    const instance = {
        $nextTick(callback) {
            assert.equal(this, instance, 'component nextTick must retain its receiver')
            return view.promise.then(() => callback?.())
        }
    }
    return instance
}
const nextTick = callback => Promise.resolve().then(() => callback?.())

function vueRenderer(instance, createCanvasContext, emitted) {
    const source = read('vue')
    const code = source.slice(source.indexOf('async function renderToCanvas(options) {'), source.indexOf('function renderToImage(options) {'))
    return new Function('nextTick', 'proxy', 'uni', 'calculateCanvasSize', 'canvasId', 'canvasWidth', 'canvasHeight', 'encodeBarcode', 'drawBarcode', 'props', 'emit', 'error', 't', code + '; return renderToCanvas')(
        nextTick, instance, { createCanvasContext }, () => {}, { value: 'barcode-test' }, { value: 200 }, { value: 80 },
        () => '101', () => {}, { value: '123' }, (...args) => emitted.push(args), { value: '' }, () => 'error'
    )
}
function uvueExporter(instance, initialize, draw, emitted) {
    const source = read('uvue')
    const code = source.slice(source.indexOf('const exportImage ='), source.indexOf('const generateBarcode ='))
        .replace('(): Promise<string> =>', '() =>').replaceAll('(err: any | null)', '(err)').replaceAll(' as UTSJSONObject', '')
    const showCanvas = { value: false }
    const exporter = new Function('instance', 'showCanvas', 'nextTick', 'initCanvas', 'drawCanvasBarcode', 'canvasContext', 'emit', 'props', code + '; return exportImage')(
        instance, showCanvas, nextTick, initialize, draw,
        { value: { toDataURL: () => 'data:image/png;base64,barcode' } }, (...args) => emitted.push(args), { value: '123' }
    )
    return { exporter, showCanvas }
}

test('Vue: creating the canvas waits for the component view, not just the global queue', async () => {
    const view = gate()
    const instance = host(view)
    const emitted = []
    const calls = []
    let drawComplete
    const render = vueRenderer(instance, (id, component) => {
        calls.push([id, component])
        return { setFillStyle() {}, fillRect() {}, draw(_reserve, callback) { drawComplete = callback } }
    }, emitted)
    const rendering = render({ background: '#fff' })
    await setImmediate()
    assert.deepEqual(calls, [], 'canvas must not be created before its host view exists')
    assert.deepEqual(emitted, [])
    view.release()
    await rendering
    assert.deepEqual(calls, [['barcode-test', instance]])
    assert.deepEqual(emitted, [], 'rendered must wait for canvas draw completion')
    drawComplete()
    assert.deepEqual(emitted, [['rendered', { type: 'canvas', id: 'barcode-test' }]])
})

test('UVue: image export waits for the host, initialization and drawing, in order', async () => {
    const view = gate()
    const initialization = gate()
    const drawing = gate()
    const events = []
    const emitted = []
    const { exporter, showCanvas } = uvueExporter(host(view), async () => {
        events.push('init'); await initialization.promise
    }, async () => { events.push('draw'); await drawing.promise }, emitted)
    let settled = false
    const output = exporter()
    output.then(() => { settled = true }, () => { settled = true })
    await setImmediate()
    assert.equal(showCanvas.value, true)
    assert.deepEqual(events, [], 'canvas query must wait for the conditional canvas to reach the host')
    view.release()
    await setImmediate()
    assert.deepEqual(events, ['init'])
    assert.equal(settled, false)
    initialization.release()
    await setImmediate()
    assert.deepEqual(events, ['init', 'draw'])
    assert.equal(settled, false)
    drawing.release()
    assert.equal(await output, 'data:image/png;base64,barcode')
    assert.equal(showCanvas.value, false)
    assert.deepEqual(emitted, [['rendered', { type: 'image', value: '123', path: 'data:image/png;base64,barcode' }]])
})

for (const stage of ['init', 'draw']) {
    test('UVue: ' + stage + ' failure is propagated and hides the temporary canvas', async () => {
        const view = gate()
        const failure = new Error(stage + ' failed')
        const emitted = []
        const { exporter, showCanvas } = uvueExporter(host(view), async () => {
            if (stage === 'init') throw failure
        }, async () => { if (stage === 'draw') throw failure }, emitted)
        const output = exporter()
        const rejected = assert.rejects(output, error => error === failure)
        view.release()
        await rejected
        assert.equal(showCanvas.value, false)
        assert.deepEqual(emitted, [])
    })
}
