import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = file => readFileSync(resolve(root, file), 'utf8')
const vueTabs = read('uni_modules/uview-ultra/components/up-tabs/up-tabs.vue')
const uvueTabs = read('uni_modules/uview-ultra/components/up-tabs/up-tabs.uvue')
const vuePro = read('uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.vue')
const uvuePro = read('uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.uvue')
const tabsProps = read('uni_modules/uview-ultra/components/up-tabs/props.js')
const tabsJsDefaults = read('uni_modules/uview-ultra/components/up-tabs/tabs.js')
const tabsDefaults = read('uni_modules/uview-ultra/components/up-tabs/tabs.uts')
const tabsTypes = read('uni_modules/uview-ultra/types/comps/tabs.d.ts')
const proTypes = read('uni_modules/uview-ultra/types/comps/tabsPro.d.ts')
const componentsTypes = read('uni_modules/uview-ultra/types/comps.d.ts')
const demo = read('pages/componentsC/tabs/tabs.uvue')
const packageJson = JSON.parse(read('package.json'))

assert.equal(packageJson.scripts['verify:tabs-parity'], 'node scripts/verify-tabs-parity.mjs')
for (const [name, source] of [['up-tabs.vue', vueTabs], ['up-tabs.uvue', uvueTabs]]) {
  assert.match(source, /clickHandler\(item, index, \$event\)/, name + ': click must receive $event')
  assert.match(source, /shapeMode/, name + ': shapeMode must be rendered')
  assert.match(source, /(?:emit|\$emit)\(['"]click['"][\s\S]*event/, name + ': click must emit the event')
}
assert.match(tabsProps, /shapeMode/)
assert.match(tabsJsDefaults, /shapeMode:/)
assert.match(tabsDefaults, /shapeMode:/)
assert.match(tabsTypes, /shapeMode\?/)
assert.match(tabsTypes, /index: number, event: any/)
for (const [name, source] of [['up-tabs-pro.vue', vuePro], ['up-tabs-pro.uvue', uvuePro]]) {
  assert.match(source, /up-tabs/)
  assert.match(source, /showContent/)
  assert.match(source, /update:current/)
  assert.match(source, /click[\s\S]*event|event[\s\S]*click/, name + ': click event must be forwarded')
  assert.match(source, /longPress|long-press/)
  assert.match(source, /content|tab/)
}
assert.match(proTypes, /TabsProProps/)
assert.match(componentsTypes, /\['up-tabs-pro'\]/)
assert.match(demo, /<up-tabs-pro[\s\S]*showContent/)

console.log('tabs parity assertions passed')
