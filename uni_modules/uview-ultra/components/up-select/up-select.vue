<template>
	<view class="up-select">
		<view :class="['up-select__content', disabled && 'disabled']">
			<view class="up-select__label" @click="openSelect">
				<slot name="text" :currentLabel="currentLabel">
					<text class="up-select__text" v-if="showOptionsLabel">
						{{ currentLabel }}
					</text>
					<text class="up-select__text" v-else>
						{{ label }}
					</text>
				</slot>
				<slot name="icon">
					<up-icon name="arrow-down" :size="iconSize" :color="iconColor"></up-icon>
				</slot>
			</view>
			<up-overlay :show="isOpen" @click="overlayClick" v-if="overlay" :zIndex="zIndex" :duration="duration + 50"
				:customStyle="overlayStyle" :opacity="overlayOpacity" @touchmove.stop.prevent="noop"></up-overlay>
			<view class="up-select__options__wrap"
				:style="{ overflowY: 'auto', zIndex: zIndex + 1, left: optionsWrapLeft, right: optionsWrapRight, maxHeight: maxHeight}">
				<view class="up-select__options" v-if="isOpen">
					<slot name="options">
						<view class="up-select__options-item" :class="current == item[keyName] ? 'up-select__options-item--active': ''"
							:key="index" v-for="(item, index) in options" @click="selectItem(item)">
							<slot name="optionItem" :item="item">
								<text class="up-select__item-text" :style="{color: itemColor}">
									{{item[labelName]}}
								</text>
							</slot>
						</view>
					</slot>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { getWindowInfo } from '../../libs/function/index'
/**
 * select 下拉选择
 */
defineOptions({
	name: 'up-select',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	maxHeight: {
		type: String,
		default: '90vh'
	},
	overlay: {
		type: Boolean,
		default: true
	},
	// 遮罩透明度，下拉框的遮罩默认比弹窗浅，避免整页压暗；传 0 即为完全透明
	overlayOpacity: {
		type: Number,
		default: 0.15
	},
	overlayStyle: {
		type: Object,
		default: () => ({})
	},
	duration: {
		type: Number,
		default: 300
	},
	label: {
		type: String,
		default: '选项'
	},
	options: {
		type: Array,
		default: () => []
	},
	keyName: {
		type: String,
		default: 'id'
	},
	labelName: {
		type: String,
		default: 'name'
	},
	showOptionsLabel: {
		type: Boolean,
		default: false
	},
	current: {
		type: [String, Number],
		default: ''
	},
	zIndex: {
		type: Number,
		default: 11000
	},
	itemColor: {
		type: String,
		default: '#333333'
	},
	iconColor: {
		type: String,
		default: ''
	},
	iconSize: {
		type: [String],
		default: '13px'
	},
	disabled: {
		type: Boolean,
		default: false
	}
})
const emit = defineEmits(['update:current', 'select'])
const { $uGetRect, noop } = useUltraUI(props)

const isOpen = ref(false)
const optionsWrapLeft = ref('auto')
const optionsWrapRight = ref('auto')

const currentLabel = computed(() => {
	let name = ''
	props.options.forEach((ele) => {
		if (ele[props.keyName] === props.current) {
			name = ele[props.labelName]
		}
	})
	return name
})

function openSelect() {
	if (props.disabled) return
	isOpen.value = true
	nextTick(() => {
		if (isOpen.value) {
			adjustOptionsWrapPosition()
		}
	})
}

function closeSelect() {
	isOpen.value = false
}

function overlayClick() {
	isOpen.value = false
}

function selectItem(item) {
	isOpen.value = false
	emit('update:current', item[props.keyName])
	emit('select', item)
}

function adjustOptionsWrapPosition() {
	const wi = getWindowInfo()
	const windowWidth = wi.windowWidth
	$uGetRect('.up-select__options__wrap').then((rect) => {
		if (rect.left + rect.width > windowWidth) {
			optionsWrapLeft.value = 'auto'
			optionsWrapRight.value = '0px'
		}
	})
}

defineExpose({
	openSelect,
	closeSelect
})
</script>


<style lang="scss" scoped>
	.up-select__content {
		position: relative;
	}

	.up-select__content--disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.up-select__label {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	/* #ifdef H5 */
	.up-select__label:hover {
		cursor: pointer;
	}
	/* #endif */

	.up-select__text {
		margin-right: 2px;
	}

	.up-select__options__wrap {
		position: fixed;
		top: 0;
		left: 0;
	}

	.up-select__options {
		min-width: 100px;
		box-sizing: border-box;
		border-radius: 4px;
		border: 1px solid #f1f1f1;
		background-color: #fff;
	}

	.up-select__options-item {
		padding: 10px 12px;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
	}

	/* #ifdef H5 */
	.up-select__options-item:hover {
		background-color: #f7f7f7;
		cursor: pointer;
	}

	.up-select__item-text:hover {
		cursor: pointer;
	}
	/* #endif */
</style>
