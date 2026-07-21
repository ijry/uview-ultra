<template>
    <view class="up-picker-warrper">
        <view v-if="hasInput"
			class="up-picker-input cursor-pointer"
			@click="showByClickInput = !showByClickInput">
            <slot>
                <view>
					{{ inputLabel && inputLabel.length ? inputLabel.join('/') : placeholder }}
				</view>
            </slot>
        </view>
		<up-popup
			:show="pageInline || show || (hasInput && showByClickInput)"
			:mode="popupMode"
			:pageInline="pageInline"
			@close="closeHandler"
		>
			<view class="up-picker">
				<up-toolbar
					v-if="showToolbar"
					:cancelColor="cancelColor"
					:confirmColor="confirmColor"
					:cancelText="cancelText"
					:confirmText="confirmText"
					:title="title"
					:rightSlot="toolbarRightSlot ? true : false"
					@cancel="cancel"
					@confirm="confirm"
				>
					<template #right>
						<slot name="toolbar-right"></slot>
					</template>
				</up-toolbar>
				<slot name="toolbar-bottom"></slot>
				<picker-view
					class="up-picker__view"
					:indicatorStyle="`height: ${addUnit(itemHeight)}`"
					:value="innerIndex"
					:immediateChange="immediateChange"
					:style="{
						height: `${addUnit(visibleItemCount * itemHeight)}`
					}"
					@change="changeHandler"
				>
					<picker-view-column
						v-for="(item, index) in innerColumns"
						:key="index"
						class="up-picker__view__column"
					>
						<view
							v-if="testArray(item)"
							class="up-picker__view__column__item up-line-1"
							v-for="(item1, index1) in item"
							:key="index1"
							:style="{
								height: addUnit(itemHeight),
								lineHeight: addUnit(itemHeight),
								fontWeight: index1 === innerIndex[index] ? 'bold' : 'normal',
								display: 'block'
							}"
						>{{ getItemText(item1) }}</view>
					</picker-view-column>
				</picker-view>
				<view
					v-if="loading"
					class="up-picker--loading"
				>
					<up-loading-icon mode="circle"></up-loading-icon>
				</view>
			</view>
		</up-popup>
    </view>
</template>

<script setup>
/**
 * up-picker
 * @description 选择器
 */
import { computed, nextTick, ref, watch } from 'vue'
import { props as pickerProps } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI'
import { addUnit, deepClone, sleep } from '../../libs/function/index.js'
import test from '../../libs/function/test.js'

defineOptions({
	name: 'up-picker',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...pickerProps.props
})
const emit = defineEmits(['close', 'cancel', 'confirm', 'change', 'update:modelValue'])

const lastIndex = ref([])
const innerIndex = ref([])
const innerColumns = ref([])
const columnIndex = ref(0)
const showByClickInput = ref(false)

const testArray = test.array

const inputLabel = computed(() => {
	const items = innerColumns.value.map((item, index) => item[innerIndex.value[index]])
	const res = []
	items.forEach((element) => {
		if (element && typeof element === 'object') {
			res.push(element[props.keyName])
		} else {
			res.push(element)
		}
	})
	return res
})

const inputValue = computed(() => {
	const items = innerColumns.value.map((item, index) => item[innerIndex.value[index]])
	const res = []
	items.forEach((element) => {
		if (element && typeof element === 'object') {
			res.push(element['id'])
		} else {
			res.push(element)
		}
	})
	return res
})

watch(() => props.defaultIndex, (n) => {
	setIndexs(n, true)
}, { immediate: true, deep: true })

watch(() => props.columns, (n) => {
	setColumns(n)
}, { immediate: true, deep: true })

function getItemText(item) {
	if (test.object(item)) {
		return item[props.keyName]
	}
	return item
}

function closeHandler() {
	if (props.closeOnClickOverlay) {
		if (props.hasInput) {
			showByClickInput.value = false
		}
		emit('close')
	}
}

function cancel() {
	if (props.hasInput) {
		showByClickInput.value = false
	}
	emit('cancel')
}

function confirm() {
	emit('update:modelValue', inputValue.value)
	if (props.hasInput) {
		showByClickInput.value = false
	}
	emit('confirm', {
		indexs: innerIndex.value,
		value: innerColumns.value.map((item, index) => item[innerIndex.value[index]]),
		values: innerColumns.value
	})
}

function changeHandler(e) {
	const {
		value
	} = e.detail
	let index = 0
	let nextColumnIndex = 0
	for (let i = 0; i < value.length; i++) {
		const item = value[i]
		if (item !== (lastIndex.value[i] || 0)) {
			nextColumnIndex = i
			index = item
			break
		}
	}
	columnIndex.value = nextColumnIndex
	const values = innerColumns.value
	setLastIndex(value)
	setIndexs(value)

	emit('update:modelValue', inputValue.value)

	emit('change', {
		// #ifndef MP-WEIXIN || MP-LARK
		// picker: this,
		// #endif
		value: innerColumns.value.map((item, idx) => item[value[idx]]),
		index,
		indexs: value,
		values,
		columnIndex: nextColumnIndex
	})
}

function setIndexs(index, setLast = false) {
	innerIndex.value = deepClone(index)
	if (setLast) {
		setLastIndex(index)
	}
}

function setLastIndex(index) {
	lastIndex.value = deepClone(index)
}

function setColumnValues(colIndex, values) {
	innerColumns.value.splice(colIndex, 1, values)
	setLastIndex(innerIndex.value.slice(0, colIndex))
	const tmpIndex = deepClone(innerIndex.value)
	for (let i = 0; i < innerColumns.value.length; i++) {
		if (i > columnIndex.value) {
			tmpIndex[i] = 0
		}
	}
	setIndexs(tmpIndex)
}

function getColumnValues(colIndex) {
	;(async () => {
		await sleep()
	})()
	return innerColumns.value[colIndex]
}

function setColumns(columns) {
	const prevColumns = innerColumns.value
	innerColumns.value = deepClone(columns)
	if (innerIndex.value.length === 0) {
		innerIndex.value = new Array(columns.length).fill(0)
	} else {
		const hasColumnsChangedFromEmpty = columns.some(
			(col, i) => col && col.length > 0 && (!prevColumns[i] || prevColumns[i].length === 0)
		)
		if (hasColumnsChangedFromEmpty) {
			const targetIndex = deepClone(innerIndex.value)
			innerIndex.value = []
			nextTick(() => {
				innerIndex.value = targetIndex
			})
		}
	}
}

function getIndexs() {
	return innerIndex.value
}

function getValues() {
	;(async () => {
		await sleep()
	})()
	return innerColumns.value.map((item, index) => item[innerIndex.value[index]])
}

defineExpose({
	setIndexs,
	setColumnValues,
	getColumnValues,
	setColumns,
	getIndexs,
	getValues,
	showByClickInput
})
</script>


<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-picker {
		position: relative;

		&__view {

			&__column {
				@include flex;
				flex: 1;
				justify-content: center;

				&__item {
					@include flex;
					justify-content: center;
					align-items: center;
					font-size: 16px;
					text-align: center;
					/* #ifndef APP-NVUE */
					display: block;
					/* #endif */
					color: $up-main-color;

					&--disabled {
						/* #ifndef APP-NVUE */
						cursor: not-allowed;
						/* #endif */
						opacity: 0.35;
					}
				}
			}
		}

		&--loading {
			position: absolute;
			top: 0;
			right: 0;
			left: 0;
			bottom: 0;
			@include flex;
			justify-content: center;
			align-items: center;
			background-color: rgba(255, 255, 255, 0.87);
			z-index: 1000;
		}
	}
</style>
