<template>
	<view class="up-swiper-indicator">
		<view
			class="up-swiper-indicator__wrapper"
			v-if="indicatorMode === 'line'"
			:class="[`up-swiper-indicator__wrapper--${indicatorMode}`]"
			:style="{
				width: addUnit(lineWidth * length),
				backgroundColor: indicatorInactiveColor
			}"
		>
			<view
				class="up-swiper-indicator__line-bar"
				:style="[lineStyle]"
			></view>
		</view>
		<view
			class="up-swiper-indicator__wrapper"
			v-if="indicatorMode === 'dot'"
		>
			<view
				class="up-swiper-indicator__wrapper__dot"
				v-for="(item, index) in length"
				:key="index"
				:class="[index === current && 'up-swiper-indicator__wrapper__dot--active']"
				:style="[dotStyle(index)]"
			>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { props as swiperIndicatorProps } from './props'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit } from '../../libs/function/index.js'
	/**
	 * SwiperIndicator 轮播图指示器
	 * @description 该组件一般用于导航轮播，广告展示等场景,可开箱即用，
	 * @tutorial https://uview-plus.jiangruyi.com/components/swiper.html
	 * @property {String | Number}	length					轮播的长度（默认 0 ）
	 * @property {String | Number}	current					当前处于活动状态的轮播的索引（默认 0 ）
	 * @property {String}			indicatorActiveColor	指示器非激活颜色
	 * @property {String}			indicatorInactiveColor	指示器的激活颜色
	 * @property {String}			indicatorMode			指示器模式（默认 'line' ）
	 * @example	<up-swiper :list="list4" indicator keyName="url" :autoplay="false"></up-swiper>
	 */
	defineOptions({
		name: 'up-swiper-indicator',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...swiperIndicatorProps.props
	})
	const lineWidth = 22

	// 指示器为线型的样式
	const lineStyle = computed(() => {
		const style = {}
		style.width = addUnit(lineWidth)
		style.transform = `translateX(${addUnit(props.current * lineWidth)})`
		style.backgroundColor = props.indicatorActiveColor
		return style
	})

	// 指示器为点型的样式
	function dotStyle(index) {
		const style = {}
		style.backgroundColor = index === props.current ? props.indicatorActiveColor : props.indicatorInactiveColor
		return style
	}
</script>

<style lang="scss" scoped>

	.up-swiper-indicator {
		&__wrapper {
			@include flex;

			&--line {
				border-radius: 100px;
				height: 4px;
			}

			&__dot {
				width: 5px;
				height: 5px;
				border-radius: 100px;
				margin: 0 4px;

				&--active {
					width: 12px;
				}
			}
		}

		&__line-bar {
			width: 22px;
			height: 4px;
			border-radius: 100px;
			background-color: #FFFFFF;
			transition: transform 0.3s;
		}
	}
</style>
