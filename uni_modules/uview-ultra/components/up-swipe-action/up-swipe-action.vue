<template>
	<view class="u-swipe-action">
		<slot></slot>
	</view>
</template>

<script setup>
	import { toRef, watch } from 'vue'
	import { props as swipeActionProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	/**
	 * SwipeAction 滑动单元格 
	 * @description 该组件一般用于左滑唤出操作菜单的场景，用的最多的是左滑删除操作
	 * @tutorial https://uview-plus.jiangruyi.com/components/swipeAction.html
	 * @property {Boolean}	autoClose	是否自动关闭其他swipe按钮组
	 * @event {Function(index)}	click	点击组件时触发
	 * @example	<u-swipe-action><u-swipe-action-item :rightOptions="options1" ></u-swipe-action-item></u-swipe-action>
	 */
	defineOptions({
		name: 'u-swipe-action',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...swipeActionProps.props
	})
	const emit = defineEmits(['opendItem:update'])
	const { children } = useUltraUI(props)
	const autoClose = toRef(props, 'autoClose')

	function updateChildData() {
		children.value.map(child => {
			// 判断子组件如果有updateParentData方法的话，就执行(执行的结果是子组件重新从父组件拉取了最新的值)
			typeof child.updateParentData === 'function' && child.updateParentData()
		})
	}

	function closeOther(child) {
		if (props.autoClose) {
			// 历遍所有的单元格，找出非当前操作中的单元格，进行关闭
			children.value.map((item, index) => {
				if (child !== item) {
					item.closeHandler()
				}
			})
		}
	}

	function closeAll() {
		// 关闭所有单元格
		children.value.map((item, index) => {
			item.closeHandler()
		})
	}

	function setOpendItem(ins) {
		emit('opendItem:update', true)
	}

	function getProps() {
		return {
			autoClose: props.autoClose
		}
	}

	// 当父组件需要子组件共享的参数发生变化，手动通知子组件
	watch(() => props.autoClose, () => {
		updateChildData()
	})

	watch(() => props.opendItem, (val) => {
		if (val == false) {
			closeAll()
		}
	})

	defineExpose({
		children,
		autoClose,
		closeOther,
		closeAll,
		setOpendItem,
		getProps,
		updateChildData
	})
</script>

<style lang="scss" scoped>

</style>
