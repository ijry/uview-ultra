<template>
    <view
        class="up-subsection"
        ref="subsectionRootRef"
        :class="[`up-subsection--${mode}`]"
        :style="[addStyle(customStyle), wrapperStyle]"
    >
        <view
            class="up-subsection__bar cursor-pointer"
            ref="subsectionBarRef"
            :style="[barStyle]"
            :class="[
                mode === 'button' && 'up-subsection--button__bar',
                innerCurrent === 0 &&
                    mode === 'subsection' &&
                    'up-subsection__bar--first',
                innerCurrent > 0 &&
                innerCurrent < list.length - 1 &&
                    mode === 'subsection' &&
                    'up-subsection__bar--center',
                innerCurrent === list.length - 1 &&
                    mode === 'subsection' &&
                    'up-subsection__bar--last',
            ]"
        ></view>
        <view
            class="up-subsection__item cursor-pointer"
            :class="[
                `up-subsection__item--${index}`,
                index < list.length - 1 &&
                    'up-subsection__item--no-border-right',
                index === 0 && 'up-subsection__item--first',
                index === list.length - 1 && 'up-subsection__item--last',
                disabled && 'up-subsection__item--disabled',
            ]"
            :ref="index === 0 ? 'firstItemRef' : undefined"
            :style="[itemStyle(index)]"
            @tap="clickHandler(index)"
            v-for="(item, index) in list"
            :key="index"
        >
            <text
                class="up-subsection__item__text"
                :class="[disabled && 'up-subsection__item__text--disabled']"
                :style="[textStyle(index)]"
                >{{ getText(item) }}</text
            >
        </view>
    </view>
</template>

<script setup>
// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
const animation = uni.requireNativePlugin('animation')
// #endif
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { props as subsectionProps } from './props.js'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
import { addStyle, addUnit, sleep } from '../../libs/function/index.js'
/**
 * Subsection 分段器
 * @description 该分段器一般用于用户从几个选项中选择某一个的场景
 * @tutorial https://ijry.github.io/uview-plus/components/subsection.html
 * @property {Array}			list			tab的数据
 * @property {String ｜ Number}	current			当前活动的tab的index（默认 0 ）
 * @property {String}			activeColor		激活时的颜色（默认 '#3c9cff' ）
 * @property {String}			inactiveColor	未激活时的颜色（默认 '#303133' ）
 * @property {String}			mode			模式选择，mode=button为按钮形式，mode=subsection时为分段模式（默认 'button' ）
 * @property {String ｜ Number}	fontSize		字体大小，单位px（默认 12 ）
 * @property {Boolean}			bold			激活选项的字体是否加粗（默认 true ）
 * @property {String}			bgColor			组件背景颜色，mode为button时有效（默认 '#eeeeef' ）
 * @property {Object}			customStyle		定义需要用到的外部样式
 * @property {String}	        keyName	        从`list`元素对象中读取的键名（默认 'name' ）
 *
 * @event {Function} change		分段器选项发生改变时触发  回调 index：选项的index索引值，从0开始
 * @example <up-subsection :list="list" :current="curNow" @change="sectionChange"></up-subsection>
 */
defineOptions({
	name: 'up-subsection',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...subsectionProps.props
})
const emit = defineEmits(['change'])
const { $uGetRect } = useUltraUI(props)

const itemRect = ref({
	width: 0,
	height: 0,
})
const innerCurrent = ref('')
const windowResizeCallback = ref(null)
const subsectionBarRef = ref(null)
const firstItemRef = ref(null)

watch(() => props.list, () => {
	init()
})

watch(() => props.current, (n) => {
	if (n !== innerCurrent.value) {
		innerCurrent.value = n
	}
	// #ifdef APP-NVUE
	const bar = subsectionBarRef.value
	const refNode = bar?.ref
	sleep(refNode ? 0 : 100).then(() => {
		animation.transition(subsectionBarRef.value.ref, {
			styles: {
				transform: `translateX(${n * itemRect.value.width}px)`,
				transformOrigin: 'center center',
			},
			duration: 300,
		})
	})
	// #endif
}, { immediate: true })

const wrapperStyle = computed(() => {
	const style = {}
	if (props.mode === 'button') {
		style.backgroundColor = props.bgColor
	}
	return style
})

