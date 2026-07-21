<template>
	<view
		class="up-tooltip"
		:style="[addStyle(customStyle)]"
	>
		<up-overlay
			:show="showTooltip && tooltipTop !== -10000 && overlay"
			customStyle="backgroundColor: rgba(0, 0, 0, 0)"
			@click="overlayClickHandler"
		></up-overlay>
		<view class="up-tooltip__wrapper">
			<text
				class="up-tooltip__wrapper__text"
				:id="textId"
				ref="textRef"
				:userSelect="false"
				:selectable="false"
				@longpress.stop="longpressHandler"
				:style="{
					color: color,
					backgroundColor: bgColor && showTooltip && tooltipTop !== -10000 ? bgColor : 'transparent'
				}"
			>{{ text }}</text>
			<up-transition
				mode="fade"
				:show="showTooltip"
				duration="300"
				:customStyle="{
					position: 'absolute',
					top: addUnit(tooltipTop),
					zIndex: zIndex,
					...tooltipStyle
				}"
			>
				<view
					class="up-tooltip__wrapper__popup"
					:id="tooltipId"
					ref="tooltipRef"
				>
					<view
						class="up-tooltip__wrapper__popup__indicator"
						hover-class="up-tooltip__wrapper__popup__indicator--hover"
						v-if="showCopy || buttons.length"
						:style="[indicatorStyle, {
							width: addUnit(indicatorWidth),
							height: addUnit(indicatorWidth),
						}]"
					>
						<!-- 由于nvue不支持三角形绘制，这里就做一个四方形，再旋转45deg，得到露出的一个三角 -->
					</view>
					<view class="up-tooltip__wrapper__popup__list">
						<view
							v-if="showCopy"
							class="up-tooltip__wrapper__popup__list__btn"
							hover-class="up-tooltip__wrapper__popup__list__btn--hover"
							@tap="setClipboardData"
						>
							<text
								class="up-tooltip__wrapper__popup__list__btn__text"
							>复制</text>
						</view>
						<up-line
							direction="column"
							color="#8d8e90"
							v-if="showCopy && buttons.length > 0"
							length="18"
						></up-line>
						<block v-for="(item , index) in buttons" :key="index">
							<view
								class="up-tooltip__wrapper__popup__list__btn"
								hover-class="up-tooltip__wrapper__popup__list__btn--hover"
							>
								<text
									class="up-tooltip__wrapper__popup__list__btn__text"
									@tap="btnClickHandler(index)"
								>{{ item }}</text>
							</view>
							<up-line
								direction="column"
								color="#8d8e90"
								v-if="index < buttons.length - 1"
								length="18"
							></up-line>
						</block>
					</view>
				</view>
			</up-transition>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { props as tooltipProps } from './props.js'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
import { addStyle, addUnit, getPx, guid, toast, sleep, sys } from '../../libs/function/index.js'
// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
// #endif
/**
 * Tooltip
 * @description
 * @tutorial https://ijry.github.io/uview-plus/components/tooltip.html
 * @property {String | Number}	text		需要显示的提示文字
 * @property {String | Number}	copyText	点击复制按钮时，复制的文本，为空则使用text值
 * @property {String | Number}	size		文本大小（默认 14 ）
 * @property {String}			color		字体颜色（默认 '#606266' ）
 * @property {String}			bgColor		弹出提示框时，文本的背景色（默认 'transparent' ）
 * @property {String}			direction	弹出提示的方向，top-上方，bottom-下方（默认 'top' ）
 * @property {String | Number}	zIndex		弹出提示的z-index，nvue无效（默认 10071 ）
 * @property {Boolean}			showCopy	是否显示复制按钮（默认 true ）
 * @property {Array}			buttons		扩展的按钮组
 * @property {Boolean}			overlay		是否显示透明遮罩以防止触摸穿透（默认 true ）
 * @property {Object}			customStyle	定义需要用到的外部样式
 *
 * @event {Function}
 * @example
 */
defineOptions({
	name: 'up-tooltip',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...tooltipProps.props
})
const emit = defineEmits(['click'])
const { $uGetRect } = useUltraUI(props)

const showTooltip = ref(true)
const textId = ref(guid())
const tooltipId = ref(guid())
const tooltipTop = ref(-10000)
const tooltipInfo = ref({
	width: 0,
	left: 0
})
const textInfo = ref({
	width: 0,
	left: 0
})
const indicatorStyle = ref({})
const screenGap = 12
const indicatorWidth = 14
const textRef = ref(null)
const tooltipRef = ref(null)

