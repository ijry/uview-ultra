<template>
	<view class="up-td" :style="[tdStyle]">
		<slot></slot>
	</view>
</template>

<script setup>
	import { getCurrentInstance, onMounted, ref } from 'vue'
	import { props as tdProps } from './props'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, $parent } from '../../libs/function/index.js'
	/** 
	 * Td 表格中的单元格
	 * @description 
	 * @tutorial url
	 * @property {String | Number} 
	 * @event {Function}
	 * @example
	 */
	defineOptions({
		name: 'up-td',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...tdProps.props,
		// 宽度，百分比或者具体带单位的值，如30%， 200rpx等，一般使用百分比
		width: {
			type: [String],
			default: 'auto'
		},
		textAlign: {
			type: String,
			default: ''
		},
		fontSize: {
			type: String,
			default: ''
		},
		borderColor: {
			type: String,
			default: ''
		},
		color: {
			type: String,
			default: ''
		}
	})
	const instance = getCurrentInstance()
	const tdStyle = ref({})

	onMounted(() => {
		const parent = $parent.call(instance.proxy, 'up-table')
		if (!parent) return
		const parentProps = typeof parent.getProps === 'function' ? parent.getProps() : parent

		// 将父组件的相关参数，合并到本组件
		const style = {}
		if (props.width != 'auto') style.flex = `0 0 ${props.width}`
		style.textAlign = parentProps.align
		style.fontSize = addUnit(parentProps.fontSize)
		style.padding = parentProps.padding
		style.borderBottom = `solid 1px ${parentProps.borderColor}`
		style.borderRight = `solid 1px ${parentProps.borderColor}`
		style.color = parentProps.color
		if (props.textAlign != '') {
			style.textAlign = props.textAlign
		}
		if (props.fontSize != '') {
			style.fontSize = props.fontSize
		}
		if (props.borderColor != '') {
			style.borderColor = props.borderColor
		}
		if (props.color != '') {
			style.color = props.color
		}
		tdStyle.value = style
	})
</script>

<style lang="scss" scoped>
	.up-td {
		@include flex;
		flex-direction: column;
		flex: 1;
		justify-content: center;
		font-size: 14px;
		color: $up-content-color;
		align-self: stretch;
		box-sizing: border-box;
		height: 100%;
	}
</style>
