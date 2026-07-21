<template>
	<!-- #ifdef MP-ALIPAY -->
	<!-- <import-sjs from="./alipay.sjs" name="mysjs" /> -->
	<!-- #endif -->
	<view class="u-swipe-action-item" ref="swipeItemRef">
		<view class="u-swipe-action-item__right">
			<slot name="button">
				<view v-for="(item,index) in options" :key="index" class="u-swipe-action-item__right__button"
					:ref="(el) => setButtonRef(el, index)" :style="[{
						alignItems: item.style && item.style.borderRadius ? 'center' : 'stretch'
					}]" @tap="buttonClickHandler(item, index)">
					<view class="u-swipe-action-item__right__button__wrapper" :style="[{
							backgroundColor: item.style && item.style.backgroundColor ? item.style.backgroundColor : '#C7C6CD',
							borderRadius: item.style && item.style.borderRadius ? item.style.borderRadius : '0',
							padding: item.style && item.style.borderRadius ? '0' : '0 15px',
						}, item.style]">
						<up-icon v-if="item.icon" :name="item.icon"
							:color="item.style && item.style.color ? item.style.color : '#ffffff'"
							:size="item.iconSize ? addUnit(item.iconSize) : item.style && item.style.fontSize ? getPx(item.style.fontSize) * 1.2 : 17"
							:customStyle="{
								marginRight: item.text ? '2px' : 0
							}"></up-icon>
						<text v-if="item.text" class="u-swipe-action-item__right__button__wrapper__text u-line-1"
							:style="[{
								color: item.style && item.style.color ? item.style.color : '#ffffff',
								fontSize: item.style && item.style.fontSize ? item.style.fontSize : '16px',
								lineHeight: item.style && item.style.fontSize ? item.style.fontSize : '16px',
							}]">{{ item.text }}</text>
					</view>
				</view>
			</slot>
		</view>
		<!-- #ifdef APP-VUE || MP-WEIXIN || MP-QQ || H5  -->
		<view class="u-swipe-action-item__content" @touchstart="wxs.touchstart" @touchmove="wxs.touchmove"
			@touchend="wxs.touchend" :status="status" :change:status="wxs.statusChange" :size="size"
			:change:size="wxs.sizeChange">
			<slot></slot>
		</view>
		<!-- #endif -->
		<!-- #ifdef MP-ALIPAY || MP-BAIDU || MP-TOUTIAO-->
		<view class="u-swipe-action-item__content" @click="clickHandler" @touchstart="touchstart" @touchmove="touchmove"
			@touchend="touchend" :style="sliderStyle">
			<slot></slot>
		</view>
		<!-- <view class="u-swipe-action-item__content" @touchstart="mysjs.touchstart" @touchmove="mysjs.touchmove"
			@touchend="mysjs.touchend">
			<slot></slot>
		</view> -->
		<!-- #endif -->
		<!-- #ifdef APP-NVUE -->
		<view class="u-swipe-action-item__content" ref="contentRef" @panstart="onTouchstart"
			@tap="clickHandler">
			<slot></slot>
		</view>
		<!-- #endif -->
	</view>
</template>
<!-- #ifdef APP-VUE || MP-WEIXIN || MP-QQ || H5 -->
<script src="./index.wxs" module="wxs" lang="wxs"></script>
<!-- #endif -->
<script setup>
/**
 * SwipeActionItem 滑动单元格子组件
 * @description 该组件一般用于左滑唤出操作菜单的场景，用的最多的是左滑删除操作
 * @tutorial https://uview-plus.jiangruyi.com/components/swipeAction.html
 * @example	<u-swipe-action><u-swipe-action-item :options="options1" ></u-swipe-action-item></u-swipe-action>
 */
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { props as swipeActionItemProps } from './props.js'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { addUnit, getPx, sleep, getDuration } from '../../libs/function/index'

// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
const bindingX = uni.requireNativePlugin('bindingx')
const animation = uni.requireNativePlugin('animation')
// #endif

defineOptions({
	name: 'u-swipe-action-item',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...swipeActionItemProps.props
})
const emit = defineEmits(['click', 'update:show'])

const parentData = reactive({
	autoClose: true
})
const { parent, $uGetRect, getParentData } = useUltraUI(props, parentData)
const instance = getCurrentInstance()
const proxy = instance?.proxy || null

