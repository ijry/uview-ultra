<template>
	<view ref="up-index-list" class="up-index-list">
		<!-- #ifdef APP-NVUE -->
		<list
			:scrollTop="scrollTop"
			enable-back-to-top
			:offset-accuracy="1"
			:style="{
				maxHeight: addUnit(scrollViewHeight)
			}"
			@scroll="scrollHandler"
			ref="up-index-list__scroll-view"
			class="up-index-list__scroll-view"
		>
			<cell
				v-if="$slots.header"
				ref="header"
			>
				<slot name="header" />
			</cell>
			<slot />
			<cell v-if="$slots.footer">
				<slot name="footer" />
			</cell>
		</list>
		<!-- #endif -->
		<!-- #ifndef APP-NVUE -->
		<scroll-view
			:scrollTop="scrollTop"
			:scrollIntoView="scrollIntoView"
			:offset-accuracy="1"
			:style="{
				maxHeight: addUnit(scrollViewHeight)
			}"
			scroll-y
			@scroll="scrollHandler"
			ref="up-index-list__scroll-view"
			class="up-index-list__scroll-view"
		>
			<view class="up-index-list__header" v-if="$slots.header">
				<slot name="header" />
			</view>
			<slot />
			<view class="up-index-list__footer" v-if="$slots.footer">
				<slot name="footer" />
			</view>
		</scroll-view>
		<!-- #endif -->
		<view
			class="up-index-list__letter"
			ref="up-index-list__letter"
			:style="{top: addUnit(letterInfo.top) , transform: 'translateY(-50%)'}"
			@touchstart.prevent="touchStart"
			@touchmove.prevent="touchMove"
			@touchend.prevent="touchEnd"
			@touchcancel.prevent="touchEnd"
		>
			<view
				class="up-index-list__letter__item"
				v-for="(item, index) in uIndexList"
				:key="index"
				:style="{
					backgroundColor: activeIndex === index ? activeColor : 'transparent'
				}"
			>
				<text
					class="up-index-list__letter__item__index"
					:style="{color: activeIndex === index ? '#fff' : inactiveColor}"
				>{{ item.key || item }}</text>
			</view>
		</view>
		<u-transition
			mode="fade"
			:show="touching"
			:customStyle="{
				position: 'absolute',
				right: '50px',
				top: addUnit(indicatorTop, 'px'),
				zIndex: 3
			}"
		>
			<view
				class="up-index-list__indicator"
				:class="['up-index-list__indicator--show']"
				:style="{
					height: addUnit(indicatorHeight),
					width: addUnit(indicatorHeight)
				}"
			>
				<text class="up-index-list__indicator__text">{{ uIndexList[activeIndex]?.key || uIndexList[activeIndex] }}</text>
			</view>
		</u-transition>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onMounted, ref, toRef, watch } from 'vue'
	import { props as indexListProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addUnit, getWindowInfo, sleep, getPx } from '../../libs/function/index'

	const indexList = () => {
		const indexList = []
		const charCodeOfA = 'A'.charCodeAt(0)
		for (let i = 0; i < 26; i++) {
			indexList.push(String.fromCharCode(charCodeOfA + i))
		}
		return indexList
	}

	// #ifdef APP-NVUE
	// 由于weex为阿里的KPI业绩考核的产物，所以不支持百分比单位，这里需要通过dom查询组件的宽度
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * IndexList 索引列表
	 * @description  通过折叠面板收纳内容区域
	 * @tutorial https://uview-plus.jiangruyi.com/components/indexList.html
	 * @property {String}			inactiveColor	右边锚点非激活的颜色 ( 默认 '#606266' )
	 * @property {String}			activeColor		右边锚点激活的颜色 ( 默认 '#5677fc' )
	 * @property {Array}			indexList		索引字符列表，数组形式
	 * @property {Boolean}			sticky			是否开启锚点自动吸顶 ( 默认 true )
	 * @property {String | Number}	customNavHeight	自定义导航栏的高度 ( 默认 0 )
	 * */
	defineOptions({
		name: 'up-index-list',
		// #ifdef MP-WEIXIN
		// 将自定义节点设置成虚拟的，更加接近Vue组件的表现，能更好的使用flex属性
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...indexListProps.props
	})
	const emit = defineEmits(['select'])
	const instance = getCurrentInstance()
	const proxy = instance?.proxy
	const { children, $uGetRect } = useUltraUI(props)
	const anchors = ref([])
	const sticky = toRef(props, 'sticky')
	const customNavHeightRef = toRef(props, 'customNavHeight')
	const itemMarginRef = toRef(props, 'itemMargin')
	// 当前正在被选中的字母索引
	const activeIndex = ref(-1)
	const touchmoveIndex = ref(1)
	// 索引字母的信息
	const letterInfo = ref({
		height: 0,
		itemHeight: 0,
		top: 0
	})
	// 设置字母指示器的高度，后面为了让指示器跟随字母，并将尖角部分指向字母的中部，需要依赖此值
	const indicatorHeight = ref(50)
	// 当前是否正在被触摸状态
	const touching = ref(false)
	// 滚动条顶部top值
	const scrollTop = ref(0)
	// scroll-view的高度
	const scrollViewHeight = ref(0)
	// 系统信息
	const sys = ref(getWindowInfo())
	const scrolling = ref(false)
	const scrollIntoView = ref('')
	const pageYState = ref(0)
	const topOffset = ref(0)
	const indicatorText = ref('')

	// 如果有传入外部的indexList锚点数组则使用，否则使用内部生成A-Z字母
	const uIndexList = computed(() => {
		return props.indexList.length ? props.indexList : indexList()
	})

	// 字母放大指示器的top值，为了让其指向当前激活的字母
	const indicatorTop = computed(() => {
		const {
			top,
			height,
			itemHeight
		} = letterInfo.value
		return Math.floor(top - (height / 2) + itemHeight * activeIndex.value + itemHeight - 70 / 2)
	})

	// 监听字母索引的变化，重新设置尺寸
	watch(uIndexList, () => {
		sleep(30).then(() => {
			setIndexListLetterInfo()
		})
	}, {
		immediate: false
	})

	function init() {
		// 设置列表的高度为整个屏幕的高度
		//减去this.customNavHeight，并将this.scrollViewHeight设置为maxHeight
		//解决当up-index-list组件放在tabbar页面时,scroll-view内容较少时，还能滚动
		const customNavHeight = getPx(props.customNavHeight)
		// scrollViewHeight.value = sys.value.windowHeight - customNavHeight
		getIndexListRect().then(async sizeScroll => {
			scrollViewHeight.value = sizeScroll.height ? sizeScroll.height : sys.value.windowHeight - customNavHeight
			topOffset.value = sys.value.windowHeight - scrollViewHeight.value
			// console.log('scrollViewHeight', scrollViewHeight.value)
			// console.log('topOffset', topOffset.value)
		})
	}

	// 索引列表被触摸
	function touchStart(e) {
		// 获取触摸点信息
		const touchStartData = e.changedTouches[0]
		if (!touchStartData) return
		touching.value = true
		const {
			pageY,
			screenY
		} = touchStartData
		// 根据当前触摸点的坐标，获取当前触摸的为第几个字母
		// #ifdef APP-NVUE
		// 使用screenY要减去导航栏44和状态栏24高度
		const currentIndex = getIndexListLetter(screenY - 68)
		// #endif
		// #ifndef APP-NVUE
		const currentIndex = getIndexListLetter(pageY)
		// #endif
		setValueForTouch(currentIndex)
	}

	// 索引字母列表被触摸滑动中
	function touchMove(e) {
		// 获取触摸点信息
		let touchMove = e.changedTouches[0]
		if (!touchMove) return

		// 滑动结束后迅速开始第二次滑动时候 touching 为 false 造成不显示 indicator 问题
		if (!touching.value) {
			touching.value = true
		}
		const {
			pageY,
			screenY
		} = touchMove
		// #ifdef APP-NVUE
		// 使用screenY要减去导航栏44和状态栏24高度
		const currentIndex = getIndexListLetter(screenY - 68)
		// #endif
		// #ifndef APP-NVUE
		const currentIndex = getIndexListLetter(pageY)
		// #endif

		setValueForTouch(currentIndex)
	}

	// 触摸结束
	function touchEnd(e) {
		// 延时一定时间后再隐藏指示器，为了让用户看的更直观，同时也是为了消除快速切换u-transition的show带来的影响
		sleep(300).then(() => {
			touching.value = false
		})
	}

	// 获取索引列表的尺寸以及单个字符的尺寸信息
	function getIndexListLetterRect() {
		return new Promise(resolve => {
			// 延时一定时间，以获取dom尺寸
			// #ifndef APP-NVUE
			$uGetRect('.up-index-list__letter').then(size => {
				resolve(size)
			})
			// #endif

			// #ifdef APP-NVUE
			const ref = proxy.$refs['up-index-list__letter']
			dom.getComponentRect(ref, res => {
				resolve(res.size)
			})
			// #endif
		})
	}

	function getIndexListScrollViewRect() {
		return new Promise(resolve => {
			// 延时一定时间，以获取dom尺寸
			// #ifndef APP-NVUE
			nextTick(() => {
				$uGetRect('.up-index-list__scroll-view').then(size => {
					resolve(size)
				})
			})
			// #endif

			// #ifdef APP-NVUE
			const ref = proxy.$refs['up-index-list__scroll-view']
			dom.getComponentRect(ref, res => {
				resolve(res.size)
			})
			// #endif
		})
	}

	function getIndexListRect() {
		return new Promise(resolve => {
			// 延时一定时间，以获取dom尺寸
			// #ifndef APP-NVUE
			$uGetRect('.up-index-list').then(size => {
				resolve(size)
			})
			// #endif

			// #ifdef APP-NVUE
			const ref = proxy.$refs['up-index-list']
			dom.getComponentRect(ref, res => {
				resolve(res.size)
			})
			// #endif
		})
	}

	// 设置indexList索引的尺寸信息
	function setIndexListLetterInfo() {
		getIndexListLetterRect().then(size => {
			// console.log('getIndexListLetterRect', size)
			const {
				height
			} = size
			const sysData = getWindowInfo()
			const windowHeight = sysData.windowHeight
			let customNavHeight = 0
			// 消除各端导航栏非原生和原生导致的差异，让索引列表字母对屏幕垂直居中
			if (props.customNavHeight == 0) {
				// #ifdef H5
				customNavHeight = sysData.windowTop
				// #endif
				// #ifndef H5
				// 在非H5中，为原生导航栏，其高度不算在windowHeight内，这里设置为负值，后面相加时变成减去其高度的一半
				customNavHeight = -(sysData.statusBarHeight + 44)
				// #endif
			} else {
				customNavHeight = getPx(props.customNavHeight)
			}
			getIndexListScrollViewRect().then(sizeScroll => {
				// console.log('sizeScroll', sizeScroll)
				letterInfo.value = {
					height,
					// 为了让字母列表对屏幕绝对居中，让其对导航栏进行修正，也即往上偏移导航栏的一半高度
					top: sizeScroll.height / 2,
					// top: (scrollViewHeight.value - height) / 2 + customNavHeight / 2,
					itemHeight: Math.floor(height / uIndexList.value.length)
				}
			})
		})
	}

	// 获取当前被触摸的索引字母
	function getIndexListLetter(pageY) {
		pageYState.value = pageY
		let {
			top,
			height,
			itemHeight
		} = letterInfo.value
		let index = activeIndex.value
		// 对H5的pageY进行修正，这是由于uni-app自作多情在H5中将触摸点的坐标跟H5的导航栏结合导致的问题
		// #ifdef H5
		// pageY += getWindowInfo().windowTop
		// #endif
		// 对第一和最后一个字母做边界处理，因为用户可能在字母列表上触摸到两端的尽头后依然继续滑动
		// console.log('top1', top)
		// console.log('height', height)
		top = top - (height / 2) // 减去transfrom的translateY值导致的高度
		pageY = pageY - topOffset.value
		// if (props.safeBottomFix) {
		// 	pageY = pageY + 34
		// }
		// console.log('topOffset', topOffset.value)
		// console.log('pageY', pageY)
		// console.log('top2', top)
		if (pageY < top) {
			index = 0
		} else if (pageY >= top + height) {
			// 如果超出了，取最后一个字母
			index = uIndexList.value.length - 1
		} else {
			// 将触摸点的Y轴偏移值，减去索引字母的top值，除以每个字母的高度，即可得到当前触摸点落在哪个字母上
			index = Math.floor((pageY - top) / itemHeight)
		}
		// console.log(index)
		return index
	}

	// 设置各项由触摸而导致变化的值
	async function setValueForTouch(currentIndex) {
		// 如果偏移量太小，前后得出的会是同一个索引字母，为了防抖，进行返回
		if (currentIndex === activeIndex.value) return
		activeIndex.value = currentIndex
		emit('select', uIndexList.value[currentIndex])
		// #ifndef APP-NVUE || MP-WEIXIN
		// 在非nvue中，由于anchor和item都在up-index-item中，所以需要对index-item进行偏移
		if (typeof uIndexList.value[currentIndex] == 'string') {
			scrollIntoView.value = `up-index-item-${uIndexList.value[currentIndex].charCodeAt(0)}`
		} else {
			scrollIntoView.value = `up-index-item-${uIndexList.value[currentIndex].name.charCodeAt(0)}`
		}
		// #endif

		// #ifdef MP-WEIXIN
		// 微信小程序下，scroll-view的scroll-into-view属性无法对slot中的内容的id生效，只能通过设置scrollTop的形式去移动滚动条
		const customNavHeight = props.customNavHeight

		// 获取header slot的尺寸信息
		const header = await getHeaderRect()
		// item的top值，在nvue下，模拟出的anchor的top，类似非nvue下的index-item的top
		let top = header.height
		// console.log(top)
		const anchorsList = anchors.value
		// 由于list组件无法获取cell的top值，这里通过header slot和各个item之间的height，模拟出类似非nvue下的位置信息
		const childrenList = children.value.map((item, index) => {
			const childHeight = item.height + getPx(props.itemMargin)
			const child = {
				height: childHeight,
				top: top
			}
			// 进行累加，给下一个item提供计算依据
			top = top + childHeight
			// #ifdef APP-NVUE
			// 只有nvue下，需要将锚点的高度也累加，非nvue下锚点高度是包含在index-item中的。
			top = top + anchorsList[index].height
			// #endif
			return child
		})
		// console.log('children[currentIndex].top', childrenList[currentIndex].top)
		if (childrenList[currentIndex]?.top || childrenList[currentIndex].top === 0) {
			scrollTop.value = childrenList[currentIndex].top - getPx(customNavHeight)
		}
		// #endif

		// #ifdef APP-NVUE
		// 在nvue中，由于cell和header为同级元素，所以实际是需要对header(anchor)进行偏移
		const anchor = `up-index-anchor-${uIndexList.value[currentIndex]}`
		// console.log(anchor)
		dom.scrollToElement(anchors.value[currentIndex].$refs[anchor], {
			offset: 0,
			animated: false
		})
		// #endif
	}

	function getHeaderRect() {
		// 获取header slot的高度，因为list组件中获取元素的尺寸是没有top值的
		return new Promise(resolve => {
			if (!proxy.$slots.header) {
				resolve({
					width: 0,
					height: 0
				})
			}

			// #ifndef APP-NVUE
			$uGetRect('.up-index-list__header').then(size => {
				resolve(size)
			})
			// #endif

			// #ifdef APP-NVUE
			let headerRef = proxy.$refs.header
			if (!headerRef) {
				resolve({
					width: 0,
					height: 0
				})
			}
			dom.getComponentRect(headerRef, res => {
				resolve(res.size)
			})
			// #endif
		})
	}

	// scroll-view的滚动事件
	async function scrollHandler(e) {
		if (touching.value || scrolling.value) return
		// 每过一定时间取样一次，减少资源损耗以及可能带来的卡顿
		scrolling.value = true
		sleep(10).then(() => {
			scrolling.value = false
		})
		let scrollTopValue = 0
		const len = children.value.length
		let childrenList = children.value
		// #ifdef APP-NVUE
		// nvue下获取的滚动条偏移为负数，需要转为正数
		let sys = getWindowInfo()
		scrollTopValue = Math.abs(e.contentOffset.y) / 10
		// console.log('native', e)
		// #endif

		// 获取header slot的尺寸信息
		const header = await getHeaderRect()
		// item的top值，在nvue下，模拟出的anchor的top，类似非nvue下的index-item的top
		let top = header.height
		const anchorsList = anchors.value
		// 由于list组件无法获取cell的top值，这里通过header slot和各个item之间的height，模拟出类似非nvue下的位置信息
		childrenList = children.value.map((item, index) => {
			const childHeight = item.height + getPx(props.itemMargin)
			const child = {
				height: childHeight,
				top: top
			}
			// 进行累加，给下一个item提供计算依据
			top = top + childHeight
			// #ifdef APP-NVUE
			// 只有nvue下，需要将锚点的高度也累加，非nvue下锚点高度是包含在index-item中的。
			top = top + anchorsList[index].height
			// #endif
			return child
		})

		// #ifndef APP-NVUE
		// 非nvue通过detail获取滚动条位移
		scrollTopValue = e.detail.scrollTop
		// console.log('scrollTop', scrollTopValue, props.customNavHeight)
		// #endif
		// 在弹窗中需要加上弹窗距离顶部的高度topOffset
		scrollTopValue = scrollTopValue + getPx(props.customNavHeight)
		for (let i = 0; i < len; i++) {
			const item = childrenList[i],
				nextItem = childrenList[i + 1]
			// 如果滚动条高度小于第一个item的top值，此时无需设置任意字母为高亮
			if (scrollTopValue <= childrenList[0].top || scrollTopValue >= childrenList[len - 1].top + childrenList[len - 1].height) {
				activeIndex.value = -1
				break
			} else if (!nextItem) {
				// 当不存在下一个item时，意味着历遍到了最后一个
				activeIndex.value = len - 1
				break
			} else if (scrollTopValue > item.top && scrollTopValue < nextItem.top) {
				activeIndex.value = i
				break
			}
		}
	}

	onMounted(() => {
		init()
		sleep(50).then(() => {
			setIndexListLetterInfo()
		})
	})

	defineExpose({
		children,
		anchors,
		sticky,
		customNavHeight: customNavHeightRef,
		itemMargin: itemMarginRef,
		activeIndex,
		touchmoveIndex,
		letterInfo,
		indicatorHeight,
		touching,
		scrollTop,
		scrollViewHeight,
		sys,
		scrolling,
		scrollIntoView,
		pageY: pageYState,
		topOffset,
		indicatorText,
		uIndexList,
		indicatorTop,
		init,
		touchStart,
		touchMove,
		touchEnd,
		getIndexListLetterRect,
		getIndexListScrollViewRect,
		getIndexListRect,
		setIndexListLetterInfo,
		getIndexListLetter,
		setValueForTouch,
		getHeaderRect,
		scrollHandler
	})
</script>

<style lang="scss" scoped>

	.up-index-list {

		&__letter {
			position: absolute;
			right: 0;
			text-align: center;
			z-index: 3;
			padding: 0 6px;
			width: 30px;

			&__item {
				width: 16px;
				height: 16px;
				border-radius: 100px;
				margin: 1px 0;
				@include flex;
				align-items: center;
				justify-content: center;

				&--active {
					background-color: $u-primary;
				}

				&__index {
					font-size: 12px;
					text-align: center;
					line-height: 12px;
				}
			}
		}

		&__indicator {
			width: 50px;
			height: 50px;
			border-radius: 100px 100px 0 100px;
			text-align: center;
			color: #ffffff;
			background-color: #c9c9c9;
			transform: rotate(-45deg);
			@include flex;
			justify-content: center;
			align-items: center;

			&__text {
				font-size: 28px;
				line-height: 28px;
				font-weight: bold;
				color: #fff;
				transform: rotate(45deg);
				text-align: center;
			}
		}
	}
</style>
