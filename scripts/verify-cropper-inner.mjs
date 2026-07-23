import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const cropperVue = readFileSync(
  resolve(root, 'uni_modules/uview-ultra/components/up-cropper/up-cropper.vue'),
  'utf8'
)
const cropperUvue = readFileSync(
  resolve(root, 'uni_modules/uview-ultra/components/up-cropper/up-cropper.uvue'),
  'utf8'
)
const demo = readFileSync(
  resolve(root, 'pages/componentsD/cropper/cropper.uvue'),
  'utf8'
)
const changelog = readFileSync(
  resolve(root, 'uni_modules/uview-ultra/changelog.md'),
  'utf8'
)

assert.match(cropperVue, /inner:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\}/, 'expected vue inner prop default false')
assert.match(
  cropperVue,
  /state\.letRotate\s*=\s*\(canRotate\s*===\s*false\s*\|\|\s*state\.isin\)\s*\?\s*0\s*:\s*1/,
  'expected chooseImage to disable rotate when inner/isin is active'
)
assert.match(
  cropperVue,
  /state\.letRotate\s*=\s*\(props\.canRotate\s*===\s*false\s*\|\|\s*props\.inner\s*===\s*true\)\s*\?\s*0\s*:\s*1/,
  'expected setup init to disable rotate when inner is true'
)
assert.match(
  cropperVue,
  /if\s*\(\s*state\.isin\s*\)[\s\S]*imgL[\s\S]*imgR/,
  'expected resize path to clamp crop box inside image when isin'
)
assert.match(cropperUvue, /inner:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\}/, 'expected uvue inner prop')
assert.match(cropperUvue, /innerMode\.value as boolean/, 'expected uvue inner mode usage')
assert.match(demo, /inner:\s*true/, 'expected demo to show inner usage via chooseImage params')
assert.match(changelog, /inner/, 'expected changelog to mention inner')

console.log('cropper inner assertions passed')
