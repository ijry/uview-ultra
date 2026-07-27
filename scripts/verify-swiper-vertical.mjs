import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')

const swiperVue = read('uni_modules/uview-ultra/components/up-swiper/up-swiper.vue')
const swiperUvue = read('uni_modules/uview-ultra/components/up-swiper/up-swiper.uvue')
const swiperProps = read('uni_modules/uview-ultra/components/up-swiper/props.js')
const swiperPropsUts = read('uni_modules/uview-ultra/components/up-swiper/props.uts')
const swiperDefaults = read('uni_modules/uview-ultra/components/up-swiper/swiper.js')
const swiperDefaultsUts = read('uni_modules/uview-ultra/components/up-swiper/swiper.uts')
const swiperTypes = read('uni_modules/uview-ultra/types/comps/swiper.d.ts')
const swiperDemo = read('pages/componentsC/swiper/swiper.uvue')
const changelog = read('uni_modules/uview-ultra/changelog.md')

for (const [name, source] of [
	['Vue default config', swiperDefaults],
	['UTS default config', swiperDefaultsUts]
]) {
	assert.match(source, /vertical\s*:\s*false/, `expected ${name} to include vertical: false`)
}

for (const [name, source] of [
	['Vue props', swiperProps],
	['UTS props', swiperPropsUts]
]) {
	assert.match(source, /vertical\s*:\s*\{[\s\S]*type:\s*Boolean/, `expected ${name} to declare vertical Boolean prop`)
}

for (const [name, source] of [
	['Vue component', swiperVue],
	['UTS component', swiperUvue]
]) {
	assert.match(source, /:vertical="vertical"/, `expected ${name} to pass vertical to native swiper`)
}

assert.match(swiperTypes, /vertical\?\s*:\s*boolean/, 'expected TypeScript definition to include vertical?: boolean')
assert.match(swiperDemo, /vertical/, 'expected demo page to include a vertical example')
assert.match(changelog, /swiper[\s\S]*vertical|vertical[\s\S]*swiper|纵向/, 'expected plugin changelog to mention swiper vertical support')

console.log('uview-ultra swiper vertical assertions passed')
