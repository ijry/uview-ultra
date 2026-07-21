<template>
	<view class="up-number-box">
		<view
		    class="up-number-box__slot cursor-pointer"
		    @tap.stop="clickHandler('minus')"
		    @touchstart="onTouchStart('minus')"
		    @touchend.stop="clearTimeout"
		    v-if="showMinus && !hideMinus && $slots.minus"
		>
			<slot name="minus" />
		</view>
		<view
		    v-else-if="showMinus && !hideMinus"
		    class="up-number-box__minus cursor-pointer"
		    @tap.stop="clickHandler('minus')"
		    @touchstart="onTouchStart('minus')"
		    @touchend.stop="clearTimeout"
		    hover-class="up-number-box__minus--hover"
		    hover-stay-time="150"
		    :class="{ 'up-number-box__minus--disabled': isDisabled('minus') }"
		    :style="[buttonStyle('minus')]"
		>
			<up-icon
			    name="minus"
			    :color="isDisabled('minus') ? '#c8c9cc' : '#323233'"
			    size="15"
			    bold
				:customStyle="iconStyle"
			></up-icon>
		</view>

		<template v-if="!hideMinus">
			<slot name="input">
				<!-- #ifdef MP-WEIXIN -->
				<input
					:disabled="disabledInput || disabled"
					:cursor-spacing="getCursorSpacing"
					:class="{ 'up-number-box__input--disabled': disabled || disabledInput }"
					:value="currentValue"
					class="up-number-box__input"
					@blur="onBlur"
					@focus="onFocus"
					@input="onInput"
					:type="integer ? 'number' : 'digit'"
					:style="[inputStyle]"
				/>
				<!-- #endif -->
				<!-- #ifndef MP-WEIXIN -->
				<input
					:disabled="disabledInput || disabled"
					:cursor-spacing="getCursorSpacing"
					:class="{ 'up-number-box__input--disabled': disabled || disabledInput }"
					v-model="currentValue"
					class="up-number-box__input"
					@blur="onBlur"
					@focus="onFocus"
					@input="onInput"
					:type="integer ? 'number' : 'digit'"
					:style="[inputStyle]"
				/>
				<!-- #endif -->
			</slot>
		</template>
		<view
		    class="up-number-box__slot cursor-pointer"
		    @tap.stop="clickHandler('plus')"
		    @touchstart="onTouchStart('plus')"
		    @touchend.stop="clearTimeout"
		    v-if="showPlus && $slots.plus"
		>
			<slot name="plus" />
		</view>
		<view
		    v-else-if="showPlus"
		    class="up-number-box__plus cursor-pointer"
		    @tap.stop="clickHandler('plus')"
		    @touchstart="onTouchStart('plus')"
		    @touchend.stop="clearTimeout"
		    hover-class="up-number-box__plus--hover"
		    hover-stay-time="150"
		    :class="{ 'up-number-box__minus--disabled': isDisabled('plus') }"
		    :style="[buttonStyle('plus')]"
		>
			<up-icon
			    name="plus"
			    :color="isDisabled('plus') ? '#c8c9cc' : '#323233'"
			    size="15"
			    bold
				:customStyle="iconStyle"
			></up-icon>
		</view>
	</view>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { props as numberBoxProps } from './props'
