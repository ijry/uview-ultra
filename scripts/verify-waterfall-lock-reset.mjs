import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const waterfallSource = readFileSync(
    resolve(__dirname, '../uni_modules/uview-ultra/components/up-waterfall/up-waterfall.vue'),
    'utf8'
)

const uGetRectSource = readFileSync(
    resolve(__dirname, '../uni_modules/uview-ultra/libs/composable/useUltraUI.js'),
    'utf8'
)

console.log('验证 #1056 修复：up-waterfall 在 App tabbar 切换时 distributionRunning 锁死问题')
console.log()

// 测试 1: 验证 clear() 方法重置锁状态
console.log('✓ 测试 1: 验证 clear() 重置 distributionRunning 和 distributionPromise')
const clearFunctionMatch = waterfallSource.match(/function clear\(bak = true\)\s*\{([\s\S]*?)(?=\n\s*function|\n\s*defineExpose)/m)
assert.ok(clearFunctionMatch, 'clear() 方法应该存在')

const clearBody = clearFunctionMatch[1]
assert.match(
    clearBody,
    /distributionRunning\s*=\s*false/,
    'clear() 必须重置 distributionRunning = false'
)
assert.match(
    clearBody,
    /distributionPromise\s*=\s*null/,
    'clear() 必须重置 distributionPromise = null'
)
console.log('  ✓ clear() 包含锁重置代码')
console.log()

// 测试 2: 验证 redistributeData() 方法在调用 clear 前先解锁
console.log('✓ 测试 2: 验证 redistributeData() 先解锁再调用 clear()')
const redistributeFunctionMatch = waterfallSource.match(/function redistributeData\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*function)/m)
assert.ok(redistributeFunctionMatch, 'redistributeData() 方法应该存在')

const redistributeBody = redistributeFunctionMatch[1]
const lines = redistributeBody.split('\n').filter(line => line.trim())

// 验证解锁代码出现在 clear() 调用之前
let unlockIndex = -1
let clearCallIndex = -1

lines.forEach((line, idx) => {
    if (line.includes('distributionRunning') && line.includes('false')) {
        if (unlockIndex === -1) unlockIndex = idx
    }
    if (line.includes('clear(')) {
        if (clearCallIndex === -1) clearCallIndex = idx
    }
})

assert.ok(unlockIndex >= 0, 'redistributeData() 应该重置 distributionRunning')
assert.ok(clearCallIndex >= 0, 'redistributeData() 应该调用 clear()')
assert.ok(unlockIndex < clearCallIndex, 'distributionRunning 重置必须在 clear() 调用之前')
console.log('  ✓ redistributeData() 先解锁后清理')
console.log()

// 测试 3: 验证 runToken 机制存在
console.log('✓ 测试 3: 验证 runToken 防止旧循环接管')
assert.match(
    waterfallSource,
    /distributionRunToken/,
    '应该存在 distributionRunToken 变量'
)

const runQueueMatch = waterfallSource.match(/async function runDistributionQueue\(\)\s*\{([\s\S]*?)(?=\n\s*(?:async )?function|\n\s*defineExpose)/m)
assert.ok(runQueueMatch, 'runDistributionQueue() 应该存在')

const runQueueBody = runQueueMatch[1]
assert.match(
    runQueueBody,
    /runToken\s*=.*distributionRunToken/,
    'runDistributionQueue() 应该捕获当前 runToken'
)
assert.match(
    runQueueBody,
    /runToken\s*!==\s*distributionRunToken/,
    'runDistributionQueue() 应该检查 runToken 是否过期'
)
console.log('  ✓ runToken 机制完整')
console.log()

// 测试 4: 验证 $uGetRect 兜底 resolve
console.log('✓ 测试 4: 验证 $uGetRect 对 null 查询结果的兜底处理')
const uGetRectMatch = uGetRectSource.match(/function \$uGetRect\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*function)/m)
assert.ok(uGetRectMatch, '$uGetRect 函数应该存在')

const uGetRectBody = uGetRectMatch[1]

// 验证对 all=true 的兜底
assert.match(
    uGetRectBody,
    /if\s*\(\s*all\s*\)[\s\S]*?resolve\(.*?\)/,
    '$uGetRect 应该对 all=true 兜底 resolve'
)

// 验证对单个查询的兜底
assert.match(
    uGetRectBody,
    /resolve\(\s*rect\s*\|\|/,
    '$uGetRect 应该对 rect 为 null/undefined 时兜底 resolve'
)

console.log('  ✓ $uGetRect 包含兜底 resolve，防止页面隐藏时永久挂起')
console.log()

// 测试 5: 验证 isStaleDistribution 辅助函数
console.log('✓ 测试 5: 验证 isStaleDistribution() 辅助函数')
const isStaleMatch = waterfallSource.match(/function isStaleDistribution\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*(?:async )?function)/m)
assert.ok(isStaleMatch, 'isStaleDistribution() 辅助函数应该存在')

const isStaleBody = isStaleMatch[1]
assert.match(
    isStaleBody,
    /generation\s*!==\s*distributionGeneration/,
    'isStaleDistribution() 应该检查 generation'
)
assert.match(
    isStaleBody,
    /runToken\s*!==\s*distributionRunToken/,
    'isStaleDistribution() 应该检查 runToken'
)
console.log('  ✓ isStaleDistribution() 同时检查 generation 和 runToken')
console.log()

console.log('==========================================')
console.log('✅ 所有修复验证通过')
console.log()
console.log('修复内容：')
console.log('1. clear() 强制重置 distributionRunning 和 distributionPromise')
console.log('2. redistributeData() 在调用 clear 前先解锁')
console.log('3. 引入 runToken 机制防止旧循环在锁重置后继续写入')
console.log('4. $uGetRect 对 null 查询结果兜底 resolve，防止永久挂起')
console.log()
console.log('问题场景：')
console.log('App 端切换 tabbar 时，原生层挂起隐藏页面的 setTimeout，')
console.log('导致 await sleep() 永不 resolve，runDistributionQueue 的')
console.log('finally 块无法执行，distributionRunning 永久为 true。')
console.log('切回页面后新数据只能入队但永远不会被消费。')
console.log('==========================================')
