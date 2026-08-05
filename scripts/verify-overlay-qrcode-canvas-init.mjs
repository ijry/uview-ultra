import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

const packageJson = JSON.parse(read('package.json'))
const canvasVue = read('uni_modules/uview-ultra/components/up-canvas/up-canvas.vue')
const canvasUvue = read('uni_modules/uview-ultra/components/up-canvas/up-canvas.uvue')
const qrcodeVue = read('uni_modules/uview-ultra/components/up-qrcode/up-qrcode.vue')
const qrcodeUvue = read('uni_modules/uview-ultra/components/up-qrcode/up-qrcode.uvue')
const qrcodeRenderer = read('uni_modules/uview-ultra/components/up-qrcode/qrcode.js')
const overlay = read('pages/componentsA/overlay/overlay.uvue')

assert.equal(
    packageJson.scripts['verify:overlay-qrcode-canvas-init'],
    'node scripts/verify-overlay-qrcode-canvas-init.mjs',
    'expected package.json to expose the overlay QR canvas verifier'
)

assert.match(canvasVue, /let _initPromise = null/)
assert.match(canvasVue, /if \(_initPromise\)\s*\{[\s\S]*return _initPromise/)
assert.match(canvasVue, /const initPromise = _initializeCanvas\(force\)/)
assert.match(canvasVue, /function refresh\(\)\s*\{\s*return initCanvas\(true\)/)
assert.match(canvasVue, /function getRawContext\(\)/)
assert.match(canvasVue, /async function drawImage\(source, \.\.\.args\)/)
assert.match(canvasVue, /function toTempFilePath\(options = \{\}\)/)
assert.match(
    canvasVue,
    /if \(canvasElement && typeof canvasElement\.getContext === 'function'\) \{\s*uniOptions\.canvas = canvasElement/,
    'legacy APP canvas exports should not pass selector size data as a 2D canvas node'
)
assert.match(
    canvasVue,
    /\/\/ #ifdef MP-WEIXIN\s+exportScale = 2\s+\/\/ #endif[\s\S]*destWidth: actualWidth\.value \* exportScale[\s\S]*destHeight: actualHeight\.value \* exportScale/,
    'up-canvas exportImage should preserve the existing WeChat mini-program 2x output size'
)
assert.match(canvasVue, /\/\/ #ifdef MP\s+[\s\S]*?canvasElement\.width = Math\.ceil\(actualWidth\.value \* dpr\.value\)/)
assert.doesNotMatch(
    canvasVue,
    /\/\/ #ifdef MP \|\| H5\s+[\s\S]*?canvasElement\.width = Math\.ceil\(actualWidth\.value \* dpr\.value\)/
)

assert.match(canvasUvue, /let initPromise: Promise<void> \| null = null/)
assert.match(canvasUvue, /if \(initPromise != null\)\s*\{[\s\S]*return initPromise/)
assert.match(canvasUvue, /const currentPromise = new Promise<void>/)
assert.match(canvasUvue, /const refresh = \(\): Promise<void> => initCanvas\(true\)/)
assert.match(canvasUvue, /const getRawContext = \(\): CanvasRenderingContext2D \| null/)
assert.match(canvasUvue, /function toTempFilePath\(options: UTSJSONObject\)/)
assert.match(canvasUvue, /canvas\.width = Math\.ceil\(actualWidth\.value \* dpr\.value\)[\s\S]*canvas\.height = Math\.ceil\(actualHeight\.value \* dpr\.value\)[\s\S]*context2d\.scale\(dpr\.value, dpr\.value\)/)
assert.match(
    canvasUvue,
    /context\.fillRect\(0, 0, actualWidth\.value, actualHeight\.value\)\s+\/\/ #ifndef H5\s+context\.draw\(\)\s+\/\/ #endif/,
    'UVue H5 should use immediate CanvasRenderingContext2D drawing without context.draw()'
)

assert.match(qrcodeVue, /<up-canvas[\s\S]*ref="qrcodeCanvas"/)
assert.doesNotMatch(qrcodeVue, /<canvas(?:\s|>)/)
assert.match(qrcodeVue, /async function initCanvas\(force = false\)/)
assert.match(qrcodeVue, /async function _makeCode\(\)[\s\S]*await initCanvas\(\)/)
assert.match(qrcodeVue, /await host\.initCanvas\(force\)[\s\S]*host\.getRawContext\(\)/)
assert.match(qrcodeVue, /canvasHost:\s*canvasHost\.value/)
assert.doesNotMatch(qrcodeVue, /createCanvasContext\(|getContext\('2d'\)/)
assert.match(qrcodeVue, /defineExpose\(\{[\s\S]*initCanvas,[\s\S]*refresh,/)
assert.match(qrcodeVue, /async function _saveCode\(\)[\s\S]*await toTempFilePath/)
assert.match(qrcodeVue, /async function longpress\(\)[\s\S]*await toTempFilePath/)

assert.match(qrcodeUvue, /<up-canvas[\s\S]*ref="qrcodeCanvas"/)
assert.doesNotMatch(qrcodeUvue, /<canvas(?:\s|>)/)
assert.match(qrcodeUvue, /function initCanvas\(force: boolean = false\): Promise<void>/)
assert.match(qrcodeUvue, /const refresh = \(\): Promise<void> => initCanvas\(true\)/)
assert.match(qrcodeUvue, /canvas\.\$callMethod\('initCanvas', force\)/)
assert.match(qrcodeUvue, /canvas\.\$callMethod\('getRawContext'\)/)
assert.doesNotMatch(qrcodeUvue, /createCanvasContextAsync|getPixelRatio|context2d\.scale/)
assert.match(qrcodeUvue, /\/\/ #ifndef H5\s+context\.draw\(\)\s+\/\/ #endif/)

assert.match(qrcodeRenderer, /canvasHost:\s*opt\.canvasHost/)
assert.match(qrcodeRenderer, /await options\.vuectx\.drawImage/)
assert.match(qrcodeRenderer, /options\.canvasHost\.toTempFilePath/)
assert.match(qrcodeRenderer, /this\.options\.canvasHost\.clearCanvas\(\)/)
assert.doesNotMatch(qrcodeRenderer, /canvas\.width\s*=\s*options\.size/)

assert.match(overlay, /const showQrcode = ref\(false\)/)
assert.match(overlay, /title:\s*'嵌入二维码'/)
assert.match(overlay, /<up-qrcode[\s\S]*cid="overlay-qrcode"/)
assert.match(overlay, /else if \(indexNum == 3\)[\s\S]*showQrcode\.value/)

console.log('overlay qrcode canvas initialization assertions passed')
