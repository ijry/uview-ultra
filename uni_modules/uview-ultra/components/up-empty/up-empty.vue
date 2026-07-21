<template>
	<view
	    class="up-empty"
	    :style="[emptyStyle]"
	    v-if="show"
	>
		<up-icon
		    v-if="!isSrc"
		    :name="mode === 'message' ? 'chat' : `empty-${mode}`"
		    :size="iconSize"
		    :color="iconColor"
		    margin-top="14"
		></up-icon>
		<image
		    v-else
		    :style="{
				width: addUnit(width),
				height: addUnit(height),
			}"
		    :src="icon"
		    mode="widthFix"
		></image>
		<text
		    class="up-empty__text"
		    :style="[textStyle]"
		>{{text ? text : icons[mode]}}</text>
		<view class="up-empty__wrap" v-if="$slots.default || $slots.$default">
			<slot />
		</view>
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { props as emptyProps } from './props'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, deepMerge } from '../../libs/function/index'
	import { t } from '../../libs/i18n'

	defineOptions({
		name: 'up-empty',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...emptyProps.props
	})

	const icons = {
		car: t('up.empty.car'),
		page: t('up.empty.page'),
		search: t('up.empty.search'),
		address: t('up.empty.address'),
		wifi: t('up.empty.wifi'),
		order: t('up.empty.order'),
		coupon: t('up.empty.coupon'),
		favor: t('up.empty.favor'),
		permission: t('up.empty.permission'),
		history: t('up.empty.history'),
		news: t('up.empty.news'),
		message: t('up.empty.message'),
		list: t('up.empty.list'),
		data: t('up.empty.data'),
		comment: t('up.empty.comment'),
	}

	// 组件样式
	const emptyStyle = computed(() => {
		const style = {}
		style.marginTop = addUnit(props.marginTop)
		return deepMerge(addStyle(props.customStyle), style)
	})

	// 文本样式
	const textStyle = computed(() => {
		const style = {}
		style.color = props.textColor
		style.fontSize = addUnit(props.textSize)
		return style
	})

	// 判断icon是否图片路径
	const isSrc = computed(() => {
		return props.icon.indexOf('/') >= 0
	})
</script>

<style lang="scss" scoped>
	$up-empty-text-margin-top:20rpx !default;
	$up-empty-slot-margin-top:20rpx !default;

	.up-empty {
		@include flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		&__text {
			@include flex;
			justify-content: center;
			align-items: center;
			margin-top: $up-empty-text-margin-top;
		}
	}
		.up-slot-wrap {
			@include flex;
			justify-content: center;
			align-items: center;
			margin-top:$up-empty-slot-margin-top;
		}
</style>
