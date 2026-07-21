<template>
	<view class="up-cate-tab" :style="{ height: addUnit(height) }">
		<view class="up-cate-tab__wrap">
			<scroll-view class="up-cate-tab__view up-cate-tab__menu-scroll-view"
                scroll-y scroll-with-animation :scroll-top="scrollTop"
			    :scroll-into-view="itemId">
				<view v-for="(item, index) in tabList" :key="index" class="up-cate-tab__item"
                    :class="[innerCurrent == index ? 'up-cate-tab__item-active' : '']"
				 @tap.stop="swichMenu(index)">
					<slot name="tabItem" :item="item">
                    </slot>
                    <text v-if="!$slots['tabItem']" class="up-line-1">{{item[tabKeyName]}}</text>
				</view>
			</scroll-view>
			<scroll-view :scroll-top="scrollRightTop" scroll-with-animation :scroll-into-view="scrollIntoView"
				scroll-y class="up-cate-tab__right-box" @scroll="rightScroll">
				<view class="up-cate-tab__right-top">
					<slot name="rightTop" :tabList="tabList">
                	</slot>
				</view>
				<view class="up-cate-tab__page-view">
					<template :key="index" v-for="(item , index) in tabList">
						<view v-if="mode == 'follow' || ( mode == 'tab' && index == innerCurrent)"
							class="up-cate-tab__page-item" :id="'item' + index">
							<slot name="itemList" :item="item">
							</slot>
							<template v-if="!$slots['itemList']">
								<view class="item-title">
									<text>{{item[tabKeyName]}}</text>
								</view>
								<view class="item-container">
									<template v-for="(item1, index1) in item.children" :key="index1">
										<slot name="pageItem" :pageItem="item1">
											<view class="thumb-box" >
												<image class="item-menu-image" :src="item1.icon" mode=""></image>
												<view class="item-menu-name">{{item1[itemKeyName]}}</view>
											</view>
										</slot>
									</template>
								</view>
							</template>
						</view>
					</template>
				</view>
			</scroll-view>
		</view>
	</view>
</template>
<script setup>
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { addUnit, sleep } from '../../libs/function/index'

defineOptions({
	name: 'up-cate-tab',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	mode: {
		type: String,
		default: 'follow' // follow跟随联动, tab单一显示。
	},
	height: {
		type: String,
		default: '100%'
	},
	tabList: {
		type: Array,
		default: () => {
			return []
		}
	},
	tabKeyName: {
		type: String,
		default: 'name'
	},
	itemKeyName: {
		type: String,
		default: 'name'
	},
	current: {
		type: Number,
		default: 0
	}
})
const emit = defineEmits(['update:current'])
const instance = getCurrentInstance()
const proxy = instance?.proxy

const scrollTop = ref(0)
const scrollIntoView = ref('')
const oldScrollTop = ref(0)
const innerCurrent = ref(0)
const menuHeight = ref(0)
const menuItemHeight = ref(0)
const itemId = ref('')
const menuItemPos = ref([])
const rects = ref([])
const arr = ref([])
const scrollRightTop = ref(0)
const timer = ref(null)
let _observerList = []

function getElRect(elClass, dataVal) {
	return new Promise((resolve) => {
		const query = uni.createSelectorQuery().in(proxy)
		query.select('.' + elClass).fields({
			size: true
		}, res => {
			if (!res) {
				setTimeout(() => {
					getElRect(elClass, dataVal)
				}, 10)
				return
			}
			if (dataVal === 'menuHeight') menuHeight.value = res.height
			else if (dataVal === 'menuItemHeight') menuItemHeight.value = res.height
			resolve()
		}).exec()
	})
}

async function leftMenuStatus(index) {
	innerCurrent.value = index
	emit('update:current', index)
	if (menuHeight.value == 0 || menuItemHeight.value == 0) {
		await getElRect('up-cate-tab__menu-scroll-view', 'menuHeight')
		await getElRect('up-cate-tab__item', 'menuItemHeight')
	}
	scrollTop.value = index * menuItemHeight.value + menuItemHeight.value / 2 - menuHeight.value / 2
}

async function getMenuItemTop() {
	return new Promise(resolve => {
		let selectorQuery = uni.createSelectorQuery().in(proxy)
		selectorQuery.selectAll('.up-cate-tab__page-item').boundingClientRect((nextRects) => {
			if (!nextRects.length) {
				setTimeout(() => {
					getMenuItemTop()
				}, 100)
				return
			}
			rects.value = nextRects
			arr.value = []
			nextRects.forEach((rect) => {
				arr.value.push(rect.top - nextRects[0].top)
			})
			resolve()
		}).exec()
	})
}

