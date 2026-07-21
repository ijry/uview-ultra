<template>
	<picker-view-column>
		<view class="up-picker-column">
		</view>
	</picker-view-column>
</template>

<script setup>
	import { props as pickerColumnProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	/**
	 * PickerColumn 
	 * @description 
	 * @tutorial url
	 * @property {String}
	 * @event {Function}
	 * @example
	 */
	defineOptions({
		name: 'up-picker-column',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	defineProps({
		...commonProps,
		...pickerColumnProps.props
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
</style>
