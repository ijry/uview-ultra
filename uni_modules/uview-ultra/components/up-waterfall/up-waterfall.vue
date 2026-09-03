<template>
    <view class="up-waterfall">
        <!-- 新增支持多列布局 -->
        <view
            v-for="(column, index) in columnList"
            :key="index"
            :ref="`up-column-${index}`"
            :id="`up-column-${index}`"
            class="up-column"
        >
            <slot name="column"
                :colIndex="index"
                :colList="column">
            </slot>
            <slot name="left"
                :colIndex="index"
                :leftList="column">
            </slot>
            <template v-if="!$slots['left'] && !$slots['column']" v-for="(item, itemIndex) in column" :key="itemIndex">
                <slot :item="item" :itemIndex="itemIndex"></slot>
            </template>
        </view>
    </view>
</template>

<script setup>
/**
 * waterfall 瀑布流
 * @description 这是一个瀑布流形式的组件，对原组件进行升级已经支持自定义列数模式，便于适配不同屏幕。搭配loadMore 加载更多组件，让您开箱即用，眼前一亮。
 * @tutorial https://uview-plus.jiangruyi.com/components/waterfall.html
 * @property {Array} flow-list 用于渲染的数据
 * @property {String Number} add-time 单条数据添加到队列的时间间隔，单位ms，见上方注意事项说明（默认200）
 * @property {String Number} columns 瀑布流列数，默认为2，设置为auto时自动根据屏幕宽度调整列数
 * @example <up-waterfall :flowList="flowList"></up-waterfall>
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { sleep } from '../../libs/function/index'

defineOptions({
	name: 'up-waterfall',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	// #ifdef VUE2
	value: {
		// 瀑布流数据
		type: Array,
		required: true,
		default: function() {
			return []
		}
	},
	// #endif
	// #ifdef VUE3
	modelValue: {
		// 瀑布流数据
		type: Array,
		required: true,
		default: function() {
			return []
		}
	},
	// #endif
	// 每次向结构插入数据的时间间隔，单位ms
	// 单位ms
	addTime: {
		type: [Number, String],
		default: 200
	},
	// id值，用于清除某一条数据时，根据此idKey名称找到并移除，如数据为{idx: 22, name: 'lisa'}
	// 那么该把idKey设置为idx
	idKey: {
		type: String,
		default: 'id'
	},
	// 瀑布流列数
	columns: {
		type: [Number, String],
		default: 2
	},
	// 瀑布流最小列数
	columnsMin: {
		type: [Number, String],
		default: 2
	},
	// 最小列宽
	minColumnWidth: {
		type: Number,
		default: 230
	}
})

const emit = defineEmits(['update:modelValue', 'after-add-one', 'after-add-all', 'input'])
const { $uGetRect } = useUltraUI(props)

const columnList = ref([[]])
const children = ref([])
const initialized = ref(false)
const windowWidth = ref(375)
const windowHeight = ref(0)
let resizeTimer = null
const distributionQueue = []
let distributionRunning = false
let distributionPromise = null
let distributionGeneration = 0
// 每个分配循环持有独立令牌：锁被强制重置后新循环接管，旧循环恢复时只能安静退出
let distributionRunToken = 0

const copyFlowList = computed(() => {
	// #ifdef VUE3
	if (!props.modelValue || props.modelValue.length == 0) {
		return []
	}
	return cloneData(props.modelValue)
	// #endif
	// #ifdef VUE2
	return cloneData(props.value)
	// #endif
})

initColumnList()

watch(copyFlowList, (nVal, oVal) => {
	if (!nVal || nVal.length == 0) {
		clear(false)
	} else {
		if (columnList.value.length == 1) {
			initColumnList()
		}
		if (!isPureAppend(nVal, oVal)) {
			redistributeData(nVal)
			return
		}
		const startIndex = Array.isArray(oVal) && oVal.length > 0 ? oVal.length : 0
		handleData(nVal.slice(startIndex))
	}
}, { immediate: true })

watch(() => props.columns, () => {
	if (copyFlowList.value.length > 0) {
		redistributeData(copyFlowList.value)
	} else {
		clear(false)
	}
})

onMounted(() => {
	initialized.value = true
	// #ifdef H5
	if (props.columns === 'auto') {
		uni.onWindowResize(handleWindowResize)
	}
	// #endif
})

onBeforeUnmount(() => {
	// #ifdef H5
	if (props.columns === 'auto') {
		uni.offWindowResize(handleWindowResize)
	}
	// #endif
})

function initColumnList() {
	windowWidth.value = uni.getSystemInfoSync().windowWidth
	const cols = getColumnsCount()
	columnList.value = Array.from({ length: cols }, () => [])
}

function getColumnsCount() {
	if (props.columns === 'auto') {
		const columnGap = 7
		let columnCount = Math.max(1, Math.floor(windowWidth.value / (props.minColumnWidth + columnGap)))
		if (columnCount < props.columnsMin) {
			columnCount = props.columnsMin
		}
		return columnCount
	}
	return parseInt(props.columns) || 2
}

function handleWindowResize(res) {
	windowWidth.value = res.size.windowWidth
	windowHeight.value = res.size.windowHeight
	if (resizeTimer) {
		clearTimeout(resizeTimer)
	}
	resizeTimer = setTimeout(() => {
		const newColumnsCount = getColumnsCount()
		const oldColumnsCount = columnList.value.length
		if (newColumnsCount !== oldColumnsCount) {
			redistributeData(copyFlowList.value)
		}
	}, 300)
}

function redistributeData(data) {
	// 强制重置锁状态，确保能重新开始分配
	distributionRunning = false
	distributionPromise = null
	clear(false)
	const allData = cloneData(data || [])
	return handleData(allData)
}

function isPureAppend(newData, oldData) {
	if (!Array.isArray(oldData) || oldData.length === 0) return true
	if (!Array.isArray(newData) || newData.length < oldData.length) return false
	return oldData.every((item, index) => JSON.stringify(item) === JSON.stringify(newData[index]))
}

function handleData(newData) {
	if (!newData || newData.length === 0) {
		return distributionPromise || Promise.resolve()
	}
	distributionQueue.push({
		generation: distributionGeneration,
		data: cloneData(newData)
	})
	if (!distributionRunning) {
		distributionPromise = runDistributionQueue()
	}
	return distributionPromise
}

async function runDistributionQueue() {
	if (distributionRunning) return
	distributionRunning = true
	const runToken = ++distributionRunToken
	try {
		while (distributionQueue.length > 0) {
			if (runToken !== distributionRunToken) return
			const task = distributionQueue.shift()
			if (task.generation !== distributionGeneration) continue
			await distributeData(task.data, task.generation, runToken)
		}
	} finally {
		// 仅当自己仍是当前循环时才释放锁，否则会清掉接管者的运行状态
		if (runToken === distributionRunToken) {
			distributionRunning = false
			distributionPromise = null
			if (distributionQueue.length > 0) {
				distributionPromise = runDistributionQueue()
			}
		}
	}
}

// 数据被重置或分配循环被接管时，当前循环应立即停止写入
function isStaleDistribution(generation, runToken) {
	return generation !== distributionGeneration || runToken !== distributionRunToken
}

async function distributeData(newData, generation, runToken) {
	let columnHeights = new Array(columnList.value.length).fill(0)
	for (const item of newData) {
		if (isStaleDistribution(generation, runToken)) return
		columnHeights = await getColumnHeights()
		if (isStaleDistribution(generation, runToken)) return

		const minHeightIndex = getMinHeightColumnIndex(columnHeights)
		columnList.value[minHeightIndex].push(item)

		await sleep(props.addTime)
		if (isStaleDistribution(generation, runToken)) return
		await nextTick()
		if (isStaleDistribution(generation, runToken)) return
		try {
			const rect = await $uGetRect(`#up-column-${minHeightIndex}`)
			if (isStaleDistribution(generation, runToken)) return
			if (rect.height) {
				columnHeights[minHeightIndex] = rect.height
				emit('after-add-one', {
					...item,
					height: rect.height
				})
			}
		} catch (e) {
		}
	}
	if (isStaleDistribution(generation, runToken)) return
	emit('after-add-all', {
		columnHeights: columnHeights,
		newData: newData
	})
}

async function getColumnHeights() {
	const columnHeights = new Array(columnList.value.length).fill(0)
	for (let i = 0; i < columnList.value.length; i++) {
		try {
			const rect = await $uGetRect(`#up-column-${i}`)
			columnHeights[i] = rect.height || 0
		} catch (e) {
			columnHeights[i] = 0
		}
	}
	return columnHeights
}

function getMinHeightColumnIndex(columnHeights) {
	let minIndex = 0
	for (let i = 1; i < columnHeights.length; i++) {
		const currentHeight = Number(columnHeights[i]) || 0
		const minHeight = Number(columnHeights[minIndex]) || 0
		if (currentHeight < minHeight) {
			minIndex = i
		} else if (currentHeight === minHeight) {
			const currentLength = columnList.value[i] ? columnList.value[i].length : 0
			const minLength = columnList.value[minIndex] ? columnList.value[minIndex].length : 0
			if (currentLength < minLength) {
				minIndex = i
			}
		}
	}
	return minIndex
}

function cloneData(data) {
	return JSON.parse(JSON.stringify(data))
}

function clear(bak = true) {
	distributionGeneration += 1
	distributionQueue.splice(0)
	// 强制重置分配锁状态，避免页面隐藏导致的永久锁死
	distributionRunning = false
	distributionPromise = null
	initColumnList()
	if (bak) {
		// #ifdef VUE2
		emit('input', [])
		// #endif
		// #ifdef VUE3
		emit('update:modelValue', [])
		// #endif
	}
}

function remove(id) {
	for (let i = 0; i < columnList.value.length; i++) {
		const index = columnList.value[i].findIndex((val) => val[props.idKey] == id)
		if (index !== -1) {
			columnList.value[i].splice(index, 1)
			break
		}
	}

	// #ifdef VUE2
	const valueIndex = props.value.findIndex((val) => val[props.idKey] == id)
	if (valueIndex !== -1) {
		const newValue = cloneData(props.value)
		newValue.splice(valueIndex, 1)
		emit('input', newValue)
	}
	// #endif
	// #ifdef VUE3
	const modelValueIndex = props.modelValue.findIndex((val) => val[props.idKey] == id)
	if (modelValueIndex !== -1) {
		const newModelValue = cloneData(props.modelValue)
		newModelValue.splice(modelValueIndex, 1)
		emit('update:modelValue', newModelValue)
	}
	// #endif
}

function modify(id, key, value) {
	let found = false
	let targetItem = null

	for (let i = 0; i < columnList.value.length; i++) {
		const index = columnList.value[i].findIndex((val) => val[props.idKey] == id)
		if (index !== -1) {
			columnList.value[i][index][key] = value
			targetItem = columnList.value[i][index]
			found = true
			break
		}
	}

	if (found && targetItem) {
		// #ifdef VUE2
		const valueIndex = props.value.findIndex((val) => val[props.idKey] == id)
		if (valueIndex !== -1) {
			let data = cloneData(props.value)
			data[valueIndex][key] = value
			emit('input', data)
		}
		// #endif
		// #ifdef VUE3
		const modelValueIndex = props.modelValue.findIndex((val) => val[props.idKey] == id)
		if (modelValueIndex !== -1) {
			let data = cloneData(props.modelValue)
			data[modelValueIndex][key] = value
			emit('update:modelValue', data)
		}
		// #endif
	}
}

defineExpose({
	children,
	clear,
	remove,
	modify,
	columnList
})
</script>


<style lang="scss" scoped>
    .up-waterfall {
        @include flex;
        flex-direction: row;
        align-items: flex-start;
    }

    .up-column {
        @include flex;
        flex: 1;
        flex-direction: column;
        overflow: hidden;
        /* #ifndef APP-NVUE */
        height: 100%;
        /* #endif */
        // 添加列之间的间距
        &:not(:first-child) {
            margin-left: 10rpx;
        }
    }

    .up-image {
        /* #ifndef APP-NVUE */
        max-width: 100%;
        /* #endif */
    }
</style>
