<template>
	<view class="up-tabbar">
		<view
		    class="up-tabbar__content"
		    ref="up-tabbar__content"
		    @touchmove.stop.prevent="noop"
		    :class="[border && 'up-border-top', fixed && 'up-tabbar--fixed']"
		    :style="[tabbarStyle]"
		>
			<view class="up-tabbar__content__item-wrapper">
				<slot />
			</view>
			<up-safe-bottom v-if="safeAreaInsetBottom"></up-safe-bottom>
		</view>
		<view
		    class="up-tabbar__placeholder"
			v-if="placeholder"
		    :style="{
				height: placeholderHeight + 'px',
			}"
		></view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, onMounted, ref, toRefs, watch } from 'vue'
	import { props as tabbarProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addStyle, deepMerge, sleep } from '../../libs/function/index'
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * Tabbar 底部导航栏
	 * @description 此组件提供了自定义tabbar的能力。
	 * @tutorial https://uview-plus.jiangruyi.com/components/tabbar.html
	 * @property {String | Number}	value				当前匹配项的name
	 * @property {Boolean}			safeAreaInsetBottom	是否为iPhoneX留出底部安全距离（默认 true ）
	 * @property {Boolean}			border				是否显示上方边框（默认 true ）
	 * @property {String | Number}	zIndex				元素层级z-index（默认 1 ）
	 * @property {String}			activeColor			选中标签的颜色（默认 '#1989fa' ）
	 * @property {String}			inactiveColor		未选中标签的颜色（默认 '#7d7e80' ）
	 * @property {Boolean}			fixed				是否固定在底部（默认 true ）
	 * @property {Boolean}			placeholder			fixed定位固定在底部时，是否生成一个等高元素防止塌陷（默认 true ）
	 * @property {String}			backgroundColor		背景色（默认 '#ffffff' ）
	 * @property {Object}			customStyle			定义需要用到的外部样式
	 * 
	 * @example <up-tabbar :value="value2" :placeholder="false" @change="name => value2 = name" :fixed="false" :safeAreaInsetBottom="false"><up-tabbar-item text="首页" icon="home" dot ></up-tabbar-item></up-tabbar>
	 */
	defineOptions({
		name: 'up-tabbar',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...tabbarProps.props
	})
	const emit = defineEmits(['change'])
	const instance = getCurrentInstance()
	const { children, noop, $uGetRect } = useUltraUI(props)
	const {
		value,
		safeAreaInsetBottom,
		border,
		activeColor,
		inactiveColor,
		borderColor,
		fixed,
		placeholder
	} = toRefs(props)
	const placeholderHeight = ref(0)

	const tabbarStyle = computed(() => {
		const style = {
			zIndex: props.zIndex
		}
		if (props.borderColor) {
			style.borderColor = props.borderColor + ' !important'
		}
		if (props.backgroundColor) {
			style.backgroundColor = props.backgroundColor
		}
		// 合并来自父组件的customStyle样式
		return deepMerge(style, addStyle(props.customStyle))
	})

	function updateChildren() {
		// 如果存在子元素，则执行子元素的updateFromParent进行更新数据
		children.value.length && children.value.map(child => child.updateFromParent())
	}

	// 设置用于防止塌陷元素的高度
	async function setPlaceholderHeight() {
		if (!props.fixed || !props.placeholder) return
		// 延时一定时间
		await sleep(20)
		// #ifndef APP-NVUE
		$uGetRect('.up-tabbar__content').then(({ height = 50 }) => {
			// 修复IOS safearea bottom 未填充高度
			placeholderHeight.value = height
		})
		// #endif

		// #ifdef APP-NVUE
		dom.getComponentRect(instance.proxy.$refs['up-tabbar__content'], (res) => {
			const {
				size
			} = res
			placeholderHeight.value = size.height
		})
		// #endif
	}

	function emitChange(name) {
		emit('change', name)
	}

	function getProps() {
		return {
			value: props.value,
			activeColor: props.activeColor,
			inactiveColor: props.inactiveColor,
			borderColor: props.borderColor
		}
	}

	watch(() => [props.value, props.activeColor, props.inactiveColor, props.borderColor], () => {
		// 如果updateChildren中的元素发生了变化，则执行子元素初始化操作
		updateChildren()
	})

	watch(() => [props.fixed, props.placeholder], () => {
		// 如果fixed，placeholder等参数发生变化，重新计算占位元素的高度
		setPlaceholderHeight()
	})

	onMounted(() => {
		setPlaceholderHeight()
	})

	defineExpose({
		children,
		value,
		activeColor,
		inactiveColor,
		borderColor,
		placeholderHeight,
		updateChildren,
		setPlaceholderHeight,
		emitChange,
		getProps
	})
</script>

<style lang="scss" scoped>

	.up-tabbar {
		@include flex(column);
		flex: 1;
		justify-content: center;
		
		&__content {
			@include flex(column);
			background-color: #fff;
			
			&__item-wrapper {
				height: 50px;
				@include flex(row);
				justify-content: space-around;
			}
		}

		&--fixed {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
		}
	}
</style>
