<template>
	<!-- #ifndef APP-NVUE -->
	<view
		v-if="parentData.col > 0"
	    class="up-grid-item"
	    hover-class="up-grid-item--hover-class"
	    :hover-stay-time="200"
	    @tap="clickHandler"
	    :class="classes"
	    :style="[itemStyle]"
	>
		<slot />
	</view>
	<!-- #endif -->
	<!-- #ifdef APP-NVUE -->
	<view
	    class="up-grid-item"
	    :hover-stay-time="200"
	    @tap="clickHandler"
	    :class="classes"
	    :style="[itemStyle]"
	>
		<slot />
	</view>
	<!-- #endif -->
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRef } from 'vue'
	import { props as gridItemProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addStyle, deepMerge } from '../../libs/function/index.js'
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * gridItem 提示
	 * @description 宫格组件一般用于同时展示多个同类项目的场景，可以给宫格的项目设置徽标组件(badge)，或者图标等，也可以扩展为左右滑动的轮播形式。搭配up-grid使用
	 * @tutorial https://ijry.github.io/uview-plus/components/grid.html
	 * @property {String | Number}	name		宫格的name ( 默认 null )
	 * @property {String}			bgColor		宫格的背景颜色 （默认 'transparent' ）
	 * @property {Object}			customStyle	自定义样式，对象形式
	 * @event {Function} click 点击宫格触发
	 * @example <up-grid-item></up-grid-item>
	 */
	defineOptions({
		name: 'up-grid-item',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...gridItemProps.props
	})
	const emit = defineEmits(['click'])
	const instance = getCurrentInstance()
	const parentData = reactive({
		col: 0, // 父组件划分的宫格数
		border: true // 是否显示边框，根据父组件决定
	})
	const width = ref(0)
	const classes = ref([]) // 类名集合，用于判断是否显示右边和下边框
	const name = toRef(props, 'name')
	const { parent, getParentData } = useUltraUI(props, parentData)

	let gridItemEventBound = false

	const itemStyle = computed(() => {
		const style = {
			background: props.bgColor
		}
		// #ifdef APP-NVUE
		style.width = width.value
		// #endif
		// #ifndef APP-NVUE
		style.width = '100%'
		// #endif
		return deepMerge(style, addStyle(props.customStyle))
	})

	function handleGridItemEvent() {
		gridItemClasses()
	}

	function init() {
		// 用于在父组件up-grid的children中被添加入子组件时，重新计算item的边框
		if (!gridItemEventBound) {
			uni.$on('$upGridItem', handleGridItemEvent)
			gridItemEventBound = true
		}
		updateParentData()
		// #ifdef APP-NVUE
		// 获取元素该有的长度，nvue下要延时才准确
		nextTick(() => {
			getItemWidth()
		})
		// #endif
		// 发出事件，通知所有的grid-item都重新计算自己的边框
		uni.$emit('$upGridItem')
		gridItemClasses()
	}

	// 获取父组件的参数
	function updateParentData() {
		getParentData('up-grid')
		gridItemClasses()
	}

	function clickHandler() {
		let itemName = props.name
		// 如果没有设置name属性，历遍父组件的children数组，判断当前的元素是否和本实例相等，找出当前组件的索引
		const children = parent.value?.children
		if (children && props.name === null) {
			itemName = children.findIndex(child => child === instance.proxy)
		}
		// 调用父组件方法，发出事件
		parent.value && parent.value.childClick(itemName)
		emit('click', itemName)
	}

	async function getItemWidth() {
		// 如果是nvue，不能使用百分比，只能使用固定宽度
		let itemWidth = 0
		if (parent.value) {
			// 获取父组件宽度后，除以栅格数，得出每个item的宽度
			const parentWidth = await getParentWidth()
			itemWidth = parentWidth / Number(parentData.col) + 'px'
		}
		width.value = itemWidth
	}

	// 获取父元素的尺寸
	function getParentWidth() {
		// #ifdef APP-NVUE
		// 返回一个promise，让调用者可以用await同步获取
		return new Promise(resolve => {
			// 调用父组件的ref
			dom.getComponentRect(parent.value.$refs['up-grid'], res => {
				resolve(res.size.width)
			})
		})
		// #endif
	}

	function gridItemClasses() {
		if (!parent.value || !parentData.border) {
			classes.value = []
			return
		}
		let nextClasses = []
		parent.value.children.map((child, index) => {
			if (instance.proxy === child) {
				const len = parent.value.children.length
				// 贴近右边屏幕边沿的child，并且最后一个（比如只有横向2个的时候），无需右边框
				if ((index + 1) % parentData.col !== 0 && index + 1 !== len) {
					nextClasses.push('up-border-right')
				}
				// 总的宫格数量对列数取余的值
				// 如果取余后，值为0，则意味着要将最后一排的宫格，都不需要下边框
				const lessNum = len % parentData.col === 0 ? parentData.col : len % parentData.col
				// 最下面的一排child，无需下边框
				if (index < len - lessNum) {
					nextClasses.push('up-border-bottom')
				}
			}
		})
		// 支付宝，头条小程序无法动态绑定一个数组类名，否则解析出来的结果会带有","，而导致失效
		// #ifdef MP-ALIPAY || MP-TOUTIAO
		nextClasses = nextClasses.join(' ')
		// #endif
		classes.value = nextClasses
	}

	onMounted(() => {
		init()
	})

	onBeforeUnmount(() => {
		// 移除事件监听，释放性能
		if (gridItemEventBound) {
			uni.$off('$upGridItem', handleGridItemEvent)
			gridItemEventBound = false
		}
	})

	defineExpose({
		name,
		init,
		updateParentData,
		getItemWidth,
		gridItemClasses
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
      $up-grid-item-hover-class-opcatiy:.5 !default;
      $up-grid-item-margin-top:1rpx !default;
      $up-grid-item-border-right-width:0.5px !default;
      $up-grid-item-border-bottom-width:0.5px !default;
      $up-grid-item-border-right-color:$up-border-color !default;
      $up-grid-item-border-bottom-color:$up-border-color !default;
	.up-grid-item {
		align-items: center;
		justify-content: center;
		position: relative;
		flex-direction: column;
		/* #ifndef APP-NVUE */
		box-sizing: border-box;
		display: flex;
		/* #endif */

		/* #ifdef MP */
		position: relative;
		float: left;
		/* #endif */

		/* #ifdef MP-WEIXIN */
		margin-top:$up-grid-item-margin-top;
		/* #endif */

		&--hover-class {
			opacity:$up-grid-item-hover-class-opcatiy;
		}
	}

	/* #ifdef APP-NVUE */
	// 由于nvue不支持组件内引入app.vue中再引入的样式，所以需要写在这里
	.up-border-right {
		border-right-width:$up-grid-item-border-right-width;
		border-color: $up-grid-item-border-right-color;
	}

	.up-border-bottom {
		border-bottom-width:$up-grid-item-border-bottom-width;
		border-color:$up-grid-item-border-bottom-color;
	}

	/* #endif */
</style>
