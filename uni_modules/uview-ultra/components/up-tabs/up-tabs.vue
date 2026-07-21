<template>
	<view class="up-tabs" :class="[customClass]">
		<view class="up-tabs__wrapper">
			<slot name="left" />
			<view class="up-tabs__wrapper__scroll-view-wrapper">
				<scroll-view
					:scroll-x="scrollable"
					:scroll-left="scrollLeft"
					scroll-with-animation
					class="up-tabs__wrapper__scroll-view"
					:show-scrollbar="false"
					ref="scrollViewRef"
				>
					<view
						class="up-tabs__wrapper__nav"
						ref="navRef"
					>
						<view
							class="up-tabs__wrapper__nav__item"
							v-for="(item, index) in list"
							:key="index"
							@tap="clickHandler(item, index)"
							@longpress="longPressHandler(item,index)"
							:ref="(el) => setItemRef(el, index)"
							:style="[addStyle(itemStyle), {flex: scrollable ? '' : 1}]"
							:class="[`up-tabs__wrapper__nav__item-${index}`,
								item.disabled && 'up-tabs__wrapper__nav__item--disabled',
								innerCurrent == index ? 'up-tabs__wrapper__nav__item-active' : '']"
						>
							<slot v-if="$slots.icon" name="icon" :item="item" :keyName="keyName" :index="index" />
							<template v-else>
								<view class="up-tabs__wrapper__nav__item__prefix-icon" v-if="item.icon">
									<up-icon
										:name="item.icon"
										:customStyle="addStyle(iconStyle)"
									></up-icon>
								</view>
							</template>
							<slot v-if="$slots.content" name="content" :item="item" :keyName="keyName" :index="index" />
							<slot v-else-if="!$slots.content && ($slots.default || $slots.$default)"
								:item="item" :keyName="keyName" :index="index" />
							<text v-else
								:class="[item.disabled && 'up-tabs__wrapper__nav__item__text--disabled']"
								class="up-tabs__wrapper__nav__item__text"
								:style="[textStyle(index)]"
							>{{ item[keyName] }}</text>
							<up-badge
								:show="!!(item.badge && (item.badge.show || item.badge.isDot || item.badge.value))"
								:isDot="item.badge && item.badge.isDot || propsBadge.isDot"
								:value="item.badge && item.badge.value || propsBadge.value"
								:max="item.badge && item.badge.max || propsBadge.max"
								:type="item.badge && item.badge.type || propsBadge.type"
								:showZero="item.badge && item.badge.showZero || propsBadge.showZero"
								:bgColor="item.badge && item.badge.bgColor || propsBadge.bgColor"
								:color="item.badge && item.badge.color || propsBadge.color"
								:shape="item.badge && item.badge.shape || propsBadge.shape"
								:numberType="item.badge && item.badge.numberType || propsBadge.numberType"
								:inverted="item.badge && item.badge.inverted || propsBadge.inverted"
								customStyle="margin-left: 4px;"
							></up-badge>
						</view>
						<!-- #ifdef APP-NVUE -->
						<view
							class="up-tabs__wrapper__nav__line"
							ref="navLineRef"
							:style="[{
								width: addUnit(lineWidth),
								height: addUnit(lineHeight),
								background: lineColor,
								backgroundSize: lineBgSize,
							}]"
						>
						</view>
						<!-- #endif -->
						<!-- #ifndef APP-NVUE -->
						<view
							class="up-tabs__wrapper__nav__line"
							ref="navLineRef"
							:style="[{
								width: addUnit(lineWidth),
								transform: `translate(${lineOffsetLeft}px)`,
								transitionDuration: `${firstTime ? 0 : duration}ms`,
								height: addUnit(lineHeight),
								background: lineColor,
								backgroundSize: lineBgSize,
							}]"
						>
						</view>
						<!-- #endif -->
					</view>
				</scroll-view>
			</view>
			<slot name="right" />
		</view>
	</view>
