<template>
	<view class="up-th" :style="[thStyle]">
		<slot></slot>
	</view>
</template>

<script setup>
	import { getCurrentInstance, onMounted, ref } from 'vue'
	import { props as thProps } from './props'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { $parent } from '../../libs/function/index.js'
	/** 
	 * Td 表格中的单元格
	 * @description 
	 * @tutorial url
	 * @property {String | Number} 
	 * @event {Function}
	 * @example
	 */
	defineOptions({
		name: 'up-th',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...thProps.props,
		// 宽度，百分比或者具体带单位的值，如30%， 200rpx等，一般使用百分比
		width: {
			type: [String],
			default: ''
		}
	})
	const instance = getCurrentInstance()
	const thStyle = ref({})

	onMounted(() => {
		const parent = $parent.call(instance.proxy, 'up-table')
		if (!parent) return
		const parentProps = typeof parent.getProps === 'function' ? parent.getProps() : parent

		// 将父组件的相关参数，合并到本组件
		const style = {}
		if (props.width) style.flex = `0 0 ${props.width}`
		style.textAlign = parentProps.align
		style.padding = parentProps.padding
		style.borderBottom = `solid 1px ${parentProps.borderColor}`
		style.borderRight = `solid 1px ${parentProps.borderColor}`
		Object.assign(style, parentProps.thStyle)
		thStyle.value = style
	})
</script>

<style lang="scss" scoped>
	.up-th {
		@include flex;
		flex-direction: column;
		flex: 1;
		justify-content: center;
		font-size: 28rpx;
		color: $up-main-color;
		font-weight: bold;
		background-color: rgb(245, 246, 248);
	}
</style>
