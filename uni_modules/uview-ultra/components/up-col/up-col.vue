<template>
	<view
	    class="up-col"
		ref="up-col"
	    :class="[
			'up-col-' + span
		]"
	    :style="[colStyle]"
	    @tap="clickHandler"
	>
		<slot></slot>
	</view>
</template>

<script setup>
	import { computed, onMounted, reactive, ref } from 'vue'
	import { propsCol } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addStyle, addUnit, deepMerge, getPx } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-col',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...propsCol.props
	})
	const emit = defineEmits(['click'])
	const parentData = reactive({
		gutter: 0
	})
	const width = ref(0)
	const gridNum = 12
	const { parent, getParentData } = useUltraUI(props, parentData)

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

	const colStyle = computed(() => {
		const style = {
			// 这里写成"padding: 0 10px"的形式是因为nvue的需要
			paddingLeft: addUnit(getPx(parentData.gutter) / 2),
			paddingRight: addUnit(getPx(parentData.gutter) / 2),
			alignItems: uAlignItem.value,
			justifyContent: uJustify.value,
			textAlign: props.textAlign,
			// #ifndef APP-NVUE
			// 在非nvue上，使用百分比形式
			flex: `0 0 ${100 / gridNum * props.span}%`,
			marginLeft: 100 / 12 * props.offset + '%',
			// #endif
			// #ifdef APP-NVUE
			// 在nvue上，由于无法使用百分比单位，这里需要获取父组件的宽度，再计算得出该有对应的百分比尺寸
			width: addUnit(Math.floor(width.value / gridNum * Number(props.span))),
			marginLeft: addUnit(Math.floor(width.value / gridNum * Number(props.offset))),
			// #endif
		}
		return deepMerge(style, addStyle(props.customStyle))
	})

	async function init() {
		getParentData('up-row')
		if (parent.value && typeof parent.value.getComponentWidth === 'function') {
			width.value = await parent.value.getComponentWidth()
		}
	}

	function clickHandler() {
		emit('click')
	}

	onMounted(() => {
		init()
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-col {
		padding: 0;
		/* #ifndef APP-NVUE */
		box-sizing:border-box;
		/* #endif */
		/* #ifdef MP */
		display: block;
		/* #endif */
	}

	// nvue下百分比无效
	/* #ifndef APP-NVUE */
	.up-col-0 {
		width: 0;
	}

	.up-col-1 {
		width: calc(100%/12);
	}

	.up-col-2 {
		width: calc(100%/12 * 2);
	}

	.up-col-3 {
		width: calc(100%/12 * 3);
	}

	.up-col-4 {
		width: calc(100%/12 * 4);
	}

	.up-col-5 {
		width: calc(100%/12 * 5);
	}

	.up-col-6 {
		width: calc(100%/12 * 6);
	}

	.up-col-7 {
		width: calc(100%/12 * 7);
	}

	.up-col-8 {
		width: calc(100%/12 * 8);
	}

	.up-col-9 {
		width: calc(100%/12 * 9);
	}

	.up-col-10 {
		width: calc(100%/12 * 10);
	}

	.up-col-11 {
		width: calc(100%/12 * 11);
	}

	.up-col-12 {
		width: calc(100%/12 * 12);
	}

	/* #endif */
</style>
