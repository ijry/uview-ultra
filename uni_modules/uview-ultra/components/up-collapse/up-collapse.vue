<template>
	<view class="up-collapse">
		<up-line v-if="border"></up-line>
		<slot />
	</view>
</template>

<script setup>
	import { toRefs, watch } from 'vue'
	import { props as collapseProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	/**
	 * collapse 折叠面板 
	 * @description 通过折叠面板收纳内容区域
	 * @tutorial https://ijry.github.io/uview-plus/components/collapse.html
	 * @property {String | Number | Array}	value		当前展开面板的name，非手风琴模式：[<string | number>]，手风琴模式：string | number
	 * @property {Boolean}					accordion	是否手风琴模式（ 默认 false ）
	 * @property {Boolean}					border		是否显示外边框 ( 默认 true ）
	 * @event {Function}	change 		当前激活面板展开时触发(如果是手风琴模式，参数activeNames类型为String，否则为Array)
	 * @example <up-collapse></up-collapse>
	 */
	defineOptions({
		name: 'up-collapse',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...collapseProps.props
	})
	const emit = defineEmits(['open', 'close', 'change'])
	const { children } = useUltraUI(props)
	const {
		value,
		accordion,
		border
	} = toRefs(props)

	// 重新初始化一次内部的所有子元素
	function init() {
		children.value.map(child => {
			child.init()
		})
	}

	function updateChildData() {
		children.value.map(child => {
			// 判断子组件如果有updateParentData方法的话，就执行(执行的结果是子组件重新从父组件拉取了最新的值)
			typeof child.updateParentData === 'function' && child.updateParentData()
		})
	}

	/**
	 * collapse-item被点击时触发，由collapse统一处理各子组件的状态
	 * @param {Object} target 被操作的面板的实例
	 */
	function onChange(target) {
		const changeArr = []
		children.value.map((child, index) => {
			// 如果是手风琴模式，将其他的折叠面板收起来
			if (props.accordion) {
				child.expanded = child === target ? !target.expanded : false
				child.setContentAnimate()
			} else {
				if (child === target) {
					child.expanded = !child.expanded
					child.setContentAnimate()
				}
			}
			// 拼接change事件中，数组元素的状态
			changeArr.push({
				// 如果没有定义name属性，则默认返回组件的index索引
				name: child.name || index,
				status: child.expanded ? 'open' : 'close'
			})
		})

		emit('change', changeArr)
		emit(target.expanded ? 'open' : 'close', target.name)
	}

	function getProps() {
		return {
			value: props.value,
			accordion: props.accordion,
			border: props.border
		}
	}

	// 通过watch同时监听accordion和value值的变化，进行再一次的初始化
	watch(() => [props.accordion, props.value], () => {
		init()
	})

	watch(() => [props.accordion, props.border], () => {
		updateChildData()
	})

	defineExpose({
		children,
		value,
		accordion,
		border,
		init,
		onChange,
		getProps
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
</style>
