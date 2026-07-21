<template>
	<view class="up-steps-item" ref="up-steps-item" :class="[`up-steps-item--${parentData.direction}`]">
		<view class="up-steps-item__line" v-if="index + 1 < childLength"
			:class="[`up-steps-item__line--${parentData.direction}`]" :style="[lineStyle]"></view>
		<view class="up-steps-item__wrapper"
			:class="[`up-steps-item__wrapper--${parentData.direction}`, parentData.dot && `up-steps-item__wrapper--${parentData.direction}--dot`]"
			:style="[itemStyleInner]">
			<slot name="icon">
				<view class="up-steps-item__wrapper__dot" v-if="parentData.dot" :style="{
						backgroundColor: statusColor
					}">

				</view>
				<view class="up-steps-item__wrapper__icon" v-else-if="parentData.activeIcon || parentData.inactiveIcon">
					<up-icon :name="index <= parentData.current ? parentData.activeIcon : parentData.inactiveIcon"
						:size="iconSize"
						:color="index <= parentData.current ? parentData.activeColor : parentData.inactiveColor">
					</up-icon>
				</view>
				<view v-else :style="{
						backgroundColor: statusClass === 'process' ? parentData.activeColor : 'transparent',
						borderColor: statusColor
					}" class="up-steps-item__wrapper__circle">
					<text v-if="statusClass === 'process' || statusClass === 'wait'"
						class="up-steps-item__wrapper__circle__text" :style="{
							color: index == parentData.current ? '#ffffff' : parentData.inactiveColor
						}">{{ index + 1}}</text>
					<up-icon v-else :color="statusClass === 'error' ? 'error' : parentData.activeColor" size="12"
						:name="statusClass === 'error' ? 'close' : 'checkmark'"></up-icon>
				</view>
			</slot>
		</view>
		<view class="up-steps-item__content" :class="[`up-steps-item__content--${parentData.direction}`,
			parentData.current == index ? 'up-steps-item__content--current' : '']"
			:style="[contentStyle]">
			<slot name="content" :index="index">
			</slot>
			<template v-if="!$slots['content']">
				<view class="up-steps-item__content__title">
					<slot name="title">
					</slot>
					<up-text v-if="!$slots['title']" :text="title" lineHeight="20px"
						:type="parentData.current == index ? 'main' : 'content'"
						:size="parentData.current == index ? 14 : 13"></up-text>
				</view>
				<view class="up-steps-item__content__desc">
					<slot name="desc">
					</slot>
					<up-text v-if="!$slots['desc']" :text="desc" type="tips" size="12"></up-text>
				</view>
			</template>
		</view>
		<!-- <view
		    class="up-steps-item__line"
		    v-if="showLine && parentData.direction === 'column'"
			:class="[`up-steps-item__line--${parentData.direction}`]"
		    :style="[lineStyle]"
		></view> -->
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, onMounted, reactive, ref, toRef } from 'vue'
	import { props as stepsItemProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { sleep, error } from '../../libs/function/index.js'
	import color from '../../libs/config/color.js'
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * StepsItem 步骤条的子组件
	 * @description 本组件需要和up-steps配合使用
	 * @tutorial https://uview-plus.jiangruyi.com/components/steps.html
	 * @property {String}			title			标题文字
	 * @property {String}			current			描述文本
	 * @property {String | Number}	iconSize		图标大小  (默认 17 )
	 * @property {Boolean}			error			当前步骤是否处于失败状态  (默认 false )
	 * @example <up-steps current="0"><up-steps-item title="已出库" desc="10:35" ></up-steps-item></up-steps>
	 */
	defineOptions({
		name: 'up-steps-item',
		// #ifdef MP-TOUTIAO
		options: {
			virtualHost: false
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...stepsItemProps.props
	})
	const instance = getCurrentInstance()
	const index = ref(0)
	const childLength = ref(0)
	const showLine = ref(false)
	const size = ref({
		height: 0,
		width: 0
	})
	const parentData = reactive({
		direction: 'row',
		current: 0,
		activeColor: '',
		inactiveColor: '',
		activeIcon: '',
		inactiveIcon: '',
		dot: false
	})
	const { parent, getParentData, $uGetRect } = useUltraUI(props, parentData)
	const errorProp = toRef(props, 'error')

	const lineStyle = computed(() => {
		const style = {}
		if (parentData.direction === 'row') {
			style.width = size.value.width + 'px'
			style.left = size.value.width / 2 + 'px'
		} else {
			style.height = size.value.height + 'px'
			// style.top = size.value.height / 2 + 'px'
		}
		const nextChild = parent.value?.children?.[index.value + 1]
		style.backgroundColor = nextChild?.error ? color.error : index.value < parentData.current ? parentData.activeColor : parentData.inactiveColor
		return style
	})

	const itemStyleInner = computed(() => {
		return {
			...props.itemStyle
		}
	})

	const statusClass = computed(() => {
		if (parentData.current == index.value) {
			return props.error === true ? 'error' : 'process'
		} else if (props.error) {
			return 'error'
		} else if (parentData.current > index.value) {
			return 'finish'
		} else {
			return 'wait'
		}
	})

	const statusColor = computed(() => {
		let colorTmp = ''
		switch (statusClass.value) {
			case 'finish':
				colorTmp = parentData.activeColor
				break
			case 'error':
				colorTmp = color.error
				break
			case 'process':
				colorTmp = parentData.dot ? parentData.activeColor : 'transparent'
				break
			default:
				colorTmp = parentData.inactiveColor
				break
		}
		return colorTmp
	})

	const contentStyle = computed(() => {
		const style = {}
		if (parentData.direction === 'column') {
			style.marginLeft = parentData.dot ? '2px' : '6px'
			style.marginTop = parentData.dot ? '0px' : '6px'
		} else {
			style.marginTop = parentData.dot ? '2px' : '6px'
			style.marginLeft = parentData.dot ? '2px' : '6px'
		}

		return style
	})

	function init() {
		// 初始化数据
		updateParentData()
		if (!parent.value) {
			return error('up-steps-item必须要搭配up-steps组件使用')
		}
		index.value = parent.value.children.indexOf(instance.proxy)
		childLength.value = parent.value.children.length
	}

	function updateParentData() {
		getParentData('up-steps')
	}

	// 父组件数据发生变化
	function updateFromParent() {
		init()
	}

	// 获取组件的尺寸，用于设置横线的位置
	function getStepsItemRect() {
		// #ifndef APP-NVUE
		$uGetRect('.up-steps-item').then(rect => {
			size.value = rect
		})
		// #endif

		// #ifdef APP-NVUE
		dom.getComponentRect(instance.proxy.$refs['up-steps-item'], res => {
			const {
				size: rect
			} = res
			size.value = rect
		})
		// #endif
	}

	onMounted(() => {
		init()
		parent.value && parent.value.updateFromChild()
		sleep().then(() => {
			getStepsItemRect()
		})
	})

	defineExpose({
		error: errorProp,
		init,
		updateParentData,
		updateFromParent
	})
</script>

<style lang="scss" scoped>

	.up-steps-item {
		flex: 1;
		@include flex;

		&--row {
			flex-direction: column;
			align-items: center;
			position: relative;
		}

		&--column {
			position: relative;
			flex-direction: row;
			justify-content: flex-start;
			padding-bottom: 5px;
		}

		&__wrapper {
			@include flex;
			justify-content: center;
			align-items: center;
			position: relative;
			background-color: #fff;
			border-radius: 50px;

			&--column {
				width: 20px;
				height: 20px;

				&--dot {
					height: 20px;
					width: 20px;
				}
			}

			&--row {
				width: 20px;
				height: 20px;

				&--dot {
					width: 20px;
					height: 20px;
				}
			}

			&__circle {
				width: 20px;
				height: 20px;
				/* #ifndef APP-NVUE */
				box-sizing: border-box;
				flex-shrink: 0;
				/* #endif */
				border-radius: 100px;
				border-width: 1px;
				border-color: $up-tips-color;
				border-style: solid;
				@include flex(row);
				align-items: center;
				justify-content: center;
				transition: background-color 0.3s;

				&__text {
					color: $up-tips-color;
					font-size: 11px;
					@include flex(row);
					align-items: center;
					justify-content: center;
					text-align: center;
					line-height: 11px;
				}
			}

			&__dot {
				width: 10px;
				height: 10px;
				border-radius: 100px;
				background-color: $up-content-color;
			}
		}

		&__content {
			@include flex;
			flex: 1;

			&__title {
				// #ifdef H5
				cursor: pointer;
				// #endif
			}

			&--row {
				flex-direction: column;
				align-items: center;
			}

			&--column {
				flex-direction: column;
				margin-left: 6px;
			}
		}

		&__line {
			position: absolute;
			background: $up-tips-color;

			&--row {
				top: 10px;
				height: 1px;
			}

			&--column {
				width: 1px;
				left: 10px;
			}
		}
	}
</style>
