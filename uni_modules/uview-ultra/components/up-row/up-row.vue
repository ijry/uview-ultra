<template>
	<view
	    class="up-row"
		ref="up-row"
	    :style="[rowStyle]"
	    @tap="clickHandler"
	>
		<slot />
	</view>
</template>

<script setup>
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	import { computed, getCurrentInstance } from 'vue'
	import { propsRow } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, deepMerge, sleep } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-row',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...propsRow.props
	})
	const emit = defineEmits(['click'])
	const instance = getCurrentInstance()
	const { children, $uGetRect } = useUltraUI(props)

	const uJustify = computed(() => {
		if (props.justify == 'end' || props.justify == 'start') return 'flex-' + props.justify
		else if (props.justify == 'around' || props.justify == 'between') return 'space-' + props.justify
		else return props.justify
	})

	const uAlignItem = computed(() => {
		if (props.align == 'top') return 'flex-start'
		if (props.align == 'bottom') return 'flex-end'
		else return props.align
	})

	const rowStyle = computed(() => {
		const style = {
			alignItems: uAlignItem.value,
			justifyContent: uJustify.value
		}
		// 消除 up-col gutter 造成的首尾半间距。
		if (props.gutter) {
			style.marginLeft = addUnit(-Number(props.gutter) / 2)
			style.marginRight = addUnit(-Number(props.gutter) / 2)
		}
		return deepMerge(style, addStyle(props.customStyle))
	})

	function clickHandler() {
		emit('click')
	}

	async function getComponentWidth() {
		await sleep()
		return new Promise(resolve => {
			// #ifndef APP-NVUE
			$uGetRect('.up-row').then(res => {
				resolve(res.width)
			})
			// #endif
			// #ifdef APP-NVUE
			dom.getComponentRect(instance.proxy.$refs['up-row'], (res) => {
				resolve(res.size.width)
			})
			// #endif
		})
	}

	function getProps() {
		return {
			gutter: props.gutter,
			justify: props.justify,
			align: props.align
		}
	}

	defineExpose({
		children,
		getComponentWidth,
		getProps
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
	
	.up-row {
		@include flex;
	}
</style>