const propsChange = computed(() => [props.text, props.buttons])

watch(propsChange, () => {
	getElRect()
})

const tooltipStyle = computed(() => {
	const style = {
		transform: `translateY(${props.direction === 'top' ? '-100%' : '100%'})`,
	}
	const sysInfo = sys()
	if (tooltipInfo.value.width / 2 > textInfo.value.left + textInfo.value.width / 2 - screenGap) {
		indicatorStyle.value = {}
		style.left = `-${addUnit(textInfo.value.left - screenGap)}`
		indicatorStyle.value.left = addUnit(textInfo.value.width / 2 - getPx(style.left) - indicatorWidth / 2)
	} else if (tooltipInfo.value.width / 2 > sysInfo.windowWidth - textInfo.value.right + textInfo.value.width / 2 - screenGap) {
		indicatorStyle.value = {}
		style.right = `-${addUnit(sysInfo.windowWidth - textInfo.value.right - screenGap)}`
		indicatorStyle.value.right = addUnit(textInfo.value.width / 2 - getPx(style.right) - indicatorWidth / 2)
	} else {
		const left = Math.abs(textInfo.value.width / 2 - tooltipInfo.value.width / 2)
		style.left = textInfo.value.width > tooltipInfo.value.width ? addUnit(left) : -addUnit(left)
		indicatorStyle.value = {}
	}
	if (props.direction === 'top') {
		style.marginTop = '-10px'
		indicatorStyle.value.bottom = '-4px'
	} else {
		style.marginBottom = '-10px'
		indicatorStyle.value.top = '-4px'
	}
	return style
})

onMounted(() => {
	init()
})

function init() {
	getElRect()
}

async function longpressHandler() {
	tooltipTop.value = 0
	showTooltip.value = true
}

function overlayClickHandler() {
	showTooltip.value = false
}

function btnClickHandler(index) {
	showTooltip.value = false
	emit('click', props.showCopy ? index + 1 : index)
}

function queryRect(refName) {
	// #ifndef APP-NVUE
	return new Promise((resolve) => {
		$uGetRect(`#${refName}`).then((size) => {
			resolve(size)
		})
	})
	// #endif

	// #ifdef APP-NVUE
	return new Promise((resolve) => {
		const node = refName === textId.value ? textRef.value : tooltipRef.value
		dom.getComponentRect(node, (res) => {
			resolve(res.size)
		})
	})
	// #endif
}

function getElRect() {
	showTooltip.value = true
	tooltipTop.value = -10000
	sleep(500).then(() => {
		queryRect(tooltipId.value).then((size) => {
			tooltipInfo.value = size
			showTooltip.value = false
		})
		queryRect(textId.value).then((size) => {
			textInfo.value = size
		})
	})
}

function setClipboardData() {
	showTooltip.value = false
	emit('click', 0)
	uni.setClipboardData({
		data: props.copyText || props.text,
		success: () => {
			props.showToast && toast('复制成功')
		},
		fail: () => {
			props.showToast && toast('复制失败')
		},
		complete: () => {
			showTooltip.value = false
		}
	})
}
</script>


<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-tooltip {
		position: relative;
		@include flex;

		&__wrapper {
			@include flex;
			justify-content: center;
			/* #ifndef APP-NVUE */
			white-space: nowrap;
			/* #endif */

			&__text {
				font-size: 14px;
			}

			&__popup {
				@include flex;
				justify-content: center;

				&__list {
					background-color: #060607;
					position: relative;
					flex: 1;
					border-radius: 5px;
					padding: 0px 0;
					@include flex(row);
					align-items: center;
					overflow: hidden;

					&__btn {
						padding: 11px 13px;

						&--hover {
							background-color: #58595B;
						}

						&__text {
							line-height: 12px;
							font-size: 13px;
							color: #FFFFFF;
						}
					}
				}

				&__indicator {
					position: absolute;
					background-color: #060607;
					width: 14px;
					height: 14px;
					bottom: -4px;
					transform: rotate(45deg);
					border-radius: 2px;
					z-index: -1;

					&--hover {
						background-color: #58595B;
					}
				}
			}
		}
	}
</style>
