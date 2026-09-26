<template>
	<view
	    class="up-flex"
	    :style="[flexStyle]"
	    @tap="clickHandler"
	>
		<slot />
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { propsFlex } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, deepMerge } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-flex',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...propsFlex.props
	})
	const emit = defineEmits(['click'])

	const uJustify = computed(() => {
		if (props.justify == 'start' || props.justify == 'end') return 'flex-' + props.justify
		else return props.justify
	})

	const flexStyle = computed(() => {
		const style = {
			display: 'flex',
			flexDirection: props.direction,
			justifyContent: uJustify.value,
			alignItems: props.align,
			flexWrap: props.wrap ? 'wrap' : 'nowrap'
		}
		if (props.gap && Number(props.gap) !== 0) {
			style.gap = addUnit(props.gap)
		}
		return deepMerge(style, addStyle(props.customStyle))
	})

	function clickHandler() {
		emit('click')
	}
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-flex {
		@include flex;
	}
</style>
