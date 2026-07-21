<template>
	<view class="up-code">
		<!-- 此组件功能由js完成，无需写html逻辑 -->
	</view>
</template>

<script setup>
	import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { props as codeProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'

	defineOptions({
		name: 'up-code',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...codeProps.props
	})
	const emit = defineEmits(['start', 'end', 'change'])
	const secNum = ref(props.seconds)
	const timer = ref(null)
	const canGetCode = ref(true)

	function changeEvent(text) {
		emit('change', text)
	}

	// 保存时间戳，为了防止倒计时尚未结束，H5刷新或者各端的右上角返回上一页再进来
	function setTimeToStorage() {
		if (!props.keepRunning || !timer.value) return
		// 倒计时尚未结束且已经开始，才需要保存。
		if (Number(secNum.value) > 0 && Number(secNum.value) < Number(props.seconds)) {
			const nowTimestamp = Math.floor((+new Date()) / 1000)
			uni.setStorage({
				key: props.uniqueKey + '_$uCountDownTimestamp',
				data: nowTimestamp + Number(secNum.value)
			})
		}
	}

	function checkKeepRunning() {
		// 获取上一次退出页面(H5还包括刷新)时的时间戳，如果没有上次的保存，此值可能为空
		const lastTimestamp = Number(uni.getStorageSync(props.uniqueKey + '_$uCountDownTimestamp'))
		if (!lastTimestamp) return changeEvent(props.startText)
		const nowTimestamp = Math.floor((+new Date()) / 1000)
		if (props.keepRunning && lastTimestamp && lastTimestamp > nowTimestamp) {
			secNum.value = lastTimestamp - nowTimestamp
			uni.removeStorageSync(props.uniqueKey + '_$uCountDownTimestamp')
			start()
		} else {
			changeEvent(props.startText)
		}
	}

	// 开始倒计时
	function start() {
		if (timer.value) {
			clearInterval(timer.value)
			timer.value = null
		}
		emit('start')
		canGetCode.value = false
		changeEvent(props.changeText.replace(/x|X/, secNum.value))
		timer.value = setInterval(() => {
			if (--secNum.value) {
				changeEvent(props.changeText.replace(/x|X/, secNum.value))
			} else {
				clearInterval(timer.value)
				timer.value = null
				changeEvent(props.endText)
				secNum.value = props.seconds
				emit('end')
				canGetCode.value = true
			}
		}, 1000)
		setTimeToStorage()
	}

	// 重置，可以让用户再次获取验证码
	function reset() {
		canGetCode.value = true
		clearInterval(timer.value)
		timer.value = null
		secNum.value = props.seconds
		changeEvent(props.endText)
	}

	onMounted(() => {
		checkKeepRunning()
	})

	watch(() => props.seconds, (value) => {
		secNum.value = value
	}, { immediate: true })

	onBeforeUnmount(() => {
		setTimeToStorage()
		clearTimeout(timer.value)
		timer.value = null
	})

	defineExpose({
		start,
		reset,
		canGetCode
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
</style>
