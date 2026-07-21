<template>
	<view class="up-circle-progress">
		<view class="up-circle-progress__left">
			<view
			    class="up-circle-progress__left__circle"
			    :style="[leftSyle]"
			    ref="left-circle"
			>

			</view>
		</view>
		<view
		    class="up-circle-progress__right"
		>
			<view
			    class="up-circle-progress__right__circle"
			    ref="right-circle"
				:style="[rightSyle]"
			>

			</view>
		</view>
		<view class="up-circle-progress__circle">

		</view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, onMounted, ref } from 'vue'
	import { props as circleProgressProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { sleep } from '../../libs/function/index.js'
	// #ifdef APP-NVUE
	const animation = uni.requireNativePlugin('animation')
	// #endif
	/**
	 * CircleProgress 圆形进度条 TODO: 待完善
	 * @description 展示操作或任务的当前进度，比如上传文件，是一个圆形的进度环。
	 * @tutorial https://ijry.github.io/uview-plus/components/circleProgress.html
	 * @property {String | Number}	percentage	圆环进度百分比值，为数值类型，0-100 (默认 30 )
	 * @example
	 */
	defineOptions({
		name: 'up-circle-progress',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	defineProps({
		...commonProps,
		...circleProgressProps.props
	})
	const instance = getCurrentInstance()
	const leftBorderColor = ref('rgb(200, 200, 200)')
	const rightBorderColor = ref('rgb(200, 200, 200)')

	const leftSyle = computed(() => {
		const style = {}
		style.borderTopColor = leftBorderColor.value
		style.borderRightColor = leftBorderColor.value
		return style
	})

	const rightSyle = computed(() => {
		const style = {}
		style.borderLeftColor = rightBorderColor.value
		style.borderBottomColor = rightBorderColor.value
		return style
	})

	function init() {
		// #ifdef APP-NVUE
		animation.transition(instance.proxy.$refs['right-circle'].ref, {
			styles: {
				transform: 'rotate(45deg)',
				transformOrigin: 'center center'
			},
		}, () => {
			rightBorderColor.value = 'rgb(66, 185, 131)'
		})
		// #endif
	}

	onMounted(() => {
		sleep().then(() => {
			rightBorderColor.value = 'rgb(66, 185, 131)'
			// init()
		})
	})

	defineExpose({
		init
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-circle-progress {
		@include flex(row);
		position: relative;
		border-radius: 100px;
		height: 100px;
		width: 100px;
		// transform: rotate(0deg);
		// background-color: rgb(66, 185, 131);
		background-color: rgb(200, 200, 200);
		overflow: hidden;
		justify-content: space-between;

		&__circle {
			border-radius: 100px;
			height: 90px;
			width: 90px;
			transform: translate(-50%, -50%);
			background-color: rgb(255, 255, 255);
			left: 50px;
			top: 50px;
			position: absolute;
		}

		&__left {
			position: absolute;
			left: 0;
			width: 50px;
			height: 100px;
			overflow: hidden;
			box-sizing: border-box;
			// background-color: rgb(66, 185, 131);
			// background-color: rgb(200, 200, 200);
			// transform-origin: left center;

			&__circle {
				box-sizing: border-box;
				// background-color: red;
				border-left-color: transparent;
				border-bottom-color: transparent;
				border-top-left-radius: 50px;
				border-top-right-radius: 50px;
				border-bottom-right-radius: 50px;
				// border-left-color: rgb(66, 185, 131);
				// border-bottom-color: rgb(66, 185, 131);
				border-top-color: rgb(66, 185, 131);
				border-right-color: rgb(66, 185, 131);
				border-width: 5px;
				width: 100px;
				height: 100px;
				transform: rotate(225deg);
				// border-radius: 100px;
			}
		}

		&__right {
			position: absolute;
			right: 0;
			width: 50px;
			height: 100px;
			overflow: hidden;

			&__circle {
				position: absolute;
				right: 0;
				box-sizing: border-box;
				// background-color: red;
				border-top-color: transparent;
				border-right-color: transparent;
				border-top-left-radius: 50px;
				border-bottom-left-radius: 50px;
				border-bottom-right-radius: 50px;
				// border-left-color: rgb(66, 185, 131);
				// border-bottom-color: rgb(66, 185, 131);
				border-left-color: rgb(200, 200, 200);
				border-bottom-color: rgb(200, 200, 200);
				border-width: 5px;
				width: 100px;
				height: 100px;
				transform: rotate(45deg);
				transform-origin: center center;
				// border-radius: 100px;
			}
		}
	}
</style>
