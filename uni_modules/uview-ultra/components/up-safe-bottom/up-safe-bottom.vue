<template>
	<view
		class="up-safe-bottom"
		:style="[style]"
		:class="[!isNvue && 'up-safe-area-inset-bottom']"
	>
	</view>
</template>

<script setup>
	import { computed, onMounted, ref } from 'vue'
	import { props as safeBottomProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addStyle, deepMerge, addUnit, sys } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-safe-bottom',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...safeBottomProps.props
	})
	const isNvue = ref(false)

	const style = computed(() => {
		const style = {}
		// #ifdef APP-NVUE || MP-TOUTIAO
		// nvue下，高度使用js计算填充
		style.height = addUnit(sys().safeAreaInsets.bottom, 'px')
		// #endif
		return deepMerge(style, addStyle(props.customStyle))
	})

	onMounted(() => {
		// #ifdef APP-NVUE
		// 标识为是否nvue
		isNvue.value = true
		// #endif
	})
</script>

<style lang="scss" scoped>
	.up-safe-bottom {
		/* #ifndef APP-NVUE */
		width: 100%;
		/* #endif */
	}
</style>
