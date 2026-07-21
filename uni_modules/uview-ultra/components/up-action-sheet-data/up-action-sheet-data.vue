<template>
	<view class="up-action-sheet-data">
		<view class="up-action-sheet-data__trigger">
			<slot name="trigger"></slot>
			<up-input
				v-if="!$slots.trigger"
				:model-value="current"
				disabled
				disabled-color="#ffffff"
				:placeholder="title"
				border="none"
			></up-input>
			<view class="up-action-sheet-data__trigger__cover" @click="show = true"></view>
		</view>
		<up-action-sheet
			:show="show"
			:actions="options"
			:title="title"
			:description="description"
			@close="show = false"
			@select="select"
		></up-action-sheet>
	</view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-action-sheet-data',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	modelValue: {
		type: [String, Number],
		default: ''
	},
	title: {
		type: String,
		default: ''
	},
	description: {
		type: String,
		default: ''
	},
	options: {
		type: Array,
		default: () => []
	},
	valueKey: {
		type: String,
		default: 'value'
	},
	labelKey: {
		type: String,
		default: 'name'
	}
})
const emit = defineEmits(['update:modelValue'])

const show = ref(false)
const current = ref('')

function syncCurrent() {
	const model = props.modelValue == null ? '' : props.modelValue.toString()
	current.value = ''
	props.options.forEach((item) => {
		if ((item[props.valueKey] == null ? '' : item[props.valueKey].toString()) == model) {
			current.value = item[props.labelKey] == null ? '' : item[props.labelKey].toString()
		}
	})
}

watch(() => props.modelValue, () => {
	syncCurrent()
}, { immediate: true })

watch(() => props.options, () => {
	syncCurrent()
}, { immediate: true })

function select(item) {
	show.value = false
	emit('update:modelValue', item[props.valueKey])
	current.value = item[props.labelKey] == null ? '' : item[props.labelKey].toString()
}
</script>


<style lang="scss" scoped>
.up-action-sheet-data__trigger {
	position: relative;
}

.up-action-sheet-data__trigger__cover {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}
</style>
