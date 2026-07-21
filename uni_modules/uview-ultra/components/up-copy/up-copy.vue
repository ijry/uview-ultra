<template>
	<view class="up-copy" @click="handleClick">
        <slot>复制</slot>
    </view>
</template>
<script setup>
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-copy',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	content: {
		type: String,
		default: ''
	},
	alertStyle: {
		type: String,
		default: 'toast'
	},
	notice: {
		type: String,
		default: '复制成功'
	}
})
const emit = defineEmits(['success'])

function handleClick() {
	let content = props.content
	if (!content) {
		uni.showToast({
			title: '暂无',
			icon: 'none',
			duration: 2000,
		})
		return false
	}
	content = typeof content === 'string' ? content : content.toString()
	uni.setClipboardData({
		data: content,
		success: function() {
			if (props.alertStyle == 'modal') {
				uni.showModal({
					title: '提示',
					content: props.notice
				})
			} else {
				uni.showToast({
					title: props.notice,
					icon: 'none'
				})
			}
			emit('success')
		},
		fail: function() {
			uni.showToast({
				title: '复制失败',
				icon: 'none',
				duration: 3000,
			})
		}
	})
}
</script>


<style lang="scss" scoped>
</style>
