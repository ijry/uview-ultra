import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = 'D:/Repos/xyito/ultra-ui/uview-plus4'
const read = filePath => readFileSync(`${root}/${filePath}`, 'utf8')

const vue = read('uni_modules/uview-ultra/components/up-goods-sku/up-goods-sku.vue')
const uvue = read('uni_modules/uview-ultra/components/up-goods-sku/up-goods-sku.uvue')

for (const [name, source] of [['.vue', vue], ['.uvue', uvue]]) {
  assert.match(
    source,
    /<up-popup[\s\S]*?:safeAreaInsetBottom="safeAreaInsetBottom"[\s\S]*?>/,
    `expected ${name} to forward safeAreaInsetBottom to up-popup`
  )
  assert.match(
    source,
    /defaultSku:\s*\{[\s\S]*?type:[\s\S]*?default/,
    `expected ${name} to declare a defaultSku prop`
  )
  assert.match(
    source,
    /safeAreaInsetBottom:\s*\{[\s\S]*?type: Boolean,[\s\S]*?default: true/,
    `expected ${name} safeAreaInsetBottom to default to true`
  )
}

// .vue：script setup，选中态初始值 / reset / watch
assert.match(
  vue,
  /const selectedSku = ref\(\{\s*\.\.\.props\.defaultSku\s*\}\)/,
  'expected .vue selectedSku to initialize from defaultSku'
)
assert.match(
  vue,
  /function reset\(\)\s*\{[\s\S]*?selectedSku\.value = \{\s*\.\.\.props\.defaultSku\s*\}/,
  'expected .vue reset to restore defaultSku'
)
assert.match(
  vue,
  /watch\(\(\) => props\.defaultSku/,
  'expected .vue to watch defaultSku'
)

// .uvue：UTS 实现，通过 cloneSkuObject 深拷贝
assert.match(
  uvue,
  /function cloneSkuObject\(value: UTSJSONObject \| null\): UTSJSONObject/,
  'expected .uvue to declare cloneSkuObject'
)
assert.match(
  uvue,
  /const selectedSku = ref\(cloneSkuObject\(props\.defaultSku\)\)/,
  'expected .uvue selectedSku to initialize from defaultSku'
)
assert.match(
  uvue,
  /const reset = \(\): void => \{[\s\S]*?selectedSku\.value = cloneSkuObject\(props\.defaultSku\)/,
  'expected .uvue reset to restore defaultSku'
)
assert.match(
  uvue,
  /watch\(\(\) : UTSJSONObject \| null => props\.defaultSku/,
  'expected .uvue to watch defaultSku'
)

console.log('goods-sku default selection & safe-area assertions passed')