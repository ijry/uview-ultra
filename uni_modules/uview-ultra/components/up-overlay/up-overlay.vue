<template>
	<up-transition
	    :show="show"
	    custom-class="up-overlay"
	    :duration="duration"
	    :custom-style="overlayStyle"
	    @click="clickHandler"
	>
		<slot />
	</up-transition>
</template>

<script setup>
	import { computed } from 'vue'
	import { props as overlayProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addStyle, deepMerge } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-overlay',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...overlayProps.props
	})
	const emit = defineEmits(['click'])

	const overlayStyle = computed(() => {
		const style = {
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			zIndex: props.zIndex,
			bottom: 0,
			'background-color': `rgba(0, 0, 0, ${props.opacity})`
		}
		return deepMerge(style, addStyle(props.customStyle))
	})

	function clickHandler() {
		emit('click')
	}
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
     $up-overlay-top:0 !default;
     $up-overlay-left:0 !default;
     $up-overlay-width:100% !default;
     $up-overlay-height:100% !default;
     $up-overlay-background-color:rgba(0, 0, 0, .7) !default;
	.up-overlay {
		position: fixed;
		top:$up-overlay-top;
		left:$up-overlay-left;
		width: $up-overlay-width;
		height:$up-overlay-height;
		background-color:$up-overlay-background-color;
	}
</style>
