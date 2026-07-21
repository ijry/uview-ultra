<template>
	<view
	    :style="[style]"
	    class="up-status-bar"
	>
		<slot />
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { props as statusBarProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, deepMerge, sys } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-status-bar',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...statusBarProps.props
	})

	const style = computed(() => {
		const style = {}
		// 状态栏高度，由于某些安卓和微信开发工具无法识别css的顶部状态栏变量，所以使用js获取的方式
		style.height = addUnit(sys().statusBarHeight, 'px')
		style.backgroundColor = props.bgColor
		return deepMerge(style, addStyle(props.customStyle))
	})
</script>

<style lang="scss" scoped>
	.up-status-bar {
		// nvue会默认100%，如果nvue下，显式写100%的话，会导致宽度不为100%而异常
		/* #ifndef APP-NVUE */
		width: 100%;
		/* #endif */
	}
</style>
