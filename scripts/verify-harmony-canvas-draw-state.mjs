import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

function extractFunctionBody(source, signature) {
    const start = source.indexOf(signature)
    assert.notEqual(start, -1, `未能在源码中找到函数: ${signature}`)
    const open = source.indexOf('{', start)
    let depth = 0
    for (let index = open; index < source.length; index++) {
        if (source[index] === '{') depth++
        else if (source[index] === '}') {
            depth--
            if (depth === 0) return source.slice(open, index + 1)
        }
    }
    assert.fail(`函数括号不配对: ${signature}`)
}

const packageJson = JSON.parse(read('package.json'))
const canvasUvue = read('uni_modules/uview-ultra/components/up-canvas/up-canvas.uvue')
const qrcodeUvue = read('uni_modules/uview-ultra/components/up-qrcode/up-qrcode.uvue')
const posterUvue = read('uni_modules/uview-ultra/components/up-poster/up-poster.uvue')

assert.equal(
    packageJson.scripts['verify:harmony-canvas-draw-state'],
    'node scripts/verify-harmony-canvas-draw-state.mjs',
    'expected package.json to expose the harmony canvas draw-state verifier'
)

// ---------------------------------------------------------------------------
// 缺陷一：fillStyle = 'transparent' 会让鸿蒙整段绘制中断
//
// 根因在运行时 uni-canvas/utssdk/app-harmony/index.ets 的 _fixColor：
//     if (color.startsWith('#') || color.startsWith('rgb')) return color
//     else return EXTENDED_COLOR_KEYWORDS[color]
// 那张表只有 147 个 CSS 颜色关键字，**不含 transparent**，查表返回 undefined，
// 赋给 fillStyle 后后续绘制全部作废——画布上只剩 CSS 背景色。
//
// 反证：若 undefined 只是被忽略，fillStyle 会保持默认 #000000，
// fillRect(0,0,w,h) 会把画布涂黑；真机截图是白/红（即 CSS 背景），
// 说明画布是空的、回调在这一行就断了。
// ---------------------------------------------------------------------------

