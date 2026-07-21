<template>
	<view
	    class="up-checkbox cursor-pointer"
	    :style="[checkboxStyle]"
	    @tap.stop="wrapperClickHandler"
	    :class="[`up-checkbox-label--${parentData.iconPlacement}`, parentData.borderBottom && parentData.placement === 'column' && 'up-border-bottom']"
	>
		<view
		    class="up-checkbox__icon-wrap cursor-pointer"
		    @tap.stop="iconClickHandler"
		    :class="iconClasses"
		    :style="[iconWrapStyle]"
		>
			<slot name="icon" :elIconSize="elIconSize" :elIconColor="elIconColor" :checked="isChecked" :elDisabled="elDisabled">
				<up-icon
				    class="up-checkbox__icon-wrap__icon"
				    name="checkbox-mark"
				    :size="elIconSize"
				    :color="elIconColor"
				/>
			</slot>
		</view>
		<slot name="label" :label="label" :elDisabled="elDisabled">
			<text
				@tap.stop="labelClickHandler"
				:style="{
					color: elDisabled ? elInactiveColor : elLabelColor,
					fontSize: elLabelSize,
					lineHeight: elLabelSize
				}"
			>{{label}}</text>
		</slot>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, toRef, watch } from 'vue'
	import { props as checkboxProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addStyle, addUnit, deepMerge, formValidate, error } from '../../libs/function/index.js'
	import test from '../../libs/function/test.js'
	/**
	 * checkbox  复选框
	 * @description 复选框组件一般用于需要多个选择的场景，该组件功能完整，使用方便
	 * @tutorial https://uview-plus.jiangruyi.com/components/checkbox.html
	 * @property {String | Number | Boolean}	name			checkbox组件的标示符
	 * @property {String}						shape			形状，square为方形，circle为圆型
	 * @property {String | Number}				size			整体的大小
	 * @property {Boolean}						checked			是否默认选中
	 * @property {String | Boolean}				disabled		是否禁用
	 * @property {String}						activeColor		选中状态下的颜色，如设置此值，将会覆盖parent的activeColor值
	 * @property {String}						inactiveColor	未选中的颜色
	 * @property {String | Number}				iconSize		图标的大小，单位px
	 * @property {String}						iconColor		图标颜色
	 * @property {String | Number}				label			label提示文字，因为nvue下，直接slot进来的文字，由于特殊的结构，无法修改样式
	 * @property {String}						labelColor 		label的颜色
	 * @property {String | Number}				labelSize		label的字体大小，px单位
	 * @property {String | Boolean}				labelDisabled	是否禁止点击提示语选中复选框
	 * @property {Object}						customStyle		定义需要用到的外部样式
	 * 
	 * @event {Function}	change	任一个checkbox状态发生变化时触发，回调为一个对象
	 * @example <up-checkbox v-model="checked" :disabled="false">天涯</up-checkbox>
	 */
	defineOptions({
		name: 'up-checkbox',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...checkboxProps.props
	})
	const emit = defineEmits(['change', 'update:checked'])
	const instance = getCurrentInstance()
	const isChecked = ref(false)
	// 父组件的默认值，因为头条小程序不支持在computed中使用parent.shape的形式
	const parentData = reactive({
		iconSize: 12,
		labelDisabled: null,
		disabled: null,
		shape: 'square',
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

	// 是否禁用，如果父组件up-checkbox-group禁用的话，将会忽略子组件的配置
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
			// disabled状态下，已勾选的checkbox图标改为elInactiveColor
			return isChecked.value ? elInactiveColor.value : 'transparent'
		}
		return isChecked.value ? iconColor : 'transparent'
	})

	const iconClasses = computed(() => {
		let classes = []
		// 组件的形状
		classes.push('up-checkbox__icon-wrap--' + elShape.value)
		if (elDisabled.value) {
			classes.push('up-checkbox__icon-wrap--disabled')
		}
		if (isChecked.value) {
			if (elDisabled.value) {
				classes.push('up-checkbox__icon-wrap--disabled--checked')
			} else {
				classes.push('up-checkbox__icon-wrap--checked')
			}
		}
		// 支付宝，头条小程序无法动态绑定一个数组类名，否则解析出来的结果会带有","，而导致失效
		// #ifdef MP-ALIPAY || MP-TOUTIAO
		classes = classes.join(' ')
		// #endif
		return classes
	})

	const iconWrapStyle = computed(() => {
		// checkbox的整体样式
		const style = {}
		style.backgroundColor = isChecked.value && !elDisabled.value ? elActiveColor.value : '#ffffff'
		style.borderColor = isChecked.value && !elDisabled.value ? elActiveColor.value : elInactiveColor.value
		style.width = addUnit(elSize.value)
		style.height = addUnit(elSize.value)
		// 如果是图标在右边的话，移除它的右边距
		if (!props.usedAlone && parentData.iconPlacement === 'right') {
			style.marginRight = 0
		}
		return style
	})

	const checkboxStyle = computed(() => {
		const style = {}
		if (!props.usedAlone) {
			if (parentData.borderBottom && parentData.placement === 'row') {
				error('检测到您将borderBottom设置为true，需要同时将up-checkbox-group的placement设置为column才有效')
			}
			// 当父组件设置了显示下边框并且排列形式为纵向时，给内容和边框之间加上一定间隔
			if (parentData.borderBottom && parentData.placement === 'column') {
				style.paddingBottom = '8px'
			}
		}
		return deepMerge(style, addStyle(props.customStyle))
	})

	function init() {
		if (!props.usedAlone) {
			// 支付宝小程序不支持provide/inject，所以使用这个方法获取整个父组件
			updateParentData()
			if (!parent.value) {
				error('up-checkbox必须搭配up-checkbox-group组件使用')
			}
			// #ifdef VUE2
			const value = parentData.value
			// #endif
			// #ifdef VUE3
			const value = parentData.modelValue
			// #endif
			// 设置初始化时，是否默认选中的状态，父组件up-checkbox-group的value可能是array，所以额外判断
			if (props.checked) {
				isChecked.value = true
			} else if (!props.usedAlone && test.array(value)) {
				// 查找数组是是否存在name元素值
				isChecked.value = value.some(item => {
					return item === props.name
				})
			}
		} else if (props.checked) {
			isChecked.value = true
		}
	}

	function updateParentData() {
		getParentData('up-checkbox-group')
	}

	// 横向两端排列时，点击组件即可触发选中事件
	function wrapperClickHandler(e) {
		if (!props.usedAlone) {
			parentData.iconPlacement === 'right' && iconClickHandler(e)
		} else {
			iconClickHandler(e)
		}
	}

	// 点击图标
	function iconClickHandler(e) {
		preventEvent(e)
		// 如果整体被禁用，不允许被点击
		if (!elDisabled.value) {
			setRadioCheckedStatus()
		}
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
		emit('change', isChecked.value)
		// 双向绑定
		if (props.usedAlone) {
			emit('update:checked', isChecked.value)
		}
		// 尝试调用up-form的验证方法，进行一定延迟，否则微信小程序更新可能会不及时
		nextTick(() => {
			formValidate(instance.proxy, 'change')
		})
	}

	// 改变组件选中状态
	// 这里的改变的依据是，更改本组件的checked值为true，同时通过父组件遍历所有up-checkbox实例
	// 将本组件外的其他up-checkbox的checked都设置为false(都被取消选中状态)，因而只剩下一个为选中状态
	function setRadioCheckedStatus() {
		// 将本组件标记为与原来相反的状态
		isChecked.value = !isChecked.value
		emitEvent()
		if (!props.usedAlone) {
			typeof parent.value?.unCheckedOther === 'function' && parent.value.unCheckedOther(instance.proxy)
		}
	}

	watch(() => props.checked, (newValue) => {
		if (newValue !== isChecked.value) {
			isChecked.value = newValue
		}
	})

	onMounted(() => {
		init()
	})

	defineExpose({
		name,
		isChecked,
		init,
		updateParentData
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
	$up-checkbox-icon-wrap-margin-right:6px !default;
	$up-checkbox-icon-wrap-font-size:6px !default;
	$up-checkbox-icon-wrap-border-width:1px !default;
	$up-checkbox-icon-wrap-border-color:#c8c9cc !default;
	$up-checkbox-icon-wrap-icon-line-height:0 !default;
	$up-checkbox-icon-wrap-circle-border-radius:100% !default;
	$up-checkbox-icon-wrap-square-border-radius:3px !default;
	$up-checkbox-icon-wrap-checked-color:#fff !default;
	$up-checkbox-icon-wrap-checked-background-color:red !default;
	$up-checkbox-icon-wrap-checked-border-color:#2979ff !default;
	$up-checkbox-icon-wrap-disabled-background-color:#ebedf0 !default;
	$up-checkbox-icon-wrap-disabled-checked-color:#c8c9cc !default;
	$up-checkbox-label-margin-left:5px !default;
	$up-checkbox-label-margin-right:12px !default;
	$up-checkbox-label-color:$up-content-color !default;
	$up-checkbox-label-font-size:15px !default;
	$up-checkbox-label-disabled-color:#c8c9cc !default;

	.up-checkbox {
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
			margin-right: $up-checkbox-icon-wrap-margin-right;

			font-size: $up-checkbox-icon-wrap-font-size;
			border-width: $up-checkbox-icon-wrap-border-width;
			border-color: $up-checkbox-icon-wrap-border-color;
			border-style: solid;

			/* #ifdef MP-TOUTIAO */
			// 头条小程序兼容性问题，需要设置行高为0，否则图标偏下
			&__icon {
				line-height: $up-checkbox-icon-wrap-icon-line-height;
			}

			/* #endif */

			&--circle {
				border-radius: $up-checkbox-icon-wrap-circle-border-radius;
			}

			&--square {
				border-radius: $up-checkbox-icon-wrap-square-border-radius;
			}

			&--checked {
				color: $up-checkbox-icon-wrap-checked-color;
				background-color: $up-checkbox-icon-wrap-checked-background-color;
				border-color: $up-checkbox-icon-wrap-checked-border-color;
			}

			&--disabled {
				background-color: $up-checkbox-icon-wrap-disabled-background-color !important;
			}

			&--disabled--checked {
				color: $up-checkbox-icon-wrap-disabled-checked-color !important;
			}
		}

		&__label {
			/* #ifndef APP-NVUE */
			word-wrap: break-word;
			/* #endif */
			margin-left: $up-checkbox-label-margin-left;
			margin-right: $up-checkbox-label-margin-right;
			color: $up-checkbox-label-color;
			font-size: $up-checkbox-label-font-size;

			&--disabled {
				color: $up-checkbox-label-disabled-color;
			}
		}
	}
</style>
