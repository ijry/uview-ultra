<template>
	<view
		class="up-scroll-list"
		ref="scrollListRef"
	>
		<!-- #ifdef APP-NVUE -->
		<!-- nvue使用bindingX实现，以得到更好的性能 -->
		<scroller
			class="up-scroll-list__scroll-view"
			ref="scrollViewRef"
			scroll-direction="horizontal"
			:show-scrollbar="false"
			:offset-accuracy="1"
			@scroll="nvueScrollHandler"
		>
			<view class="up-scroll-list__scroll-view__content">
				<slot />
			</view>
		</scroller>
		<!-- #endif -->
		<!-- #ifndef APP-NVUE -->
		<!-- #ifdef MP-WEIXIN || APP-VUE || H5 || MP-QQ -->
		<!-- 以上平台，支持wxs -->
		<scroll-view
			class="up-scroll-list__scroll-view scroll-view-native"
			scroll-x
			enable-flex
			@scroll="wxs.scroll"
			@scrolltoupper="wxs.scrolltoupper"
			@scrolltolower="wxs.scrolltolower"
			:data-scrollWidth="scrollWidth"
			:data-barWidth="getPx(indicatorBarWidth)"
			:data-indicatorWidth="getPx(indicatorWidth)"
			:show-scrollbar="false"
			:upper-threshold="0"
			:lower-threshold="0"
		>
			<!-- #endif -->
			<!-- #ifndef APP-NVUE || MP-WEIXIN || H5 || APP-VUE || MP-QQ -->
			<!-- 非以上平台，只能使用普通js实现 -->
			<scroll-view
				class="up-scroll-list__scroll-view scroll-view-js"
				scroll-x
				@scroll="scrollHandler"
				@scrolltoupper="scrolltoupperHandler"
				@scrolltolower="scrolltolowerHandler"
				:show-scrollbar="false"
				:upper-threshold="0"
				:lower-threshold="0"
			>
				<!-- #endif -->
				<view class="up-scroll-list__scroll-view__content">
					<slot />
				</view>
			</scroll-view>
			<!-- #endif -->
			<view
				class="up-scroll-list__indicator"
				v-if="indicator"
				:style="[addStyle(indicatorStyle)]"
			>
				<view
					class="up-scroll-list__indicator__line"
					:style="[lineStyle]"
				>
					<view
						class="up-scroll-list__indicator__line__bar"
						:style="[barStyle]"
						ref="indicatorBarRef"
					></view>
				</view>
			</view>
	</view>
</template>

<script
	src="./scrollWxs.wxs"
	module="wxs"
	lang="wxs"
></script>

<script setup>
/**
 * scrollList 横向滚动列表
 * @description 该组件一般用于同时展示多个商品、分类的场景，也可以完成左右滑动的列表。
 * @tutorial https://uview-plus.jiangruyi.com/components/scrollList.html
 * @property {String | Number}	indicatorWidth			指示器的整体宽度 (默认 50 )
 * @property {String | Number}	indicatorBarWidth		滑块的宽度 (默认 20 )
 * @property {Boolean}			indicator				是否显示面板指示器 (默认 true )
 * @property {String}			indicatorColor			指示器非激活颜色 (默认 '#f2f2f2' )
 * @property {String}			indicatorActiveColor	指示器的激活颜色 (默认 '#3c9cff' )
 * @property {String | Object}	indicatorStyle			指示器样式，可通过bottom，left，right进行定位
 * @event {Function} left	滑动到左边时触发
 * @event {Function} right	滑动到右边时触发
 * @example
 */
// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
const BindingX = uni.requireNativePlugin('bindingx')
import { os } from '../../libs/function/index'
// #endif
import { computed, onMounted, ref } from 'vue'
import { props as scrollListProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { addStyle, addUnit, getPx, sleep } from '../../libs/function/index'

defineOptions({
	name: 'up-scroll-list',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...scrollListProps.props
})
const emit = defineEmits(['left', 'right'])
const { $uGetRect } = useUltraUI(props)

const scrollInfo = ref({
	scrollLeft: 0,
	scrollWidth: 0
})
const scrollWidth = ref(0)
const scrollListRef = ref(null)
const scrollViewRef = ref(null)
const indicatorBarRef = ref(null)

const barStyle = computed(() => {
	const style = {}
	// #ifndef APP-NVUE || MP-WEIXIN || H5 || APP-VUE || MP-QQ
	const scrollLeft = scrollInfo.value.scrollLeft
	const contentWidth = scrollInfo.value.scrollWidth
	const barAllMoveWidth = props.indicatorWidth - props.indicatorBarWidth
	const x = scrollLeft / (contentWidth - scrollWidth.value) * barAllMoveWidth
	style.transform = `translateX(${x}px)`
	// #endif
	style.width = addUnit(props.indicatorBarWidth)
	style.backgroundColor = props.indicatorActiveColor
	return style
})

const lineStyle = computed(() => {
	const style = {}
	style.width = addUnit(props.indicatorWidth)
	style.backgroundColor = props.indicatorColor
	return style
})

onMounted(() => {
	init()
})

function init() {
	getComponentWidth()
}

// #ifndef APP-NVUE || MP-WEIXIN || H5 || APP-VUE || MP-QQ
function scrollHandler(e) {
	scrollInfo.value = e.detail
}
function scrolltoupperHandler() {
	scrollEvent('left')
	scrollInfo.value.scrollLeft = 0
}
function scrolltolowerHandler() {
	scrollEvent('right')
	scrollInfo.value.scrollLeft = getPx(props.indicatorWidth) - getPx(props.indicatorBarWidth)
}
// #endif

function scrollEvent(status) {
	emit(status)
}

async function getComponentWidth() {
	await sleep(30)
	// #ifndef APP-NVUE
	$uGetRect('.up-scroll-list').then((size) => {
		scrollWidth.value = size.width
	})
	// #endif

	// #ifdef APP-NVUE
	const refNode = scrollListRef.value
	refNode && dom.getComponentRect(refNode, (res) => {
		scrollWidth.value = res.size.width
	})
	// #endif
}

// #ifdef APP-NVUE
function nvueScrollHandler(e) {
	const anchor = scrollViewRef.value?.ref
	let element = {}
	if (indicatorBarRef.value) {
		element = indicatorBarRef.value.ref
	}
	const contentSize = e.contentSize.width
	const barAllMoveWidth = props.indicatorWidth - props.indicatorBarWidth
	const actionNum = os() === 'ios' ? 2 : 1
	const expression = `(x / ${actionNum}) / ${contentSize - scrollWidth.value} * ${barAllMoveWidth}`
	BindingX.bind({
		anchor,
		eventType: 'scroll',
		props: [{
			element,
			property: 'transform.translateX',
			expression
		}]
	})
}
// #endif
</script>


<style lang="scss" scoped>
.up-scroll-list {
	padding-bottom: 10px;

	&__scroll-view {
		@include flex;
		// 缺少会在enable-flex模式下高度异常
		align-items: flex-start;

		&__content {
			@include flex;
		}
	}

	&__indicator {
		@include flex;
		justify-content: center;
		margin-top: 15px;

		&__line {
			width: 60px;
			height: 4px;
			border-radius: 100px;
			overflow: hidden;

			&__bar {
				width: 20px;
				height: 4px;
				border-radius: 100px;
			}
		}
	}
}
</style>
