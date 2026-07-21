<template>
	<text
		class="up-count-num"
		:style="{
			fontSize: addUnit(fontSize),
			fontWeight: bold ? 'bold' : 'normal',
			color: color
		}"
	>{{ displayValue }}</text>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { props as countToProps } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { addUnit } from '../../libs/function/index.js'
/**
 * countTo 数字滚动
 * @description 该组件一般用于需要滚动数字到某一个值的场景，目标要求是一个递增的值。
 * @tutorial https://ijry.github.io/uview-plus/components/countTo.html
 * @property {String | Number}	startVal	开始的数值，默认从0增长到某一个数（默认 0 ）
 * @property {String | Number}	endVal		要滚动的目标数值，必须 （默认 0 ）
 * @property {String | Number}	duration	滚动到目标数值的动画持续时间，单位为毫秒（ms） （默认 2000 ）
 * @property {Boolean}			autoplay	设置数值后是否自动开始滚动 （默认 true ）
 * @property {String | Number}	decimals	要显示的小数位数，见官网说明（默认 0 ）
 * @property {Boolean}			useEasing	滚动结束时，是否缓动结尾，见官网说明（默认 true ）
 * @property {String}			decimal		十进制分割 （ 默认 "." ）
 * @property {String}			color		字体颜色（ 默认 '#606266' )
 * @property {String | Number}	fontSize	字体大小，单位px（ 默认 22 ）
 * @property {Boolean}			bold		字体是否加粗（默认 false ）
 * @property {String}			separator	千位分隔符，见官网说明
 * @event {Function} end 数值滚动到目标值时触发
 * @example <up-count-to ref="uCountTo" :end-val="endVal" :autoplay="autoplay"></up-count-to>
 */
defineOptions({
	name: 'up-count-to',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...countToProps.props
})
const emit = defineEmits(['end'])
const localStartVal = ref(props.startVal)
const displayValue = ref(formatNumber(props.startVal))
const printVal = ref(null)
const paused = ref(false) // 是否暂停
const localDuration = ref(Number(props.duration))
const startTime = ref(null) // 开始的时间
const timestampValue = ref(null) // 时间戳
const remaining = ref(null) // 停留的时间
const rAF = ref(null)
const lastTime = ref(0) // 上一次的时间

const countDown = computed(() => props.startVal > props.endVal)

function easingFn(t, b, c, d) {
	return (c * (-Math.pow(2, (-10 * t) / d) + 1) * 1024) / 1023 + b
}

function requestAnimationFrameInner(callback) {
	const currTime = new Date().getTime()
	// 为了使setTimteout的尽可能的接近每秒60帧的效果
	const timeToCall = Math.max(0, 16 - (currTime - lastTime.value))
	const id = setTimeout(() => {
		callback(currTime + timeToCall)
	}, timeToCall)
	lastTime.value = currTime + timeToCall
	return id
}

function cancelAnimationFrameInner(id) {
	clearTimeout(id)
}

// 开始滚动数字
function start() {
	localStartVal.value = props.startVal
	startTime.value = null
	localDuration.value = props.duration
	paused.value = false
	rAF.value = requestAnimationFrameInner(count)
}

// 暂定状态，重新再开始滚动；或者滚动状态下，暂停
function reStart() {
	if (paused.value) {
		resume()
		paused.value = false
	} else {
		stop()
		paused.value = true
	}
}

// 暂停
function stop() {
	cancelAnimationFrameInner(rAF.value)
}

// 重新开始(暂停的情况下)
function resume() {
	if (!remaining.value) return
	startTime.value = 0
	localDuration.value = remaining.value
	localStartVal.value = printVal.value
	rAF.value = requestAnimationFrameInner(count)
}

// 重置
function reset() {
	startTime.value = null
	cancelAnimationFrameInner(rAF.value)
	displayValue.value = formatNumber(props.startVal)
}

function count(timestamp) {
	if (!startTime.value) startTime.value = timestamp
	timestampValue.value = timestamp
	const progress = timestamp - startTime.value
	remaining.value = localDuration.value - progress
	if (props.useEasing) {
		if (countDown.value) {
			printVal.value = localStartVal.value - easingFn(progress, 0, localStartVal.value - props.endVal, localDuration.value)
		} else {
			printVal.value = easingFn(progress, localStartVal.value, props.endVal - localStartVal.value, localDuration.value)
		}
	} else {
		if (countDown.value) {
			printVal.value = localStartVal.value - (localStartVal.value - props.endVal) * (progress / localDuration.value)
		} else {
			printVal.value = localStartVal.value + (props.endVal - localStartVal.value) * (progress / localDuration.value)
		}
	}
	if (countDown.value) {
		printVal.value = printVal.value < props.endVal ? props.endVal : printVal.value
	} else {
		printVal.value = printVal.value > props.endVal ? props.endVal : printVal.value
	}
	displayValue.value = formatNumber(printVal.value) || 0
	if (progress < localDuration.value) {
		rAF.value = requestAnimationFrameInner(count)
	} else {
		emit('end')
	}
}

// 判断是否数字
function isNumber(val) {
	return !isNaN(parseFloat(val))
}

function formatNumber(num) {
	// 将num转为Number类型，因为其值可能为字符串数值，调用toFixed会报错
	num = Number(num)
	num = num.toFixed(Number(props.decimals))
	num += ''
	const x = num.split('.')
	let x1 = x[0]
	const x2 = x.length > 1 ? props.decimal + x[1] : ''
	const rgx = /(\d+)(\d{3})/
	if (props.separator && !isNumber(props.separator)) {
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + props.separator + '$2')
		}
	}
	return x1 + x2
}

watch(() => props.startVal, () => {
	props.autoplay && start()
})

watch(() => props.endVal, () => {
	props.autoplay && start()
})

onMounted(() => {
	props.autoplay && start()
})

onBeforeUnmount(() => {
	cancelAnimationFrameInner(rAF.value)
})

defineExpose({
	start,
	reStart,
	stop,
	resume,
	reset
})
</script>

<style lang="scss" scoped>
@import "../../libs/css/components.scss";

.up-count-num {
	/* #ifndef APP-NVUE */
	display: inline-flex;
	/* #endif */
	text-align: center;
}
</style>
