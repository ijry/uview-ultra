<template>
	<!-- #ifdef APP-NVUE -->
	<cell ref="up-index-item">
		<!-- #endif -->
		<view
			class="up-index-item"
			:id="`up-index-item-${id}`"
			:class="[`up-index-item-${id}`]"
		>
			<slot />
		</view>
		<!-- #ifdef APP-NVUE -->
	</cell>
	<!-- #endif -->
</template>

<script setup>
	import { getCurrentInstance, onMounted, ref } from 'vue'
	import { props as itemProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { sleep, error } from '../../libs/function/index'
	// #ifdef APP-NVUE
	// 由于weex为阿里的KPI业绩考核的产物，所以不支持百分比单位，这里需要通过dom查询组件的宽度
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * IndexItem 
	 * @description 
	 * @tutorial https://uview-plus.jiangruyi.com/components/indexList.html
	 * @property {String}
	 * @event {Function}
	 * @example
	 */
	defineOptions({
		name: 'up-index-item',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...itemProps.props
	})
	const instance = getCurrentInstance()
	const proxy = instance?.proxy
	const { parent, getParentData, $uGetRect } = useUltraUI(props)
	// 本组件到滚动条顶部的距离
	const top = ref(0)
	const height = ref(0)
	const id = ref('')
	// 子组件u-index-anchor的实例
	const anchor = ref({})

	function init() {
		// 此处会活动父组件实例，并赋值给实例的parent属性
		getParentData('up-index-list')
		if (!parent.value) {
			return error('up-index-item必须要搭配up-index-list组件使用')
		}
		sleep().then(() =>{
			getIndexItemRect().then(size => {
				// 由于对象的引用特性，此处会同时生效到父组件的children数组的本实例的top属性中，供父组件判断读取
				top.value = Math.ceil(size.top)
				height.value = Math.ceil(size.height)
			})
		})
	}

	function getIndexItemRect() {
		return new Promise(resolve => {
			// #ifndef APP-NVUE
			$uGetRect('.up-index-item').then(size => {
				resolve(size)
			})
			// #endif

			// #ifdef APP-NVUE
			const ref = proxy.$refs['up-index-item']
			dom.getComponentRect(ref, res => {
				resolve(res.size)
			})
			// #endif
		})
	}

	onMounted(() => {
		init()
	})

	defineExpose({
		top,
		height,
		id,
		anchor,
		init,
		getIndexItemRect
	})
</script>

<style lang="scss" scoped>
	
</style>
