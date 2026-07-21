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

watch(copyFlowList, (nVal, oVal) => {
	if (!nVal || nVal.length == 0) {
		clear(false)
	} else {
		if (columnList.value.length == 1) {
			initColumnList()
		}
		const startIndex = Array.isArray(oVal) && oVal.length > 0 ? oVal.length : 0
		handleData(nVal.slice(startIndex))
	}
}, { immediate: true })

watch(() => props.columns, () => {
	initColumnList()
	if (copyFlowList.value.length > 0) {
		redistributeData()
	}
})

initColumnList()

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
			redistributeData()
		}
	}, 300)
}

async function redistributeData() {
	initColumnList()
	const allData = cloneData(copyFlowList.value)
	handleData(allData)
}

async function handleData(newData) {
	if (!newData || newData.length === 0) return

	const columnHeights = new Array(columnList.value.length).fill(0)

	for (let i = 0; i < columnList.value.length; i++) {
		try {
			const rect = await $uGetRect(`#up-column-${i}`)
			columnHeights[i] = rect.height || 0
		} catch (e) {
			columnHeights[i] = 0
		}
	}

	for (let item of newData) {
		const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights))
		columnList.value[minHeightIndex].push(item)

		await sleep(props.addTime)
		await nextTick(async () => {
			try {
				const rect = await $uGetRect(`#up-column-${minHeightIndex}`)
				if (rect.height) {
					columnHeights[minHeightIndex] = rect.height
					emit('after-add-one', {
						...item,
						height: rect.height
					})
				}
			} catch (e) {
			}
		})
	}
	emit('after-add-all', {
		columnHeights: columnHeights,
		newData: newData
	})
}

function cloneData(data) {
	return JSON.parse(JSON.stringify(data))
}

function clear(bak = true) {
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
