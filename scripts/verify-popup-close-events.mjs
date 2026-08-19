import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const component = name => `uni_modules/uview-ultra/components/${name}/${name}`

const packageJson = JSON.parse(read('package.json'))

assert.equal(
	packageJson.scripts['verify:popup-close-events'],
	'node scripts/verify-popup-close-events.mjs',
	'expected package.json to expose verify:popup-close-events'
)

// .vue 写 function name(){}，.uvue 写 const name = (): void => {}，
// 断言只关心函数体，不关心声明形式
const bodyOf = (source, name) => {
	const opener = new RegExp(`(?:function ${name}\\s*\\(|const ${name}\\s*=[^{;]*?=>\\s*)`)
	const at = source.search(opener)
	if (at === -1) return null
	const from = source.indexOf('{', at)
	if (from === -1) return null
	let depth = 0
	for (let i = from; i < source.length; i++) {
		if (source[i] === '{') depth++
		else if (source[i] === '}' && --depth === 0) return source.slice(from + 1, i)
	}
	return null
}

// 两个变体都要改到：.vue 走各端，.uvue 走 uni-app x
const POPUP_VARIANTS = [
	['Vue', read(`${component('up-popup')}.vue`)],
	['UVue', read(`${component('up-popup')}.uvue`)]
]

for (const [variant, popup] of POPUP_VARIANTS) {
	// —— close 在任意关闭方式下都要发出（issue #902 主诉）——
	// show 由 true 变 false 时补发 close，否则外部直接改 show 收不到任何事件
	assert.match(
		popup,
		/else if \(oldValue\)?[^)]*\)?\s*\{[\s\S]*?if \(closeEmitted\.value\)\s*\{[\s\S]*?closeEmitted\.value = false[\s\S]*?\}\s*else\s*\{[\s\S]*?emit\('close'\)/,
		`${variant}: expected the show watcher to emit close when show is set to false externally`
	)
	// watch 必须拿到 oldValue，否则首次渲染 show=false 会误报一次 close
	assert.match(
		popup,
		/watch\([\s\S]{0,80}?props\.show,\s*\([^)]*newValue[^)]*,[^)]*oldValue[^)]*\)/,
		`${variant}: expected the show watcher to receive oldValue, so an initial show=false does not emit a spurious close`
	)

	const emitCloseBody = bodyOf(popup, 'emitClose')
	assert.ok(emitCloseBody, `${variant}: expected to locate the emitClose body`)
	assert.match(
		emitCloseBody,
		/nextTick\(\(\) => \{\s*closeEmitted\.value = false/,
		`${variant}: expected emitClose to clear its dedupe flag on nextTick so later closes still emit`
	)

	// closeEmitted 必须先同步置位、再发出 close：up-picker/up-color-picker/up-goods-sku 会在
	// close 的同步 handler 里修改喂给 popup 的 show 数据源，若置位晚于 emit 或改为异步，
	// 那次 prop 变化会让 watcher 误判为外部关闭并补发第二个 close。
	{
		const flagAt = emitCloseBody.indexOf('closeEmitted.value = true')
		const emitAt = emitCloseBody.indexOf("emit('close')")
		assert.ok(flagAt !== -1 && emitAt !== -1, `${variant}: expected emitClose to set the flag and emit close`)
		assert.ok(
			flagAt < emitAt,
			`${variant}: expected closeEmitted to be set synchronously BEFORE close is emitted, so a downstream handler that mutates the show source in the same tick does not trigger a duplicate close`
		)
	}

	// 重新打开时要清掉标记，否则上一次内部关闭的标记会吞掉下一次的外部 close
	assert.match(
		popup,
		/if \(newValue[^)]*\)\s*\{\s*closeEmitted\.value = false/,
		`${variant}: expected reopening to reset closeEmitted, otherwise a stale flag swallows the next external close`
	)

	// —— closed 事件：离场动画结束后发出 ——
	assert.match(
		popup,
		/@afterLeave="afterLeave"/,
		`${variant}: expected up-popup to listen for the transition afterLeave event`
	)
	assert.match(
		bodyOf(popup, 'afterLeave') ?? '',
		/emit\('closed'\)/,
		`${variant}: expected afterLeave to emit the closed event`
	)
	// pageInline 模式下 transition 的 show 恒为 true、不执行离场动画，收不到 afterLeave
	assert.match(
		popup,
		/if \(props\.pageInline\)\s*\{\s*emit\('closed'\)/,
		`${variant}: expected pageInline mode to emit closed from the watcher, since no leave animation runs there`
	)
	assert.match(
		popup,
		/defineEmits\(\['open', 'close', 'closed', 'click', 'update:show'\]\)/,
		`${variant}: expected closed to be declared in defineEmits`
	)
	assert.match(
		popup,
		/import \{[^}]*\bnextTick\b[^}]*\} from 'vue'/,
		`${variant}: expected nextTick to be imported, since emitClose defers clearing its flag`
	)

	// —— 两条内部关闭路径都走 emitClose，避免绕过去重 ——
	assert.match(
		bodyOf(popup, 'overlayClick') ?? '',
		/if \(props\.closeOnClickOverlay\)\s*\{\s*emit\('update:show', false\)\s*emitClose\(\)/,
		`${variant}: expected the overlay path to emit update:show and go through emitClose`
	)
	assert.match(
		bodyOf(popup, 'close') ?? '',
		/^\s*emit\('update:show', false\)\s*emitClose\(\)/,
		`${variant}: expected the close-icon path to emit update:show and go through emitClose`
	)
	// 走了 emitClose 之后就不该再有裸 emit('close')，否则等于绕过去重
	{
		const bare = popup.match(/\n\t*emit\('close'\)/g) || []
		assert.equal(
			bare.length,
			2,
			`${variant}: expected exactly two emit('close') sites (emitClose + the watcher fallback); every other close path must go through emitClose`
		)
	}

	// —— 兼容性：组件必须保持纯受控，渲染只依赖 show prop ——
	// 3.x 曾引入 beforeClose + show 内部副本(innerShow/displayShow)，
	// 由于 Function 类型 prop 的 default 是值本身而非取值工厂，拦截被意外恒定启用，
	// 导致所有弹窗（含 picker）再也关不掉。这里锁住"不再有内部副本"。
	for (const forbidden of [/displayShow/, /innerShow/, /interceptEnabled/, /beforeClose/]) {
		assert.doesNotMatch(
			popup,
			forbidden,
			`${variant}: up-popup must stay purely controlled by the show prop; found reintroduced state: ${forbidden}`
		)
	}
	assert.match(
		popup,
		/:show="pageInline \? true : show"/,
		`${variant}: expected the transition to render straight from the show prop`
	)
}

// —— up-transition 必须真的会发出 afterLeave，否则 closed 永远不来 ——
// .vue 走三元 emit(status === 'leave' ? 'afterLeave' : 'afterEnter')，.uvue 走 if/else，
// 两者都在 onTransitionEnd 里，所以只断言这个函数体里出现了 afterLeave
for (const ext of ['vue', 'uvue']) {
	const transition = read(`${component('up-transition')}.${ext}`)
	assert.match(
		bodyOf(transition, 'onTransitionEnd') ?? '',
		/'afterLeave'/,
		`up-transition.${ext}: expected onTransitionEnd to emit afterLeave when the leave animation finishes`
	)
	assert.match(
		transition,
		/defineEmits\(\[[^\]]*'afterLeave'[^\]]*\]\)/,
		`up-transition.${ext}: expected afterLeave to be declared in defineEmits`
	)
}

