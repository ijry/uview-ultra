import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

const packageJson = JSON.parse(read('package.json'))
const cropperUvue = read('uni_modules/uview-ultra/components/up-cropper/up-cropper.uvue')
const cropperVue = read('uni_modules/uview-ultra/components/up-cropper/up-cropper.vue')
const demo = read('pages/componentsD/cropper/cropper.uvue')

assert.equal(
    packageJson.scripts['verify:cropper-image-src'],
    'node scripts/verify-cropper-image-src.mjs',
    'expected package.json to expose the cropper imageSrc verifier'
)

// Issue #897: business code often takes the photo itself (uni.chooseImage / camera) and
// only then wants the cropper. Without an explicit path parameter the cropper always
// re-opens the system picker, so the caller's temp file cannot be cropped at all.
// chooseImage(index, { imageSrc }, data) must skip the picker and crop that path
// directly, while an empty/missing imageSrc keeps the original picker behaviour.

// -- uni-app x (uvue) ---------------------------------------------------------
assert.match(
    cropperUvue,
    /const\s+imageSrc\s*=\s*normalizeString\(options\['imageSrc'\]\)\.trim\(\)/,
    'up-cropper.uvue chooseImage() must read and trim params.imageSrc'
)
assert.match(
    cropperUvue,
    /if\s*\(imageSrc\.length\s*>\s*0\)\s*\{\s*loadImage\(imageSrc\)\s*\n\s*return\s*\n\s*\}/,
    'up-cropper.uvue must crop a non-empty imageSrc via the shared loadImage() and skip the picker'
)
assert.match(
    cropperUvue,
    /const\s+openPicker\s*=\s*\(\)\s*:\s*void\s*=>\s*\{[\s\S]{0,400}?uni\.chooseImage\(/,
    'up-cropper.uvue must keep the system picker reachable through a shared openPicker()'
)
// Guard the ordering trap: UTS compiles setup-scope arrow functions to Kotlin locals,
// which are NOT hoisted, so these helpers must be declared before their callers.
const chooseImageDeclaration = cropperUvue.indexOf('function chooseImage')
for (const helper of ['const applyOptions = ', 'const openPicker = ']) {
    const declaration = cropperUvue.indexOf(helper)
    assert.ok(declaration > -1, `up-cropper.uvue must declare a shared ${helper.trim()}`)
    assert.ok(
        declaration < chooseImageDeclaration,
        `up-cropper.uvue must declare ${helper.trim()} before chooseImage(); UTS does not hoist setup-scope locals`
    )
}
// 重选 must reopen the picker even when the current image arrived via imageSrc, so
// select() must not route back through chooseImage() and replay the stored imageSrc.
// It must still re-apply the last crop configuration, which chooseImage() used to do.
const selectBody = cropperUvue.match(/const\s+select\s*=\s*\(\)\s*:\s*void\s*=>\s*\{([\s\S]*?)\n\t\}/)
assert.ok(selectBody, 'up-cropper.uvue must keep a select() method for 重选')
assert.doesNotMatch(
    selectBody[1],
    /chooseImage\(/,
    'up-cropper.uvue select() must call openPicker() directly; replaying chooseImage() would reload the same imageSrc'
)
assert.match(
    selectBody[1],
    /openPicker\(\)/,
    'up-cropper.uvue select() must open the system picker'
)

// -- Vue (H5 / 小程序) --------------------------------------------------------
assert.match(
    cropperVue,
    /function\s+loadImage\s*\(\s*path\s*\)\s*\{/,
    'up-cropper.vue must expose a shared loadImage(path) extracted from select()'
)
assert.match(
    cropperVue,
    /function\s+select\s*\(\)\s*\{[\s\S]*?loadImage\(r\.tempFilePaths\[0\]\)/,
    'up-cropper.vue select() must reuse loadImage() for picker results'
)
assert.match(
    cropperVue,
    /const\s+imageSrc\s*=\s*typeof\s+params\?\.imageSrc\s*===\s*'string'\s*\?\s*params\.imageSrc\.trim\(\)\s*:\s*''/,
    'up-cropper.vue chooseImage() must read and trim params.imageSrc'
)
assert.match(
    cropperVue,
    /if\s*\(imageSrc\)\s*\{\s*loadImage\(imageSrc\)\s*;?\s*\n\s*return\s*;?\s*\n\s*\}/,
    'up-cropper.vue must crop a non-empty imageSrc via loadImage() and skip the picker'
)
// The load path must stay shared: select() may no longer inline getImageInfo itself.
const vueSelect = cropperVue.match(/function\s+select\s*\(\)\s*\{([\s\S]*?)\n\t\t\tfunction\s+/)
assert.ok(vueSelect, 'up-cropper.vue must keep a select() method')
assert.doesNotMatch(
    vueSelect[1],
    /uni\.getImageInfo/,
    'up-cropper.vue select() must delegate image reading to loadImage(), not inline getImageInfo'
)

// -- demo --------------------------------------------------------------------
assert.match(
    demo,
    /imageSrc/,
    'the cropper demo page must show cropping an already-chosen image path'
)
assert.match(
    demo,
    /\$callMethod\('chooseImage',\s*3,\s*\{[\s\S]{0,200}?imageSrc/,
    'the cropper demo must pass imageSrc through chooseImage() params'
)

console.log('cropper imageSrc assertions passed')
