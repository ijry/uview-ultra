<template>
	<!-- #ifdef APP-NVUE -->
	<cell>
		<!-- #endif -->
		<view
			class="up-list-item"
			:ref="`up-list-item-${anchor}`"
			:anchor="`up-list-item-${anchor}`"
			:class="[`up-list-item-${anchor}`]"
		>
			<slot />
		</view>
		<!-- #ifdef APP-NVUE -->
	</cell>
	<!-- #endif -->
</template>

<script setup>
	import { getCurrentInstance, inject, onMounted, ref, toRef, watch } from 'vue'
	import { props as listItemProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { getWindowInfo } from '../../libs/function/index.js'
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * List 列表
	 * @description 该组件为高性能列表组件
	 * @tutorial https://uview-plus.jiangruyi.com/components/list.html
	 * @property {String | Number}	anchor	用于滚动到指定item
	 * @example <up-list-ite v-for="(item, index) in indexList" :key="index" ></up-list-item>
	 */
	defineOptions({
		name: 'up-list-item',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...listItemProps.props
	})
	const instance = getCurrentInstance()
	const uList = inject('uList', null)
	const { parent, getParentData, $uGetRect } = useUltraUI(props)
	const anchor = toRef(props, 'anchor')
	// 节点信息
	const rect = ref({})
	const index = ref(0)
	const show = ref(true)
	const sys = getWindowInfo()

	function init() {
		// 初始化数据
		updateParentData()
		index.value = parent.value?.children?.indexOf(instance.proxy) ?? 0
		resize()
	}

	function updateParentData() {
		getParentData('up-list')
	}

	function getPreLoadScreen() {
		return uList?.preLoadScreen?.value ?? parent.value?.preLoadScreen ?? 1
	}

	function getInnerScrollTop() {
		return uList?.innerScrollTop?.value ?? parent.value?.innerScrollTop ?? 0
	}

	function updateOffsetFromChild(top) {
		if (typeof uList?.updateOffsetFromChild === 'function') {
			uList.updateOffsetFromChild(top)
			return
		}
		parent.value?.updateOffsetFromChild?.(top)
	}

	function resize() {
		queryRect(`up-list-item-${props.anchor}`).then(size => {
			const lastChild = parent.value?.children?.[index.value - 1]
			rect.value = size
			const preLoadScreen = getPreLoadScreen()
			const windowHeight = sys.windowHeight
			// #ifndef APP-NVUE
			if (lastChild) {
				// children 是父级 up-list 共用的，里面可能混着 up-cell 等同父级组件
				// （它们也走 getParentData('up-list')），不是每个都有 rect。
				// 拿不到 rect 就跳过偏移，否则会抛 "Cannot read properties of undefined (reading 'top')"。
				const lastRect = lastChild.rect
				if (lastRect) {
					rect.value.top = (lastRect.top ?? 0) + (lastRect.height ?? 0)
				}
			}
			if (size.top >= getInnerScrollTop() + (1 + preLoadScreen) * windowHeight) {
				show.value = false
			}
			// #endif
		})
	}

	// 查询元素尺寸
	function queryRect(el) {
		return new Promise(resolve => {
			// #ifndef APP-NVUE
			$uGetRect(`.${el}`).then(size => {
				resolve(size)
			})
			// #endif

			// #ifdef APP-NVUE
			const ref = instance.proxy.$refs[el]
			dom.getComponentRect(ref, res => {
				resolve(res.size)
			})
			// #endif
		})
	}

	// #ifndef APP-NVUE
	watch(() => uList?.innerScrollTop?.value, (n = 0) => {
		const preLoadScreen = getPreLoadScreen()
		const windowHeight = sys.windowHeight
		if (n <= windowHeight * preLoadScreen) {
			updateOffsetFromChild(0)
		} else if (rect.value.top <= n - windowHeight * preLoadScreen) {
			updateOffsetFromChild(rect.value.top)
		}
	})
	// #endif

	onMounted(() => {
		init()
	})

	defineExpose({
		anchor,
		rect,
		index,
		show,
		init,
		updateParentData,
		resize,
		queryRect
	})
</script>

<style lang="scss" scoped>

	.up-list-item {}
</style>
