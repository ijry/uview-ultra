import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

const packageJson = JSON.parse(read('package.json'))
const canvasVue = read('uni_modules/uview-ultra/components/up-canvas/up-canvas.vue')
const posterVue = read('uni_modules/uview-ultra/components/up-poster/up-poster.vue')
const posterUvue = read('uni_modules/uview-ultra/components/up-poster/up-poster.uvue')
const barcodeVue = read('uni_modules/uview-ultra/components/up-barcode/up-barcode.vue')

assert.equal(
    packageJson.scripts['verify:harmony-canvas-fallback'],
    'node scripts/verify-harmony-canvas-fallback.mjs',
    'expected package.json to expose the harmony canvas fallback verifier'
)

// ---------------------------------------------------------------------------
// 行为验证 1：鸿蒙 measureText 恒返回 0 时，up-poster.vue 仍必须换行
//
// 根因：@dcloudio/uni-app-harmony 的 CanvasContext.measureText 同步返回值写死为 0
// （真实宽度只通过 callback 经 evalJSAsync 异步回传），而 uni-app-plus 走
// evalJSSync 同步返回真值。宽度 0 会让 `0 > maxWidth` 恒为 false，
// 换行逻辑认为"整段都放得下"，于是文本挤成一行横穿海报。
// ---------------------------------------------------------------------------

/** 从 SFC 中抽出一个函数定义，脱离 uni-app 运行时直接执行。 */
function extractFunction(source, signature) {
    const start = source.indexOf(signature)
    assert.notEqual(start, -1, `未能在源码中找到函数: ${signature}`)
    let depth = 0
    let index = source.indexOf('{', start)
    for (; index < source.length; index++) {
        if (source[index] === '{') depth++
        else if (source[index] === '}') {
            depth--
            if (depth === 0) break
        }
    }
    assert.ok(index < source.length, `函数括号不配对: ${signature}`)
    return source.slice(start, index + 1)
}

const RPX_RATIO = 0.5 // 375/750，与鸿蒙默认 baseWidth 一致
const convertRpxToPx = value => (typeof value === 'number'
    ? value
    : (String(value).endsWith('rpx') ? parseFloat(value) * RPX_RATIO : parseFloat(value) || 0))

const posterSandbox = new Function('convertRpxToPx', `
    ${extractFunction(posterVue, 'function estimateTextWidth(text, fontSize) {')}
    ${extractFunction(posterVue, 'function measureTextWidth(ctx, text, fontSize) {')}
    ${extractFunction(posterVue, 'function drawTextWithLineClamp(ctx, text, x, y, maxWidth, css) {')}
    return { drawTextWithLineClamp, estimateTextWidth, measureTextWidth }
`)(convertRpxToPx)

const DEMO_TEXT = '精美陶瓷茶具套装，高端大气上档次，送礼自用两相宜'
const DEMO_CSS = { lineClamp: 2, fontSize: '36rpx', lineHeight: '50rpx' }
const DEMO_MAX_WIDTH = convertRpxToPx('396rpx')

/** 鸿蒙 CanvasContext：measureText 同步恒返回 0 */
function createHarmonyCtx() {
    const drawn = []
    return { drawn, measureText: () => ({ width: 0 }), fillText: (text, x, y) => drawn.push({ text, x, y }) }
}

const harmonyCtx = createHarmonyCtx()
posterSandbox.drawTextWithLineClamp(harmonyCtx, DEMO_TEXT, 0, 0, DEMO_MAX_WIDTH, DEMO_CSS)

assert.equal(
    harmonyCtx.drawn.length, 2,
    `鸿蒙测量失效时海报文本必须按 lineClamp 换行，实际绘制 ${harmonyCtx.drawn.length} 行: ` +
    JSON.stringify(harmonyCtx.drawn.map(item => item.text))
)
assert.ok(
    harmonyCtx.drawn[0].text.length < DEMO_TEXT.length,
    '第一行不能承载整段文本，否则等于没有换行'
)
assert.match(harmonyCtx.drawn[1].text, /\.\.\.$/, '超出 lineClamp 的文本应以省略号结尾')

// 每一行的估算宽度都不能超过 maxWidth
const demoFontSize = convertRpxToPx(DEMO_CSS.fontSize)
for (const line of harmonyCtx.drawn) {
    assert.ok(
        posterSandbox.estimateTextWidth(line.text, demoFontSize) <= DEMO_MAX_WIDTH,
        `行宽超出限制: ${line.text}`
    )
}

// 行距必须等于 lineHeight
assert.equal(
    harmonyCtx.drawn[1].y - harmonyCtx.drawn[0].y,
    convertRpxToPx(DEMO_CSS.lineHeight),
    '两行之间的间距应等于 lineHeight'
)

