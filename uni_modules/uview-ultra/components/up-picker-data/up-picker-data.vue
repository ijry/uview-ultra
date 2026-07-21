<template>
	<view class="up-picker-data">
		<view class="up-picker-data__trigger">
			<slot name="trigger"></slot>
			<up-input
				v-if="!$slots.trigger"
				:model-value="current"
				disabled
				disabled-color="#ffffff"
				:placeholder="title"
				border="none"
			></up-input>
			<view class="up-picker-data__trigger__cover" @click="show = true"></view>
		</view>
		<up-picker
			:show="show"
			:columns="columns"
			:key-name="labelKey"
			:default-index="defaultIndex"
			@confirm="confirm"
			@cancel="cancel"
			@close="close"
		></up-picker>
	</view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-picker-data',
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
		default: 'id'
	},
	labelKey: {
		type: String,
		default: 'name'
	}
})
const emit = defineEmits(['update:modelValue', 'cancel', 'close', 'confirm'])

const show = ref(false)
const current = ref('')
const defaultIndex = ref([])

const columns = computed(() => {
	return [props.options]
})

function syncCurrent() {
	const model = props.modelValue == null ? '' : props.modelValue.toString()
	current.value = ''
	defaultIndex.value = []
	props.options.forEach((item, index) => {
		if ((item[props.valueKey] == null ? '' : item[props.valueKey].toString()) == model) {
			current.value = item[props.labelKey] == null ? '' : item[props.labelKey].toString()
			defaultIndex.value = [index]
		}
	})
}

watch(() => props.modelValue, () => {
	syncCurrent()
}, { immediate: true })

watch(() => props.options, () => {
	syncCurrent()
}, { immediate: true })

function cancel() {
	show.value = false
	emit('cancel')
}
function close() {
	show.value = false
	emit('close')
}
function confirm(e) {
	const value = e.value || []
	const item = value[0]
	show.value = false
	if (item) {
		emit('update:modelValue', item[props.valueKey])
		current.value = item[props.labelKey] == null ? '' : item[props.labelKey].toString()
	}
	emit('confirm')
}
</script>


<style lang="scss" scoped>
.up-picker-data__trigger {
	position: relative;
}

.up-picker-data__trigger__cover {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 10;
}
</style>
