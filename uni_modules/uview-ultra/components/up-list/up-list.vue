<template>
	<!-- #ifdef APP-NVUE -->
	<list
		class="up-list"
		:enableBackToTop="enableBackToTop"
		:loadmoreoffset="lowerThreshold"
		:showScrollbar="showScrollbar"
		:style="[listStyle]"
		:offset-accuracy="Number(offsetAccuracy)"
		@scroll="onScroll"
		@loadmore="scrolltolower"
	>
		<slot />
	</list>
	<!-- #endif -->
	<!-- #ifndef APP-NVUE -->
	<scroll-view
		class="up-list"
		:scroll-into-view="scrollIntoView"
		:style="[listStyle]"
		:scroll-y="scrollable"
		:scroll-top="Number(scrollTop)"
		:lower-threshold="Number(lowerThreshold)"
		:upper-threshold="Number(upperThreshold)"
		:show-scrollbar="showScrollbar"
		:enable-back-to-top="enableBackToTop"
		:scroll-with-animation="scrollWithAnimation"
		@scroll="onScroll"
		@scrolltolower="scrolltolower"
		@scrolltoupper="scrolltoupper"
		:refresher-enabled="refresherEnabled"
		:refresher-threshold="refresherThreshold"
		:refresher-default-style="refresherDefaultStyle"
		:refresher-background="refresherBackground"
		:refresher-triggered="refresherTriggered"
		@refresherpulling="refresherpulling"
		@refresherrefresh="refresherrefresh"
		@refresherrestore="refresherrestore"
		@refresherabort="refresherabort"
		:scroll-anchoring="true"
	>
		<view>
			<slot />
		</view>
	</scroll-view>
	<!-- #endif -->
</template>

