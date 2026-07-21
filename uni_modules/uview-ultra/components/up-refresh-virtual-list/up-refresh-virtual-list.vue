<template>
  <up-pull-refresh
    :refreshing="refreshing"
    :threshold="50"
    @refresh="handleRefresh"
  >
    <up-virtual-list
      ref="virtualList"
      :list-data="listData"
      :item-height="itemHeight"
      :height="height"
      :buffer="buffer"
      :key-field="keyField"
      :scroll-top="scrollTop"
      @scroll="handleScroll"
    >
      <template #default="{ item, index }">
        <slot :item="item" :index="index"></slot>
      </template>
    </up-virtual-list>
  </up-pull-refresh>
</template>

<script setup>
import { ref } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-refresh-virtual-list',
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
	}
})
const emit = defineEmits(['refresh', 'scroll'])

const refreshing = ref(false)
const scrollTop = ref(0)
const virtualList = ref(null)

function handleRefresh() {
	refreshing.value = true
	emit('refresh')
}

function handleScroll(top) {
	scrollTop.value = top
	emit('scroll', top)
}

function finishRefresh() {
	refreshing.value = false
}

function scrollTo(top) {
	scrollTop.value = top
}

function scrollToTop() {
	scrollTo(0)
}

defineExpose({
	finishRefresh,
	scrollTo,
	scrollToTop,
	virtualList
})
</script>

