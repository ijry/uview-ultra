<template>
	<view
	    class="up-loadmore"
	    :style="[
			addStyle(customStyle),
			{
				backgroundColor: bgColor,
				marginBottom: addUnit(marginBottom),
				marginTop: addUnit(marginTop),
				height: addUnit(height),
			},
		]"
	>
		<up-line
		    length="140rpx"
		    :color="lineColor"
		    :hairline="false"
			:dashed="dashed"
			v-if="line"
		></up-line>
		<!-- 加载中和没有更多的状态才显示两边的横线 -->
		<view
		    :class="status == 'loadmore' || status == 'nomore' ? 'up-more' : ''"
		    class="up-loadmore__content"
		>
			<view
			    class="up-loadmore__content__icon-wrap"
			    v-if="status === 'loading' && icon"
			>
				<up-loading-icon
				    :color="iconColor"
				    :size="iconSize"
				    :mode="loadingIcon"
				></up-loading-icon>
			</view>
			<!-- 如果没有更多的状态下，显示内容为dot（粗点），加载特定样式 -->
			<text
			    class="up-line-1"
			    :style="[loadTextStyle]"
			    :class="[(status == 'nomore' && isDot == true) ? 'up-loadmore__content__dot-text' : 'up-loadmore__content__text']"
			    @tap="loadMore"
			>{{ showText }}</text>
		</view>
		<up-line
		    length="140rpx"
		    :color="lineColor"
			:hairline="false"
			:dashed="dashed"
			v-if="line"
		></up-line>
	</view>
</template>

<script setup>
	import { computed } from 'vue'
	import { props as loadmoreProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-loadmore',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...loadmoreProps.props
	})
	const emit = defineEmits(['loadmore'])
	const dotText = '●'

	// 加载的文字显示的样式
	const loadTextStyle = computed(() => {
		return {
			color: props.color,
			fontSize: addUnit(props.fontSize),
			lineHeight: addUnit(props.fontSize),
			backgroundColor: props.bgColor,
		}
	})

	// 显示的提示文字
	const showText = computed(() => {
		let text = ''
		if (props.status == 'loadmore') text = props.loadmoreText
		else if (props.status == 'loading') text = props.loadingText
		else if (props.status == 'nomore' && props.isDot) text = dotText
		else text = props.nomoreText
		return text
	})

	function loadMore() {
		// 只有在“加载更多”的状态下才发送点击事件，内容不满一屏时无法触发底部上拉事件，所以需要点击来触发
		if (props.status == 'loadmore') emit('loadmore')
	}
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-loadmore {
		@include flex(row);
		align-items: center;
		justify-content: center;
		flex: 1;

		&__content {
			margin: 0 15px;
			@include flex(row);
			align-items: center;
			justify-content: center;

			&__icon-wrap {
				margin-right: 8px;
			}

			&__text {
				font-size: 14px;
				color: $up-content-color;
			}

			&__dot-text {
				font-size: 15px;
				color: $up-tips-color;
			}
		}
	}
</style>
