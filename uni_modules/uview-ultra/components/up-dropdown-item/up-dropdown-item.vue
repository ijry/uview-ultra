<template>
	<view class="up-dropdown-item" v-if="active" @touchmove.stop.prevent="() => {}" @tap.stop.prevent="() => {}">
		<block v-if="!$slots['default'] && !$slots['$default']">
			<scroll-view class="up-dropdown-item__scroll" scroll-y="true" :style="{
				height: addUnit(height)
			}">
				<view class="up-dropdown-item__options">
					<up-cell-group>
						<up-cell @click="cellClick(item['value'])" :arrow="false" :title="item['label']" v-for="(item, index) in options"
						 :key="index" :title-style="{
							color: modelValue == item['value'] ? activeColor : inactiveColor
						}">
							<up-icon v-if="modelValue == item['value']" name="checkbox-mark" :color="activeColor" size="32"></up-icon>
						</up-cell>
					</up-cell-group>
				</view>
			</scroll-view>
		</block>
		<slot v-else />
	</view>
</template>

<script setup>
	import { computed, onMounted, ref, toRef, watch } from 'vue'
	import { props as dropdownItemProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addUnit } from '../../libs/function/index'
	/**
	 * dropdown-item 下拉菜单
	 * @description 该组件一般用于向下展开菜单，同时可切换多个选项卡的场景
	 * @tutorial https://ijry.github.io/uview-plus/components/dropdown.html
	 * @property {String | Number} v-model 双向绑定选项卡选择值
	 * @property {String} title 菜单项标题
	 * @property {Array[Object]} options 选项数据，如果传入了默认slot，此参数无效
	 * @property {Boolean} disabled 是否禁用此选项卡（默认false）
	 * @property {String | Number} duration 选项卡展开和收起的过渡时间，单位ms（默认300）
	 * @property {String | Number} height 弹窗下拉内容的高度(内容超出将会滚动)（默认auto）
	 * @example <up-dropdown-item title="标题"></up-dropdown-item>
	 */
	defineOptions({
		name: 'up-dropdown-item',
		options: {
			styleIsolation: 'shared',
			// #ifdef MP-WEIXIN
			virtualHost: true
			// #endif
		},
	})

	const props = defineProps({
		...commonProps,
		...dropdownItemProps.props
	})
	const emit = defineEmits(['update:modelValue', 'input', 'change'])
	const { parent, getParentData } = useUltraUI(props)
	const active = ref(false) // 当前项是否处于展开状态
	const activeColor = ref('#2979ff') // 激活时左边文字和右边对勾图标的颜色
	const inactiveColor = ref('#606266') // 未激活时左边文字和右边对勾图标的颜色
	const title = toRef(props, 'title')
	const disabled = toRef(props, 'disabled')

	// 监听props是否发生了变化，有些值需要传递给父组件up-dropdown，无法双向绑定
	const propsChange = computed(() => {
		return `${props.title}-${props.disabled}`
	})

	function init() {
		// 获取父组件up-dropdown
		getParentData('up-dropdown')
		if (parent.value) {
			// 将子组件的激活颜色配置为父组件设置的激活和未激活时的颜色
			activeColor.value = parent.value.activeColor
			inactiveColor.value = parent.value.inactiveColor
			if (parent.value.children.length == 1) active.value = true
			// 父组件无法监听children的变化，故将子组件的title，传入父组件的menuList数组中
			parent.value.menuList.push({
				title: props.title,
				disabled: props.disabled
			})
		}
	}

	// cell被点击
	function cellClick(value) {
		// 修改通过v-model绑定的值
		// #ifdef VUE2
		emit('input', value)
		// #endif
		// #ifdef VUE3
		emit('update:modelValue', value)
		// #endif
		// 通知父组件(up-dropdown)收起菜单
		parent.value?.close()
		// 发出事件，抛出当前勾选项的value
		emit('change', value)
	}

	watch(propsChange, () => {
		// 当值变化时，通知父组件重新初始化，让父组件执行每个子组件的init()方法
		// 将所有子组件数据重新整理一遍
		if (parent.value) parent.value.init()
	})

	onMounted(() => {
		init()
	})

	defineExpose({
		active,
		activeColor,
		inactiveColor,
		title,
		disabled,
		init,
		cellClick
	})
</script>

<style scoped lang="scss">
    .up-dropdown-item__scroll {
        background: #ffffff;
    }
</style>
