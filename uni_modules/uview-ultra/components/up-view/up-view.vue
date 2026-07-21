<template>
	<view class="up-view" :style="viewStyle" @click="clickHandler">
		<slot></slot>
	</view>
</template>

<script setup>
import { computed } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-view',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	backgroundColor: {
		type: String,
		default: ''
	},
	color: {
		type: String,
		default: ''
	},
	flexDirection: {
		type: String,
		default: ''
	},
	justifyContent: {
		type: String,
		default: ''
	},
	alignItems: {
		type: String,
		default: ''
	},
	flex1: {
		type: [String, Number],
		default: ''
	},
	width: {
		type: String,
		default: ''
	},
	height: {
		type: String,
		default: ''
	},
	padding: {
		type: String,
		default: ''
	},
	margin: {
		type: String,
		default: ''
	},
	borderColor: {
		type: String,
		default: ''
	}
})
const emit = defineEmits(['click'])

const viewStyle = computed(() => {
	const style = {}
	if (props.backgroundColor) style.backgroundColor = props.backgroundColor
	if (props.color) style.color = props.color
	if (props.flexDirection) style.flexDirection = props.flexDirection
	if (props.justifyContent) style.justifyContent = props.justifyContent
	if (props.alignItems) style.alignItems = props.alignItems
	if (props.flex1 !== '') style.flex = props.flex1
	if (props.width) style.width = props.width
	if (props.height) style.height = props.height
	if (props.padding) style.padding = props.padding
	if (props.margin) style.margin = props.margin
	if (props.borderColor) style.borderColor = props.borderColor
	return style
})

function clickHandler() {
	emit('click')
}
</script>


<style lang="scss" scoped>
.up-view {
	display: flex;
}
</style>
