import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')

const dragsortVue = read('uni_modules/uview-ultra/components/up-dragsort/up-dragsort.vue')
const dragsortUvue = read('uni_modules/uview-ultra/components/up-dragsort/up-dragsort.uvue')
const dragsortDemo = read('pages/componentsD/dragsort/dragsort.uvue')
const packageJson = JSON.parse(read('package.json'))

assert.equal(
    packageJson.scripts['verify:dragsort-stable-identity'],
    'node scripts/verify-dragsort-stable-identity.mjs',
    'expected package.json to expose verify:dragsort-stable-identity'
)

for (const [fileName, source] of [
    ['up-dragsort.vue', dragsortVue],
    ['up-dragsort.uvue', dragsortUvue]
]) {
    assert.match(
        source,
        /:id="`up-dragsort-item-\$\{instanceId(?:\.value)?\}-\$\{getItemId\(item, index\)\}`"/,
        `${fileName} item ids must combine the component instance and stable item ids`
    )
    assert.doesNotMatch(
        source,
        /:id="`up-dragsort-item-\$\{index\}`"/,
        `${fileName} item ids must not use the render index`
    )
    assert.match(source, /const orderIds = ref(?:<[^\r\n]+>)?\(/, `${fileName} must track visual order separately`)
    assert.match(source, /const dragItemId = ref(?:<[^\r\n]+>)?\(/, `${fileName} must track the dragged item by id`)
    assert.match(
        source,
        /const hasHandlerSlot = (?:computed\(\(\) =>|\(\): boolean =>)[\s\S]*?slots\[['"]handler['"]\][\s\S]*?slots\[['"]\$handler['"]\]/,
        `${fileName} must support H5 and mini-program handler slot names`
    )
    assert.match(source, /v-if="hasHandlerSlot(?:\.value)?(?:\(\))?"/, `${fileName} must use the cross-platform handler check`)

    const itemContentStyle = source.match(/\.up-dragsort-item-content\s*\{([\s\S]*?)\n\s*\}/)?.[1] || ''
    assert.doesNotMatch(
        itemContentStyle,
        /(?:border(?:-radius)?|background(?:-color)?)\s*:/,
        `${fileName} content wrapper must not impose a card background or border`
    )
}

assert.match(
    dragsortVue,
    /<movable-view[\s\S]*:key="getItemId\(item, index\)"[\s\S]*@change="onChange\(getItemId\(item, index\), \$event\)"/,
    'Vue movable-view events must use stable item ids'
)
assert.doesNotMatch(
    dragsortVue,
    /function reorderItems\(fromIndex, toIndex\)[\s\S]*?list\.value\.splice/,
    'Vue rendered list must not be spliced during native drag'
)
assert.match(
    dragsortVue,
    /const renderIds = \[[\s\S]*?list\.value\.map[\s\S]*?orderIds\.value\.filter/,
    'Vue prop updates must preserve existing native node order'
)
assert.match(
    dragsortVue,
    /emit\('drag-end', orderIds\.value\.map/,
    'Vue drag-end must emit visual order'
)

assert.doesNotMatch(
    dragsortUvue,
    /function reorderItems\([\s\S]*?currentList\.splice/,
    'UVUE rendered list must not be spliced when committing visual order'
)
assert.match(
    dragsortUvue,
    /emit\('drag-end', getOrderedList\(\)\)/,
    'UVUE drag-end must emit visual order'
)

assert.match(
    dragsortDemo,
    /<template\s+#handler="\{\s*item\s*,\s*index\s*\}">/,
    'mini-program handler usage must declare slot scope'
)

console.log('dragsort stable identity assertions passed')
