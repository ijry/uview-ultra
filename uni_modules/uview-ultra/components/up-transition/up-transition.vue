<template>
	<view
		v-if="inited"
		class="up-transition"
		ref="up-transition"
		@tap="clickHandler"
		:class="classes"
		:style="[mergeStyle]"
	>
		<slot />
	</view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue'
import { propsTransition } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { addStyle, sleep } from '../../libs/function/index.js'
// nvue动画模块实现细节抽离在外部文件
// #ifdef APP-NVUE
import animationMap from './nvue-ani-map.js'
// #endif
/**
 * transition  动画组件
 * @description
 * @tutorial
 * @property {String}			show			是否展示组件 （默认 false ）
 * @property {String}			mode			使用的动画模式 （默认 'fade' ）
 * @property {String | Number}	duration		动画的执行时间，单位ms （默认 '300' ）
 * @property {String}			timingFunction	使用的动画过渡函数 （默认 'ease-out' ）
 * @property {Object}			customStyle		自定义样式
 * @event {Function} before-enter	进入前触发
 * @event {Function} enter			进入中触发
 * @event {Function} after-enter	进入后触发
 * @event {Function} before-leave	离开前触发
 * @event {Function} leave			离开中触发
 * @event {Function} after-leave	离开后触发
 * @example
 */
defineOptions({
	name: 'up-transition',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...propsTransition.props
})
const emit = defineEmits(['click', 'beforeEnter', 'enter', 'afterEnter', 'beforeLeave', 'leave', 'afterLeave'])
const instance = getCurrentInstance()
const proxy = instance?.proxy

// 定义一个一定时间后自动成功的promise，让调用nextTick方法处，进入下一个then方法
const waitTick = () => new Promise(resolve => setTimeout(resolve, 1000 / 50))

// #ifndef APP-NVUE
// 定义类名，通过给元素动态切换类名，赋予元素一定的css动画样式
const getClassNames = (name) => ({
	enter: `up-${name}-enter up-${name}-enter-active`,
	'enter-to': `up-${name}-enter-to up-${name}-enter-active`,
	leave: `up-${name}-leave up-${name}-leave-active`,
	'leave-to': `up-${name}-leave-to up-${name}-leave-active`
})
// #endif

// #ifdef APP-NVUE
// 引入nvue(weex)的animation动画模块，文档见：
// https://weex.apache.org/zh/docs/modules/animation.html#transition
const animation = uni.requireNativePlugin('animation')
const getStyle = (name) => animationMap[name]
// #endif

const inited = ref(false) // 是否显示/隐藏组件
const viewStyle = ref({}) // 组件内部的样式
const status = ref('') // 记录组件动画的状态
const transitionEnded = ref(false) // 组件是否结束的标记
const display = ref(false) // 组件是否展示
const classes = ref('') // 应用的类名

const mergeStyle = computed(() => {
	return {
		// #ifndef APP-NVUE
		transitionDuration: `${props.duration}ms`,
		// display: `${display.value ? '' : 'none'}`,
		transitionTimingFunction: props.timingFunction,
		// #endif
		// 避免自定义样式影响到动画属性，所以写在viewStyle前面
		...addStyle(props.customStyle),
		...viewStyle.value
	}
})

watch(() => props.show, (newVal) => {
	// vue和nvue分别执行不同的方法
	// #ifdef APP-NVUE
	newVal ? nvueEnter() : nvueLeave()
	// #endif
	// #ifndef APP-NVUE
	newVal ? vueEnter() : vueLeave()
	// #endif
}, {
	// 表示同时监听初始化时的props的show的意思
	immediate: true
})

// 组件被点击发出事件
function clickHandler() {
	emit('click')
}

// #ifndef APP-NVUE
// vue版本的组件进场处理
async function vueEnter() {
	// 动画进入时的类名
	const classNames = getClassNames(props.mode)
	// 定义状态和发出动画进入前事件
	status.value = 'enter'
	emit('beforeEnter')
	inited.value = true
	display.value = true
	classes.value = classNames.enter
	await nextTick()
	{
		// https://github.com/umicro/uView2.0/issues/545
		await sleep(20)
		// 标识动画尚未结束
		emit('enter')
		transitionEnded.value = false
		// 组件动画进入后触发的事件
		emit('afterEnter')
		// 赋予组件enter-to类名
		classes.value = classNames['enter-to']
	}
}