<script setup>
	import { computed, provide, ref, toRefs, watch } from 'vue'
	import { props as listProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, deepMerge, sleep, getWindowInfo } from '../../libs/function/index'
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * List 列表
	 * @description 该组件为高性能列表组件
	 * @tutorial https://uview-plus.jiangruyi.com/components/list.html
	 * @property {Boolean}			showScrollbar		控制是否出现滚动条，仅nvue有效 （默认 false ）
	 * @property {String ｜ Number}	lowerThreshold		距底部多少时触发scrolltolower事件 （默认 50 ）
	 * @property {String ｜ Number}	upperThreshold		距顶部多少时触发scrolltoupper事件，非nvue有效 （默认 0 ）
	 * @property {String ｜ Number}	scrollTop			设置竖向滚动条位置（默认 0 ）
	 * @property {String ｜ Number}	offsetAccuracy		控制 onscroll 事件触发的频率，仅nvue有效（默认 10 ）
	 * @property {Boolean}			enableFlex			启用 flexbox 布局。开启后，当前节点声明了display: flex就会成为flex container，并作用于其孩子节点，仅微信小程序有效（默认 false ）
	 * @property {Boolean}			pagingEnabled		是否按分页模式显示List，（默认 false ）
	 * @property {Boolean}			scrollable			是否允许List滚动（默认 true ）
	 * @property {String}			scrollIntoView		值应为某子元素id（id不能以数字开头）
	 * @property {Boolean}			scrollWithAnimation	在设置滚动条位置时使用动画过渡 （默认 false ）
	 * @property {Boolean}			enableBackToTop		iOS点击顶部状态栏、安卓双击标题栏时，滚动条返回顶部，只对微信小程序有效 （默认 false ）
	 * @property {String ｜ Number}	height				列表的高度 （默认 0 ）
	 * @property {String ｜ Number}	width				列表宽度 （默认 0 ）
	 * @property {String ｜ Number}	preLoadScreen		列表前后预渲染的屏数，1代表一个屏幕的高度，1.5代表1个半屏幕高度  （默认 1 ）
	 * @property {Object}			customStyle			定义需要用到的外部样式
	 *
	 * @example <up-list @scrolltolower="scrolltolower"></up-list>
	 */
	defineOptions({
		name: 'up-list',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...listProps.props
	})
	const emit = defineEmits(['scroll', 'scrolltolower', 'scroll-to-lower', 'scrolltoupper', 'scroll-to-upper',
		'refresherpulling', 'refresherrefresh', 'refresherrestore', 'refresherabort'])
	const { children } = useUltraUI(props)
	const {
		showScrollbar,
		lowerThreshold,
		upperThreshold,
		scrollTop,
		offsetAccuracy,
		scrollable,
		scrollIntoView,
		scrollWithAnimation,
		enableBackToTop,
		refresherEnabled,
		refresherThreshold,
		refresherDefaultStyle,
		refresherBackground,
		refresherTriggered,
		preLoadScreen
	} = toRefs(props)
	const refs = ref([])
	const anchors = ref([])
	// 记录内部滚动的距离
	const innerScrollTop = ref(0)
	// vue下，scroll-view在上拉加载时的偏移值
	const offset = ref(0)
	const sys = getWindowInfo()

	const listStyle = computed(() => {
		const style = {}
		if (props.width != 0) style.width = addUnit(props.width)
		if (props.height != 0) style.height = addUnit(props.height)
		// 如果没有定义列表高度，则默认使用屏幕高度
		if (!style.height) style.height = addUnit(sys.windowHeight, 'px')
		return deepMerge(style, addStyle(props.customStyle))
	})

	function updateOffsetFromChild(top) {
		offset.value = top
	}

	function onScroll(e) {
		let currentScrollTop = 0
		// #ifdef APP-NVUE
		currentScrollTop = e.contentOffset.y
		// #endif
		// #ifndef APP-NVUE
		currentScrollTop = e.detail.scrollTop
		// #endif
		innerScrollTop.value = currentScrollTop
		emit('scroll', currentScrollTop)
	}

	function scrollIntoViewById(id) {
		// #ifdef APP-NVUE
		// 根据id参数，找到所有up-list-item中匹配的节点，再通过dom模块滚动到对应的位置
		const item = refs.value.find(item => item.$refs[id] ? true : false)
		dom.scrollToElement(item.$refs[id], {
			// 是否需要滚动动画
			animated: props.scrollWithAnimation
		})
		// #endif
	}

	// 滚动到底部触发事件
	function scrolltolower(e) {
		sleep(30).then(() => {
			emit('scrolltolower')
			// 支付宝小程序奇怪无法触发scrolltolowerhttps://github.com/ijry/uview-plus/issues/422
			emit('scroll-to-lower')
		})
	}

	// #ifndef APP-NVUE
	// 滚动到底部时触发，非nvue有效
	function scrolltoupper(e) {
		sleep(30).then(() => {
			emit('scrolltoupper')
			emit('scroll-to-upper')
			// 这一句很重要，能绝对保证在性功能障碍的webview，滚动条到顶时，取消偏移值，让页面置顶
			offset.value = 0
		})
	}

	function refresherpulling(e) {
		emit('refresherpulling', e)
	}

	function refresherrefresh(e) {
		emit('refresherrefresh', e)
	}

	function refresherrestore(e) {
		emit('refresherrestore', e)
	}

	function refresherabort(e) {
		emit('refresherabort', e)
	}
	// #endif

	function getProps() {
		return {
			preLoadScreen: props.preLoadScreen,
			scrollWithAnimation: props.scrollWithAnimation
		}
	}

	provide('uList', {
		innerScrollTop,
		preLoadScreen,
		updateOffsetFromChild
	})

	watch(() => props.scrollIntoView, (n) => {
		scrollIntoViewById(n)
	})

	defineExpose({
		children,
		refs,
		anchors,
		innerScrollTop,
		offset,
		preLoadScreen,
		scrollWithAnimation,
		updateOffsetFromChild,
		scrollIntoViewById,
		getProps
	})
</script>

<style lang="scss" scoped>

	.up-list {
		@include flex(column);

	}
</style>
