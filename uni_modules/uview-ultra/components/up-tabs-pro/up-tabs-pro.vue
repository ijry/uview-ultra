<template>
	<view class="up-tabs-pro" :class="customClass" :style="addStyle(customStyle)" v-bind="$attrs">
		<up-tabs
			:list="safeList"
			:keyName="keyName"
			:current="innerCurrent"
			:lineColor="resolvedLineColor"
			:activeStyle="activeStyle"
			:inactiveStyle="inactiveStyle"
			:lineWidth="lineWidth"
			:lineHeight="lineHeight"
			:lineBgSize="lineBgSize"
			:itemStyle="itemStyle"
			:scrollable="scrollable"
			:duration="Number(duration)"
			:iconStyle="iconStyle"
			:shapeMode="shapeMode"
			@update:current="updateCurrent"
			@click="clickHandler"
			@longPress="longPressHandler"
			@change="changeHandler"
		>
			<template v-if="$slots.left" #left>
				<slot name="left" />
			</template>
			<template v-if="$slots.icon" #icon="scope">
				<slot name="icon" :item="scope.item" :keyName="scope.keyName" :index="scope.index" />
			</template>
			<template v-if="$slots.tab || $slots.content" #content="scope">
				<slot name="tab" :item="scope.item" :keyName="scope.keyName" :index="scope.index">
					<slot name="content" :item="scope.item" :keyName="scope.keyName" :index="scope.index" />
				</slot>
			</template>
			<template v-if="$slots.right" #right>
				<slot name="right" />
			</template>
		</up-tabs>
		<view
			v-if="showContent"
			class="up-tabs-pro__content"
			:class="contentClass"
			:style="addStyle(contentStyle)"
		>
			<slot
				:current="innerCurrent"
				:index="innerCurrent"
				:item="currentItem"
				:value="currentValue"
				:list="safeList"
			/>
		</view>
	</view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI'
import { addStyle } from '../../libs/function/index'

defineOptions({
	name: 'up-tabs-pro',
	inheritAttrs: false
})

const props = defineProps({
	...commonProps,
	list: {
		type: Array,
		default: () => []
	},
	keyName: {
		type: String,
		default: 'name'
	},
	current: {
		type: [Number, String],
		default: 0
	},
	contentMode: {
		type: String,
		default: 'static'
	},
	lineColor: {
		type: String,
		default: ''
	},
	activeStyle: {
		type: [String, Object],
		default: () => ({})
	},
	inactiveStyle: {
		type: [String, Object],
		default: () => ({})
	},
	lineWidth: {
		type: [String, Number],
		default: 20
	},
	lineHeight: {
		type: [String, Number],
		default: 3
	},
	lineBgSize: {
		type: String,
		default: 'cover'
	},
	itemStyle: {
		type: [String, Object],
		default: () => ({})
	},
	scrollable: {
		type: Boolean,
		default: true
	},
	duration: {
		type: [Number, String],
		default: 300
	},
	iconStyle: {
		type: [String, Object],
		default: () => ({})
	},
	shapeMode: {
		type: String,
		default: ''
	},
	showContent: {
		type: Boolean,
		default: true
	},
	contentClass: {
		type: String,
		default: ''
	},
	contentStyle: {
		type: [String, Object, Array],
		default: ''
	},
	bindIndexRef: {
		type: String,
		default: ''
	}
})

const emit = defineEmits(['click', 'longPress', 'change', 'update:current'])
const innerCurrent = ref(0)

const safeList = computed(() => Array.isArray(props.list) ? props.list : [])
const currentItem = computed(() => safeList.value[innerCurrent.value] || null)
const currentValue = computed(() => currentItem.value ? currentItem.value[props.keyName] : undefined)
const resolvedLineColor = computed(() => props.lineColor || undefined)

function normalizeCurrent(value) {
	const parsed = Number(value)
	const nextValue = Number.isFinite(parsed) ? parsed : 0
	const maxIndex = Math.max(safeList.value.length - 1, 0)
	return Math.min(Math.max(nextValue, 0), maxIndex)
}

function updateCurrent(value) {
	const nextCurrent = normalizeCurrent(value)
	innerCurrent.value = nextCurrent
	emit('update:current', nextCurrent)
}

function clickHandler(item, index, event) {
	emit('click', item, index, event)
}

function longPressHandler(item, index) {
	emit('longPress', item, index)
}

function changeHandler(item, index) {
	updateCurrent(index)
	emit('change', item, index)
}

watch(() => props.current, (value) => {
	innerCurrent.value = normalizeCurrent(value)
}, { immediate: true })

watch(() => props.list, () => {
	const nextCurrent = normalizeCurrent(innerCurrent.value)
	if (nextCurrent !== innerCurrent.value) {
		innerCurrent.value = nextCurrent
		emit('update:current', nextCurrent)
	}
}, { deep: true })
</script>

<style lang="scss" scoped>
	.up-tabs-pro {
		width: 100%;
		box-sizing: border-box;

		&__content {
			width: 100%;
			box-sizing: border-box;
		}
	}
</style>
