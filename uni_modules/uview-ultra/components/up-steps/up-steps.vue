<template>
	<view
	    class="up-steps"
	    :class="[`up-steps--${direction}`]"
	>
		<slot></slot>
	</view>
</template>

<script setup>
	import { toRefs, watch } from 'vue'
	import { props as stepsProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	/**
	 * Steps 步骤条
	 * @description 该组件一般用于完成一个任务要分几个步骤，标识目前处于第几步的场景。
	 * @tutorial https://uview-plus.jiangruyi.com/components/steps.html
	 * @property {String}			direction		row-横向，column-竖向 (默认 'row' )
	 * @property {String | Number}	current			设置当前处于第几步 (默认 0 )
	 * @property {String}			activeColor		激活状态颜色 (默认 '#3c9cff' )
	 * @property {String}			inactiveColor	未激活状态颜色 (默认 '#969799' )
	 * @property {String}			activeIcon		激活状态的图标
	 * @property {String}			inactiveIcon	未激活状态图标
	 * @property {Boolean}			dot				是否显示点类型 (默认 false )
	 * @example <up-steps current="0"><up-steps-item title="已出库" desc="10:35" ></up-steps-item></up-steps>
	 */
	defineOptions({
		name: 'up-steps',
		options: {
			virtualHost: false
		}
	})

	const props = defineProps({
		...commonProps,
		...stepsProps.props
	})
	const { children } = useUltraUI(props)
	const {
		direction,
		current,
		activeColor,
		inactiveColor,
		activeIcon,
		inactiveIcon,
		dot
	} = toRefs(props)

	// 更新子组件的数据
	function updateChildData() {
		children.value.map(child => {
			if (typeof child.updateFromParent === 'function') {
				child.updateFromParent()
			}
		})
	}

	// 接受子组件的通知，去修改其他子组件的数据
	function updateFromChild() {
		updateChildData()
	}

	function getProps() {
		return {
			direction: props.direction,
			current: props.current,
			activeColor: props.activeColor,
			inactiveColor: props.inactiveColor,
			activeIcon: props.activeIcon,
			inactiveIcon: props.inactiveIcon,
			dot: props.dot
		}
	}

	// 监听参数的变化，通过watch中，手动去更新子组件的数据，否则子组件不会自动变化
	watch(() => [props.current, props.direction, props.activeColor, props.inactiveColor, props.activeIcon, props.inactiveIcon, props.dot], () => {
		updateChildData()
	})

	defineExpose({
		children,
		direction,
		current,
		activeColor,
		inactiveColor,
		activeIcon,
		inactiveIcon,
		dot,
		updateChildData,
		updateFromChild,
		getProps
	})
</script>

<style lang="scss" scoped>

	.up-steps {
		@include flex;

		&--column {
			flex-direction: column
		}

		&--row {
			flex-direction: row;
			flex: 1;
			/* #ifdef MP */
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
			/* #endif */

            //微信小程序优化的比抖音的好 因此微信小程序使用flex布局
            /* #ifdef MP-WEIXIN */
            display: flex !important;
            /* #endif */
		}
	}
</style>
