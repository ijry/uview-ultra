<template>
	<view
		class="up-sticky"
		:style="[style]"
	>
		<view
		:id="elId"
			:style="[stickyContent]"
			class="up-sticky__content"
		>
			<slot />
		</view>
	</view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { props as stickyProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { addUnit, addStyle, deepMerge, getPx, guid, getDeviceInfo, os } from '../../libs/function/index'
import zIndex from '../../libs/config/zIndex'
/**
 * sticky 吸顶
 * @description 该组件与CSS中position: sticky属性实现的效果一致，当组件达到预设的到顶部距离时， 就会固定在指定位置，组件位置大于预设的顶部距离时，会重新按照正常的布局排列。
 * @tutorial https://uview-plus.jiangruyi.com/components/sticky.html
 * @property {String ｜ Number}	offsetTop		吸顶时与顶部的距离，单位px（默认 0 ）
 * @property {String ｜ Number}	customNavHeight	自定义导航栏的高度 （h5 默认44  其他默认 0 ）
 * @property {Boolean}			disabled		是否开启吸顶功能 （默认 false ）
 * @property {String}			bgColor			组件背景颜色（默认 '#ffffff' ）
 * @property {String ｜ Number}	zIndex			吸顶时的z-index值
 * @property {String ｜ Number}	index			自定义标识，用于区分是哪一个组件
 * @property {Object}			customStyle		组件的样式，对象形式
 * @event {Function} fixed		组件吸顶时触发
 * @event {Function} unfixed	组件取消吸顶时触发
 * @example <up-sticky offsetTop="200"><view>塞下秋来风景异，衡阳雁去无留意</view></up-sticky>
 */
defineOptions({
	name: 'up-sticky',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...stickyProps.props
})
defineEmits(['fixed', 'unfixed'])
const instance = getCurrentInstance()
const proxy = instance?.proxy || null
const { $uGetRect } = useUltraUI(props)

const cssSticky = ref(false)
const stickyTop = ref(0)
const elId = ref(guid())
const left = ref(0)
const width = ref('auto')
const height = ref('auto')
const fixed = ref(false)
let contentObserver = null

const uZindex = computed(() => (props.zIndex ? props.zIndex : zIndex.sticky))

const style = computed(() => {
	const styleObj = {}
	if (!props.disabled) {
		if (cssSticky.value) {
			styleObj.position = 'sticky'
			styleObj.zIndex = uZindex.value
			styleObj.top = addUnit(stickyTop.value)
		} else {
			styleObj.height = fixed.value ? height.value + 'px' : 'auto'
		}
	} else {
		// #ifdef APP-NVUE
		styleObj.position = 'relative'
		// #endif
		// #ifndef APP-NVUE
		styleObj.position = 'static'
		// #endif
	}
	styleObj.backgroundColor = props.bgColor
	return deepMerge(addStyle(props.customStyle), styleObj)
})

const stickyContent = computed(() => {
	const styleObj = {}
	if (!cssSticky.value) {
		styleObj.position = fixed.value ? 'fixed' : 'static'
		styleObj.top = stickyTop.value + 'px'
		styleObj.left = left.value + 'px'
		styleObj.width = width.value == 'auto' ? 'auto' : width.value + 'px'
		styleObj.zIndex = uZindex.value
	}
	return styleObj
})

onMounted(() => {
	init()
})

watch(() => props.offsetTop, () => {
	getStickyTop()
})

onBeforeUnmount(() => {
	disconnectObserver('contentObserver')
})

function init() {
	getStickyTop()
	checkSupportCssSticky()
	if (!cssSticky.value) {
		!props.disabled && initObserveContent()
	}
}

function initObserveContent() {
	$uGetRect('#' + elId.value).then((res) => {
		height.value = res.height
		left.value = res.left
		width.value = res.width
		nextTick(() => {
			observeContent()
		})
	})
}

function observeContent() {
	disconnectObserver('contentObserver')
	const observer = uni.createIntersectionObserver(proxy, {
		thresholds: [0.95, 0.98, 1]
	})
	observer.relativeToViewport({
		top: -stickyTop.value
	})
	observer.observe(`#${elId.value}`, (res) => {
		setFixed(res.boundingClientRect.top)
	})
	contentObserver = observer
}

function setFixed(top) {
	fixed.value = top <= stickyTop.value
}

function disconnectObserver(observerName) {
	if (observerName === 'contentObserver') {
		contentObserver && contentObserver.disconnect()
		contentObserver = null
	}
}

function getStickyTop() {
	stickyTop.value = getPx(props.offsetTop) + getPx(props.customNavHeight)
}

async function checkSupportCssSticky() {
	// #ifdef H5
	if (checkCssStickyForH5()) {
		cssSticky.value = true
	}
	// #endif

	if (os() === 'android' && Number(getDeviceInfo().system) > 8) {
		cssSticky.value = true
	}

	// #ifdef APP-VUE || MP-WEIXIN || MP-TOUTIAO
	cssSticky.value = await checkComputedStyle()
	// #endif

	if (os() === 'ios') {
		cssSticky.value = true
	}

	// #ifdef APP-NVUE
	cssSticky.value = true
	// #endif
}

function checkComputedStyle() {
	// #ifdef APP-VUE || MP-WEIXIN || MP-TOUTIAO
	return new Promise((resolve) => {
		uni.createSelectorQuery().in(proxy).select('.up-sticky').fields({
			computedStyle: ['position']
		}).exec((e) => {
			resolve('sticky' === e[0].position)
		})
	})
	// #endif
}

function checkCssStickyForH5() {
	// #ifdef H5
	const vendorList = ['', '-webkit-', '-ms-', '-moz-', '-o-']
	const vendorListLength = vendorList.length
	const stickyElement = document.createElement('div')
	for (let i = 0; i < vendorListLength; i++) {
		stickyElement.style.position = vendorList[i] + 'sticky'
		if (stickyElement.style.position !== '') {
			return true
		}
	}
	return false
	// #endif
}
</script>


<style lang="scss" scoped>
	.up-sticky {
		/* #ifdef APP-VUE || MP-WEIXIN || MP-TOUTIAO */
		// 此处默认写sticky属性，是为了给微信和APP通过uni.createSelectorQuery查询是否支持css sticky使用
		position: sticky;
		/* #endif */
	}
</style>
