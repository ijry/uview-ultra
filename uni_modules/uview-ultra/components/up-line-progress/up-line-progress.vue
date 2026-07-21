<template>
	<view
	    class="up-line-progress"
	    :style="[addStyle(customStyle)]"
	>
		<view
		    class="up-line-progress__background"
		    ref="up-line-progress__background"
		    :style="[{
				backgroundColor: inactiveColor,
				height: addUnit(height),
			}]"
		>
		</view>
		<view
		    class="up-line-progress__line"
		    :style="[progressStyle]"
		> 
			<slot>
				<text v-if="showText && percentage >= 10" class="up-line-progress__text">{{innserPercentage + '%'}}</text>
			</slot> 
		</view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
	import { props as lineProgressProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, sleep, range } from '../../libs/function/index.js'
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * lineProgress 线型进度条
	 * @description 展示操作或任务的当前进度，比如上传文件，是一个线形的进度条。
	 * @tutorial https://ijry.github.io/uview-plus/components/lineProgress.html
	 * @property {String}			activeColor		激活部分的颜色 ( 默认 '#19be6b' )
	 * @property {String}			inactiveColor	背景色 ( 默认 '#ececec' )
	 * @property {String | Number}	percentage		进度百分比，数值 ( 默认 0 )
	 * @property {Boolean}			showText		是否在进度条内部显示百分比的值 ( 默认 true )
	 * @property {String | Number}	height			进度条的高度，单位px ( 默认 12 )
	 * 
	 * @example <up-line-progress :percent="70" :show-percent="true"></up-line-progress>
	 */
	defineOptions({
		name: 'up-line-progress',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...lineProgressProps.props
	})
	const instance = getCurrentInstance()
	const lineWidth = ref(0)
	const { $uGetRect } = useUltraUI(props)

	const progressStyle = computed(() => {
		const style = {}
		style.width = lineWidth.value
		style.backgroundColor = props.activeColor
		style.height = addUnit(props.height)
		return style
	})

	const innserPercentage = computed(() => {
		// 控制范围在0-100之间
		return range(0, 100, props.percentage)
	})

	function init() {
		sleep(20).then(() => {
			resizeProgressWidth()
		})
	}

	function getProgressWidth() {
		// #ifndef APP-NVUE
		return $uGetRect('.up-line-progress__background')
		// #endif

		// #ifdef APP-NVUE
		// 返回一个promise
		return new Promise(resolve => {
			dom.getComponentRect(instance.proxy.$refs['up-line-progress__background'], (res) => {
				resolve(res.size)
			})
		})
		// #endif
	}

	function resizeProgressWidth() {
		getProgressWidth().then(size => {
			const {
				width
			} = size
			// 通过设置的percentage值，计算其所占总长度的百分比
			lineWidth.value = width * innserPercentage.value / 100 + 'px'
		})
	}

	watch(() => props.percentage, () => {
		resizeProgressWidth()
	})

	onMounted(() => {
		init()
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-line-progress {
		align-items: stretch;
		position: relative;
		@include flex(row);
		flex: 1;
		overflow: hidden;
		border-radius: 100px;

		&__background {
			background-color: #ececec;
			border-radius: 100px;
			flex: 1;
		}

		&__line {
			position: absolute;
			top: 0;
			left: 0;
			bottom: 0;
			align-items: center;
			@include flex(row);
			color: #ffffff;
			border-radius: 100px;
			transition: width 0.5s ease;
			justify-content: flex-end;
		}

		&__text {
			font-size: 10px;
			align-items: center;
			text-align: right;
			color: #FFFFFF;
			margin-right: 5px;
			transform: scale(0.9);
		}
	}
</style>
