<template>
	<view
	    class="up-divider"
	    :style="[addStyle(customStyle)]"
		@tap="click"
	>
		<up-line
		    :color="lineColor"
		    :customStyle="leftLineStyle"
		    :hairline="hairline"
			:dashed="dashed"
		></up-line>
		<text
		    v-if="dot"
		    class="up-divider__dot"
		>●</text>
		<text
		    v-else-if="text"
		    class="up-divider__text"
		    :style="[textStyle]"
		>{{text}}</text>
		<up-line
		    :color="lineColor"
		    :customStyle="rightLineStyle"
		    :hairline="hairline"
			:dashed="dashed"
		></up-line>
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { props as dividerProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addStyle, addUnit } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-divider',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...dividerProps.props
	})
	const emit = defineEmits(['click'])

	const textStyle = computed(() => {
		const style = {}
		style.fontSize = addUnit(props.textSize)
		style.color = props.textColor
		return style
	})

	// 左边线条的的样式
	const leftLineStyle = computed(() => {
		const style = {}
		// 如果是在左边，设置左边的宽度为固定值
		if (props.textPosition === 'left') {
			style.width = '80rpx'
		} else {
			style.flex = 1
		}
		return style
	})

	// 右边线条的的样式
	const rightLineStyle = computed(() => {
		const style = {}
		// 如果是在右边，设置右边的宽度为固定值
		if (props.textPosition === 'right') {
			style.width = '80rpx'
		} else {
			style.flex = 1
		}
		return style
	})

	function click() {
		emit('click')
	}
</script>

<style lang="scss" scoped>
	@import '../../libs/css/components.scss';
	$up-divider-margin:15px 0 !default;
	$up-divider-text-margin:0 15px !default;
	$up-divider-dot-font-size:12px !default;
	$up-divider-dot-margin:0 12px !default;
	$up-divider-dot-color: #c0c4cc !default;

	.up-divider {
		@include flex;
		flex-direction: row;
		align-items: center;
		margin: $up-divider-margin;

		&__text {
			margin: $up-divider-text-margin;
		}

		&__dot {
			font-size: $up-divider-dot-font-size;
			margin: $up-divider-dot-margin;
			color: $up-divider-dot-color;
		}
	}
</style>
