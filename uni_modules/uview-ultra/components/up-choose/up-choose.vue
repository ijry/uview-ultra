<style scoped lang="scss">
	.up-choose {
		::v-deep .up-tag {
		    font-weight: 600;
		}
		&:last-child {
			margin-right: 0;
		}
	}

	.up-choose-wrap {
		flex-wrap: wrap;
	}

	.up-choose-nowrap {
		flex-wrap: nowrap;
		white-space: nowrap;
	}
</style>

<template>
	<scroll-view
		:scroll-x="wrap === false"
		:class="['up-choose', wrap ? 'up-choose-wrap' : 'up-choose-nowrap']">
        <template :key="item.id"  v-for="(item,index) in options">
            <view :style="{width: itemWidth, display: 'inline-block'}">
                <slot :item="item" :index="index">
                    <up-tag :type="index == currentIndex ? 'primary' : 'info'"
                        size="large" :plain="index == currentIndex ? false : true"
                        :class="currentIndex === index ? 'active': ''" :height="itemHeight"
                        :style="{width: itemWidth, padding: itemPadding}"
                        @click="change(index)">
                        {{item[labelName]}}
                    </up-tag>
                </slot>
            </view>
        </template>
	</scroll-view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-choose',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	options: {
		type: Array,
		default: () => {
			return []
		}
	},
	modelValue: {
		type: [Number, String, Array],
		default: false
	},
	type: {
		type: [String],
		default: 'radio'
	},
	itemWidth: {
		type: [String],
		default: 'auto'
	},
	itemHeight: {
		type: [String],
		default: '50px'
	},
	itemPadding: {
		type: [String],
		default: '8px'
	},
	labelName: {
		type: String,
		default: 'title'
	},
	valueName: {
		type: String,
		default: 'value'
	},
	customClick: {
		type: Boolean,
		default: false
	},
	// 是否换行
	wrap: {
		type: Boolean,
		default: true
	}
})
const emit = defineEmits(['update:modelValue', 'custom-click'])

const currentIndex = ref('')

watch(() => props.modelValue, (newVal) => {
	currentIndex.value = newVal
}, { immediate: true })

function change(index) {
	if (props.customClick) {
		emit('custom-click', index)
	} else {
		currentIndex.value = index
		emit('update:modelValue', index)
	}
}
</script>