// ---------------------------------------------------------------------------
// 行为验证 2：真实测量可用时必须优先采用测量值，不能被估算顶掉
// ---------------------------------------------------------------------------
const REAL_WIDTH = 7
const realCtx = { measureText: text => ({ width: text.length * REAL_WIDTH }) }
assert.equal(
    posterSandbox.measureTextWidth(realCtx, 'abcd', 20), 4 * REAL_WIDTH,
    '测量值有效时必须直接采用，不能回退到估算'
)
assert.equal(
    posterSandbox.measureTextWidth({ measureText: () => ({ width: 0 }) }, 'abcd', 20),
    posterSandbox.estimateTextWidth('abcd', 20),
    '测量值为 0 时必须回退到估算'
)

// ---------------------------------------------------------------------------
// 行为验证 3：估算系数必须适配全角字符
// 常见的 length * fontSize * 0.6 会把汉字短算约 40%，中文依旧不换行。
// ---------------------------------------------------------------------------
const FONT = 18
assert.equal(posterSandbox.estimateTextWidth('中', FONT), FONT, '全角汉字应约占一个字号宽')
assert.equal(posterSandbox.estimateTextWidth('，', FONT), FONT, '全角标点应按全角计算')
assert.ok(
    posterSandbox.estimateTextWidth('a', FONT) < FONT,
    '半角字符应窄于全角'
)
// 整段中文的估算宽度必须显著超过单行上限，否则不会触发换行
assert.ok(
    posterSandbox.estimateTextWidth(DEMO_TEXT, demoFontSize) > DEMO_MAX_WIDTH * 1.5,
    '整段中文的估算宽度应明显超过单行宽度上限'
)

// ---------------------------------------------------------------------------
// 行为验证 4：.vue 与 .uvue 两处全角正则必须判定一致
// 二者各写一份（uts 不能 import .vue 的辅助函数），容易漂移。
// 尤其要覆盖 CJK 标点区：全角句号「。」、顿号「、」、书名号若被判成半角，
// 行宽会被低估，中文长文案又会退回不换行。
// ---------------------------------------------------------------------------
const vueFullWidth = new RegExp(posterVue.match(/const FULL_WIDTH = \/(\[[^\n]*?\])\/;/)[1])
const utsFullWidth = new RegExp(posterUvue.match(/if \(\/(\[[^\n]*?\])\/\.test\(character\)\)/)[1])
const SAMPLES = '精美陶瓷茶具，。、；：！？「」《》（）ひらがなカタカナ한글abc123 \t.,;:!?'
for (const char of SAMPLES) {
    assert.equal(
        vueFullWidth.test(char), utsFullWidth.test(char),
        `.vue 与 .uvue 的全角判定不一致，字符: ${JSON.stringify(char)}`
    )
}
for (const char of '。、《》「」') {
    assert.ok(utsFullWidth.test(char), `全角标点必须按全角计算: ${char}`)
}
for (const char of 'a1') {
    assert.ok(!utsFullWidth.test(char), `半角字符不应判为全角: ${char}`)
}

// ---------------------------------------------------------------------------
// 源码约束：.uvue 侧（uni-app x 下 .uvue 优先于 .vue，这是当前鸿蒙构建走的路径）
// ---------------------------------------------------------------------------
assert.match(
    posterUvue,
    /function measuredTextWidth\(context: CanvasRenderingContext2D, text: string, fontSize: number\): number/,
    'up-poster.uvue 需要 measuredTextWidth 兜底函数'
)
assert.match(
    posterUvue,
    /const measured = context\.measureText\(text\)\.width \/ getDrawScale\(\)\s*\n\s*return measured > 0 \? measured : estimateTextWidth\(text, fontSize\)/,
    'up-poster.uvue 必须把物理测量宽度还原为逻辑宽度，并在结果 <= 0 时回退到估算'
)
assert.doesNotMatch(
    posterUvue,
    /context\.measureText\([^)]*\)\.width > maxWidth/,
    'up-poster.uvue 不得直接用裸 measureText 结果做换行判断'
)
assert.match(
    posterUvue,
    /wrapText = \(text: string, maxWidth: number, maxLines: number, fontSize: number\)/,
    'wrapText 需要接收 fontSize 以便估算'
)
assert.match(
    posterUvue,
    /let wrapText = \(_text: string, _maxWidth: number, _maxLines: number, _fontSize: number\)/,
    'wrapText 的前置声明必须与实现签名一致（uts 无函数提升）'
)
assert.match(
    posterUvue,
    /const lines = wrapText\(item\.text, width, lineClamp, fontSize\)/,
    'drawText 必须把 fontSize 传给 wrapText'
)
// uts 无函数提升：估算辅助函数必须出现在首次使用之前
assert.ok(
    posterUvue.indexOf('function characterWidth(') < posterUvue.indexOf('function estimateTextWidth('),
    'characterWidth 必须定义在 estimateTextWidth 之前（uts 无函数提升）'
)
assert.ok(
    posterUvue.indexOf('function estimateTextWidth(') < posterUvue.indexOf('function measuredTextWidth('),
    'estimateTextWidth 必须定义在 measuredTextWidth 之前（uts 无函数提升）'
)
assert.ok(
    posterUvue.indexOf('function measuredTextWidth(') < posterUvue.indexOf('measuredTextWidth(context, next, fontSize)'),
    'measuredTextWidth 必须定义在首次调用之前（uts 无函数提升）'
)

