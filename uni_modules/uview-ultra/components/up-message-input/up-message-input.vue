<template>
	<up-code-input
		:maxlength="maxlength"
		:dot="dotFill"
		:mode="codeInputMode"
		:model-value="currentValue"
		:focus="focus"
		:bold="bold"
		:font-size="fontSize"
		:color="inactiveColor"
		:size="width"
		:disabled-keyboard="disabledKeyboard"
		:border-color="activeBorderColor"
		@change="onChange"
		@finish="onFinish"
		@update:modelValue="onModelValueUpdate"
	></up-code-input>
</template>

<script setup>
import { computed } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-message-input',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	maxlength: {
		type: [Number, String],
		default: 4
	},
	dotFill: {
		type: Boolean,
		default: false
	},
	mode: {
		type: String,
		default: 'box'
	},
	modelValue: {
		type: [String, Number],
		default: ''
	},
	value: {
		type: [String, Number],
		default: ''
	},
	breathe: {
		type: Boolean,
		default: true
	},
	focus: {
		type: Boolean,
		default: false
	},
	bold: {
		type: Boolean,
		default: false
	},
	fontSize: {
		type: [String, Number],
		default: 60
	},
	activeColor: {
		type: String,
		default: '#2979ff'
	},
	inactiveColor: {
		type: String,
		default: '#606266'
	},
	width: {
		type: [Number, String],
		default: '80'
	},
	disabledKeyboard: {
		type: Boolean,
		default: false
	}
})
const emit = defineEmits(['change', 'finish', 'update:modelValue'])

const currentValue = computed(() => {
	const modelText = props.modelValue == null ? '' : props.modelValue.toString()
	return modelText.length > 0 ? modelText : (props.value == null ? '' : props.value.toString())
})
const codeInputMode = computed(() => {
	return props.mode == 'box' ? 'box' : 'line'
})
const activeBorderColor = computed(() => {
	return props.mode == 'box' ? props.activeColor : props.inactiveColor
})

function onChange(value) {
	emit('change', value)
}
function onFinish(value) {
	emit('finish', value)
}
function onModelValueUpdate(value) {
	emit('update:modelValue', value)
}
</script>