// 按钮的尺寸信息
const size = ref({})
// 当前状态，open-打开，close-关闭
const status = ref('')
const sliderStyle = ref({})

// #ifdef APP-NVUE
// 所有按钮的总宽度
const buttonsWidth = ref(0)
// 是否正在移动中
const moving = ref(false)
const buttons = ref([])
let panEvent = null
// #endif

// #ifdef MP-ALIPAY || MP-BAIDU || MP-TOUTIAO
const state = reactive({
	moving: false,
	startX: 0,
	startY: 0,
	buttonsWidth: 0
})
// #endif

// #ifndef APP-NVUE
// touchMixin state for non-nvue if needed
const direction = ref('')
const deltaX = ref(0)
const deltaY = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const startX = ref(0)
const startY = ref(0)
// #endif

const swipeItemRef = ref(null)
const contentRef = ref(null)
const buttonRefs = {}

function setButtonRef(el, index) {
	if (el) {
		buttonRefs[index] = el
	} else {
		delete buttonRefs[index]
	}
}

// 由于wxs无法直接读取外部的值，需要在外部值变化时，重新执行赋值逻辑
// #ifndef APP-NVUE
const wxsInit = computed(() => {
	return [props.disabled, props.autoClose, props.threshold, props.options, props.duration]
})

watch(wxsInit, () => {
	queryRect()
})
// #endif

watch(status, (newValue) => {
	if (newValue === 'open') {
		emit('update:show', true)
		parent.value && parent.value.setOpendItem(proxy)
	} else {
		emit('update:show', false)
	}
})

watch(() => props.show, (newValue) => {
	if (newValue) {
		status.value = 'open'
	} else {
		status.value = 'close'
	}
})

// #ifdef APP-NVUE
const getDuratin = computed(() => {
	let duration = String(props.duration)
	// 如果ms为单位，返回ms的数值部分
	if (duration.indexOf('ms') >= 0) return parseInt(duration)
	// 如果s为单位，为了得到ms的数值，需要乘以1000
	if (duration.indexOf('s') >= 0) return parseInt(duration) * 1000
	// 如果值传了数值，且小于30，认为是s单位
	duration = Number(duration)
	return duration < 30 ? duration * 1000 : duration
})

watch(() => props.show, (n) => {
	if (n) {
		moveCellByAnimation('open')
	} else {
		moveCellByAnimation('close')
	}
})
// #endif

// #ifdef MP-ALIPAY || MP-BAIDU || MP-TOUTIAO
watch(status, (newValue) => {
	if (props.disabled) return
	// 打开或关闭单元格
		// keep open/close animation based on transitions from external setStatus
})

watch(() => props.options, () => {
	getBtnWidth()
})
// #endif

onMounted(() => {
	init()
	// #ifdef APP-NVUE
	initialize()
	// #endif
	// #ifdef MP-ALIPAY || MP-BAIDU || MP-TOUTIAO
	getBtnWidth()
	// #endif
})

onBeforeUnmount(() => {
	closeHandler()
	// #ifdef APP-NVUE
	unbindBindingX()
	// #endif
})

function init() {
	// 初始化父组件数据
	updateParentData()
	// #ifndef APP-NVUE
	sleep().then(() => {
		queryRect()
	})
	// #endif
}

function updateParentData() {
	getParentData('u-swipe-action')
}

// #ifndef APP-NVUE
// 查询节点
function queryRect() {
	$uGetRect('.u-swipe-action-item__right__button', true).then(buttons => {
		size.value = {
			buttons,
			show: props.show,
			disabled: props.disabled,
			threshold: props.threshold,
			duration: props.duration
		}
	})
}
// #endif

// 按钮被点击
function buttonClickHandler(item, index) {
	emit('click', {
		index,
		name: props.name
	}, () => {
	})
	if (props.closeOnClick) {
		closeHandler()
	}
}

// ---------- touchMixin (non-nvue) ----------
// #ifndef APP-NVUE
const MIN_DISTANCE = 10

function getDirection(x, y) {
	if (x > y && x > MIN_DISTANCE) {
		return 'horizontal'
	}
	if (y > x && y > MIN_DISTANCE) {
		return 'vertical'
	}
	return ''
}

