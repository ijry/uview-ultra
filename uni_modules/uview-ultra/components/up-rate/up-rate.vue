<template>
    <view
        class="up-rate"
        :id="elId"
        ref="rateRef"
        :style="[addStyle(customStyle)]"
    >
        <view
            class="up-rate__content"
            @touchmove.stop="touchMove"
            @touchend.stop="touchEnd"
        >
            <view
                class="up-rate__content__item cursor-pointer"
                v-for="(item, index) in Number(count)"
                :key="index"
                :class="[elClass]"
            >
                <view
                    class="up-rate__content__item__icon-wrap"
                    ref="rateIconWrapRefs"
                    @tap.stop="clickHandler($event, index + 1)"
                >
                    <up-icon
                        :name="
                            Math.floor(activeIndex) > index
                                ? activeIcon
                                : inactiveIcon
                        "
                        :color="
                            disabled
                                ? '#c8c9cc'
                                : Math.floor(activeIndex) > index
                                ? activeColor
                                : inactiveColor
                        "
                        :custom-style="{
                            padding: `0 ${addUnit(gutter / 2)}`,
                        }"
                        :size="size"
                    ></up-icon>
                </view>
                <view
                    v-if="allowHalf"
                    @tap.stop="clickHandler($event, index + 1)"
                    class="up-rate__content__item__icon-wrap up-rate__content__item__icon-wrap--half"
                    :style="[{
                        width: addUnit(rateWidth / 2),
                    }]"
                    ref="rateIconWrapRefs"
                >
                    <up-icon
                        :name="
                            Math.ceil(activeIndex) > index
                                ? activeIcon
                                : inactiveIcon
                        "
                        :color="
                            disabled
                                ? '#c8c9cc'
                                : Math.ceil(activeIndex) > index
                                ? activeColor
                                : inactiveColor
                        "
                        :custom-style="{
                            padding: `0 ${addUnit(gutter / 2)}`
                        }"
                        :size="size"
                    ></up-icon>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { props as rateProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { addUnit, addStyle, guid, sleep, range, os } from '../../libs/function/index'
// #ifdef APP-NVUE
const dom = weex.requireModule('dom')
// #endif
/**
 * rate 评分
 * @description 该组件一般用于满意度调查，星型评分的场景
 * @tutorial https://uview-plus.jiangruyi.com/components/rate.html
 * @property {String | Number}	value			用于v-model双向绑定选中的星星数量 (默认 1 )
 * @property {String | Number}	count			最多可选的星星数量 （默认 5 ）
 * @property {Boolean}			disabled		是否禁止用户操作 （默认 false ）
 * @property {Boolean}			readonly		是否只读 （默认 false ）
 * @property {String | Number}	size			星星的大小，单位px （默认 18 ）
 * @property {String}			inactiveColor	未选中星星的颜色 （默认 '#b2b2b2' ）
 * @property {String}			activeColor		选中的星星颜色 （默认 '#FA3534' ）
 * @property {String | Number}	gutter			星星之间的距离 （默认 4 ）
 * @property {String | Number}	minCount		最少选中星星的个数 （默认 1 ）
 * @property {Boolean}			allowHalf		是否允许半星选择 （默认 false ）
 * @property {String}			activeIcon		选中时的图标名，只能为uView的内置图标 （默认 'star-fill' ）
 * @property {String}			inactiveIcon	未选中时的图标名，只能为uView的内置图标 （默认 'star' ）
 * @property {Boolean}			touchable		是否可以通过滑动手势选择评分 （默认 'true' ）
 * @property {Object}			customStyle		组件的样式，对象形式
 * @event {Function} change 选中的星星发生变化时触发
 * @example <up-rate :count="count" :value="2"></up-rate>
 */
defineOptions({
	name: 'up-rate',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...rateProps.props
})
const emit = defineEmits([
	// #ifdef VUE3
	'update:modelValue',
	// #endif
	'change'
])
const { $uGetRect, preventEvent } = useUltraUI(props)

function toNumber(value, fallback = 0) {
	const num = Number(value)
	return Number.isFinite(num) ? num : fallback
}
function getMinCountValue() {
	return toNumber(props.minCount, 0)
}
function getCountValue() {
	return toNumber(props.count, 0)
}
function normalizeActiveIndex(value) {
	let normalized = toNumber(value, getMinCountValue())
	const minCount = getMinCountValue()
	const count = getCountValue()
	if (normalized < minCount) normalized = minCount
	if (count > 0 && normalized > count) normalized = count
	return normalized
}

// #ifdef VUE3
const initialActive = Number.isFinite(Number(props.modelValue)) ? Number(props.modelValue) : getMinCountValue()
// #endif
// #ifdef VUE2
const initialActive = Number.isFinite(Number(props.value)) ? Number(props.value) : getMinCountValue()
// #endif

const elId = ref(guid())
const elClass = ref(guid())
const rateBoxLeft = ref(0)
const activeIndex = ref(initialActive)
const rateWidth = ref(0)
const moving = ref(false)
const rateRef = ref(null)
const rateIconWrapRefs = ref([])

// #ifdef VUE3
watch(() => props.modelValue, (val) => {
	activeIndex.value = normalizeActiveIndex(val)
})
// #endif
// #ifdef VUE2
watch(() => props.value, (val) => {
	activeIndex.value = normalizeActiveIndex(val)
})
// #endif

watch(activeIndex, () => {
	emitEvent()
})

onMounted(() => {
	init()
})

function getFallbackRateWidth() {
	const size = parseFloat(props.size) || 18
	const gutter = parseFloat(props.gutter) || 0
	const width = size + gutter
	return width > 0 ? width : 18
}

function ensureRateMetrics() {
	if (!Number.isFinite(rateBoxLeft.value)) {
		rateBoxLeft.value = 0
	}
	if (!Number.isFinite(rateWidth.value) || rateWidth.value <= 0) {
		rateWidth.value = getFallbackRateWidth()
		getRateIconWrapRect()
	}
	return Number.isFinite(rateWidth.value) && rateWidth.value > 0
}

function init() {
	sleep().then(() => {
		getRateItemRect()
		getRateIconWrapRect()
	})
}

async function getRateItemRect() {
	await sleep()
	// #ifndef APP-NVUE
	$uGetRect('#' + elId.value).then((res) => {
		if (res && Number.isFinite(res.left)) {
			rateBoxLeft.value = res.left
		}
	})
	// #endif
	// #ifdef APP-NVUE
	dom.getComponentRect(rateRef.value, (res) => {
		const left = res && res.size ? res.size.left : NaN
		if (Number.isFinite(left)) {
			rateBoxLeft.value = left
		}
	})
	// #endif
}

function getRateIconWrapRect() {
	// #ifndef APP-NVUE
	$uGetRect('.' + elClass.value).then((res) => {
		if (res && Number.isFinite(res.width) && res.width > 0) {
			rateWidth.value = res.width
		}
	})
	// #endif
	// #ifdef APP-NVUE
	const wrap = Array.isArray(rateIconWrapRefs.value) ? rateIconWrapRefs.value[0] : rateIconWrapRefs.value
	dom.getComponentRect(wrap, (res) => {
		const width = res && res.size ? res.size.width : NaN
		if (Number.isFinite(width) && width > 0) {
			rateWidth.value = width
		}
	})
	// #endif
}

function touchMove(e) {
	if (!props.touchable) return
	preventEvent(e)
	ensureRateMetrics()
	const x = e.changedTouches[0].pageX
	getActiveIndex(x)
}

function touchEnd(e) {
	if (!props.touchable) return
	preventEvent(e)
	ensureRateMetrics()
	const x = e.changedTouches[0].pageX
	getActiveIndex(x)
}

function clickHandler(e, index) {
	if (os() === 'ios' && moving.value) return
	preventEvent(e)
	ensureRateMetrics()
	let x = 0
	// #ifndef APP-NVUE
	x = e.changedTouches[0].pageX
	// #endif
	// #ifdef APP-NVUE
	x = index * rateWidth.value + rateBoxLeft.value
	// #endif
	getActiveIndex(x, true)
}

function emitEvent() {
	const normalizedValue = normalizeActiveIndex(activeIndex.value)
	if (!Number.isFinite(activeIndex.value) || normalizedValue !== activeIndex.value) {
		activeIndex.value = normalizedValue
		return
	}
	emit('change', normalizedValue)
	// #ifdef VUE3
	emit('update:modelValue', normalizedValue)
	// #endif
	// #ifdef VUE2
	emit('input', normalizedValue)
	// #endif
}

function getActiveIndex(x, isClick = false) {
	if (props.disabled || props.readonly) return
	if (!ensureRateMetrics()) return
	const count = getCountValue()
	if (count <= 0) return
	if (!Number.isFinite(x)) return
	const allRateWidth = rateWidth.value * count + rateBoxLeft.value
	x = range(rateBoxLeft.value, allRateWidth, x) - rateBoxLeft.value
	const distance = x
	let index
	if (props.allowHalf) {
		index = Math.floor(distance / rateWidth.value)
		const decimal = distance % rateWidth.value
		if (decimal <= rateWidth.value / 2 && decimal > 0) {
			index += 0.5
		} else if (decimal > rateWidth.value / 2) {
			index++
		}
	} else {
		index = Math.floor(distance / rateWidth.value)
		const decimal = distance % rateWidth.value
		if (isClick) {
			if (decimal > 0) index++
		} else {
			if (decimal > rateWidth.value / 2) index++
		}
	}
	activeIndex.value = normalizeActiveIndex(Math.min(index, count))
	if (activeIndex.value < getMinCountValue()) {
		activeIndex.value = getMinCountValue()
	}
	setTimeout(() => {
		moving.value = true
	}, 10)
	setTimeout(() => {
		moving.value = false
	}, 10)
}
</script>


<style lang="scss" scoped>
$up-rate-margin: 0 !default;
$up-rate-padding: 0 !default;
$up-rate-item-icon-wrap-half-top: 0 !default;
$up-rate-item-icon-wrap-half-left: 0 !default;

.up-rate {
    @include flex;
    align-items: center;
    margin: $up-rate-margin;
    padding: $up-rate-padding;
    /* #ifndef APP-NVUE */
    touch-action: none;
    /* #endif */

    &__content {
        @include flex;

		&__item {
		    position: relative;

		    &__icon-wrap {
		        &--half {
		            position: absolute;
		            overflow: hidden;
		            top: $up-rate-item-icon-wrap-half-top;
		            left: $up-rate-item-icon-wrap-half-left;
		        }
		    }
		}
    }
}

.up-icon {
    /* #ifndef APP-NVUE */
    box-sizing: border-box;
    /* #endif */
}
</style>
