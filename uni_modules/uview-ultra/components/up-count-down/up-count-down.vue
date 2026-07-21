<template>
	<view class="up-count-down">
		<slot>
			<text class="up-count-down__text">{{ formattedTime }}</text>
		</slot>
	</view>
</template>

<script setup>
	import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { props as countDownProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import {
		isSameSecond,
		parseFormat,
		parseTimeData
	} from './utils';
	/**
	 * up-count-down 倒计时
	 * @description 该组件一般使用于某个活动的截止时间上，通过数字的变化，给用户明确的时间感受，提示用户进行某一个行为操作。
	 * @tutorial https://uview-plus.jiangruyi.com/components/countDown.html
	 * @property {String | Number}	time		倒计时时长，单位ms （默认 0 ）
	 * @property {String}			format		时间格式，DD-日，HH-时，mm-分，ss-秒，SSS-毫秒  （默认 'HH:mm:ss' ）
	 * @property {Boolean}			autoStart	是否自动开始倒计时 （默认 true ）
	 * @property {Boolean}			millisecond	是否展示毫秒倒计时 （默认 false ）
	 * @event {Function} finish 倒计时结束时触发 
	 * @event {Function} change 倒计时变化时触发 
	 * @event {Function} start	开始倒计时
	 * @event {Function} pause	暂停倒计时 
	 * @event {Function} reset	重设倒计时，若 auto-start 为 true，重设后会自动开始倒计时 
	 * @example <up-count-down :time="time"></up-count-down>
	 */
	defineOptions({
		name: 'up-count-down',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...countDownProps.props
	})
	const emit = defineEmits(['change', 'finish'])
	const timer = ref(null)
	// 各单位(天，时，分等)剩余时间
	const timeData = ref(parseTimeData(0))
	// 格式化后的时间，如"03:23:21"
	const formattedTime = ref('0')
	// 倒计时是否正在进行中
	const runing = ref(false)
	const endTime = ref(0) // 结束的毫秒时间戳
	const remainTime = ref(0) // 剩余的毫秒时间

	function init() {
		reset()
	}

	// 开始倒计时
	function start() {
		if (runing.value) return
		// 标识为进行中
		runing.value = true
		// 结束时间戳 = 此刻时间戳 + 剩余的时间
		endTime.value = Date.now() + remainTime.value
		toTick()
	}

	// 根据是否展示毫秒，执行不同操作函数
	function toTick() {
		if (props.millisecond) {
			microTick()
		} else {
			macroTick()
		}
	}

	function macroTick() {
		clearTimer()
		// 每隔一定时间，更新一遍定时器的值
		// 同时此定时器的作用也能带来毫秒级的更新
		timer.value = setTimeout(() => {
			// 获取剩余时间
			const remain = getRemainTime()
			// 重设剩余时间
			if (!isSameSecond(remain, remainTime.value) || remain === 0) {
				setRemainTime(remain)
			}
			// 如果剩余时间不为0，则继续检查更新倒计时
			if (remainTime.value !== 0) {
				macroTick()
			}
		}, 30)
	}

	function microTick() {
		clearTimer()
		timer.value = setTimeout(() => {
			setRemainTime(getRemainTime())
			if (remainTime.value !== 0) {
				microTick()
			}
		}, 50)
	}

	// 获取剩余的时间
	function getRemainTime() {
		// 取最大值，防止出现小于0的剩余时间值
		return Math.max(endTime.value - Date.now(), 0)
	}

	// 设置剩余的时间
	function setRemainTime(remain) {
		remainTime.value = remain
		// 根据剩余的毫秒时间，得出该有天，小时，分钟等的值，返回一个对象
		timeData.value = parseTimeData(remain)
		emit('change', timeData.value)
		// 得出格式化后的时间
		formattedTime.value = parseFormat(props.format, timeData.value)
		// 如果时间已到，停止倒计时
		if (remain <= 0) {
			pause()
			emit('finish')
		}
	}

	// 重置倒计时
	function reset() {
		pause()
		remainTime.value = props.time
		setRemainTime(remainTime.value)
		if (props.autoStart) {
			start()
		}
	}

	// 暂停倒计时
	function pause() {
		runing.value = false
		clearTimer()
	}

	// 清空定时器
	function clearTimer() {
		clearTimeout(timer.value)
		timer.value = null
	}

	watch(() => props.time, () => {
		reset()
	})

	onMounted(() => {
		init()
	})

	onBeforeUnmount(() => {
		clearTimer()
	})

	defineExpose({
		start,
		pause,
		reset
	})
</script>

<style
	lang="scss"
	scoped
>
	@import "../../libs/css/components.scss";
	$up-count-down-text-color:$up-content-color !default;
	$up-count-down-text-font-size:15px !default;
	$up-count-down-text-line-height:22px !default;

	.up-count-down {
		&__text {
			color: $up-count-down-text-color;
			font-size: $up-count-down-text-font-size;
			line-height: $up-count-down-text-line-height;
		}
	}
</style>
