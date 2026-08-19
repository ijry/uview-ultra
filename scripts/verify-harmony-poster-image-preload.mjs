import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const poster = readFileSync(
    resolve(root, 'uni_modules/uview-ultra/components/up-poster/up-poster.uvue'),
    'utf8'
)

function extractBody(signature, fromLast = false) {
    const start = fromLast ? poster.lastIndexOf(signature) : poster.indexOf(signature)
    assert.notEqual(start, -1, `未找到函数: ${signature}`)
    const open = poster.indexOf('{', start)
    let depth = 0
    for (let index = open; index < poster.length; index++) {
        if (poster[index] === '{') depth++
        if (poster[index] === '}') {
            depth--
            if (depth === 0) return poster.slice(open, index + 1)
        }
    }
    assert.fail(`函数括号不配对: ${signature}`)
}

assert.match(
    poster,
    /type PosterImageAsset = \{[\s\S]*?src: string,[\s\S]*?image: Image \| null[\s\S]*?failed: boolean[\s\S]*?\}/,
    '海报组件需要保存预加载后的 Canvas Image'
)

const generatePosterBody = extractBody('generatePoster = (): Promise<string> =>', true)
const initIndex = generatePosterBody.indexOf('initCanvas()')
const preloadIndex = generatePosterBody.indexOf('preloadPosterImages(')
const drawIndex = generatePosterBody.indexOf('drawPoster()')

assert.ok(initIndex >= 0, '生成海报前必须初始化 Canvas')
assert.ok(preloadIndex > initIndex, '图片预加载必须发生在 Canvas 初始化之后')
assert.ok(drawIndex > preloadIndex, '任何海报绘制必须等待图片预加载完成')

const preloadImageBody = extractBody('preloadPosterImage = (item: PosterItem): Promise<void> =>', true)
assert.match(preloadImageBody, /uni\.getImageInfo\(/, '预加载阶段需要解析图片路径')
assert.match(preloadImageBody, /canvas\.createImage\(\)/, '预加载阶段需要创建 Canvas Image')
assert.match(preloadImageBody, /image\.onload = \(\) =>/, '预加载阶段必须等待 Canvas Image 加载完成')

const drawImageBody = extractBody('drawImageBox = (item: PosterItem): Promise<void> =>', true)
assert.doesNotMatch(
    drawImageBody,
    /uni\.getImageInfo\(|canvas\.createImage\(\)|image\.onload/,
    '正式绘制阶段不能再次跨越异步图片加载边界'
)
assert.match(drawImageBody, /getPosterImageAsset\(item\.src\)/, '正式绘制阶段必须读取预加载缓存')
assert.match(drawImageBody, /context\.drawImage\(/, '缓存命中后需要按原顺序绘制图片')
assert.match(drawImageBody, /drawImageFallback\(/, '缓存失败时必须保留占位图逻辑')

console.log('harmony poster image preload assertions passed')
