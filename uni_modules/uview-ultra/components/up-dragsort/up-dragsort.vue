<template>
    <view class="up-dragsort"
        :class="[direction == 'horizontal' ? 'up-dragsort--horizontal' : '', direction == 'vertical' ? 'up-dragsort--vertical' : '', direction == 'all' ? 'up-dragsort--all' : '']"
        :style="movableAreaStyle"
        >
        <movable-area class="up-dragsort-area">
            <movable-view v-for="(item, index) in list" :key="getItemId(item, index)" :id="`up-dragsort-item-${instanceId}-${getItemId(item, index)}`"
                class="up-dragsort-item" :class="{ 'dragging': dragItemId === getItemId(item, index), disabled: !draggable || item.draggable === false }"
                :direction="direction === 'all' ? 'all' : direction" :x="item.x" :y="item.y" :inertia="false"
                :disabled="!draggable || dragItemId === null || item.draggable === false" @change="onChange(getItemId(item, index), $event)"
                @touchstart="onTouchStart(getItemId(item, index), $event)" @touchend="onTouchEnd" @touchcancel="onTouchEnd" @touchmove="onTouchMove">
                <view class="up-dragsort-item-content">
                    <view
                        class="up-dragsort-item__handler"
                        v-if="hasHandlerSlot"
                        data-action="handler"
                        @touchstart="onTouchStart(getItemId(item, index), $event)"
                    >
                        <slot name="handler" :item="item" :index="getItemIndex(getItemId(item, index))"></slot>
                    </view>
                    <slot :item="item" :index="getItemIndex(getItemId(item, index))">
                        {{ item.label }}
                    </slot>
                </view>
            </movable-view>
        </movable-area>
    </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, ref, useSlots, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI'
import { guid, sleep } from '../../libs/function/index'

defineOptions({
	name: 'up-dragsort',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	initialList: {
		type: Array,
		required: true,
		default: () => []
	},
	draggable: {
		type: Boolean,
		default: true
	},
	vibrate: {
		type: Boolean,
		default: true
	},
	direction: {
		type: String,
		default: 'vertical',
		validator: (value) => ['vertical', 'horizontal', 'all'].includes(value)
	},
	// 列数配置属性，用于all模式
	columns: {
		type: Number,
		default: 3
	}
})
const emit = defineEmits(['drag-end'])
const instance = getCurrentInstance()
const proxy = instance?.proxy || null
const slots = useSlots()

const list = ref([])
const orderIds = ref([])
const instanceId = guid(8)
const dragItemId = ref(null)
const sortChanged = ref(false)
const itemHeight = ref(0)
const itemWidth = ref(0)
const areaWidth = ref(0)
const areaHeight = ref(0)
const currentPosition = ref({
	x: 0,
	y: 0
})
let timer = null
const hasHandlerSlot = computed(() => !!(slots['handler'] || slots['$handler']))

const movableAreaStyle = computed(() => {
	if (props.direction === 'vertical') {
		return {
			height: itemHeight.value ? `${list.value.length * itemHeight.value}px` : 'auto',
			width: '100%'
		}
	} else if (props.direction === 'horizontal') {
		return {
			height: itemHeight.value ? `${itemHeight.value}px` : 'auto',
			width: itemWidth.value ? `${list.value.length * itemWidth.value}px` : 'auto'
		}
	} else {
		const rows = Math.ceil(list.value.length / props.columns)
		return {
			height: itemHeight.value ? `${rows * itemHeight.value}px` : 'auto',
			width: '100%'
		}
	}
})

onMounted(async () => {
	await nextTick()
	initList()
	calculateItemSize()
	calculateAreaSize()
})

watch(() => props.initialList, () => {
	nextTick(() => {
		initList()
	})
})

watch(() => props.direction, () => {
	nextTick(() => {
		initList()
		calculateItemSize()
		calculateAreaSize()
	})
})

watch(() => props.columns, () => {
	if (props.direction === 'all') {
		nextTick(() => {
			initList()
			updatePositions()
		})
	}
})

function initList() {
	orderIds.value = props.initialList.map((item, index) => getItemId(item, index))
	const currentItems = new Map(list.value.map((item, index) => [getItemId(item, index), item]))
	const initialItems = new Map(props.initialList.map((item, index) => [getItemId(item, index), item]))
	const renderIds = [
		...list.value.map((item, index) => getItemId(item, index)).filter(itemId => initialItems.has(itemId)),
		...orderIds.value.filter(itemId => !currentItems.has(itemId))
	]
	list.value = renderIds.map((itemId) => {
		const item = initialItems.get(itemId)
		const index = getItemIndex(itemId)
		let x
		let y

		if (props.direction === 'horizontal' && itemWidth.value) {
			x = index * itemWidth.value
			y = 0
		} else if (props.direction === 'vertical' && itemHeight.value) {
			x = 0
			y = index * itemHeight.value
		} else if (itemWidth.value && itemHeight.value) {
			const col = index % props.columns
			const row = Math.floor(index / props.columns)
			x = col * itemWidth.value
			y = row * itemHeight.value
		}

		return {
			...item,
			x,
			y
		}
	})
}

function getItemId(item, index) {
	return item.id ?? index
}

function getItemIndex(itemId) {
	return orderIds.value.indexOf(itemId)
}