// —— 下游组件把 closed 透传出去 ——
// [组件, 它在模板里包裹的子组件标签, 转发用的 handler 名]。
// up-datetime-picker / up-picker-data 包的是 up-picker，属于二级透传：
// closed 要先从 up-popup 到 up-picker，再到最外层，链上任一环缺失都收不到。
// 不含 up-upload：它的 popup 是内部视频预览，对外没有关闭语义。
// 不含 up-modal / up-cascader：它们没监听 popup 的 close，对外也不暴露 close 语义。
const FORWARDERS = [
	['up-picker', 'up-popup', 'closedHandler'],
	['up-action-sheet', 'up-popup', 'closedHandler'],
	['up-keyboard', 'up-popup', 'popupClosed'],
	['up-calendar', 'up-popup', 'closedHandler'],
	['up-color-picker', 'up-popup', 'closedHandler'],
	['up-goods-sku', 'up-popup', 'closedHandler'],
	['up-datetime-picker', 'up-picker', 'closedHandler'],
	['up-picker-data', 'up-picker', 'closedHandler']
]

for (const [name, childTag, handler] of FORWARDERS) {
	for (const ext of ['vue', 'uvue']) {
		const src = read(`${component(name)}.${ext}`)
		const label = `${name}.${ext}`
		// 只看第一个被包裹的子组件标签，即主体弹窗
		const openTag = src.match(new RegExp(`<${childTag}(?:\\s[\\s\\S]*?)?>`))
		assert.ok(openTag, `${label}: expected to find the wrapped <${childTag}> tag`)
		assert.match(
			openTag[0],
			new RegExp(`@closed="${handler}"`),
			`${label}: expected @closed to be forwarded on the <${childTag}> it wraps`
		)
		// handler 必须真的存在并把 closed 发出去，模板里挂个不存在的名字等于静默失效
		assert.match(
			bodyOf(src, handler) ?? '',
			/emit\('closed'\)/,
			`${label}: expected ${handler} to be defined and emit closed`
		)
		const emitsDecl = src.match(/defineEmits\((\[[\s\S]*?\])\)/)
		assert.ok(emitsDecl, `${label}: expected a defineEmits declaration`)
		assert.ok(
			/['"]closed['"]/.test(emitsDecl[1]),
			`${label}: expected closed to be declared in defineEmits, otherwise Vue treats it as a fallthrough attr`
		)
	}
}

// up-calendar 有两个 popup：主体 + 内部时间选择器。closed 只能来自主体，
// 否则关掉内部时间选择器也会对外报告"日历已关闭"。
for (const ext of ['vue', 'uvue']) {
	const calendar = read(`${component('up-calendar')}.${ext}`)
	const forwards = calendar.match(/@closed=/g) || []
	assert.equal(
		forwards.length,
		1,
		`up-calendar.${ext}: must forward closed from its main popup only, not from the inner time-picker popup`
	)
	// 内部时间选择器那个 popup 接的仍是 closeTimePicker，没被顺手改成对外转发
	assert.match(
		calendar,
		/@close="closeTimePicker"/,
		`up-calendar.${ext}: expected the inner time-picker popup to keep its own close handler`
	)
}

// —— 类型定义要跟上，否则 TS 用户写 @closed 会报错 ——
for (const typeFile of ['popup', 'picker', 'datetimePicker', 'actionSheet', 'keyboard', 'calendar']) {
	const dts = read(`uni_modules/uview-ultra/types/comps/${typeFile}.d.ts`)
	assert.match(
		dts,
		/onClosed\?: \(\) => any/,
		`${typeFile}.d.ts: expected onClosed to be declared alongside onClose`
	)
}

console.log('popup close/closed assertions passed')
