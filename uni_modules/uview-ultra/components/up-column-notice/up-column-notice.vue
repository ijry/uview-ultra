<template>
	<view
		class="up-notice"
		@tap="clickHandler"
	>
		<slot name="icon">
			<view
				class="up-notice__left-icon"
				v-if="icon"
			>
				<up-icon
					:name="icon"
					:color="color"
					size="19"
				></up-icon>
			</view>
		</slot>
		<swiper
			:disable-touch="disableTouch"
			:vertical="step ? false : true"
			circular
			:interval="duration"
			:autoplay="true"
			class="up-notice__swiper"
			@change="noticeChange"
		>
			<swiper-item
				v-for="(item, index) in text"
				:key="index"
				class="up-notice__swiper__item"
			>
				<text
					class="up-notice__swiper__item__text up-line-1"
					:style="[textStyle]"
				>{{ item }}</text>
			</swiper-item>
		</swiper>
		<view
			class="up-notice__right-icon"
			v-if="['link', 'closable'].includes(mode)"
		>
			<up-icon
				v-if="mode === 'link'"
				name="arrow-right"
				:size="17"
				:color="color"
			></up-icon>
			<up-icon
				v-if="mode === 'closable'"
				name="close"
				:size="16"
				:color="color"
				@click="close"
			></up-icon>
		</view>
	</view>
</template>

<script setup>
	import { computed, ref, watch } from 'vue'
	import { props as columnNoticeProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, error } from '../../libs/function/index.js'
	import test from '../../libs/function/test.js'
	/**
	 * ColumnNotice 滚动通知中的垂直滚动 内部组件
	 * @description 该组件用于滚动通告场景，是其中的垂直滚动方式
	 * @tutorial https://ijry.github.io/uview-plus/components/noticeBar.html
	 * @property {Array}			text 			显示的内容，字符串
	 * @property {String}			icon 			是否显示左侧的音量图标 （ 默认 'volume' ）
	 * @property {String}			mode 			通告模式，link-显示右箭头，closable-显示右侧关闭图标
	 * @property {String}			color 			文字颜色，各图标也会使用文字颜色 （ 默认 '#f9ae3d' ）
	 * @property {String}			bgColor 		背景颜色 （ 默认 '#fdf6ec' ）
	 * @property {String | Number}	fontSize		字体大小，单位px  （ 默认 14 ）
	 * @property {String | Number}	speed			水平滚动时的滚动速度，即每秒滚动多少px(rpx)，这有利于控制文字无论多少时，都能有一个恒定的速度 （ 默认 80 ）
	 * @property {Boolean}			step			direction = row时，是否使用步进形式滚动 （ 默认 false ）
	 * @property {String | Number}	duration		滚动一个周期的时间长，单位ms （ 默认 1500 ）
	 * @property {Boolean}			disableTouch	是否禁止用手滑动切换   目前HX2.6.11，只支持App 2.5.5+、H5 2.5.5+、支付宝小程序、字节跳动小程序 （ 默认 true ）
	 * @example 
	 */
	defineOptions({
		name: 'up-column-notice',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...columnNoticeProps.props
	})
	const emit = defineEmits(['click', 'close'])
	const index = ref(0)

	// 文字内容的样式
	const textStyle = computed(() => {
		const style = {}
		style.color = props.color
		style.fontSize = addUnit(props.fontSize)
		return style
	})

	watch(() => props.text, (newValue) => {
		if (!test.array(newValue)) {
			error('noticebar组件direction为column时，要求text参数为数组形式')
		}
	}, { immediate: true })

	function noticeChange(e) {
		index.value = e.detail.current
	}

	// 点击通告栏
	function clickHandler() {
		emit('click', index.value)
	}

	// 点击关闭按钮
	function close() {
		emit('close')
	}
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-notice {
		@include flex;
		align-items: center;
		justify-content: space-between;

		&__left-icon {
			align-items: center;
			margin-right: 5px;
		}

		&__right-icon {
			margin-left: 5px;
			align-items: center;
		}

		&__swiper {
			height: 16px;
			@include flex;
			align-items: center;
			flex: 1;

			&__item {
				@include flex;
				align-items: center;
				overflow: hidden;

				&__text {
					font-size: 14px;
					color: $up-warning;
				}
			}
		}
	}
</style>