async function calculateItemSize() {
	await sleep(30)
	return new Promise((resolve) => {
		uni.createSelectorQuery()
			.in(proxy)
			.select('.up-dragsort-item-content')
			.boundingClientRect((res) => {
				if (res) {
					itemHeight.value = res.height || 40
					itemWidth.value = res.width || 80
					updatePositions()
				}
				resolve(res)
			})
			.exec()
	})
}

async function calculateAreaSize() {
	await sleep(30)
	return new Promise((resolve) => {
		uni.createSelectorQuery()
			.in(proxy)
			.select('.up-dragsort-area')
			.boundingClientRect((res) => {
				if (res) {
					areaWidth.value = res.width || 300
					areaHeight.value = res.height || 300
				}
				resolve(res)
			})
			.exec()
	})
}

function updatePositions(isDragging) {
	list.value = list.value.map((item, renderIndex) => {
		const itemId = getItemId(item, renderIndex)
		if (isDragging && dragItemId.value === itemId) {
			return item
		}
		const index = getItemIndex(itemId)

		if (props.direction === 'vertical') {
			return {
				...item,
				x: 0,
				y: index * itemHeight.value
			}
		}

		if (props.direction === 'horizontal') {
			return {
				...item,
				x: index * itemWidth.value,
				y: 0
			}
		}

		const col = index % props.columns
		const row = Math.floor(index / props.columns)

		return {
			...item,
			x: col * itemWidth.value,
			y: row * itemHeight.value
		}
	})
}

function onTouchStart(itemId, e) {
	if (hasHandlerSlot.value && e.currentTarget.dataset.action !== 'handler') {
		return
	}
	const index = list.value.findIndex((item, renderIndex) => getItemId(item, renderIndex) === itemId)
	if (index === -1 || list.value[index]?.draggable === false) return
	if (timer) clearTimeout(timer)
	sortChanged.value = false
	dragItemId.value = itemId
}

function onTouchMove(e) {
	if (dragItemId.value !== null) {
		e.stopPropagation()
		e.preventDefault()
	}
}

function onChange(itemId, event) {
	if (!event.detail.source || event.detail.source !== 'touch') return
	const index = getItemIndex(itemId)
	if (index === -1) return

	currentPosition.value.x = event.detail.x
	currentPosition.value.y = event.detail.y

	if (props.direction === 'all') {
		handleAllModeChange(index)
	} else {
		let itemSize = 0
		let targetIndex = -1

		if (props.direction === 'vertical') {
			itemSize = itemHeight.value
			targetIndex = Math.max(0, Math.min(
				Math.round(currentPosition.value.y / itemSize),
				list.value.length - 1
			))
		} else if (props.direction === 'horizontal') {
			itemSize = itemWidth.value
			targetIndex = Math.max(0, Math.min(
				Math.round(currentPosition.value.x / itemSize),
				list.value.length - 1
			))
		}

		if (targetIndex !== index) {
			reorderItems(index, targetIndex)
		}
	}
}

function handleAllModeChange(index) {
	const col = Math.max(0, Math.min(Math.round(currentPosition.value.x / itemWidth.value), props.columns - 1))
	const row = Math.max(0, Math.round(currentPosition.value.y / itemHeight.value))

	let targetIndex = row * props.columns + col
	targetIndex = Math.max(0, Math.min(targetIndex, list.value.length - 1))

	if (targetIndex !== index) {
		reorderItems(index, targetIndex)
	}
}

function reorderItems(fromIndex, toIndex) {
	const movedItemId = orderIds.value.splice(fromIndex, 1)[0]
	orderIds.value.splice(toIndex, 0, movedItemId)
	sortChanged.value = true

	updatePositions(true)

	if (props.vibrate && uni.vibrateShort) {
		uni.vibrateShort({ type: 'light' })
	}
}

function onTouchEnd() {
	if (dragItemId.value === null) return
	const dragItem = list.value.find((item, index) => getItemId(item, index) === dragItemId.value)
	if (!dragItem) return

	if (props.direction === 'horizontal') {
		dragItem.x = currentPosition.value.x + 0.001
	} else if (props.direction === 'vertical' || props.direction === 'all') {
		dragItem.y = currentPosition.value.y + 0.001
		dragItem.x = currentPosition.value.x + 0.001
	}

	sleep(50).then(() => {
		updatePositions()
		if (sortChanged.value) {
			emit('drag-end', orderIds.value.map(itemId => list.value.find((item, index) => getItemId(item, index) === itemId)).filter(Boolean))
			sortChanged.value = false
		}
		timer = setTimeout(() => {
			dragItemId.value = null
		}, 600)
	})
}
</script>


<style scoped lang="scss">
.up-dragsort {
    width: 100%;
    height: auto;

    .up-dragsort-area {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .up-dragsort-item {
        position: absolute;
        width: 100%;
        transition: box-shadow 0.45s ease-out;
        cursor: pointer;

        &.dragging {
            z-index: 1000;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .up-dragsort-item-content {
            position: relative;
            padding: 0;
            box-sizing: border-box;
        }
    }

    &.up-dragsort--vertical {
        .up-dragsort-item {
            height: auto;
        }
    }

    &.up-dragsort--horizontal {
        .up-dragsort-area {
            display: flex;
            white-space: nowrap;
        }

        .up-dragsort-item {
            width: auto;
            height: auto;
        }
    }

    &.up-dragsort--all {
        .up-dragsort-item {
            width: auto;
            height: auto;
        }
    }
}
</style>