function getTouchPoint(e) {
	if (!e) {
		return {
			x: 0,
			y: 0
		}
	} if (e.touches && e.touches[0]) {
		return {
			x: e.touches[0].pageX,
			y: e.touches[0].pageY
		}
	} if (e.changedTouches && e.changedTouches[0]) {
		return {
			x: e.changedTouches[0].pageX,
			y: e.changedTouches[0].pageY
		}
	}
	return {
		x: e.clientX || 0,
		y: e.clientY || 0
	}
}

function resetTouchStatus() {
	direction.value = ''
	deltaX.value = 0
	deltaY.value = 0
	offsetX.value = 0
	offsetY.value = 0
}

function touchStart(event) {
	resetTouchStatus()
	const touch = getTouchPoint(event)
	startX.value = touch.x
	startY.value = touch.y
}

function touchMove(event) {
	const touch = getTouchPoint(event)
	deltaX.value = touch.x - startX.value
	deltaY.value = touch.y - startY.value
	offsetX.value = Math.abs(deltaX.value)
	offsetY.value = Math.abs(deltaY.value)
	direction.value = direction.value || getDirection(offsetX.value, offsetY.value)
}
// #endif

// shared helpers used by wxs / parent
function setState(nextStatus) {
	status.value = nextStatus
}

function setStatus(nextStatus) {
	status.value = nextStatus
}

function closeOther() {
	// 尝试关闭其他打开的单元格
	parent.value && parent.value.closeOther(proxy)
}

// ---------- wxs platform methods ----------
// #ifdef APP-VUE || MP-WEIXIN || MP-QQ || H5
// 关闭时执行
function closeHandler() {
	status.value = 'close'
}
// #endif

// ---------- other platforms (alipay/baidu/toutiao) ----------
// #ifdef MP-ALIPAY || MP-BAIDU || MP-TOUTIAO
function clickHandler() {
}

function closeHandler() {
	closeSwipeAction()
}

function getBtnWidth() {
	let view = uni.createSelectorQuery().in(proxy).select(".up-swipe-action-item__right")
	// original used .up-swipe-action-item__right but template class is u-swipe-action-item__right
	view = uni.createSelectorQuery().in(proxy).select(".u-swipe-action-item__right")
	view.fields({
		size: true,
		scrollOffset: true
	}, data => {
		if (data) {
			state.buttonsWidth = data.width
		}
	}).exec()
}

// 开始触摸
function touchstart(event) {
	// 标识当前为滑动中状态
	state.moving = true
	// 记录触摸开始点的坐标值
	var touches = event.touches
	state.startX = touches[0].pageX
	state.startY = touches[0].pageY

	// 关闭其它
	parent.value && parent.value.closeOther(proxy)
}

function touchmove(event) {
	if (props.disabled || !state.moving) return
	var touches = event.touches
	var pageX = touches[0].pageX
	var pageY = touches[0].pageY
	var moveX = pageX - state.startX
	var moveY = pageY - state.startY

	// 移动的X轴距离大于Y轴距离，也即终点与起点位置连线，与X轴夹角小于45度时，禁止页面滚动
	if (Math.abs(moveX) > Math.abs(moveY) || Math.abs(moveX) > props.threshold) {
		event.preventDefault && event.preventDefault()
		event.stopPropagation && event.stopPropagation()
	}
	// 如果移动的X轴距离小于Y轴距离，也即终点位置与起点位置连线，与Y轴夹角小于45度时，认为是页面上下滑动，而不是左右滑动单元格
	if (Math.abs(moveX) < Math.abs(moveY)) return

	// 限制右滑的距离，不允许内容部分往右偏移
	if (status.value === 'open') {
		// 在开启状态下，向左滑动，需忽略
		if (moveX < 0) moveX = 0
		// 想要收起菜单，最大能移动的距离为按钮的总宽度
		if (moveX > state.buttonsWidth) moveX = state.buttonsWidth
		// 如果是已经打开了的状态，向左滑动时，移动收起菜单
		moveSwipeAction(-state.buttonsWidth + moveX)
	} else {
		// 关闭状态下，右滑动需忽略
		if (moveX > 0) moveX = 0
		// 滑动的距离不允许超过所有按钮的总宽度，此时只能是左滑，最终设置按钮的总宽度，同时为负数
		if (Math.abs(moveX) > state.buttonsWidth) moveX = -state.buttonsWidth
		// 只要是在滑过程中，就不断移动单元格内容部分，从而使隐藏的菜单显示出来
		moveSwipeAction(moveX)
	}
}

