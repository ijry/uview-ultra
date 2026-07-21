<template>
  <view class="up-virtual-list" :style="{ height: addUnit(height) }" ref="container">
    <scroll-view
      class="virtual-scroll-container"
      :scroll-y="true"
      :scroll-top="scrollTop"
      :style="{ height: '100%' }"
      @scroll="handleScroll"
    >
    <!-- @touchmove.stop.prevent="handleTouchMove" -->
      <view class="scroll-content">
        <!-- 顶部占位 -->
        <view :style="{ height: topPlaceholderHeight + 'px' }"></view>

        <!-- 可见项 -->
        <view
          v-for="item in visibleItems"
          :key="getItemKey(item)"
          class="list-item"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item" :index="item._virtualIndex"></slot>
        </view>

        <!-- 底部占位 -->
        <view :style="{ height: bottomPlaceholderHeight + 'px' }"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { addUnit } from '../../libs/function/index.js'

defineOptions({
	name: 'up-virtual-list',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	// 数据源
	listData: {
		type: Array,
		default: () => []
	},
	// 每项高度（固定高度模式）
	itemHeight: {
		type: Number,
		default: 50
	},
	// 容器高度
	height: {
		type: [String, Number],
		default: '100%'
	},
	// 缓冲区项数
	buffer: {
		type: Number,
		default: 4
	},
	// 索引键名
	keyField: {
		type: String,
		default: 'id'
	},
	// 当前滚动位置
	scrollTop: {
		type: Number,
		default: 0
	}
})
const emit = defineEmits(['update:scrollTop', 'scroll'])
const instance = getCurrentInstance()
const proxy = instance?.proxy

const startIndex = ref(0)
const containerHeight = ref(0)
const container = ref(null)

const remain = computed(() => {
	if (containerHeight.value <= 0) {
		return Math.ceil(500 / props.itemHeight) || 10
	}
	const calculated = Math.ceil(containerHeight.value / props.itemHeight)
	return Math.max(1, calculated)
})
const visibleCount = computed(() => {
	return remain.value + props.buffer
})
const visibleItems = computed(() => {
	const start = Math.max(0, startIndex.value - Math.floor(props.buffer / 2))
	const end = Math.min(props.listData.length, start + visibleCount.value)

	return props.listData.slice(start, end).map((item, index) => {
		return {
			...item,
			_virtualIndex: start + index
		}
	})
})
const topPlaceholderHeight = computed(() => {
	const start = Math.max(0, startIndex.value - Math.floor(props.buffer / 2))
	return start * props.itemHeight
})
const bottomPlaceholderHeight = computed(() => {
	const start = Math.max(0, startIndex.value - Math.floor(props.buffer / 2))
	const end = Math.min(props.listData.length, start + visibleCount.value)
	return (props.listData.length - end) * props.itemHeight
})

function getViewportHeight() {
	// #ifdef H5
	return window.innerHeight
	// #endif

	// #ifndef H5
	try {
		const res = uni.getSystemInfoSync()
		return res.windowHeight
	} catch (e) {
		return 600
	}
	// #endif
}

function calculateDefaultHeight() {
	const height = props.height
	if (typeof height === 'number') {
		return height
	}

	if (typeof height === 'string') {
		if (height.includes('px')) {
			return parseInt(height) || 500
		} else if (height.includes('vh')) {
			const vh = parseInt(height)
			return isNaN(vh) ? 500 : (vh / 100) * getViewportHeight()
		} else if (height.includes('%')) {
			return 500
		} else {
			const num = parseInt(height)
			return isNaN(num) ? 500 : num
		}
	}

	return 500
}

function measureContainerHeight() {
	nextTick(() => {
		// #ifdef H5
		if (container.value) {
			const element = container.value.$el || container.value
			containerHeight.value = element.offsetHeight || 500
		}
		// #endif

		// #ifndef H5
		const query = uni.createSelectorQuery().in(proxy)
		query.select('.up-virtual-list').boundingClientRect(rect => {
			if (rect) {
				containerHeight.value = rect.height || 500
			} else {
				containerHeight.value = calculateDefaultHeight()
			}
		}).exec()
		// #endif
	})
}

function getItemKey(item) {
	return item[props.keyField] !== undefined ? item[props.keyField] : item._virtualIndex
}

function updateVisibleItems() {
	const index = Math.floor(props.scrollTop / props.itemHeight)
	startIndex.value = Math.max(0, index)
}

function handleScroll(e) {
	const top = e.detail.scrollTop
	emit('update:scrollTop', top)
	emit('scroll', top)
}

function handleTouchMove(e) {
	e.stopPropagation()
}

function getVisibleRange() {
	const start = Math.max(0, startIndex.value - Math.floor(props.buffer / 2))
	const end = Math.min(props.listData.length, start + visibleCount.value)
	return { start, end }
}

watch(() => props.listData, () => {
	updateVisibleItems()
}, { immediate: true })

watch(() => props.scrollTop, () => {
	updateVisibleItems()
})

onMounted(() => {
	measureContainerHeight()
})

defineExpose({
	getVisibleRange,
	measureContainerHeight,
	updateVisibleItems,
	container
})
</script>


<style scoped lang="scss">
.up-virtual-list {
  position: relative;
  overflow: hidden;
}

.virtual-scroll-container {
  height: 100%;
}

.scroll-content {
  position: relative;
}

.list-item {
  will-change: transform;
}
</style>