// ---------------------------------------------------------------------------
// 源码约束：画布实例判空（鸿蒙拿不到实例时应立刻报错，而不是等 10s 超时）
// ---------------------------------------------------------------------------
assert.match(
    posterVue,
    /const ctx = uni\.createCanvasContext\(canvasId\.value, proxy\);[\s\S]{0,300}?if \(!ctx\) \{[\s\S]{0,200}?reject\(new Error\('无法初始化海报画布'\)\)/,
    'up-poster.vue 必须在画布实例为空时立刻 reject'
)
assert.equal(
    (barcodeVue.match(/if \(!ctx\) \{\s*\n\s*throw new Error\('无法获取条码画布实例'\)/g) || []).length,
    2,
    'up-barcode.vue 的两处 createCanvasContext 都必须判空'
)

// ---------------------------------------------------------------------------
// 条件编译验证：用真实预处理器确认 getCanvasContext 在每个平台都有且仅有一个
// 可达 return。鸿蒙下 APP_PLUS 并未定义（见 uni-cli-shared 的
// preprocess/context.js：platform === 'app-harmony' 时只置 APP_HARMONY），
// 所以 #ifdef APP-PLUS 会把整个函数体裁空、静默返回 undefined。
// ---------------------------------------------------------------------------
const PREPROCESS_HOST = resolve(root, '..', 'uview-plus', 'package.json')
let pre = null
try {
    pre = createRequire(PREPROCESS_HOST)('@dcloudio/uni-cli-shared/dist/preprocess/index.js')
} catch (error) {
    pre = null
}

if (pre) {
    const target = extractFunction(canvasVue, 'function getCanvasContext() {')
    const templateBlock = canvasVue.slice(0, canvasVue.indexOf('</template>'))
    const expected = {
        'app-harmony': 'createCanvasContext',
        'app-plus': 'createCanvasContext',
        'mp-weixin': 'getContext',
        h5: 'getContext'
    }
    for (const [platform, wanted] of Object.entries(expected)) {
        pre.initPreContext(platform, undefined, undefined, false)
        const out = pre.preJs(target)
        const code = out.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
        const returns = (code.match(/\breturn\b/g) || []).length
        assert.equal(
            returns, 1,
            `${platform}: getCanvasContext 应恰好保留 1 个 return，实际 ${returns} 个` +
            (returns === 0 ? '（函数体被裁空，会静默返回 undefined）' : '')
        )
        assert.ok(
            code.includes(wanted),
            `${platform}: getCanvasContext 应走 ${wanted} 分支`
        )
        const canvasCount = (pre.preHtml(templateBlock).match(/<canvas|<gcanvas/g) || []).length
        assert.equal(
            canvasCount, 1,
            `${platform}: 模板应恰好渲染 1 个画布元素，实际 ${canvasCount} 个`
        )
    }
    // nvue 分支不能被改动波及
    pre.initPreContext('app-plus', undefined, undefined, false)
    const nvueOut = pre.preNVueJs(target).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.equal(
        (nvueOut.match(/\breturn\b/g) || []).length, 1,
        'app-plus/nvue: getCanvasContext 应恰好保留 1 个 return'
    )
    console.log('  (条件编译已用真实预处理器验证: app-harmony / app-plus / mp-weixin / h5 / nvue)')
} else {
    // 预处理器只存在于相邻的 uview-plus 仓库，缺失时降级为源码约束检查
    console.log('  (跳过预处理器验证: 未找到 @dcloudio/uni-cli-shared，降级为源码检查)')
    assert.match(
        canvasVue,
        /\/\/ #ifdef APP-PLUS \|\| APP-HARMONY\s+return uni\.createCanvasContext/,
        'getCanvasContext 必须显式覆盖 APP-HARMONY'
    )
    assert.match(
        canvasVue,
        /\/\/ #ifndef APP-PLUS \|\| APP-HARMONY\s+return canvasElement/,
        'getCanvasContext 的非 APP 分支必须用 #ifndef 兜底，避免新平台裁空'
    )
    assert.match(
        canvasVue,
        /<!-- #ifdef APP-PLUS \|\| APP-HARMONY -->/,
        '模板必须为鸿蒙渲染 canvas 元素'
    )
}

// 无论预处理器是否可用，都不允许再出现"每个 return 都被 ifdef 包住"的写法
assert.doesNotMatch(
    canvasVue,
    /\/\/ #ifdef APP-PLUS-NVUE \|\| MP \|\| H5\s+return canvasElement/,
    'getCanvasContext 不得使用会漏掉鸿蒙的平台白名单'
)

console.log('harmony canvas fallback assertions passed')
