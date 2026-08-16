<template>
	<view class="up-tabs" :class="[customClass, shapeModeClass]" :style="addStyle(customStyle)">
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
							v-for="(item, index) in tabList"
							:key="index"
							@tap="clickHandler(item, index, $event)"
							@longpress="longPressHandler(item,index)"
							:ref="(el) => setItemRef(el, index)"
							:style="[itemComputedStyle, {flex: scrollable ? '' : 1}]"
							:class="[`up-tabs__wrapper__nav__item-${index}`,
								shapeMode && `up-tabs__wrapper__nav__item--${shapeMode}`,
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
							<view
								v-if="shapeMode === 'card' && innerCurrent == index && index < tabList.length - 1"
								class="up-tabs__wrapper__nav__item__card-corner"
							></view>
							<view
								v-if="shapeMode === 'pill-arrow' && innerCurrent == index"
								class="up-tabs__wrapper__nav__item__active-arrow"
							></view>
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
								display: showLine ? 'block' : 'none',
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
								display: showLine ? 'block' : 'none',
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
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { props as tabsProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import defProps from '../../libs/config/props.js'
import { addUnit, addStyle, deepClone, deepMerge, getPx, sleep, getWindowInfo } from '../../libs/function/index'
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
const instance = getCurrentInstance()

const firstTime = ref(true)
	const lineShow = ref(false)
	const tabList = ref([])
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

const shapeModeClass = computed(() => props.shapeMode ? `up-tabs--shape-${props.shapeMode}` : '')
const showLine = computed(() => lineShow.value && !['capsule', 'pill-arrow', 'tag'].includes(props.shapeMode))

function hasExplicitProp(name) {
	const rawProps = instance?.vnode?.props || {}
	return Object.prototype.hasOwnProperty.call(rawProps, name)
		|| Object.prototype.hasOwnProperty.call(rawProps, name.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`))
}

const itemComputedStyle = computed(() => {
	const style = addStyle(props.itemStyle)
	if (!hasExplicitProp('itemStyle')) {
		const defaultModeHeights = {
			capsule: '30px',
			card: '34px',
			'pill-arrow': '32px',
			tag: '28px'
		}
		style.height = defaultModeHeights[props.shapeMode] || '44px'
	}
	return style
})

function setItemRef(el, index) {
	if (el) {
		itemRefs.value[index] = el
	}
}

function syncTabList() {
	const source = Array.isArray(props.list) ? props.list : []
	const cloned = deepClone(source)
	tabList.value = Array.isArray(cloned) ? cloned : []
}

const textStyle = computed(() => {
	return (index) => {
		const style = {}
		const customeStyle = (index == innerCurrent.value)
			? addStyle(props.activeStyle)
			: addStyle(props.inactiveStyle)
		const isActive = index == innerCurrent.value
		const customColor = customeStyle && customeStyle.color
		const hasCustomColor = customColor != null && String(customColor).trim() !== ''
		const defaultColor = isActive ? '#303133' : '#606266'
		const isStyleOverridden = hasCustomColor && (hasExplicitProp(isActive ? 'activeStyle' : 'inactiveStyle')
			|| customColor !== defaultColor)
		if (isActive && ['pill-arrow', 'tag'].includes(props.shapeMode) && !isStyleOverridden) {
			style.color = '#ffffff'
		} else if (!isActive && ['pill-arrow', 'tag'].includes(props.shapeMode) && !isStyleOverridden) {
			style.color = '#606266'
		}
		if (tabList.value[index] && tabList.value[index]['disabled']) {
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
	syncTabList()
	nextTick(() => {
		resize()
	})
}, { immediate: true, deep: true })

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
	const tabItem = tabList.value[innerCurrent.value]
	if (!tabItem) {
		return
	}
	let offset = tabList.value
		.slice(0, innerCurrent.value)
		.reduce((total, curr) => total + curr.rect.width, 0)
	const lineWidthPx = getPx(props.lineWidth)
	lineOffsetLeft.value = offset + (tabItem.rect.width - lineWidthPx) / 2
	lineShow.value = true
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

function clickHandler(item, index, event) {
	emit('click', {
		...item,
		index
	}, index, event)
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
	const tabRect = tabList.value[innerCurrent.value]
	if (!tabRect || !tabRect.rect) {
		return
	}
	const offsetLeft = tabList.value
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
	if (tabList.value.length === 0) {
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
			if (tabList.value[index]) {
				tabList.value[index].rect = item
			}
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
		const promiseAllArr = tabList.value.map((item, index) => queryRect(
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
					position: relative;
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

					&__card-corner {
						position: absolute;
						top: 0;
						right: -10px;
						width: 20px;
						height: 100%;
						background-color: inherit;
						transform: skewX(25deg);
						border-top-right-radius: 10px;
						z-index: 1;
					}

					&__active-arrow {
						position: absolute;
						left: 50%;
						bottom: -6px;
						width: 0;
						height: 0;
						border-left: 6px solid transparent;
						border-right: 6px solid transparent;
						border-top: 6px solid #ff3b30;
						transform: translateX(-50%);
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

		&--shape-capsule {
			.up-tabs__wrapper__scroll-view-wrapper {
				padding: 3px;
				border-radius: 999px;
				background-color: #edf0f5;
			}

			.up-tabs__wrapper__nav__item {
				min-height: 30px;
				padding: 0 14px;
				border-radius: 999px;
				transition: background-color 0.2s;
			}

			.up-tabs__wrapper__nav__item-active {
				background-color: #ffffff;
			}
		}

		&--shape-card {
			.up-tabs__wrapper__scroll-view-wrapper {
				padding: 0;
				border-radius: 10px;
				background-color: #9ccde5;
				box-shadow: inset 0 0 0 1px rgba(96, 98, 102, 0.06);
			}

			.up-tabs__wrapper__nav__item {
				min-height: 34px;
				padding: 0;
				border-radius: 10px 10px 0 0;
				transition: background-color 0.2s;
			}

			.up-tabs__wrapper__nav__item-active {
				background-color: #f6f8fb;
				box-shadow: inset 0 0 0 1px rgba(96, 98, 102, 0.06);
				z-index: 2;
			}
		}

		&--shape-pill-arrow {
			.up-tabs__wrapper__nav {
				padding-bottom: 6px;
			}

			.up-tabs__wrapper__nav__item {
				min-height: 32px;
				padding: 0 12px;
				border-radius: 8px;
				background-color: #e8e8e8;
				margin-right: 8px;
			}

			.up-tabs__wrapper__nav__item-active {
				background: linear-gradient(90deg, #ff6c57 0%, #ff3b30 100%);
			}
		}

		&--shape-tag {
			.up-tabs__wrapper__nav {
				padding: 2px 0;
			}

			.up-tabs__wrapper__nav__item {
				min-height: 28px;
				padding: 0 14px;
				border-radius: 999px;
				background-color: #f3f4f6;
				margin-right: 8px;
			}

			.up-tabs__wrapper__nav__item-active {
				background-color: #2a6bf6;
			}
		}
	}
</style>
