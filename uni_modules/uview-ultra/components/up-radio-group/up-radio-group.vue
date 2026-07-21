<template>
	<view
	    class="up-radio-group"
	    :class="bemClass"
	>
		<slot></slot>
	</view>
</template>

<script setup>
	import { computed, toRefs, watch } from 'vue'
	import { props as radioGroupProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'

	/**
	 * radioRroup 单选框父组件
	 * @description 单选框用于有一个选择，用户只能选择其中一个的场景。搭配up-radio使用
	 * @tutorial https://ijry.github.io/uview-plus/components/radio.html
	 * @property {String | Number | Boolean}	value 			绑定的值
	 * @property {Boolean}						disabled		是否禁用所有radio（默认 false ）
	 * @property {String}						shape			外观形状，shape-方形，circle-圆形(默认 circle )
	 * @property {String}						activeColor		选中时的颜色，应用到所有子Radio组件（默认 '#2979ff' ）
	 * @property {String}						inactiveColor	未选中的颜色 (默认 '#c8c9cc' )
	 * @property {String}						name			标识符
	 * @property {String | Number}				size			组件整体的大小，单位px（默认 18 ）
	 * @property {String}						placement		布局方式，row-横向，column-纵向 （默认 'row' ）
	 * @property {String}						label			文本
	 * @property {String}						labelColor		label的颜色 （默认 '#303133' ）
	 * @property {String | Number}				labelSize		label的字体大小，px单位 （默认 14 ）
	 * @property {Boolean}						labelDisabled	是否禁止点击文本操作checkbox(默认 false )
	 * @property {String}						iconColor		图标颜色 （默认 '#ffffff' ）
	 * @property {String | Number}				iconSize		图标的大小，单位px （默认 12 ）
	 * @property {Boolean}						borderBottom	placement为row时，是否显示下边框 （默认 false ）
	 * @property {String}						iconPlacement	图标与文字的对齐方式 （默认 'left' ）
     * @property {Object}						customStyle		组件的样式，对象形式
	 * @event {Function} change 任一个radio状态发生变化时触发
	 * @example <up-radio-group v-model="value"></up-radio-group>
	 */
	defineOptions({
		name: 'up-radio-group',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...radioGroupProps.props
	})
	const emit = defineEmits(['update:modelValue', 'input', 'change'])
	const { children, bem } = useUltraUI(props)
	const {
		modelValue,
		value,
		disabled,
		inactiveColor,
		activeColor,
		size,
		labelDisabled,
		shape,
		iconSize,
		borderBottom,
		placement,
		labelColor,
		labelSize,
		iconColor,
		iconPlacement
	} = toRefs(props)

	const bemClass = computed(() => {
		return bem('radio-group', ['placement'])
	})

	function updateChildData() {
		children.value.map(child => {
			// 判断子组件如果有init方法的话，就执行(执行的结果是子组件重新从父组件拉取了最新的值)
			typeof child.init === 'function' && child.init()
		})
	}

	function getProps() {
		return {
			modelValue: props.modelValue,
			value: props.value,
			disabled: props.disabled,
			inactiveColor: props.inactiveColor,
			activeColor: props.activeColor,
			size: props.size,
			labelDisabled: props.labelDisabled,
			shape: props.shape,
			iconSize: props.iconSize,
			borderBottom: props.borderBottom,
			placement: props.placement,
			labelColor: props.labelColor,
			labelSize: props.labelSize,
			iconColor: props.iconColor,
			iconPlacement: props.iconPlacement
		}
	}

	// 将其他的radio设置为未选中的状态
	function unCheckedOther(childInstance) {
		children.value.map(child => {
			// 所有子radio中，被操作组件实例的checked的值无需修改
			if (childInstance !== child) {
				child.checked = false
			}
		})
		const { name } = childInstance
		// 通过emit事件，设置父组件通过v-model双向绑定的值
		// #ifdef VUE3
		emit('update:modelValue', name)
		// #endif
		// #ifdef VUE2
		emit('input', name)
		// #endif
		// 发出事件
		emit('change', name)
	}

	// 当父组件需要子组件共享的参数发生变化，手动通知子组件
	watch(() => [
		props.modelValue,
		props.value,
		props.disabled,
		props.inactiveColor,
		props.activeColor,
		props.size,
		props.labelDisabled,
		props.shape,
		props.iconSize,
		props.borderBottom,
		props.placement,
		props.labelColor,
		props.labelSize,
		props.iconColor,
		props.iconPlacement
	], () => {
		updateChildData()
	})

	defineExpose({
		children,
		modelValue,
		value,
		disabled,
		inactiveColor,
		activeColor,
		size,
		labelDisabled,
		shape,
		iconSize,
		borderBottom,
		placement,
		labelColor,
		labelSize,
		iconColor,
		iconPlacement,
		unCheckedOther,
		getProps,
		updateChildData
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-radio-group {
		flex: 1;

		&--row {
			/* #ifndef APP-NVUE */
			display: flex;
			/* #endif */
			flex-flow: row wrap;
		}

		&--column {
			@include flex(column);
		}
	}
</style>