import { commonProps } from '../../libs/composable/useUltraUI'
import { getPx, addUnit } from '../../libs/function/index'
/**
 * numberBox 步进器
 * @description 该组件一般用于商城购物选择物品数量的场景。
 * @tutorial https://uview-plus.jiangruyi.com/components/numberBox.html
 * @property {String | Number}	name			步进器标识符，在change回调返回
 * @property {String | Number}	value			用于双向绑定的值，初始化时设置设为默认min值(最小值)  （默认 0 ）
 * @property {String | Number}	min				最小值 （默认 1 ）
 * @property {String | Number}	max				最大值 （默认 Number.MAX_SAFE_INTEGER ）
 * @property {String | Number}	step			加减的步长，可为小数 （默认 1 ）
 * @property {Boolean}			integer			是否只允许输入整数 （默认 false ）
 * @property {Boolean}			disabled		是否禁用，包括输入框，加减按钮 （默认 false ）
 * @property {Boolean}			disabledInput	是否禁用输入框 （默认 false ）
 * @property {Boolean}			asyncChange		是否开启异步变更，开启后需要手动控制输入值 （默认 false ）
 * @property {String | Number}	inputWidth		输入框宽度，单位为px （默认 35 ）
 * @property {Boolean}			showMinus		是否显示减少按钮 （默认 true ）
 * @property {Boolean}			showPlus		是否显示增加按钮 （默认 true ）
 * @property {String | Number}	decimalLength	显示的小数位数
 * @property {Boolean}			longPress		是否开启长按加减手势 （默认 true ）
 * @property {String}			color			输入框文字和加减按钮图标的颜色 （默认 '#323233' ）
 * @property {String | Number}	buttonSize		按钮大小，宽高等于此值，单位px，输入框高度和此值保持一致 （默认 30 ）
 * @property {String}			bgColor			输入框和按钮的背景颜色 （默认 '#EBECEE' ）
 * @property {String | Number}	cursorSpacing	指定光标于键盘的距离，避免键盘遮挡输入框，单位px （默认 100 ）
 * @property {Boolean}			disablePlus		是否禁用增加按钮 （默认 false ）
 * @property {Boolean}			disableMinus	是否禁用减少按钮 （默认 false ）
 * @property {Object ｜ String}	iconStyle		加减按钮图标的样式
 *
 * @event {Function}	onFocus	输入框活动焦点
 * @event {Function}	onBlur	输入框失去焦点
 * @event {Function}	onInput	输入框值发生变化
 * @event {Function}	onChange
 * @example <up-number-box v-model="value" @change="valChange"></up-number-box>
 */
defineOptions({
	name: 'up-number-box',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...numberBoxProps.props
})
const emit = defineEmits([
	// #ifdef VUE3
	'update:modelValue',
	// #endif
	'focus', 'blur', 'overlimit', 'change', 'plus', 'minus'
])

const type = ref('')
const currentValue = ref('')
const longPressTimer = ref(null)

const hideMinus = computed(() => currentValue.value == 0 && props.miniMode == true)
const getCursorSpacing = computed(() => getPx(props.cursorSpacing))
const watchChange = computed(() => [props.integer, props.decimalLength, props.min, props.max])

function isDisabled(btnType) {
	if (btnType === 'plus') {
		return props.disabled || props.disablePlus || currentValue.value >= props.max
	}
	return props.disabled || props.disableMinus || currentValue.value <= props.min
}

function buttonStyle(btnType) {
	const style = {
		backgroundColor: props.bgColor,
		width: addUnit(props.buttonWidth),
		height: addUnit(props.buttonSize),
		color: props.color,
		borderRadius: props.buttonRadius
	}
	if (isDisabled(btnType)) {
		style.backgroundColor = props.disabledBgColor
	}
	return style
}

const inputStyle = computed(() => ({
	color: props.color,
	backgroundColor: props.inputBgColor || props.bgColor,
	height: addUnit(props.buttonSize),
	width: addUnit(props.inputWidth)
}))

watch(watchChange, () => {
	check()
})

// #ifdef VUE2
watch(() => props.value, (n) => {
	if (n !== currentValue.value) {
		currentValue.value = format(props.value)
	}
})
// #endif
// #ifdef VUE3
watch(() => props.modelValue, (newV) => {
	if (newV !== currentValue.value) {
		currentValue.value = format(props.modelValue)
	}
}, { immediate: true })
// #endif

onMounted(() => {
	init()
})

function init() {
	// #ifdef VUE3
	currentValue.value = format(props.modelValue)
	// #endif
	// #ifdef VUE2
	currentValue.value = format(props.value)
	// #endif
}

function format(value) {
	value = filter(value)
	value = value === '' ? 0 : +value
	value = Math.max(Math.min(props.max, value), props.min)
	if (props.decimalLength !== null) {
		value = value.toFixed(props.decimalLength)
	}
	return value
}

function filter(value) {
	value = String(value).replace(/[^0-9.-]/g, '')
	if (props.integer && value.indexOf('.') !== -1) {
		value = value.split('.')[0]
	}
	return value
}

function check() {
	const val = format(currentValue.value)
	if (val !== currentValue.value) {
		currentValue.value = val
		emitChange(val)
	}
}

function onFocus(event) {
	emit('focus', {
		...event.detail,
		name: props.name,
	})
}