const barStyle = computed(() => {
	const style = {}
	style.width = `${itemRect.value.width}px`
	style.height = `${itemRect.value.height}px`
	// #ifndef APP-NVUE
	style.transform = `translateX(${innerCurrent.value * itemRect.value.width}px)`
	// #endif
	if (props.mode === 'subsection') {
		style.backgroundColor = props.activeColor
	}
	return style
})

function itemStyle() {
	const style = {}
	if (props.mode === 'subsection') {
		style.borderColor = props.activeColor
		style.borderWidth = '1px'
		style.borderStyle = 'solid'
	}
	return style
}

function textStyle(index) {
	const style = {}
	if (props.disabled) {
		style.fontWeight = 'normal'
		style.fontSize = addUnit(props.fontSize)
		style.color = 'var(--up-disabled-color, #c8c9cc)'
		return style
	}
	style.fontWeight = props.bold && innerCurrent.value === index ? 'bold' : 'normal'
	style.fontSize = addUnit(props.fontSize)
	const item = props.list[index]
	const activeColorTemp = typeof item === 'object' && item ? item[props.activeColorKeyName] : null
	const inactiveColorTemp = typeof item === 'object' && item ? item[props.inactiveColorKeyName] : null
	if (props.mode === 'subsection') {
		style.color = innerCurrent.value === index
			? activeColorTemp || '#fff'
			: inactiveColorTemp || props.inactiveColor
	} else {
		style.color = innerCurrent.value === index
			? activeColorTemp || props.activeColor
			: inactiveColorTemp || props.inactiveColor
	}
	return style
}

onMounted(() => {
	init()
	windowResizeCallback.value = () => {
		init()
	}
	uni.onWindowResize(windowResizeCallback.value)
})

onBeforeUnmount(() => {
	uni.offWindowResize(windowResizeCallback.value)
})

function init() {
	innerCurrent.value = props.current
	sleep().then(() => getRect())
}

function getText(item) {
	return typeof item === 'object' ? item[props.keyName] : item
}

function getRect() {
	// #ifndef APP-NVUE
	$uGetRect('.up-subsection__item--0').then((size) => {
		itemRect.value = size
	})
	// #endif

	// #ifdef APP-NVUE
	const refNode = Array.isArray(firstItemRef.value) ? firstItemRef.value[0] : firstItemRef.value
	refNode && dom.getComponentRect(refNode, (res) => {
		itemRect.value = res.size
	})
	// #endif
}

function clickHandler(index) {
	if (props.disabled) return
	innerCurrent.value = index
	emit('change', index)
}
</script>


<style lang="scss" scoped>
@import "../../libs/css/components.scss";
@import "./theme-vars.scss";

.up-subsection {
    @include flex;
    position: relative;
    overflow: hidden;
	/* #ifndef APP-NVUE */
	width: 100%;
	box-sizing: border-box;
	/* #endif */

    &--button {
        height: 34px;
        background-color: var(--up-hover-bg-color, rgb(238, 238, 239));
        padding: 3px;
        border-radius: 4px;
        align-items: stretch;

        &__bar {
            background-color: var(--up-card-bg-color, #ffffff);
            border-radius: 4px !important;
        }
    }

    &--subsection {
        height: 32px;
    }

    &__bar {
        position: absolute;
        /* #ifndef APP-NVUE */
        transition-property: transform, color;
        transition-duration: 0.3s;
        transition-timing-function: ease-in-out;
        /* #endif */

        &--first {
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
            border-top-right-radius: 0px;
            border-bottom-right-radius: 0px;
        }

        &--center {
            border-top-left-radius: 0px;
            border-bottom-left-radius: 0px;
            border-top-right-radius: 0px;
            border-bottom-right-radius: 0px;
        }

        &--last {
            border-top-left-radius: 0px;
            border-bottom-left-radius: 0px;
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
        }
    }

    &__item {
        @include flex;
        flex: 1;
        justify-content: center;
        align-items: center;
        // vue环境下，需要设置相对定位，因为滑块为绝对定位，item需要在滑块的上面
        position: relative;

        &--no-border-right {
            border-right-width: 0 !important;
        }

        &--first {
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
        }

        &--last {
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
        }

        &--disabled {
            cursor: no-drop;
        }

        &__text {
            font-size: 12px;
            line-height: 14px;
            @include flex;
            align-items: center;
            transition-property: color;
            transition-duration: 0.3s;

            &--disabled {
                color: var(--up-disabled-color, #c8c9cc) !important;
            }
        }
    }
}
</style>