/** 用真实运行时的关键字表当 oracle（存在时），否则退化为断言表里没有 transparent。 */
function loadColorKeywords() {
    const ohpm = resolve(root, 'unpackage/dist/dev/app-harmony/oh_modules/.ohpm')
    if (!existsSync(ohpm)) return null
    const runtime = readdirSync(ohpm).find(name => name.startsWith('@dcloudio+uni-app-x-runtime@'))
    if (!runtime) return null
    const file = resolve(
        ohpm, runtime,
        'oh_modules/@dcloudio/uni-app-x-runtime/src/main/ets/modules/uni_modules',
        'uni-canvas/customElements/uni-canvas/uni-canvas.js'
    )
    if (!existsSync(file)) return null
    const source = readFileSync(file, 'utf8')
    const match = source.match(/EXTENDED_COLOR_KEYWORDS\s*=\s*\{([\s\S]*?)\n\}/)
    if (!match) return null
    const keys = new Set()
    for (const line of match[1].split('\n')) {
        const key = line.match(/^\s*['"]?([A-Za-z]+)['"]?\s*:/)
        if (key) keys.add(key[1])
    }
    return keys.size > 0 ? keys : null
}

const keywords = loadColorKeywords()
if (keywords) {
    assert.ok(
        !keywords.has('transparent'),
        '前提已变：运行时关键字表现在包含 transparent，本修复可以撤销'
    )
    for (const known of ['red', 'blue', 'white', 'black']) {
        assert.ok(keywords.has(known), `关键字表应包含 ${known}，否则说明解析姿势不对`)
    }
    console.log(`  (已用真实运行时关键字表校验: ${keywords.size} 个关键字，无 transparent)`)
} else {
    console.log('  (跳过运行时关键字表校验: 未找到已构建的鸿蒙运行时)')
}

/** 复刻 _fixColor，用来证明修复前后的差异。 */
const fixColor = color => (
    color.startsWith('#') || color.startsWith('rgb')
        ? color
        : (keywords && keywords.has(color) ? color : undefined)
)

// 三个组件各自持有一份 normalizeCanvasColor（uts 不便跨 SFC 复用），行为必须一致
function extractNormalize(source, label) {
    const match = source.match(
        /function normalizeCanvasColor\(color: string\): string \{\s*\n\s*return ([^\n]+)\n\s*\}/
    )
    assert.ok(match, `${label} 缺少 normalizeCanvasColor`)
    return new Function('color', `return ${match[1].replace(/==/g, '===')}`)
}

const normalizers = {
    'up-canvas.uvue': extractNormalize(canvasUvue, 'up-canvas.uvue'),
    'up-qrcode.uvue': extractNormalize(qrcodeUvue, 'up-qrcode.uvue'),
    'up-poster.uvue': extractNormalize(posterUvue, 'up-poster.uvue')
}

for (const [label, normalize] of Object.entries(normalizers)) {
    // 修复前：transparent 会被查表吃掉；修复后必须活着穿过 _fixColor
    assert.equal(fixColor('transparent'), undefined, '前提：裸 transparent 会被 _fixColor 吞掉')
    const fixed = fixColor(normalize('transparent'))
    assert.notEqual(fixed, undefined, `${label}: transparent 归一化后仍被 _fixColor 吞掉`)
    assert.match(fixed, /^rgba?\(/, `${label}: 归一化结果必须以 rgb 开头才能绕过查表`)
    assert.match(
        fixed.replace(/\s/g, ''),
        /^rgba\(\d+,\d+,\d+,0\)$/,
        `${label}: 归一化结果必须是全透明，否则会盖住底色`
    )
    // 其它颜色必须原样透传，不能顺手改写
    for (const passthrough of ['#ffffff', '#000', 'rgba(1, 2, 3, 0.5)', 'rgb(1,2,3)', 'red']) {
        assert.equal(
            normalize(passthrough), passthrough,
            `${label}: 非 transparent 颜色必须原样透传: ${passthrough}`
        )
    }
}

// up-qrcode 仍然向 up-canvas 传 transparent（保留语义），所以归一化必须在下游生效
assert.match(
    qrcodeUvue,
    /bg-color="transparent"/,
    'up-qrcode.uvue 仍应保留 transparent 语义，由下游归一化处理'
)
// 裸 context 写入点必须全部经过归一化
const rawFillStyleWrites = qrcodeUvue.match(/context\.fillStyle = (?!normalizeCanvasColor)[^\n]+/g)
assert.equal(
    rawFillStyleWrites, null,
    `up-qrcode.uvue 存在未归一化的 fillStyle 赋值: ${JSON.stringify(rawFillStyleWrites)}`
)
for (const setter of ['fillStyle', 'strokeStyle']) {
    assert.match(
        canvasUvue,
        new RegExp(`context\\.${setter} = normalizeCanvasColor\\(color\\)`),
        `up-canvas.uvue 的 ${setter} 必须经过 normalizeCanvasColor`
    )
}

// ---------------------------------------------------------------------------
// 缺陷二：鸿蒙 uni-canvas 会把每个绘制数值参数 px2vp，内容缩到 1/dpr
//
// 后备存储仍需使用「逻辑尺寸 × dpr」保证导出清晰度，但鸿蒙适配层的
// fillRect/clearRect/drawImage/fillText/路径/渐变会再次对参数执行 px2vp。
// 因此鸿蒙分支必须把绘制参数乘 dpr 抵消；不能用 scale/setTransform，
// 真机会把 Surface 高度异常放大到 16777216 并触发 ResetSurfaceForVK。
// ---------------------------------------------------------------------------

const stripComments = source => source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** 仅处理本测试关心的 APP-HARMONY 条件，验证两个分支的可达代码。 */
function preprocessHarmony(source, isHarmony) {
    const output = []
    const activeStack = [true]
    for (const line of source.split('\n')) {
        const directive = line.match(/^\s*\/\/\s*#(ifdef|ifndef)\s+APP-HARMONY\s*$/)
        if (directive) {
            const enabled = directive[1] === 'ifdef' ? isHarmony : !isHarmony
            activeStack.push(activeStack[activeStack.length - 1] && enabled)
            continue
        }
        if (/^\s*\/\/\s*#endif\s*$/.test(line) && activeStack.length > 1) {
            activeStack.pop()
            continue
        }
        if (activeStack[activeStack.length - 1]) output.push(line)
    }
    return output.join('\n')
}

const SCALED_FILES = {
    'up-canvas.uvue': canvasUvue,
    'up-poster.uvue': posterUvue
}

for (const [label, source] of Object.entries(SCALED_FILES)) {
    const scaleBody = extractFunctionBody(source, 'function scaleCanvasValue(value: number): number {')
    assert.match(
        scaleBody,
        /return value \* getDrawScale\(\)/,
        `${label}: 所有逻辑绘制值必须统一乘 getDrawScale()`
    )

    const drawScaleBody = extractFunctionBody(source, 'function getDrawScale(): number {')
    const harmonyBody = preprocessHarmony(drawScaleBody, true)
    const otherBody = preprocessHarmony(drawScaleBody, false)
    assert.equal((stripComments(harmonyBody).match(/\breturn\b/g) || []).length, 1,
        `${label}: 鸿蒙 getDrawScale 必须恰好保留一个 return`)
    assert.equal((stripComments(otherBody).match(/\breturn\b/g) || []).length, 1,
        `${label}: 非鸿蒙 getDrawScale 必须恰好保留一个 return`)
    assert.match(harmonyBody, /return dpr\.value/, `${label}: 鸿蒙绘制倍率必须使用 dpr`)
    assert.match(otherBody, /return 1/, `${label}: 非鸿蒙绘制倍率必须保持 1`)

    const initStart = source.indexOf('createCanvasContextAsync')
    const initCanvas = source.slice(initStart, source.indexOf('fail:', initStart))
    assert.ok(initStart >= 0 && initCanvas.length > 0, `${label}: 未能定位 initCanvas 的 success 回调`)
    assert.match(
        initCanvas,
        /canvas\.width = Math\.ceil\([^\n]+ \* dpr\.value\)/,
        `${label}: 后备存储宽度必须按 dpr 放大`
    )
    assert.match(
        initCanvas,
        /canvas\.height = Math\.ceil\([^\n]+ \* dpr\.value\)/,
        `${label}: 后备存储高度必须按 dpr 放大`
    )
    const harmonyInit = stripComments(preprocessHarmony(initCanvas, true))
    assert.doesNotMatch(
        harmonyInit,
        /\.(?:scale|setTransform|resetTransform)\(/,
        `${label}: 鸿蒙初始化不得使用矩阵缩放，否则可能创建异常超大 Surface`
    )
}

// up-canvas 其它平台仍保留原有清晰度缩放，条件编译不能误删。
const canvasInitStart = canvasUvue.indexOf('createCanvasContextAsync')
const canvasInit = canvasUvue.slice(canvasInitStart, canvasUvue.indexOf('fail:', canvasInitStart))
assert.match(
    preprocessHarmony(canvasInit, false),
    /context2d\.scale\(dpr\.value, dpr\.value\)/,
    'up-canvas.uvue 非鸿蒙分支应保留既有 context scale'
)

// 旧矩阵补偿 API 必须彻底退出绘制链路。
for (const [label, source] of Object.entries({ ...SCALED_FILES, 'up-qrcode.uvue': qrcodeUvue })) {
    const code = stripComments(source)
    assert.doesNotMatch(code, /\bapplyDrawScale\b/, `${label}: 不得残留 applyDrawScale`)
    assert.doesNotMatch(code, /\.(?:setTransform|resetTransform)\(/, `${label}: 不得调用矩阵重置 API`)
}

// up-canvas 对外绘制 API 的所有长度和坐标都要走统一补偿。
for (const pattern of [
    /context\.clearRect\(scaleCanvasValue\(x\), scaleCanvasValue\(y\), scaleCanvasValue\(width\), scaleCanvasValue\(height\)\)/,
    /context\.fillRect\(0, 0, scaleCanvasValue\(actualWidth\.value\), scaleCanvasValue\(actualHeight\.value\)\)/,
    /context\.rect\(scaleCanvasValue\(x\), scaleCanvasValue\(y\), scaleCanvasValue\(width\), scaleCanvasValue\(height\)\)/,
    /context\.lineWidth = scaleCanvasValue\(width\)/,
    /context\.moveTo\(scaleCanvasValue\(x\), scaleCanvasValue\(y\)\)/,
    /context\.lineTo\(scaleCanvasValue\(x\), scaleCanvasValue\(y\)\)/
]) {
    assert.match(canvasUvue, pattern, `up-canvas.uvue 缺少绘制参数补偿: ${pattern}`)
}

// 海报所有含坐标/长度的 Canvas 调用必须显式经过 scaleCanvasValue。
for (const method of [
    'clearRect', 'fillRect', 'fillText', 'drawImage', 'createRadialGradient',
    'createLinearGradient', 'arc', 'moveTo', 'lineTo', 'quadraticCurveTo'
]) {
    const calls = posterUvue.match(new RegExp(`context\\.${method}\\([^\\n]+`, 'g')) || []
    assert.ok(calls.length > 0, `up-poster.uvue 未找到 ${method} 调用`)
    for (const call of calls) {
        assert.match(call, /scaleCanvasValue\(/, `up-poster.uvue ${method} 存在未补偿调用: ${call}`)
    }
}
assert.match(
    posterUvue,
    /context\.font = [^\n]+scaleCanvasValue\(fontSize\)/,
    'up-poster.uvue 字号必须按鸿蒙绘制倍率补偿'
)
assert.match(
    posterUvue,
    /const measured = context\.measureText\(text\)\.width \/ getDrawScale\(\)/,
    'up-poster.uvue measureText 返回非零物理宽度时必须还原为逻辑宽度'
)
assert.ok(
    posterUvue.indexOf('function getDrawScale(') < posterUvue.indexOf('function measuredTextWidth('),
    'up-poster.uvue getDrawScale 必须定义在 measuredTextWidth 之前'
)
const posterPixelRatioBody = extractFunctionBody(posterUvue, 'function canvasPixelRatio(): number {')
assert.match(preprocessHarmony(posterPixelRatioBody, true), /uni\.getWindowInfo\(\)\.pixelRatio/,
    'up-poster.uvue 鸿蒙分支必须读取真实 DPR')
assert.equal((stripComments(preprocessHarmony(posterPixelRatioBody, false)).match(/\breturn\b/g) || []).length, 1,
    'up-poster.uvue 非鸿蒙 canvasPixelRatio 必须恰好保留一个 return')
assert.match(preprocessHarmony(posterPixelRatioBody, false), /return 1/,
    'up-poster.uvue 非鸿蒙不得改变原有画布倍率')

// up-qrcode 通过 up-canvas 绘图，但鸿蒙必须等原生 Canvas 首帧后再消费上下文。
const canvasInitBody = extractFunctionBody(canvasUvue, 'function initCanvas(force: boolean = false): Promise<void> {')
const harmonyCanvasInit = preprocessHarmony(canvasInitBody, true)
assert.match(
    harmonyCanvasInit,
    /context\.requestAnimationFrame\(\(_time: number\) => \{[\s\S]*?fillCanvasBackground\(\)[\s\S]*?resolve\(\)/,
    'up-canvas.uvue 鸿蒙端必须等待首帧后再初始化并绘制背景'
)
const otherCanvasInit = preprocessHarmony(canvasInitBody, false)
assert.doesNotMatch(
    otherCanvasInit,
    /context\.requestAnimationFrame\(/,
    'up-canvas.uvue 非鸿蒙端不应引入首帧等待'
)
assert.match(
    qrcodeUvue,
    /const scale = canvas\.\$callMethod\('getDrawScale'\)[\s\S]{0,160}?drawScale\.value =/,
    'up-qrcode.uvue 必须从 up-canvas 同步绘制倍率'
)

const qrcodeTemplate = qrcodeUvue.slice(0, qrcodeUvue.indexOf('</template>'))
assert.match(qrcodeTemplate, /<up-canvas[\s\S]*?bg-color="transparent"/,
    'up-qrcode.uvue 必须保留透明背景语义并复用 up-canvas')
assert.match(qrcodeUvue, /const physicalDrawSize = drawSize \* drawScale\.value/,
    'up-qrcode.uvue 必须计算二维码物理绘制尺寸')
assert.doesNotMatch(
    qrcodeUvue,
    /cell\.get(?:Boolean|String)\(/,
    'up-qrcode.uvue 不得用 typed getter 读取二维码单元字段'
)
assert.match(
    qrcodeUvue,
    /\(cell\['dark'\] as boolean\) != true/,
    'up-qrcode.uvue 必须通过下标读取二维码 dark 字段'
)
assert.match(
    qrcodeUvue,
    /const rawColor = cell\['color'\]/,
    'up-qrcode.uvue 必须通过下标读取二维码 color 字段'
)
for (const pattern of [
    /context\.clearRect\(0, 0, physicalDrawSize, physicalDrawSize\)/,
    /context\.fillRect\(0, 0, physicalDrawSize, physicalDrawSize\)/,
    /Math\.floor\(col \* physicalDrawSize \/ count\)/,
    /Math\.ceil\(\(col \+ 1\) \* physicalDrawSize \/ count\)/,
    /context\.fillRect\(left, top, right - left, bottom - top\)/
]) {
    assert.match(qrcodeUvue, pattern, `up-qrcode.uvue 缺少物理像素边界计算: ${pattern}`)
}

const posterInitBody = extractFunctionBody(posterUvue, 'function initCanvas(): Promise<void> {')
const harmonyPosterInit = preprocessHarmony(posterInitBody, true)
assert.match(
    harmonyPosterInit,
    /context\.requestAnimationFrame\(\(_time: number\) => \{[\s\S]*?resolve\(\)/,
    'up-poster.uvue 鸿蒙端必须等待首帧后才开始背景、文字和图片绘制'
)
const otherPosterInit = preprocessHarmony(posterInitBody, false)
assert.doesNotMatch(
    otherPosterInit,
    /context\.requestAnimationFrame\(/,
    'up-poster.uvue 非鸿蒙端不应引入首帧等待'
)

// ---------------------------------------------------------------------------
// 缺陷三：Regex("...") 是 UTS 编译到 Kotlin 才有的全局，鸿蒙(ArkTS)下不存在
// ---------------------------------------------------------------------------
const utsSources = []
const walk = dir => {
    for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'unpackage') continue
        const path = `${dir}/${entry.name}`
        if (entry.isDirectory()) walk(path)
        else if (/\.(uts|uvue)$/.test(entry.name)) utsSources.push(path)
    }
}
walk('uni_modules')
// 注释里提到 Regex(...) 是正常的（修复说明就会提），先剥掉注释再判定
const regexOffenders = utsSources.filter(path => /\bRegex\s*\(/.test(stripComments(read(path))))
assert.deepEqual(
    regexOffenders, [],
    `以下文件使用了 Kotlin 专属的 Regex(...)，鸿蒙下会报 "Regex is not defined": ${regexOffenders}`
)

console.log('harmony canvas draw-state assertions passed')
