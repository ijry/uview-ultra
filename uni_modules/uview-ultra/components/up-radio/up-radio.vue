<template>
	<view
	    class="up-radio cursor-pointer"
		@tap.stop="wrapperClickHandler"
	    :style="[radioStyle]"
	    :class="[`up-radio-label--${parentData.iconPlacement}`, parentData.borderBottom && parentData.placement === 'column' && 'up-border-bottom']"
	>
		<view
		    class="up-radio__icon-wrap cursor-pointer"
		    @tap.stop="iconClickHandler"
		    :class="iconClasses"
		    :style="[iconWrapStyle]"
		>
			<slot name="icon" :elIconSize="elIconSize" :elIconColor="elIconColor" :checked="checked" :elDisabled="elDisabled">
				<up-icon
				    class="up-radio__icon-wrap__icon"
				    name="checkbox-mark"
				    :size="elIconSize"
				    :color="elIconColor"
				/>
			</slot>
		</view>
		<view class="u-radio__label-wrap cursor-pointer" @tap.stop="labelClickHandler">
			<slot name="label" :label="label" :elDisabled="elDisabled">
				<text
					class="up-radio__text"
					:style="{
						color: elDisabled ? elInactiveColor : elLabelColor,
						fontSize: elLabelSize,
						lineHeight: elLabelSize
					}"
				>{{label}}</text>
			</slot>
		</view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, toRef } from 'vue'
	import { props as radioProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, os, deepMerge, formValidate, error } from '../../libs/function/index.js'
	/**
	 * radio 单选框
	 * @description 单选框用于有一个选择，用户只能选择其中一个的场景。搭配up-radio-group使用
	 * @tutorial https://ijry.github.io/uview-plus/components/radio.html
	 * @property {String | Number}	name			radio的名称
	 * @property {String}			shape			形状，square为方形，circle为圆型
	 * @property {Boolean}			disabled		是否禁用
	 * @property {String | Boolean}	labelDisabled	是否禁止点击提示语选中单选框
	 * @property {String}			activeColor		选中时的颜色，如设置parent的active-color将失效
	 * @property {String}			inactiveColor	未选中的颜色
	 * @property {String | Number}	iconSize		图标大小，单位px
	 * @property {String | Number}	labelSize		label字体大小，单位px
	 * @property {String | Number}	label			label提示文字，因为nvue下，直接slot进来的文字，由于特殊的结构，无法修改样式
	 * @property {String | Number}	size			整体的大小
	 * @property {String}			iconColor		图标颜色
	 * @property {String}			labelColor		label的颜色
	 * @property {Object}			customStyle		组件的样式，对象形式
	 * 
	 * @event {Function} change 某个radio状态发生变化时触发(选中状态)
	 * @example <up-radio :labelDisabled="false">门掩黄昏，无计留春住</up-radio>
	 */
	defineOptions({
		name: 'up-radio',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...radioProps.props
	})
	const emit = defineEmits(['change'])
	const instance = getCurrentInstance()
	const checked = ref(false)
	// 父组件的默认值，因为头条小程序不支持在computed中使用parent.shape的形式
	const parentData = reactive({
		iconSize: 12,
		labelDisabled: null,
		disabled: null,
		shape: null,
		activeColor: null,
		inactiveColor: null,
		size: 18,
		value: null,
		modelValue: null,
		labelColor: null,
		labelSize: null,
		iconColor: null,
		placement: 'row',
		borderBottom: false,
		iconPlacement: 'left'
	})
	const name = toRef(props, 'name')
	const { parent, getParentData, preventEvent } = useUltraUI(props, parentData)

	// 是否禁用，如果父组件up-radio-group禁用的话，将会忽略子组件的配置
	const elDisabled = computed(() => {
		return props.disabled !== '' ? props.disabled : parentData.disabled !== null ? parentData.disabled : false
	})

	// 是否禁用label点击
	const elLabelDisabled = computed(() => {
		return props.labelDisabled !== '' ? props.labelDisabled : parentData.labelDisabled !== null ? parentData.labelDisabled : false
	})

	// 组件尺寸，对应size的值，默认值为21px
	const elSize = computed(() => {
		return props.size ? props.size : (parentData.size ? parentData.size : 21)
	})

	// 组件的勾选图标的尺寸，默认12px
	const elIconSize = computed(() => {
		return props.iconSize ? props.iconSize : (parentData.iconSize ? parentData.iconSize : 12)
	})

	// 组件选中激活时的颜色
	const elActiveColor = computed(() => {
		return props.activeColor ? props.activeColor : (parentData.activeColor ? parentData.activeColor : '#2979ff')
	})

	// 组件选未中激活时的颜色
	const elInactiveColor = computed(() => {
		return props.inactiveColor ? props.inactiveColor : (parentData.inactiveColor ? parentData.inactiveColor : '#c8c9cc')
	})

	// label的颜色
	const elLabelColor = computed(() => {
		return props.labelColor ? props.labelColor : (parentData.labelColor ? parentData.labelColor : '#606266')
	})

	// 组件的形状
	const elShape = computed(() => {
		return props.shape ? props.shape : (parentData.shape ? parentData.shape : 'circle')
	})

	// label大小
	const elLabelSize = computed(() => {
		return addUnit(props.labelSize ? props.labelSize : (parentData.labelSize ? parentData.labelSize : '15'))
	})

	const elIconColor = computed(() => {
		const iconColor = props.iconColor ? props.iconColor : (parentData.iconColor ? parentData.iconColor : '#ffffff')
		// 图标的颜色
		if (elDisabled.value) {
			// disabled状态下，已勾选的radio图标改为elInactiveColor
			return checked.value ? elInactiveColor.value : 'transparent'
		}
		return checked.value ? iconColor : 'transparent'
	})

	const iconClasses = computed(() => {
		let classes = []
		// 组件的形状
		classes.push('up-radio__icon-wrap--' + elShape.value)
		if (elDisabled.value) {
			classes.push('up-radio__icon-wrap--disabled')
		}
		if (checked.value) {
			if (elDisabled.value) {
				classes.push('up-radio__icon-wrap--disabled--checked')
			} else {
				classes.push('up-radio__icon-wrap--checked')
			}
		}
		// 支付宝，头条小程序无法动态绑定一个数组类名，否则解析出来的结果会带有","，而导致失效
		// #ifdef MP-ALIPAY || MP-TOUTIAO
		classes = classes.join(' ')
		// #endif
		return classes
	})

	const iconWrapStyle = computed(() => {
		// radio的整体样式
		const style = {}
		style.backgroundColor = checked.value && !elDisabled.value ? elActiveColor.value : '#ffffff'
		style.borderColor = checked.value && !elDisabled.value ? elActiveColor.value : elInactiveColor.value
		style.width = addUnit(elSize.value)
		style.height = addUnit(elSize.value)
		// 如果是图标在右边的话，移除它的右边距
		if (parentData.iconPlacement === 'right') {
			style.marginRight = 0
		}
		return style
	})

	const radioStyle = computed(() => {
		const style = {}
		if (parentData.borderBottom && parentData.placement === 'row') {
			error('检测到您将borderBottom设置为true，需要同时将up-radio-group的placement设置为column才有效')
		}
		// 当父组件设置了显示下边框并且排列形式为纵向时，给内容和边框之间加上一定间隔
		if (parentData.borderBottom && parentData.placement === 'column') {
			// ios像素密度高，需要多一点的距离
			style.paddingBottom = os() === 'ios' ? '12px' : '8px'
		}
		return deepMerge(style, addStyle(props.customStyle))
	})

	function init() {
		// 支付宝小程序不支持provide/inject，所以使用这个方法获取整个父组件
		updateParentData()
		if (!parent.value) {
			error('up-radio必须搭配up-radio-group组件使用')
		}
		// 设置初始化时，是否默认选中的状态
		// #ifdef VUE3
		checked.value = props.name === parentData.modelValue
		// #endif
		// #ifdef VUE2
		checked.value = props.name === parentData.value
		// #endif
	}

	function updateParentData() {
		getParentData('up-radio-group')
	}

	// 点击图标
	function iconClickHandler(e) {
		preventEvent(e)
		// 如果整体被禁用，不允许被点击
		if (!elDisabled.value) {
			setRadioCheckedStatus()
		}
	}

	// 横向两端排列时，点击组件即可触发选中事件
	function wrapperClickHandler(e) {
		parentData.iconPlacement === 'right' && iconClickHandler(e)
	}

	// 点击label
	function labelClickHandler(e) {
		preventEvent(e)
		// 如果按钮整体被禁用或者label被禁用，则不允许点击文字修改状态
		if (!elLabelDisabled.value && !elDisabled.value) {
			setRadioCheckedStatus()
		}
	}

	function emitEvent() {
		// up-radio的checked不为true时(意味着未选中)，才发出事件，避免多次点击触发事件
		if (!checked.value) {
			emit('change', props.name)
			// 尝试调用up-form的验证方法，进行一定延迟，否则微信小程序更新可能会不及时
			nextTick(() => {
				formValidate(instance.proxy, 'change')
			})
		}
	}

	// 改变组件选中状态
	// 这里的改变的依据是，更改本组件的checked值为true，同时通过父组件遍历所有up-radio实例
	// 将本组件外的其他up-radio的checked都设置为false(都被取消选中状态)，因而只剩下一个为选中状态
	function setRadioCheckedStatus() {
		emitEvent()
		// 将本组件标记为选中状态
		checked.value = true
		typeof parent.value?.unCheckedOther === 'function' && parent.value.unCheckedOther(instance.proxy)
	}

	onMounted(() => {
		init()
	})

	defineExpose({
		name,
		checked,
		init,
		updateParentData
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
	$up-radio-wrap-margin-right:6px !default;
	$up-radio-wrap-font-size:20px !default;
	$up-radio-wrap-border-width:1px !default;
	$up-radio-wrap-border-color: #c8c9cc !default;
	$up-radio-line-height:0 !default;
	$up-radio-circle-border-radius:100% !default;
	$up-radio-square-border-radius:3px !default;
	$up-radio-checked-color:#fff !default;
	$up-radio-checked-background-color:red !default;
	$up-radio-checked-border-color: #2979ff !default;
	$up-radio-disabled-background-color:#ebedf0 !default;
	$up-radio-disabled--checked-color:#c8c9cc !default;
	$up-radio-label-margin-left: 5px !default;
	$up-radio-label-margin-right:12px !default;
	$up-radio-label-color:$up-content-color !default;
	$up-radio-label-font-size:15px !default;
	$up-radio-label-disabled-color:#c8c9cc !default;
	
	.up-radio {
		/* #ifndef APP-NVUE */
		@include flex(row);
		/* #endif */
		overflow: hidden;
		flex-direction: row;
		align-items: center;
		margin-bottom: 5px;
		margin-top: 5px;
		
		&-label--left {
			flex-direction: row
		}

		&-label--right {
			flex-direction: row-reverse;
			justify-content: space-between
		}

		&__icon-wrap {
			/* #ifndef APP-NVUE */
			box-sizing: border-box;
			// nvue下，border-color过渡有问题
			transition-property: border-color, background-color, color;
			transition-duration: 0.2s;
			/* #endif */
			color: $up-content-color;
			@include flex;
			align-items: center;
			justify-content: center;
			color: transparent;
			text-align: center;
			margin-right: $up-radio-wrap-margin-right;
			font-size: $up-radio-wrap-font-size;
			border-width: $up-radio-wrap-border-width;
			border-color: $up-radio-wrap-border-color;
			border-style: solid;

			/* #ifdef MP-TOUTIAO */
			// 头条小程序兼容性问题，需要设置行高为0，否则图标偏下
			&__icon {
				line-height: $up-radio-line-height;
			}

			/* #endif */

			&--circle {
				border-radius: $up-radio-circle-border-radius;
			}

			&--square {
				border-radius: $up-radio-square-border-radius;
			}

			&--checked {
				color: $up-radio-checked-color;
				background-color: $up-radio-checked-background-color;
				border-color: $up-radio-checked-border-color;
			}

			&--disabled {
				background-color: $up-radio-disabled-background-color !important;
			}

			&--disabled--checked {
				color: $up-radio-disabled--checked-color !important;
			}
		}

		&__label {
			/* #ifndef APP-NVUE */
			word-wrap: break-word;
			/* #endif */
			margin-left: $up-radio-label-margin-left;
			margin-right: $up-radio-label-margin-right;
			color: $up-radio-label-color;
			font-size: $up-radio-label-font-size;

			&--disabled {
				color: $up-radio-label-disabled-color;
			}
		}
	}
</style>
