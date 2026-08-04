import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const waterfallVue = read('uni_modules/uview-ultra/components/up-waterfall/up-waterfall.vue')
const waterfallUvue = read('uni_modules/uview-ultra/components/up-waterfall/up-waterfall.uvue')
const packageJson = JSON.parse(read('package.json'))

function loadVueWaterfall(sleep) {
    const scriptBlock = waterfallVue.match(/<script setup>([\s\S]*?)<\/script>/)
    assert.ok(scriptBlock, 'up-waterfall.vue should contain a script setup block')
    const watchers = []
    let runtime
    const executableScript = scriptBlock[1]
        .replace(/^\s*import\s+.*?\s+from\s+['"].*?['"]\s*$/gm, '')
        .concat(`
return {
    columnList,
    clear,
    handleData,
    redistributeData,
    isPureAppend,
    getDistributionPromise: () => distributionPromise
}
`)
    const factory = new Function(
        'computed',
        'nextTick',
        'onBeforeUnmount',
        'onMounted',
        'ref',
        'watch',
        'commonProps',
        'useUltraUI',
        'sleep',
        'defineOptions',
        'defineProps',
        'defineEmits',
        'defineExpose',
        'uni',
        executableScript
    )
    runtime = factory(
        getter => ({ get value() { return getter() } }),
        () => Promise.resolve(),
        () => {},
        () => {},
        value => ({ value }),
        (source, callback, options = {}) => {
            watchers.push({ source, callback })
            if (options.immediate) callback(source.value, undefined)
        },
        {},
        () => ({
            async $uGetRect(selector) {
                const columnIndex = Number(selector.match(/(\d+)$/)?.[1] || 0)
                const height = runtime.columnList.value[columnIndex].reduce(
                    (total, item) => total + (item.height || 1),
                    0
                )
                return { height }
            }
        }),
        sleep,
        () => {},
        () => ({
            modelValue: [],
            columns: 2,
            columnsMin: 2,
            minColumnWidth: 230,
            addTime: 0,
            idKey: 'id'
        }),
        () => () => {},
        () => {},
        {
            getSystemInfoSync() {
                return { windowWidth: 375 }
            }
        }
    )
    return { runtime, watchers }
}

async function flushMicrotasks(times = 20) {
    for (let index = 0; index < times; index++) {
        await Promise.resolve()
    }
}

assert.equal(
    packageJson.scripts['verify:waterfall-distribution'],
    'node scripts/verify-waterfall-distribution.mjs',
    'expected package.json to expose verify:waterfall-distribution'
)

for (const [fileName, source] of [
    ['up-waterfall.vue', waterfallVue],
    ['up-waterfall.uvue', waterfallUvue]
]) {
    assert.match(source, /distributionQueue/, `${fileName} should use a shared distribution queue`)
    assert.match(source, /distributionGeneration/, `${fileName} should cancel stale distribution tasks`)
    assert.match(source, /isPureAppend/, `${fileName} should detect non-append list changes`)
    assert.match(
        source,
        /redistributeData\(nVal\)/,
        `${fileName} should redistribute the latest list after a middle insertion`
    )
    assert.match(
        source,
        /currentHeight\s*={2,3}\s*minHeight[\s\S]*currentLength\s*<\s*minLength/,
        `${fileName} should break equal-height ties by current column length`
    )
    assert.doesNotMatch(
        source,
        /columnHeights\.indexOf\(Math\.min\(\.\.\.columnHeights\)\)/,
        `${fileName} should not always choose the first column when heights are equal`
    )
}

assert.doesNotMatch(
    waterfallVue,
    /nextTick\(async/,
    'Vue waterfall should await nextTick before measuring instead of using an async callback'
)
assert.doesNotMatch(
    waterfallUvue,
    /previousFlowLength/,
    'UVue waterfall should not detect changes only by list length'
)

{
    const sleepResolvers = []
    const { runtime } = loadVueWaterfall(() => new Promise(resolve => sleepResolvers.push(resolve)))
    const firstTask = runtime.handleData([{ id: 'a' }])
    const secondTask = runtime.handleData([{ id: 'b' }])

    await flushMicrotasks()
    assert.equal(sleepResolvers.length, 1, 'multiple batches should share one serial distribution loop')
    sleepResolvers.shift()()
    await flushMicrotasks()
    assert.equal(sleepResolvers.length, 1, 'the queued batch should start after the active batch')
    sleepResolvers.shift()()
    await Promise.all([firstTask, secondTask])
}

{
    let firstSleepResolve
    let sleepCount = 0
    const { runtime } = loadVueWaterfall(() => {
        sleepCount += 1
        if (sleepCount === 1) {
            return new Promise(resolve => {
                firstSleepResolve = resolve
            })
        }
        return Promise.resolve()
    })
    const task = runtime.handleData([{ id: 'old-1' }, { id: 'old-2' }])

    await flushMicrotasks()
    assert.equal(typeof firstSleepResolve, 'function', 'the first item should enter its render wait')
    runtime.clear(false)
    firstSleepResolve()
    await task
    assert.deepEqual(runtime.columnList.value.flat(), [], 'clear() should prevent stale items from returning')
}

{
    const { runtime, watchers } = loadVueWaterfall(() => Promise.resolve())
    const initialList = [
        { id: 'a1', height: 300 },
        { id: 'a2', height: 200 },
        { id: 'a3', height: 250 },
        { id: 'a4', height: 180 }
    ]
    await runtime.handleData(initialList)

    const insertedList = [
        initialList[0],
        { id: 'ad', height: 200 },
        ...initialList.slice(1)
    ]
    watchers[0].callback(insertedList, initialList)
    await runtime.getDistributionPromise()

    assert.equal(
        runtime.columnList.value[1][0].id,
        'ad',
        'full redistribution should keep the inserted AD item first in the right column'
    )
    assert.deepEqual(
        runtime.columnList.value.flat().map(item => item.id).sort(),
        insertedList.map(item => item.id).sort(),
        'middle insertion should not duplicate or drop items'
    )
}

console.log('waterfall distribution assertions passed')
