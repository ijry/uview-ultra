<template>
	<text
	    class="up-link"
	    @tap.stop="openLink"
	    :style="[linkStyle, addStyle(customStyle)]"
	>{{text}}</text>
</template>

<script setup>
	import { computed, nextTick } from 'vue'
	import { propsLink } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addStyle, addUnit, getPx, toast } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-link',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...propsLink.props
	})
	const emit = defineEmits(['click'])

	const linkStyle = computed(() => {
		const style = {
			color: props.color,
			fontSize: addUnit(props.fontSize),
			// line-height设置为比字体大小多2px
			lineHeight: addUnit(getPx(props.fontSize) + 2),
			textDecoration: props.underLine ? 'underline' : 'none'
		}
		return style
	})

	function openLink() {
		// #ifdef APP-PLUS
		plus.runtime.openURL(props.href)
		// #endif
		// #ifdef H5
		window.open(props.href)
		// #endif
		// #ifdef MP
		uni.setClipboardData({
			data: props.href,
			success: () => {
				uni.hideToast()
				nextTick(() => {
					toast(props.mpTips)
				})
			}
		})
		// #endif
		emit('click')
	}
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
	$up-link-line-height:1 !default;

	.up-link {
		/* #ifndef APP-NVUE */
		line-height: $up-link-line-height;
		/* #endif */
		@include flex;
		flex-wrap: wrap;
		flex: 1;
	}
</style>
