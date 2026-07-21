<template>
	<text class="up-badge"
		v-if="show && ((Number(value) === 0 ? showZero : true) || isDot)"
		:class="[isDot ? 'up-badge--dot' : 'up-badge--not-dot',
			inverted && 'up-badge--inverted',
			shape === 'horn' && 'up-badge--horn',
			inverted ? `up-badge--${type}--inverted` : `up-badge--${type}`]"
		:style="[addStyle(customStyle), badgeStyle]"
	>{{ isDot ? '' :showValue }}</text>
</template>

<script setup>
	import { computed } from 'vue'
	import { props as badgeProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addStyle, addUnit } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-badge',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...badgeProps.props
	})

	// 整个组件的样式
	const badgeStyle = computed(() => {
		const style = {}
		if (props.color) {
			style.color = props.color
		}
		if (props.bgColor && !props.inverted) {
			style.backgroundColor = props.bgColor
		}
		if (props.absolute) {
			style.position = 'absolute'
			// 如果有设置offset参数
			if (props.offset.length) {
				// top和right分为为offset的第一个和第二个值，如果没有第二个值，则right等于top
				const top = props.offset[0]
				const right = props.offset[1] || top
				style.top = addUnit(top)
				style.right = addUnit(right)
			}
		}
		return style
	})

	const showValue = computed(() => {
		switch (props.numberType) {
			case 'overflow':
				return Number(props.value) > Number(props.max) ? props.max + '+' : props.value
			case 'ellipsis':
				return Number(props.value) > Number(props.max) ? '...' : props.value
			case 'limit':
				return Number(props.value) > 999 ? Number(props.value) >= 9999 ?
					Math.floor(props.value / 1e4 * 100) / 100 + 'w' : Math.floor(props.value /
						1e3 * 100) / 100 + 'k' : props.value
			default:
				return Number(props.value)
		}
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	$up-badge-primary: $up-primary !default;
	$up-badge-error: $up-error !default;
	$up-badge-success: $up-success !default;
	$up-badge-info: $up-info !default;
	$up-badge-warning: $up-warning !default;
	$up-badge-dot-radius: 100px !default;
	$up-badge-dot-size: 8px !default;
	$up-badge-dot-right: 4px !default;
	$up-badge-dot-top: 0 !default;
	$up-badge-text-font-size: 11px !default;
	$up-badge-text-right: 10px !default;
	$up-badge-text-padding: 2px 5px !default;
	$up-badge-text-align: center !default;
	$up-badge-text-color: #FFFFFF !default;

	.up-badge {
		border-top-right-radius: $up-badge-dot-radius;
		border-top-left-radius: $up-badge-dot-radius;
		border-bottom-left-radius: $up-badge-dot-radius;
		border-bottom-right-radius: $up-badge-dot-radius;
		@include flex;
		line-height: $up-badge-text-font-size;
		text-align: $up-badge-text-align;
		font-size: $up-badge-text-font-size;
		// color: $up-badge-text-color;

		&--dot {
			height: $up-badge-dot-size;
			width: $up-badge-dot-size;
		}
		
		&--inverted {
			font-size: 13px;
		}
		
		&--not-dot {
			padding: $up-badge-text-padding;
		}

		&--horn {
			border-bottom-left-radius: 0;
		}

		&--primary {
			background-color: $up-badge-primary;
		}
		
		&--primary--inverted {
			color: $up-badge-primary;
		}

		&--error {
			background-color: $up-badge-error;
		}
		
		&--error--inverted {
			color: $up-badge-error;
		}

		&--success {
			background-color: $up-badge-success;
		}
		
		&--success--inverted {
			color: $up-badge-success;
		}

		&--info {
			background-color: $up-badge-info;
		}
		
		&--info--inverted {
			color: $up-badge-info;
		}

		&--warning {
			background-color: $up-badge-warning;
		}
		
		&--warning--inverted {
			color: $up-badge-warning;
		}
	}
</style>
