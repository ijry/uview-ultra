<template>
	<view
	    class="up-checkbox-group"
	    :class="bemClass"
	>
		<slot></slot>
	</view>
</template>

<script setup>
	import { computed, toRefs, watch } from 'vue'
	import { props as checkboxGroupProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	/**
	 * checkboxGroup 复选框组
	 * @description 复选框组件一般用于需要多个选择的场景，该组件功能完整，使用方便
	 * @tutorial https://ijry.github.io/uview-plus/components/checkbox.html
	 * @property {String}			name			标识符 
	 * @property {Array}			value			绑定的值
	 * @property {String}			shape			形状，circle-圆形，square-方形 （默认 'square' ）
	 * @property {Boolean}			disabled		是否禁用全部checkbox （默认 false ）
	 * @property {String}			activeColor		选中状态下的颜色，如设置此值，将会覆盖parent的activeColor值 （默认 '#2979ff' ）
	 * @property {String}			inactiveColor	未选中的颜色 （默认 '#c8c9cc' ）
	 * @property {String | Number}	size			整个组件的尺寸 单位px （默认 18 ）
	 * @property {String}			placement		布局方式，row-横向，column-纵向 （默认 'row' ）
	 * @property {String | Number}	labelSize		label的字体大小，px单位  （默认 14 ）
	 * @property {String}			labelColor		label的字体颜色 （默认 '#303133' ）
	 * @property {Boolean}			labelDisabled	是否禁止点击文本操作 (默认 false )
	 * @property {String}			iconColor		图标颜色 （默认 '#ffffff' ）
	 * @property {String | Number}	iconSize		图标的大小，单位px （默认 12 ）
	 * @property {String}			iconPlacement	勾选图标的对齐方式，left-左边，right-右边  （默认 'left' ）
	 * @property {Boolean}			borderBottom	placement为row时，是否显示下边框 （默认 false ）
	 * @event {Function}	change	任一个checkbox状态发生变化时触发，回调为一个对象
	 * @event {Function}	input	修改通过v-model绑定的值时触发，回调为一个对象
	 * @example <up-checkbox-group></up-checkbox-group>
	 */
	defineOptions({
		name: 'up-checkbox-group',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...checkboxGroupProps.props
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
		return bem('checkbox-group', ['placement'])
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

	// 将其他的checkbox设置为未选中的状态
	function unCheckedOther(childInstance) {
		const values = []
		children.value.map(child => {
			// 将被选中的checkbox，放到数组中返回
			if (child.isChecked) {
				values.push(child.name)
			}
		})

		// 修改通过v-model绑定的值
		// #ifdef VUE3
		emit('update:modelValue', values)
		// #endif
		// #ifdef VUE2
		emit('input', values)
		// #endif
		// 放在最后更新，否则change事件传出去的values不会更新
		emit('change', values, {
			isChecked: childInstance.isChecked,
			name: childInstance.name // 当前变动的checkbox的name值
		})
	}

	// 当父组件需要子组件共享的参数发生变化，手动通知子组件
	watch(() => [
		props.value,
		props.modelValue,
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
	}, { deep: true })

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

	.up-checkbox-group {

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