// 动画离场处理
async function vueLeave() {
	// 如果不是展示状态，无需执行逻辑
	if (!display.value) return
	const classNames = getClassNames(props.mode)
	// 标记离开状态和发出事件
	status.value = 'leave'
	emit('beforeLeave')
	// 获得类名
	classes.value = classNames.leave

	await nextTick()
	{
		// 动画正在离场的状态
		transitionEnded.value = false
		emit('leave')
		// 组件执行动画，到了执行的执行时间后，执行一些额外处理
		setTimeout(onTransitionEnd, props.duration)
		classes.value = classNames['leave-to']
	}
}
// #endif

// #ifdef APP-NVUE
// nvue版本动画进场
async function nvueEnter() {
	// 获得样式的名称
	const currentStyle = getStyle(props.mode) || getStyle('none')
	// 组件动画状态和发出事件
	status.value = 'enter'
	emit('beforeEnter')
	// 展示生成组件元素
	inited.value = true
	display.value = true
	// 在nvue安卓上，由于渲染速度慢，在弹窗，键盘，日历等组件中，渲染其中的内容需要时间
	// 导致出现弹窗卡顿，这里让其一开始为透明状态，等一定时间渲染完成后，再让其隐藏起来，再让其按正常逻辑出现
	// none 模式为页面内常驻展示，不需要预置透明
	viewStyle.value = props.mode === 'none' ? { opacity: 1 } : {
		opacity: 0
	}
	// 等待弹窗内容渲染完成
	await nextTick()
	{
		// 合并样式
		viewStyle.value = currentStyle.enter
		Promise.resolve()
			.then(waitTick)
			.then(() => {
				// 组件开始进入前的事件
				emit('enter')
				// nvue的transition动画模块需要通过ref调用组件，注意此处的ref不同于vue的this.$refs['up-transition']用法
				animation.transition(proxy.$refs['up-transition'].ref, {
					styles: currentStyle['enter-to'],
					duration: props.mode === 'none' ? 0 : props.duration,
					timingFunction: props.timingFunction,
					needLayout: false,
					delay: 0
				}, () => {
					// 动画执行完毕，发出事件
					emit('afterEnter')
				})
			})
			.catch(() => {})
	}
}

function nvueLeave() {
	if (!display.value) {
		return
	}
	const currentStyle = getStyle(props.mode) || getStyle('none')
	// 定义状态和事件
	status.value = 'leave'
	emit('beforeLeave')
	// 合并样式
	viewStyle.value = currentStyle.leave
	// 放到promise中处理执行过程
	Promise.resolve()
		.then(waitTick) // 等待几十ms
		.then(() => {
			transitionEnded.value = false
			// 动画正在离场的状态
			emit('leave')
			animation.transition(proxy.$refs['up-transition'].ref, {
				styles: currentStyle['leave-to'],
				duration: props.mode === 'none' ? 0 : props.duration,
				timingFunction: props.timingFunction,
				needLayout: false,
				delay: 0
			}, () => {
				onTransitionEnd()
			})
		})
		.catch(() => {})
}
// #endif

// 完成过渡后触发
function onTransitionEnd() {
	// 如果已经是结束的状态，无需再处理
	if (transitionEnded.value) return
	transitionEnded.value = true
	// 发出组件动画执行后的事件
	emit(status.value === 'leave' ? 'afterLeave' : 'afterEnter')
	if (!props.show && display.value) {
		display.value = false
		inited.value = false
	}
}

defineExpose({
	inited,
	viewStyle,
	status,
	transitionEnded,
	display,
	classes,
	mergeStyle,
	clickHandler,
	// #ifndef APP-NVUE
	vueEnter,
	vueLeave,
	// #endif
	// #ifdef APP-NVUE
	nvueEnter,
	nvueLeave,
	// #endif
	onTransitionEnd
})
</script>

<style lang="scss" scoped>
@import '../../libs/css/components.scss';

/* #ifndef APP-NVUE */
// vue版本动画相关的样式抽离在外部文件
@import './vue.ani-style.scss';
/* #endif */

.up-transition {}
</style>