function touchend(event) {
	if (!state.moving || props.disabled) return
	state.moving = false
	var touches = event.changedTouches ? event.changedTouches[0] : {}
	var pageX = touches.pageX
	var pageY = touches.pageY
	var moveX = pageX - state.startX
	if (status.value === 'open') {
		// 在展开的状态下，继续左滑，无需操作
		if (moveX < 0) return
		// 在开启状态下，点击一下内容区域，moveX为0，也即没有进行移动，这时执行收起菜单逻辑
		if (moveX === 0) {
			return closeSwipeAction()
		}
		// 在开启状态下，滑动距离小于阈值，则默认为不关闭，同时恢复原来的打开状态
		if (Math.abs(moveX) < props.threshold) {
			openSwipeAction()
		} else {
			// 如果滑动距离大于阈值，则执行收起逻辑
			closeSwipeAction()
		}
	} else {
		// 在关闭的状态下，右滑，无需操作
		if (moveX > 0) return
		// 理由同上
		if (Math.abs(moveX) < props.threshold) {
			closeSwipeAction()
		} else {
			openSwipeAction()
		}
	}
}

// 一次性展开滑动菜单
function openSwipeAction() {
	// 处理duration单位问题
	var duration = getDurationOther(props.duration)
	// 展开过程中，是向左移动，所以X的偏移应该为负值
	var width = -state.buttonsWidth
	sliderStyle.value = {
		'transition': 'transform ' + duration,
		'transform': 'translateX(' + width + 'px)',
		'-webkit-transform': 'translateX(' + width + 'px)',
	}
	setStatus('open')
}

// 一次性收起滑动菜单
function closeSwipeAction() {
	// 处理duration单位问题
	var duration = getDurationOther(props.duration)
	sliderStyle.value = {
		'transition': 'transform ' + duration,
		'transform': 'translateX(0px)',
		'-webkit-transform': 'translateX(0px)'
	}
	setStatus('close')
}

// 移动滑动选择器内容区域，同时显示出其隐藏的菜单
function moveSwipeAction(moveX) {
	// 设置菜单内容部分的偏移
	sliderStyle.value = {
		'transition': 'none',
		transform: 'translateX(' + moveX + 'px)',
		'-webkit-transform': 'translateX(' + moveX + 'px)'
	}
}

// 获取过渡时间
function getDurationOther(value) {
	if (value.toString().indexOf('s') >= 0) return value
	return value > 30 ? value + 'ms' : value + 's'
}
// #endif

// ---------- nvue platform ----------
// #ifdef APP-NVUE
function initialize() {
	queryRectNvue()
}

// 关闭单元格，用于打开一个，自动关闭其他单元格的场景
function closeHandler() {
	if (status.value === 'open') {
		// 如果在打开状态下，进行点击的话，直接关闭单元格
		return moveCellByAnimation('close') && unbindBindingX()
	}
}

// 点击单元格
function clickHandler() {
	// 如果在移动中被点击，进行忽略
	if (moving.value) return
	// 尝试关闭其他打开的单元格
	parent.value && parent.value.closeOther(proxy)
	if (status.value === 'open') {
		// 如果在打开状态下，进行点击的话，直接关闭单元格
		return moveCellByAnimation('close') && unbindBindingX()
	}
}

// 滑动单元格
function onTouchstart(e) {
	// 如果当前正在移动中，或者disabled状态，则返回
	if (moving.value || props.disabled) {
		return unbindBindingX()
	}
	if (status.value === 'open') {
		// 如果在打开状态下，进行点击的话，直接关闭单元格
		return moveCellByAnimation('close') && unbindBindingX()
	}
	// 特殊情况下，e可能不为一个对象
	e?.stopPropagation && e.stopPropagation()
	e?.preventDefault && e.preventDefault()
	moving.value = true
	// 获取元素ref
	const content = getContentRef()
	let expression = `min(max(${-buttonsWidth.value}, x), 0)`
	// 尝试关闭其他打开的单元格
	parent.value && parent.value.closeOther(proxy)

	// 阿里为了KPI而开源的BindingX
	panEvent = bindingX.bind({
		anchor: content,
		eventType: 'pan',
		props: [{
			element: content,
			// 绑定width属性，设置其宽度值
			property: 'transform.translateX',
			expression
		}]
	}, (res) => {
		moving.value = false
		if (res.state === 'end' || res.state === 'exit') {
			const delta = res.deltaX
			if (delta <= -buttonsWidth.value || delta >= 0) {
				// 如果触摸滑动的过程中，大于单元格的总宽度，或者大于0，意味着已经动过滑动达到了打开或者关闭的状态
				// 这里直接进行状态的标记
				nextTick(() => {
					status.value = delta <= -buttonsWidth.value ? 'open' : 'close'
				})
			} else if (Math.abs(delta) > getPx(props.threshold)) {
				// 在移动大于阈值、并且小于总按钮宽度时，进行自动打开或者关闭
				// 移动距离大于0时，意味着需要关闭状态
				if (Math.abs(delta) < buttonsWidth.value) {
					moveCellByAnimation(delta > 0 ? 'close' : 'open')
				}
			} else {
				// 在小于阈值时，进行关闭操作(如果在打开状态下，将不会执行bindingX)
				moveCellByAnimation('close')
			}
		}
	})
}