async function swichMenu(index) {
	if (props.mode == 'follow') {
		if (arr.value.length == 0) {
			await getMenuItemTop()
		}
		if (scrollIntoView.value != 'item' + index) {
			scrollIntoView.value = 'item' + index
		}
	}

	if (index == innerCurrent.value) return
	nextTick(() => {
		innerCurrent.value = index
		emit('update:current', index)
	})
}

async function observer() {
	await nextTick()
	if (_observerList) {
		_observerList.forEach(obs => {
			obs.disconnect()
		})
	}
	_observerList = []

	props.tabList.map((val, index) => {
		let obs = uni.createIntersectionObserver(proxy)
		_observerList.push(obs)
		obs.relativeTo('.up-cate-tab__right-box', {
			top: 10
		}).observe('#item' + index, (res) => {
			if (res.intersectionRatio > 0) {
				console.log('res', res)
				let id = res.id ? res.id.substring(4) : index
				leftMenuStatus(parseInt(id))
			}
		})
	})
}

async function rightScroll(e) {
	if (props.mode !== 'follow') return
	oldScrollTop.value = e.detail.scrollTop
	if (arr.value.length == 0) {
		await getMenuItemTop()
	}
	if (timer.value) return
	if (!menuHeight.value) {
		await getElRect('up-cate-tab__menu-scroll-view', 'menuHeight')
	}
	timer.value = setTimeout(() => {
		timer.value = null
		let scrollHeight = e.detail.scrollTop + 1
		for (let i = 0; i < arr.value.length; i++) {
			let height1 = arr.value[i]
			let height2 = arr.value[i + 1]
			if (!height2 || scrollHeight >= height1 && scrollHeight <= height2) {
				leftMenuStatus(i)
				return
			}
		}
	}, 100)
}

watch(() => props.tabList, () => {
	sleep(30).then(() => {
		getMenuItemTop()
		leftMenuStatus(innerCurrent.value)
	})
}, { deep: true })

watch(() => props.current, (nval) => {
	innerCurrent.value = nval
	leftMenuStatus(innerCurrent.value)
	sleep(30).then(() => {
		swichMenu(innerCurrent.value)
	})
})

watch(() => props.height, () => {
	getMenuItemTop()
	leftMenuStatus(innerCurrent.value)
})

onMounted(() => {
	innerCurrent.value = props.current
	leftMenuStatus(innerCurrent.value)
	getMenuItemTop()
	sleep(50).then(() => {
		swichMenu(innerCurrent.value)
	})
})
</script>


<style lang="scss" scoped>
	.up-cate-tab {
		display: flex;
		flex-direction: column;
	}

	.up-cate-tab__wrap {
		flex: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.up-search-inner {
		background-color: rgb(234, 234, 234);
		border-radius: 100rpx;
		display: flex;
		align-items: center;
		padding: 10rpx 16rpx;
	}

	.up-search-text {
		font-size: 26rpx;
		color: $up-tips-color;
		margin-left: 10rpx;
	}

	.up-cate-tab__view {
		width: 200rpx;
		height: 100%;
	}

	.up-cate-tab__item {
		height: 110rpx;
		background: #f6f6f6;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		color: #444;
		font-weight: 400;
		line-height: 1;
	}

	.up-cate-tab__item-active {
		position: relative;
		color: #000;
		font-size: 30rpx;
		font-weight: 600;
		background: #fff;
	}

	.up-cate-tab__item-active::before {
		content: "";
		position: absolute;
		border-left: 4px solid $up-primary;
		height: 32rpx;
		left: 0;
		top: 39rpx;
	}

	.up-cate-tab__view {
		height: 100%;
	}

	.up-cate-tab__right-box {
		flex: 1;
		background-color: rgb(250, 250, 250);
	}

	.up-cate-tab__page-view {
		padding: 16rpx;
	}

	.up-cate-tab__page-item {
		margin-bottom: 30rpx;
		background-color: #fff;
		padding: 16rpx;
		border-radius: 8rpx;
	}

	.up-cate-tab__page-item:last-child {
		min-height: 100vh;
	}

	.item-title {
		font-size: 26rpx;
		color: $up-main-color;
		font-weight: bold;
	}

	.item-menu-name {
		font-weight: normal;
		font-size: 24rpx;
		color: $up-main-color;
	}

	.item-container {
		display: flex;
		flex-wrap: wrap;
	}

	.thumb-box {
		width: 33.333333%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		margin-top: 20rpx;
	}

	.item-menu-image {
		width: 120rpx;
		height: 120rpx;
	}
</style>
