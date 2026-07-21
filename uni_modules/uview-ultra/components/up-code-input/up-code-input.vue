<template>
	<view class="up-code-input">
		<view
			class="up-code-input__item"
			:style="[itemStyle(index)]"
			v-for="(item, index) in codeLength"
			:key="index"
		>
			<view
				class="up-code-input__item__dot"
				v-if="dot && codeArray.length > index"
			></view>
			<text
				v-else
				:style="{
					fontSize: addUnit(fontSize),
					fontWeight: bold ? 'bold' : 'normal',
					color: color
				}"
			>{{codeArray[index]}}</text>
			<view
				class="up-code-input__item__line"
				v-if="mode === 'line'"
				:style="[lineStyle]"
			></view>
			<!-- #ifndef APP-NVUE -->
			<view v-if="isFocus && codeArray.length === index"
				:style="{backgroundColor: color}" class="up-code-input__item__cursor"></view>
			<!-- #endif -->
			<!-- #ifdef APP-NVUE -->
			 <view v-if="isFocus && codeArray.length === index"
			 :style="{backgroundColor: color, opacity: opacity}" class="up-code-input__item__cursor"></view>
			<!-- #endif -->
		</view>
		<input
			:disabled="disabledKeyboard"
			type="number"
			:focus="focus"
			:value="inputValue"
			:maxlength="maxlength"
			:adjustPosition="adjustPosition"
			class="up-code-input__input"
			@input="inputHandler"
			:style="{
				height: addUnit(size)
			}"
			@focus="isFocus = true"
			@blur="isFocus = false"
		/>
	</view>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { props as codeInputProps } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { addUnit, getPx } from '../../libs/function/index.js'
/**
 * CodeInput 验证码输入
 * @description 该组件一般用于验证用户短信验证码的场景，也可以结合uview-plus的键盘组件使用
 * @tutorial https://ijry.github.io/uview-plus/components/codeInput.html
 * @property {String | Number}	maxlength			最大输入长度 （默认 6 ）
 * @property {Boolean}			dot					是否用圆点填充 （默认 false ）
 * @property {String}			mode				显示模式，box-盒子模式，line-底部横线模式 （默认 'box' ）
 * @property {Boolean}			hairline			是否细边框 （默认 false ）
 * @property {String | Number}	space				字符间的距离 （默认 10 ）
 * @property {String | Number}	value				预置值
 * @property {Boolean}			focus				是否自动获取焦点 （默认 false ）
 * @property {Boolean}			bold				字体和输入横线是否加粗 （默认 false ）
 * @property {String}			color				字体颜色 （默认 '#606266' ）
 * @property {String | Number}	fontSize			字体大小，单位px （默认 18 ）
 * @property {String | Number}	size				输入框的大小，宽等于高 （默认 35 ）
 * @property {Boolean}			disabledKeyboard	是否隐藏原生键盘，如果想用自定义键盘的话，需设置此参数为true （默认 false ）
 * @property {String}			borderColor			边框和线条颜色 （默认 '#c9cacc' ）
 * @property {Boolean}			disabledDot			是否禁止输入"."符号 （默认 true ）
 *
 * @event {Function}	change	输入内容发生改变时触发，具体见上方说明			value：当前输入的值
 * @event {Function}	finish	输入字符个数达maxlength值时触发，见上方说明	value：当前输入的值
 * @example	<up-code-input v-model="value4" :focus="true"></up-code-input>
 */
defineOptions({
	name: 'up-code-input',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...codeInputProps.props
})
const emit = defineEmits(['change', 'finish', 'update:modelValue'])

const inputValue = ref('')
const isFocus = ref(props.focus)
const timer = ref(null)
const opacity = ref(1)

// #ifdef VUE2
watch(() => props.value, (val) => {
	inputValue.value = String(val).substring(0, props.maxlength)
}, { immediate: true })
// #endif
// #ifdef VUE3
watch(() => props.modelValue, (val) => {
	inputValue.value = String(val).substring(0, props.maxlength)
}, { immediate: true })
// #endif

