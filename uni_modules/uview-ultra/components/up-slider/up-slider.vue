<template>
	<view
		class="up-slider"
		:style="[addStyle(customStyle)]"
	>
		<template v-if="!useNative || isRange">
			<view ref="up-slider-inner" class="up-slider-inner" @click="onClick"
				@onTouchStart="onTouchStart2($event, 1)" @touchmove="onTouchMove2($event, 1)"
				@touchend="onTouchEnd2($event, 1)" @touchcancel="onTouchEnd2($event, 1)"
				:class="[disabled ? 'up-slider--disabled' : '']" :style="innerStyleCpu"
			>
				<view ref="sliderBaseRef"
					class="up-slider__base"
					:style="[
						{
							height: height,
							backgroundColor: inactiveColor
						}
					]"
				>
				</view>
				<view
					@click="onClick"
					class="up-slider__gap"
					:style="[
						barStyle,
						{
							height: height,
							marginTop: '-' + height,
							backgroundColor: activeColor
						}
					]"
				>
				</view>
				<view v-if="isRange"
					class="up-slider__gap up-slider__gap-0"
					:style="[
						barStyle0,
						{
							height: height,
							marginTop: '-' + height,
							backgroundColor: inactiveColor
						}
					]"
				>
				</view>
				<text v-if="isRange && showValue"
					class="up-slider__show-range-value" :style="{left: (getPx(barStyle0.width) + getPx(blockSize)/2) + 'px'}">
					{{ rangeValue[0] }}
				</text>
				<text v-if="isRange && showValue"
					class="up-slider__show-range-value" :style="{left: (getPx(barStyle.width) + getPx(blockSize)/2) + 'px'}">
					{{ rangeValue[1] }}
				</text>
				<template v-if="isRange">
					<view class="up-slider__button-wrap up-slider__button-wrap-0" @touchstart="onTouchStart($event, 0)"
						@touchmove="onTouchMove($event, 0)" @touchend="onTouchEnd($event, 0)"
						@touchcancel="onTouchEnd($event, 0)" :style="{left: (getPx(barStyle0.width) + getPx(blockSize)/2) + 'px'}">
						<slot name="min" v-if="$slots.min || $slots.$min"/>
						<view v-else class="up-slider__button" :style="[blockStyle, {
							height: getPx(blockSize, true),
							width: getPx(blockSize, true),
							backgroundColor: blockColor
						}]"></view>
					</view>
				</template>
				<view class="up-slider__button-wrap" @touchstart="onTouchStart"
					@touchmove="onTouchMove" @touchend="onTouchEnd"
					@touchcancel="onTouchEnd" :style="{left: (getPx(barStyle.width) + getPx(blockSize)/2) + 'px'}">
					<slot name="max" v-if="isRange && ($slots.max || $slots.$max)"/>
					<slot v-else-if="$slots.default || $slots.$default"/>
					<view v-else class="up-slider__button" :style="[blockStyle, {
						height: getPx(blockSize, true),
						width: getPx(blockSize, true),
						backgroundColor: blockColor
					}]"></view>
				</view>
			</view>
			<view class="up-slider__show-value" v-if="showValue && !isRange">{{ modelValue }}</view>
		</template>
		<slider
			class="up-slider__native"
			v-else
			:min="min"
			:max="max"
			:step="step"
			:value="modelValue"
			:activeColor="activeColor"
			:backgroundColor="inactiveColor"
			:blockSize="getPx(blockSize)"
			:blockColor="blockColor"
			:showValue="showValue"
			:disabled="disabled"
			@changing="changingHandler"
			@change="changeHandler"
		></slider>
	</view>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { props as sliderProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { addStyle, getPx, sleep } from '../../libs/function/index.js'
// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
// #endif
/**
 * slider 滑动选择器
 * @tutorial https://uview-plus.jiangruyi.com/components/slider.html
 * @example <up-slider v-model="value" />
 */
defineOptions({
	name: 'up-slider',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...sliderProps.props
})
const emit = defineEmits(['start', 'changing', 'change', 'update:modelValue', 'input'])
const { $uGetRect } = useUltraUI(props)

const startX = ref(0)
const status = ref('end')
const newValue = ref(0)
const distanceX = ref(0)
const startValue0 = ref(0)
const startValue = ref(0)
const barStyle0 = ref({})
const barStyle = ref({})
const sliderRect = ref({
	left: 0,
	width: 0
})
const sliderBaseRef = ref(null)

const innerStyleCpu = computed(() => {
	const style = { ...(props.innerStyle || {}) }
	style.height = (props.isRange && props.showValue) ? (getPx(props.blockSize) + 24) + 'px' : (getPx(props.blockSize)) + 'px'
	return style
})

// #ifdef VUE3
watch(() => props.modelValue, () => {
	if (status.value == 'end') {
		const $crtFmtValue = updateValue(props.modelValue, false)
		emit('change', $crtFmtValue)
	}
})
// #endif
// #ifdef VUE2
watch(() => props.value, () => {
	if (status.value == 'end') {
		const $crtFmtValue = updateValue(props.value, false)
		emit('change', $crtFmtValue)
	}
})
// #endif

watch(() => props.rangeValue, () => {
	if (status.value == 'end') {
		updateValue(props.rangeValue[0], false, 0)
		updateValue(props.rangeValue[1], false, 1)
		emit('change', props.rangeValue)
	}
}, { deep: true })

onMounted(async () => {
	if (!props.useNative) {
		// #ifndef APP-NVUE
		$uGetRect('.up-slider__base').then((rect) => {
			sliderRect.value = rect
			if (sliderRect.value.width == 0) {
				console.info('嵌套在滚动元素中使用时，请使用v-if控制显示时机，否则无法计算长度。')
			}
			init()
		})
		// #endif
		// #ifdef APP-NVUE
		await sleep(30)
		const refNode = sliderBaseRef.value
		refNode &&
			dom.getComponentRect(refNode, (res) => {
				sliderRect.value = {
					left: res.size.left,
					width: res.size.width
				}
				init()
			})
		// #endif
	}
})

function init() {
	if (props.isRange) {
		updateValue(props.rangeValue[0], false, 0)
		updateValue(props.rangeValue[1], false, 1)
	} else {
		// #ifdef VUE3
		updateValue(props.modelValue, false)
		// #endif
		// #ifdef VUE2
		updateValue(props.value, false)
		// #endif
	}
}

function changingHandler(e) {
	const {
		value
	} = e.detail
	// #ifdef VUE3
	emit('update:modelValue', value)
	// #endif
	// #ifdef VUE2
	emit('input', value)
	// #endif
	emit('changing', value)
}

function changeHandler(e) {
	const {
		value
	} = e.detail
	// #ifdef VUE3
	emit('update:modelValue', value)
	// #endif
	// #ifdef VUE2
	emit('input', value)
	// #endif
	emit('change', value)
}

function onTouchStart(event, index = 1) {
	if (props.disabled) return
	startX.value = 0
	const touches = event.touches[0]
	startX.value = touches.clientX
	if (props.isRange) {
		startValue0.value = format(props.rangeValue[0], 0)
		startValue.value = format(props.rangeValue[1], 1)
	} else {
		// #ifdef VUE3
		startValue.value = format(props.modelValue)
		// #endif
		// #ifdef VUE2
		startValue.value = format(props.value)
		// #endif
	}
	status.value = 'start'

	let clientX = 0
	// #ifndef APP-NVUE
	clientX = touches.clientX
	// #endif
	// #ifdef APP-NVUE
	clientX = touches.screenX
	// #endif
	distanceX.value = clientX - sliderRect.value.left
	newValue.value = ((distanceX.value / sliderRect.value.width) * (props.max - props.min)) + parseFloat(props.min)
	status.value = 'moving'
	const $crtFmtValue = updateValue(newValue.value, true, index)
	emit('changing', $crtFmtValue)
}

function onTouchMove(event, index = 1) {
	if (props.disabled) return
	if (status.value == 'start') emit('start')
	const touches = event.touches[0]
	let clientX = 0
	// #ifndef APP-NVUE
	clientX = touches.clientX
	// #endif
	// #ifdef APP-NVUE
	clientX = touches.screenX
	// #endif
	distanceX.value = clientX - sliderRect.value.left
	newValue.value = ((distanceX.value / sliderRect.value.width) * (props.max - props.min)) + parseFloat(props.min)
	status.value = 'moving'
	const $crtFmtValue = updateValue(newValue.value, true, index)
	emit('changing', $crtFmtValue)
}

function onTouchEnd(event, index = 1) {
	if (props.disabled) return
	if (status.value === 'moving') {
		const $crtFmtValue = updateValue(newValue.value, false, index)
		emit('change', $crtFmtValue)
	}
	status.value = 'end'
}

function onTouchStart2(event, index = 1) {
	if (!props.isRange) {
	}
}

function onTouchMove2(event, index = 1) {
	if (!props.isRange) {
	}
}

function onTouchEnd2(event, index = 1) {
	if (!props.isRange) {
	}
}

function onClick(event) {
	if (props.disabled) return
	// #ifndef APP-NVUE
	const clientX = event.detail.x - sliderRect.value.left
	newValue.value = ((clientX / sliderRect.value.width) * (props.max - props.min)) + parseFloat(props.min)
	updateValue(newValue.value, false, 1)
	// #endif
}

function updateValue(value, drag, index = 1) {
	let valueFormat = format(value, index)
	if (valueFormat > props.max) {
		valueFormat = props.max
	}
	const width = Math.min((valueFormat - props.min) / (props.max - props.min) * sliderRect.value.width, sliderRect.value.width)
	const nextBarStyle = {
		width: width + 'px'
	}
	if (drag == true) {
		nextBarStyle.transition = 'none'
	} else {
		delete nextBarStyle.transition
	}
	if (props.isRange) {
		props.rangeValue[index] = valueFormat
		emit('update:modelValue', props.rangeValue)
	} else {
		// #ifdef VUE3
		emit('update:modelValue', valueFormat)
		// #endif
		// #ifdef VUE2
		emit('input', valueFormat)
		// #endif
	}

	switch (index) {
		case 0:
			barStyle0.value = { ...nextBarStyle }
			break
		case 1:
			barStyle.value = { ...nextBarStyle }
			break
		default:
			break
	}
	if (props.isRange) {
		return props.rangeValue
	}
	return valueFormat
}

function format(value, index = 1) {
	if (props.isRange) {
		switch (index) {
			case 0:
				return Math.round(
					Math.max(props.min, Math.min(value, props.rangeValue[1] - parseInt(props.step), props.max))
					/ parseInt(props.step)
				) * parseInt(props.step)
			case 1:
				return Math.round(
					Math.max(props.min, props.rangeValue[0] + parseInt(props.step), Math.min(value, props.max))
					/ parseInt(props.step)
				) * parseInt(props.step)
			default:
				break
		}
	} else {
		return Math.round(
			Math.max(props.min, Math.min(value, props.max))
			/ parseInt(props.step)
		) * parseInt(props.step)
	}
}
</script>


<style lang="scss" scoped>
	.up-slider {
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: center;

		&__native {
			flex: 1;
		}

		&-inner {
			flex: 1;
			display: flex;
			flex-direction: column;
			position: relative;
			border-radius: 999px;
			padding: 10px 18px;
			justify-content: center;
		}

		&__show-value {
			margin: 10px 18px 10px 0px;
		}

		&__show-range-value {
			padding-top: 2px;
			font-size: 12px;
			line-height: 12px;
			position: absolute;
    		bottom: 0;
		}

		&__base {
			background-color: #ebedf0;
		}

		/* #ifndef APP-NVUE */
		&-inner:before {
			position: absolute;
			right: 0;
			left: 0;
			content: '';
			top: -8px;
			bottom: -8px;
			z-index: -1;
		}
		/* #endif */

		&__gap {
			position: relative;
			border-radius: 999px;
			transition: width 0.2s;
			background-color: #1989fa;
		}

		&__button {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
			background-color: #fff;
			transform: scale(0.9);
			/* #ifdef H5 */
			cursor: pointer;
			/* #endif */
		}

		&__button-wrap {
			position: absolute;
			// transform: translate3d(50%, -50%, 0);
		}

		&--disabled {
			opacity: 0.5;
		}
	}
</style>
