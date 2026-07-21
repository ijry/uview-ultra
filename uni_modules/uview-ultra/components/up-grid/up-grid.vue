<template>
	<view
	    class="up-grid"
		ref='up-grid'
	    :style="[gridStyle]"
	>
		<slot />
	</view>
</template>

<script setup>
	import { computed, toRefs, watch } from 'vue'
	import { propsGrid } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addStyle, deepMerge } from '../../libs/function/index.js'
	/**
	 * grid 宫格布局
	 * @description 宫格组件一般用于同时展示多个同类项目的场景，可以给宫格的项目设置徽标组件(badge)，或者图标等，也可以扩展为左右滑动的轮播形式。
	 * @tutorial https://ijry.github.io/uview-plus/components/grid.html
	 * @property {String | Number}	col			宫格的列数（默认 3 ）
	 * @property {Boolean}			border		是否显示宫格的边框（默认 false ）
	 * @property {String}			align		宫格对齐方式，表现为数量少的时候，靠左，居中，还是靠右 （默认 'left' ）
	 * @property {Object}			customStyle	定义需要用到的外部样式
	 * @event {Function} click 点击宫格触发
	 * @example <up-grid :col="3" @click="click"></up-grid>
	 */
	defineOptions({
		name: 'up-grid'
	})

	const props = defineProps({
		...commonProps,
		...propsGrid.props
	})
	const emit = defineEmits(['click'])
	const { children } = useUltraUI(props)
	const { col, border, align, gap } = toRefs(props)

	// 宫格对齐方式
	const gridStyle = computed(() => {
		let style = {}
		switch (props.align) {
			case 'left':
				style.justifyContent = 'flex-start'
				break
			case 'center':
				style.justifyContent = 'center'
				break
			case 'right':
				style.justifyContent = 'flex-end'
				break
			default:
				style.justifyContent = 'flex-start'
		}
		return deepMerge(style, addStyle(props.customStyle))
	})

	function updateChildData() {
		children.value.map(child => {
			// 判断子组件如果有updateParentData方法的话，就执行(执行的结果是子组件重新从父组件拉取了最新的值)
			typeof child.updateParentData === 'function' && child.updateParentData()
		})
	}

	function getProps() {
		return {
			col: props.col,
			border: props.border,
			align: props.align,
			gap: props.gap
		}
	}

	// 此方法由up-grid-item触发，用于在up-grid发出事件
	function childClick(name) {
		emit('click', name)
	}

	// 当父组件需要子组件共享的参数发生变化，手动通知子组件
	watch(() => [props.col, props.border], () => {
		updateChildData()
	})

	defineExpose({
		children,
		col,
		border,
		align,
		gap,
		childClick,
		getProps,
		updateChildData
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
    $up-grid-width:100% !default;
	.up-grid {
		/* #ifdef APP-NVUE */
		width: $up-grid-width;
		position: relative;
		box-sizing: border-box;
		overflow: hidden;
		display: block;
		/* #endif */
		justify-content: center;
		@include flex;
		flex-wrap: wrap;
		align-items: center;
		// 在uni-app中应尽量避免使用flex布局以外的方式,因为nvue/uvue等方案都支持flex布局
		// 这里使用grid布局使用为目前20240409uni-app在抖音小程序开启virtualHost时有bug，存在事件失效问题。
		/* #ifndef APP-NVUE */
		display: grid;
		grid-gap: v-bind(gap);
		grid-template-columns: repeat(v-bind(col), 1fr);
		/* #endif */
	}
</style>