watch(isFocus, (val) => {
	// #ifdef APP-NVUE
	if (val) {
		timer.value = setInterval(() => {
			opacity.value = Math.abs(opacity.value - 1)
		}, 600)
	} else {
		clearInterval(timer.value)
	}
	// #endif
})

onBeforeUnmount(() => {
	// #ifdef APP-NVUE
	clearInterval(timer.value)
	// #endif
})

const codeLength = computed(() => new Array(Number(props.maxlength)))
const codeArray = computed(() => String(inputValue.value).split(''))
const lineStyle = computed(() => {
	const style = {}
	style.height = props.hairline ? '2px' : '4px'
	style.width = addUnit(props.size)
	style.backgroundColor = props.borderColor
	return style
})

function itemStyle(index) {
	const style = {
		width: addUnit(props.size),
		height: addUnit(props.size)
	}
	if (props.mode === 'box') {
		style.border = `${props.hairline ? 0.5 : 1}px solid ${props.borderColor}`
		if (getPx(props.space) === 0) {
			if (index === 0) {
				style.borderTopLeftRadius = '3px'
				style.borderBottomLeftRadius = '3px'
			}
			if (index === codeLength.value.length - 1) {
				style.borderTopRightRadius = '3px'
				style.borderBottomRightRadius = '3px'
			}
			if (index !== codeLength.value.length - 1) {
				style.borderRight = 'none'
			}
		}
	}
	if (index !== codeLength.value.length - 1) {
		style.marginRight = addUnit(props.space)
	} else {
		style.marginRight = 0
	}
	return style
}

function inputHandler(e) {
	const value = e.detail.value
	inputValue.value = value
	if (props.disabledDot) {
		nextTick(() => {
			inputValue.value = value.replace('.', '')
		})
	}
	emit('change', value)
	// #ifdef VUE3
	emit('update:modelValue', value)
	// #endif
	// #ifdef VUE2
	emit('input', value)
	// #endif
	if (String(value).length >= Number(props.maxlength)) {
		emit('finish', value)
	}
}
</script>


<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
	$up-code-input-cursor-width: 1px;
	$up-code-input-cursor-height: 20px;
	$up-code-input-cursor-animation-duration: 1s;
	$up-code-input-cursor-animation-name: up-cursor-flicker;

	.up-code-input {
		@include flex;
		position: relative;
		overflow: hidden;

		&__item {
			@include flex;
			justify-content: center;
			align-items: center;
			position: relative;

			&__text {
				font-size: 15px;
				color: $up-content-color;
			}

			&__dot {
				width: 7px;
				height: 7px;
				border-radius: 100px;
				background-color: $up-content-color;
			}

			&__line {
				position: absolute;
				bottom: 0;
				height: 4px;
				border-radius: 100px;
				width: 40px;
				background-color: $up-content-color;
			}
			&__cursor {
				position: absolute;
				/* #ifndef APP-NVUE */
				top: 50%;
				left: 50%;
				opacity: 1;
				transform: translate(-50%,-50%);
				/* #endif */
				width: $up-code-input-cursor-width;
				height: $up-code-input-cursor-height;
				animation: $up-code-input-cursor-animation-duration up-cursor-flicker infinite;
			}
		}

		&__input {
			// 之所以需要input输入框，是因为有它才能唤起键盘
			// 这里将它设置为两倍的屏幕宽度，再将左边的一半移出屏幕，为了不让用户看到输入的内容
			position: absolute;
			left: -750rpx;
			width: 1500rpx;
			top: 0;
			background-color: transparent;
			text-align: left;
		}
	}

	/* #ifndef APP-NVUE */
	@keyframes up-cursor-flicker {
		0% {
		    opacity: 0;
		}
		50% {
		    opacity: 1;
		}
		100% {
		    opacity: 0;
		}
	}
	/* #endif */

</style>
