<template>
  <view
    class="up-pull-refresh"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- 下拉刷新区域 -->
    <view
      class="refresh-area"
      :style="{ height: refreshDistance + 'px' }"
      :class="{ refreshing: isRefreshing }"
    >
      <!-- 不同状态的插槽 -->
      <slot
        v-if="refreshStatus === 'pull'"
        name="pull"
        :distance="refreshDistance"
        :threshold="threshold"
      >
        <!-- 默认下拉状态 -->
        <view class="refresh-content">
          <view class="refresh-indicator">
            <up-icon name="arrow-downward" size="26px"></up-icon>
          </view>
          <text class="refresh-text">{{ t("up.pullRefresh.pull") }}</text>
        </view>
      </slot>

      <slot
        v-else-if="refreshStatus === 'release'"
        name="release"
        :distance="refreshDistance"
        :threshold="threshold"
      >
        <!-- 默认释放状态 -->
        <view class="refresh-content">
          <view class="refresh-indicator">
            <up-icon name="arrow-upward" size="26px"></up-icon>
          </view>
          <text class="refresh-text">{{ t("up.pullRefresh.release") }}</text>
        </view>
      </slot>

      <slot
        v-else-if="refreshStatus === 'refreshing'"
        name="refreshing"
      >
        <!-- 默认刷新中状态 -->
        <view class="refresh-content">
          <view class="refresh-indicator">
            <view class="spinner"></view>
          </view>
          <text class="refresh-text">{{ t("up.pullRefresh.refreshing") }}...</text>
        </view>
      </slot>
    </view>

    <!-- 内容区域 -->
    <view
      class="refresh-content-wrapper"
      :style="{ transform: `translateY(${contentTranslateY}px)` }"
    >
      <scroll-view
        v-if="useScrollView"
        class="scroll-wrapper"
        :scroll-y="true"
        :enable-back-to-top="enableBackToTop"
        :scroll-top="scrollTop"
        :lower-threshold="lowerThreshold"
        @scroll="handleScroll"
        @scrolltolower="handleScrollToLower"
      >
        <slot></slot>

        <!-- 使用 up-loadmore 组件实现上拉加载更多 -->
        <up-loadmore
          v-if="showLoadmore"
          v-bind="loadmoreProps"
        />
      </scroll-view>

      <view v-else>
        <slot></slot>

        <!-- 使用 up-loadmore 组件实现上拉加载更多 -->
        <up-loadmore
          v-if="showLoadmore"
          v-bind="loadmoreProps"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { t } from '../../libs/i18n'

defineOptions({
	name: 'up-pull-refresh',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	// 是否正在刷新
	refreshing: {
		type: Boolean,
		default: false
	},
	// 下拉刷新阈值
	threshold: {
		type: Number,
		default: 80
	},
	// 阻尼系数
	damping: {
		type: Number,
		default: 0.4
	},
	// 最大下拉距离
	maxDistance: {
		type: Number,
		default: 120
	},
	// 是否显示加载更多
	showLoadmore: {
		type: Boolean,
		default: false
	},
	// up-loadmore 组件的 props 配置
	loadmoreProps: {
		type: Object,
		default: () => ({
			status: 'loadmore',
		})
	},
	// 是否使用 scroll-view 包装内容
	useScrollView: {
		type: Boolean,
		default: true
	},
	// scroll-view 相关属性
	enableBackToTop: {
		type: Boolean,
		default: false
	},
	lowerThreshold: {
		type: [Number, String],
		default: 50
	},
	scrollTop: {
		type: [Number, String],
		default: 0
	}
})
const emit = defineEmits(['refresh', 'loadmore', 'scroll'])

const isRefreshing = ref(false)
const refreshStatus = ref('pull') // pull, release, refreshing
const refreshDistance = ref(0)
const startY = ref(0)
const currentY = ref(0)
const touching = ref(false)
const contentTranslateY = ref(0)

function startRefresh() {
	isRefreshing.value = true
	refreshStatus.value = 'refreshing'
	refreshDistance.value = props.threshold
	contentTranslateY.value = props.threshold
}

function resetRefresh() {
	refreshDistance.value = 0
	contentTranslateY.value = 0
}

function finishRefresh() {
	isRefreshing.value = false
	refreshStatus.value = 'pull'
	resetRefresh()
}

function isScrollViewAtTop() {
	return true
}

function onTouchStart(e) {
	if (isRefreshing.value) return

	touching.value = true
	startY.value = e.touches[0].pageY
	currentY.value = startY.value
	refreshStatus.value = 'pull'
}

function onTouchMove(e) {
	if (!touching.value || isRefreshing.value) return

	currentY.value = e.touches[0].pageY
	const diff = currentY.value - startY.value

	if (diff > 0 && isScrollViewAtTop()) {
		refreshDistance.value = Math.min(diff * props.damping, props.maxDistance)
		contentTranslateY.value = refreshDistance.value

		if (refreshDistance.value >= props.threshold) {
			refreshStatus.value = 'release'
		} else {
			refreshStatus.value = 'pull'
		}

		e.preventDefault()
		e.stopPropagation()
	}
}

function onTouchEnd() {
	if (!touching.value) return

	touching.value = false

	if (refreshDistance.value >= props.threshold && !isRefreshing.value) {
		startRefresh()
		emit('refresh')
	} else {
		resetRefresh()
	}
}

function handleScroll(e) {
	emit('scroll', e)
}

function handleScrollToLower(e) {
	if (props.showLoadmore && props.loadmoreProps.status === 'loadmore') {
		emit('loadmore')
	}
}

watch(() => props.refreshing, (newVal) => {
	if (!newVal) {
		finishRefresh()
	} else {
		startRefresh()
	}
})

defineExpose({
	finishRefresh,
	startRefresh
})
</script>


<style scoped lang="scss">
.up-pull-refresh {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.refresh-area {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  transition: height 0.2s ease-out;
}

.refresh-content-wrapper {
  height: 100%;
  transition: transform 0.2s ease-out;
}

.scroll-wrapper {
  height: 100%;
}

.refresh-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-bottom: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #666;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.refresh-text {
  font-size: 14px;
  color: #666;
}
</style>