function onBlur(event) {
	const value = format(event.detail.value)
	emitChange(value)
	emit('blur', {
		...event.detail,
		name: props.name,
	})
}

function onInput(e) {
	const { value = '' } = e.detail || {}
	if (value === '') {
		currentValue.value = ''
		return
	}
	let formatted = filter(value)
	emitChange(value)
	if (props.decimalLength !== null && formatted.indexOf('.') !== -1) {
		const pair = formatted.split('.')
		formatted = `${pair[0]}.${pair[1].slice(0, props.decimalLength)}`
	}
	formatted = format(formatted)
	emitChange(formatted)
	// #ifdef MP-WEIXIN
	return formatted
	// #endif
}

function emitChange(value, changeType = '') {
	if (!props.asyncChange) {
		nextTick(() => {
			// #ifdef VUE3
			emit('update:modelValue', value)
			// #endif
			// #ifdef VUE2
			emit('input', value)
			// #endif
			currentValue.value = value
		})
	}
	emit('change', {
		value,
		name: props.name,
		type: changeType
	})
}

function onChange() {
	const btnType = type.value
	if (isDisabled(btnType)) {
		return emit('overlimit', btnType)
	}
	const diff = btnType === 'minus' ? -props.step : +props.step
	const value = format(add(+currentValue.value, diff))
	emitChange(value, btnType)
	emit(btnType)
}

function add(num1, num2) {
	const cardinal = Math.pow(10, 10)
	return Math.round((num1 + num2) * cardinal) / cardinal
}

function clickHandler(btnType) {
	type.value = btnType
	onChange()
}

function longPressStep() {
	clearTimeout()
	longPressTimer.value = setTimeout(() => {
		onChange()
		longPressStep()
	}, 250)
}

function onTouchStart(btnType) {
	if (!props.longPress) return
	clearTimeout()
	type.value = btnType
	longPressTimer.value = setTimeout(() => {
		onChange()
		longPressStep()
	}, 600)
}

function clearTimeout() {
	if (longPressTimer.value) {
		globalThis.clearTimeout(longPressTimer.value)
	}
	longPressTimer.value = null
}
</script>


<style lang="scss" scoped>
	$up-numberBox-hover-bgColor: #E6E6E6 !default;
	$up-numberBox-disabled-color: #c8c9cc !default;
	$up-numberBox-disabled-bgColor: #f7f8fa !default;
	$up-numberBox-plus-radius: 4px !default;
	$up-numberBox-minus-radius: 4px !default;
	$up-numberBox-input-text-align: center !default;
	$up-numberBox-input-font-size: 15px !default;
	$up-numberBox-input-padding: 0 !default;
	$up-numberBox-input-margin: 0 2px !default;
	$up-numberBox-input-disabled-color: #c8c9cc !default;
	$up-numberBox-input-disabled-bgColor: #f2f3f5 !default;

	.up-number-box {
		@include flex(row);
		align-items: center;

		&__slot {
			/* #ifndef APP-NVUE */
			touch-action: none;
			/* #endif */
		}

		&__plus,
		&__minus {
			width: 35px;
			@include flex;
			justify-content: center;
			align-items: center;
			/* #ifndef APP-NVUE */
			touch-action: none;
			/* #endif */

			&--hover {
				background-color: $up-numberBox-hover-bgColor !important;
			}

			&--disabled {
				color: $up-numberBox-disabled-color;
				background-color: $up-numberBox-disabled-bgColor;
			}
		}

		&__plus {
			border-top-right-radius: $up-numberBox-plus-radius;
			border-bottom-right-radius: $up-numberBox-plus-radius;
		}

		&__minus {
			border-top-left-radius: $up-numberBox-minus-radius;
			border-bottom-left-radius: $up-numberBox-minus-radius;
		}

		&__input {
			position: relative;
			text-align: $up-numberBox-input-text-align;
			font-size: $up-numberBox-input-font-size;
			padding: $up-numberBox-input-padding;
			margin: $up-numberBox-input-margin;
			@include flex;
			align-items: center;
			justify-content: center;

			&--disabled {
				color: $up-numberBox-input-disabled-color;
				background-color: $up-numberBox-input-disabled-bgColor;
			}
		}
	}
</style>
