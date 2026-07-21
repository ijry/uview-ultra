<template>
	<view class="up-gap" :style="[gapStyle]"></view>
</template>

<script setup>
	import { computed } from 'vue'
	import { propsGap } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addStyle, addUnit, deepMerge } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-gap',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...propsGap.props
	})

	const gapStyle = computed(() => {
		const style = {
			backgroundColor: props.bgColor,
			height: addUnit(props.height),
			marginTop: addUnit(props.marginTop),
			marginBottom: addUnit(props.marginBottom),
		}
		return deepMerge(style, addStyle(props.customStyle))
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
</style>