// 释放bindingX
function unbindBindingX() {
	// 释放上一次的资源
	if (panEvent?.token != 0) {
		bindingX.unbind({
			token: panEvent?.token,
			// pan为手势事件
			eventType: 'pan'
		})
	}
}

// 查询按钮节点信息
function queryRectNvue() {
	// 历遍所有按钮数组，通过getRectByDom返回一个promise
	const promiseAll = props.options.map((item, index) => {
		return getRectByDom(buttonRefs[index])
	})
	// 通过promise.all方法，让所有按钮的查询结果返回一个数组的形式
	Promise.all(promiseAll).then(sizes => {
		buttons.value = sizes
		// 计算所有按钮总宽度
		buttonsWidth.value = sizes.reduce((sum, cur) => sum + cur.width, 0)
	})
}

// 通过nvue的dom模块，查询节点信息
function getRectByDom(refNode) {
	return new Promise(resolve => {
		dom.getComponentRect(refNode, res => {
			resolve(res.size)
		})
	})
}

// 移动单元格到左边或者右边尽头
function moveCellByAnimation(nextStatus = 'open') {
	if (moving.value) return
	// 标识当前状态
	moving.value = true
	const content = getContentRef()
	const x = nextStatus === 'open' ? -buttonsWidth.value : 0
	animation.transition(content, {
		styles: {
			transform: `translateX(${x}px)`,
		},
		duration: getDuration(props.duration, false),
		timingFunction: 'ease-in-out'
	}, () => {
		moving.value = false
		status.value = nextStatus
		unbindBindingX()
	})
}

// 获取元素ref
function getContentRef() {
	return contentRef.value?.ref || contentRef.value
}
// #endif

defineExpose({
	closeHandler,
	setState,
	closeOther,
	updateParentData,
	setStatus,
	status
})
</script>


<style lang="scss" scoped>

	.u-swipe-action-item {
		position: relative;
		overflow: hidden;
		/* #ifndef APP-NVUE || MP-WEIXIN */
		touch-action: pan-y;
		/* #endif */
		/* #ifndef APP-NVUE */
		// 触发独立合成层，避免 H5 下 overflow 裁剪失效导致右侧按钮露边
		transform: translateZ(0);
		/* #endif */

		&__content {
			position: relative;
			// 保证内容层始终铺满整行，避免关闭态右侧露出删除按钮底色
			width: 100%;
            transform: translateX(0px); // 修复某些情况下默认右侧按钮是展开的问题
			background-color: var(--up-card-bg-color, #FFFFFF);
			z-index: 10;
			/* #ifndef APP-NVUE */
			// 覆盖 H5 亚像素渲染时内容层与容器之间的 1px 缝隙
			box-shadow: 1px 0 0 var(--up-card-bg-color, #FFFFFF);
			box-sizing: border-box;
			/* #endif */
		}

		&__right {
			position: absolute;
			top: 0;
			bottom: 0;
			right: 0;
			height: 100%;
			z-index: 1;
			@include flex;

			&__button {
				@include flex;
				justify-content: center;
				overflow: hidden;
				align-items: center;

				&__wrapper {
					@include flex;
					align-items: center;
					justify-content: center;
					padding: 0 15px;

					&__text {
						@include flex;
						align-items: center;
						color: #FFFFFF;
						font-size: 15px;
						text-align: center;
						justify-content: center;
					}
				}
			}
		}
	}
</style>