</template>

<script setup>
// #ifdef APP-NVUE
const animation = uni.requireNativePlugin('animation')
const dom = uni.requireNativePlugin('dom')
// #endif
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { props as tabsProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import defProps from '../../libs/config/props.js'
import { addUnit, addStyle, deepMerge, getPx, sleep, getWindowInfo } from '../../libs/function/index'
/**
 * Tabs 标签
 * @description tabs标签组件，在标签多的时候，可以配置为左右滑动，标签少的时候，可以禁止滑动。 该组件的一个特点是配置为滚动模式时，激活的tab会自动移动到组件的中间位置。
 * @tutorial https://uview-plus.jiangruyi.com/components/tabs.html
 * @example <up-tabs :list="list" :is-scroll="false" :current="current" @change="change" @longPress="longPress"></up-tabs>
 */
defineOptions({
	name: 'up-tabs',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...tabsProps.props
})
const emit = defineEmits(['click', 'longPress', 'change', 'update:current'])
const { $uGetRect } = useUltraUI(props)

const firstTime = ref(true)
const scrollLeft = ref(0)
const scrollViewWidth = ref(0)
const lineOffsetLeft = ref(0)
const tabsRect = ref({
	left: 0
})
const innerCurrent = ref(0)
const moving = ref(false)
const scrollViewRef = ref(null)
const navRef = ref(null)
const navLineRef = ref(null)
const itemRefs = ref([])
let windowResizeCallback = null

function setItemRef(el, index) {
	if (el) {
		itemRefs.value[index] = el
	}
}

const textStyle = computed(() => {
	return (index) => {
		const style = {}
		const customeStyle = (index == innerCurrent.value)
			? addStyle(props.activeStyle)
			: addStyle(props.inactiveStyle)
		if (props.list[index] && props.list[index]['disabled']) {
			style.color = '#c8c9cc'
		}
		return deepMerge(customeStyle, style)
	}
})

const propsBadge = computed(() => defProps.badge)

watch(() => props.current, (newValue) => {
	if (newValue !== innerCurrent.value) {
		if (typeof newValue == 'string') {
			innerCurrent.value = parseInt(newValue)
		} else {
			innerCurrent.value = newValue
		}
		nextTick(() => {
			resize()
		})
	}
}, { immediate: true })

watch(() => props.list, () => {
	nextTick(() => {
		resize()
	})
})

onMounted(() => {
	init()
	windowResizeCallback = () => {
		init()
	}
	uni.onWindowResize(windowResizeCallback)
})

onBeforeUnmount(() => {
	if (windowResizeCallback) {
		uni.offWindowResize(windowResizeCallback)
	}
})

function setLineLeft() {
	const tabItem = props.list[innerCurrent.value]
	if (!tabItem) {
		return
	}
	let offset = props.list
		.slice(0, innerCurrent.value)
		.reduce((total, curr) => total + curr.rect.width, 0)
	const lineWidthPx = getPx(props.lineWidth)
	lineOffsetLeft.value = offset + (tabItem.rect.width - lineWidthPx) / 2
	// #ifdef APP-NVUE
	animationLine(lineOffsetLeft.value, firstTime.value ? 0 : parseInt(props.duration))
	// #endif

	if (firstTime.value) {
		setTimeout(() => {
			firstTime.value = false
		}, 10)
	}
}

function animationLine(x, duration = 0) {
	// #ifdef APP-NVUE
	const refNode = navLineRef.value
	animation.transition(refNode, {
		styles: {
			transform: `translateX(${x}px)`
		},
		duration
	})
	// #endif
}

function clickHandler(item, index) {
	emit('click', {
		...item,
		index
	}, index)
	if (item.disabled) return
	if (innerCurrent.value == index) return
	innerCurrent.value = index
	nextTick(() => {
		resize()
	})
	emit('update:current', index)
	emit('change', {
		...item,
		index
	}, index)
}

function longPressHandler(item, index) {
	emit('longPress', {
		...item,
		index
	})
}

function init() {
	sleep().then(() => {
		resize()
	})
}

function setScrollLeft() {
	if (innerCurrent.value < 0) {
		innerCurrent.value = 0
	}
	const tabRect = props.list[innerCurrent.value]
	const offsetLeft = props.list
		.slice(0, innerCurrent.value)
		.reduce((total, curr) => {
			return total + curr.rect.width
		}, 0)
	const windowWidth = getWindowInfo().windowWidth
	let nextScrollLeft = offsetLeft - (tabsRect.value.width - tabRect.rect.width) / 2 - (windowWidth - tabsRect.value
		.right) / 2 + tabsRect.value.left / 2
	nextScrollLeft = Math.min(nextScrollLeft, scrollViewWidth.value - tabsRect.value.width)
	scrollLeft.value = Math.max(0, nextScrollLeft)
}

function resize() {
	if (props.list.length === 0) {
		return
	}
	Promise.all([getTabsRect(), getAllItemRect()]).then(([nextTabsRect, itemRect = []]) => {
		if (nextTabsRect.left > nextTabsRect.width) {
			nextTabsRect.right = nextTabsRect.right - Math.floor(nextTabsRect.left / nextTabsRect.width) * nextTabsRect.width
			nextTabsRect.left = nextTabsRect.left % nextTabsRect.width
		}
		tabsRect.value = nextTabsRect
		scrollViewWidth.value = 0
		itemRect.map((item, index) => {
			scrollViewWidth.value += item.width
			props.list[index].rect = item
		})
		setLineLeft()
		setScrollLeft()
	})
}

function getTabsRect() {
	return new Promise((resolve) => {
		queryRect('up-tabs__wrapper__scroll-view').then((size) => resolve(size))
	})
}

function getAllItemRect() {
	return new Promise((resolve) => {
		const promiseAllArr = props.list.map((item, index) => queryRect(
			`up-tabs__wrapper__nav__item-${index}`, true, index))
		Promise.all(promiseAllArr).then((sizes) => resolve(sizes))
	})
}

function queryRect(el, item = false, index = 0) {
	// #ifndef APP-NVUE
	return new Promise((resolve) => {
		$uGetRect(`.${el}`).then((size) => {
			resolve(size)
		})
	})
	// #endif

	// #ifdef APP-NVUE
	return new Promise((resolve) => {
		const refNode = item ? itemRefs.value[index] : (el === 'up-tabs__wrapper__scroll-view' ? scrollViewRef.value : navRef.value)
		dom.getComponentRect(refNode, (res) => {
			resolve(res.size)
		})
	})
	// #endif
}
</script>


<style lang="scss" scoped>

	.up-tabs {

		&__wrapper {
			@include flex;
			align-items: center;

			&__scroll-view-wrapper {
				flex: 1;
				/* #ifndef APP-NVUE */
				overflow: auto hidden;
				/* #endif */
			}

			&__scroll-view {
				@include flex;
				flex: 1;
			}

			&__nav {
				@include flex;
				position: relative;

				&__item {
					padding: 0 11px;
					@include flex;
					align-items: center;
					justify-content: center;
					/* #ifdef H5 */
					cursor: pointer;
					/* #endif */

					&--disabled {
						/* #ifdef H5 */
						cursor: not-allowed;
						/* #endif */
					}

					&__text {
						font-size: 15px;
						color: $up-content-color;
                        white-space: nowrap !important;

						&--disabled {
							color: $up-disabled-color !important;
						}
					}
				}

				&__line {
					height: 3px;
					background: $up-primary;
					width: 30px;
					position: absolute;
					bottom: 2px;
					border-radius: 100px;
					transition-property: transform;
					transition-duration: 300ms;
				}
			}
		}
	}
</style>
