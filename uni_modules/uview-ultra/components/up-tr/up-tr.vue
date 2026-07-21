<template>
	<view class="up-tr">
		<slot></slot>
	</view>
</template>

<script setup>
	import { props as trProps } from './props'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	/**
	 * Tr  
	 * @description 
	 * @tutorial url
	 * @property {String}
	 * @event {Function}
	 * @example
	 */
	defineOptions({
		name: 'up-tr',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	defineProps({
		...commonProps,
		...trProps.props
	})
</script>

<style lang="scss" scoped>
	.up-tr {
		@include flex;
	}
</style>
