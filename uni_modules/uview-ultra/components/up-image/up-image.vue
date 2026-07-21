<template>
	<up-transition
		mode="fade"
		:show="show"
		:duration="fade ? 1000 : 0"
	>
		<view
			class="up-image"
			@tap="onClick"
			:style="[wrapStyle, backgroundStyle]"
		>
			<image
				v-if="!isError"
				:src="src"
				:mode="mode"
				@error="onErrorHandler"
				@load="onLoadHandler"
				:show-menu-by-longpress="showMenuByLongpress"
				:lazy-load="lazyLoad"
				class="up-image__image"
				:style="{
					borderRadius: shape == 'circle' ? '10000px' : addUnit(radius),
					width: addUnit(width),
					height: addUnit(height)
				}"
			></image>
			<view
				v-if="showLoading && loading"
				class="up-image__loading"
				:style="{
					borderRadius: shape == 'circle' ? '50%' : addUnit(radius),
					backgroundColor: bgColor,
					width: addUnit(width),
					height: addUnit(height)
				}"
			>
				<slot name="loading">
					<up-icon
						:name="loadingIcon"
						:width="width"
						:height="height"
					></up-icon>
				</slot>
			</view>
			<view
				v-if="showError && isError && !loading"
				class="up-image__error"
				:style="{
					borderRadius: shape == 'circle' ? '50%' : addUnit(radius),
					width: addUnit(width),
					height: addUnit(height)
				}"
			>
				<slot name="error">
					<up-icon
						:name="errorIcon"
						:width="width"
						:height="height"
					></up-icon>
				</slot>
			</view>
		</view>
	</up-transition>
</template>

<script setup>
	import { computed, onMounted, ref, watch } from 'vue'
	import { propsImage } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle, deepMerge } from '../../libs/function/index.js'
	/**
	 * Image 图片
	 * @description 此组件为uni-app的image组件的加强版，在继承了原有功能外，还支持淡入动画、加载中、加载失败提示、圆角值和形状等。
	 * @tutorial https://uview-plus.jiangruyi.com/components/image.html
	 * @property {String}			src 				图片地址
	 * @property {String}			mode 				裁剪模式，见官网说明 （默认 'aspectFill' ）
	 * @property {String | Number}	width 				宽度，单位任意，如果为数值，则为px单位 （默认 '300' ）
	 * @property {String | Number}	height 				高度，单位任意，如果为数值，则为px单位 （默认 '225' ）
	 * @property {String}			shape 				图片形状，circle-圆形，square-方形 （默认 'square' ）
	 * @property {String | Number}	radius		 		圆角值，单位任意，如果为数值，则为px单位 （默认 0 ）
	 * @property {Boolean}			lazyLoad			是否懒加载，仅微信小程序、App、百度小程序、字节跳动小程序有效 （默认 true ）
	 * @property {Boolean}			showMenuByLongpress	是否开启长按图片显示识别小程序码菜单，仅微信小程序有效 （默认 true ）
	 * @property {String}			loadingIcon 		加载中的图标，或者小图片 （默认 'photo' ）
	 * @property {String}			errorIcon 			加载失败的图标，或者小图片 （默认 'error-circle' ）
	 * @property {Boolean}			showLoading 		是否显示加载中的图标或者自定义的slot （默认 true ）
	 * @property {Boolean}			showError 			是否显示加载错误的图标或者自定义的slot （默认 true ）
	 * @property {Boolean}			fade 				是否需要淡入效果 （默认 true ）
	 * @property {Boolean}			webp 				只支持网络资源，只对微信小程序有效 （默认 false ）
	 * @property {String | Number}	duration 			搭配fade参数的过渡时间，单位ms （默认 500 ）
	 * @property {String}			bgColor 			背景颜色，用于深色页面加载图片时，为了和背景色融合  (默认 '#f3f4f6' )
	 * @property {Object}			customStyle  		定义需要用到的外部样式
	 * @event {Function}	click	点击图片时触发
	 * @event {Function}	error	图片加载失败时触发
	 * @event {Function} load 图片加载成功时触发
	 * @example <up-image width="100%" height="300px" :src="src"></up-image>
	 */
	defineOptions({
		name: 'up-image',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...propsImage.props
	})
	const emit = defineEmits(['click', 'error', 'load'])
	// 图片是否加载错误，如果是，则显示错误占位图
	const isError = ref(false)
	// 初始化组件时，默认为加载中状态
	const loading = ref(true)
	// 不透明度，为了实现淡入淡出的效果
	const opacity = ref(1)
	// 过渡时间，因为props的值无法修改，故需要一个中间值
	const durationTime = ref(props.duration)
	// 图片加载完成时，去掉背景颜色，因为如果是png图片，就会显示灰色的背景
	const backgroundStyle = ref({})
	// 用于fade模式的控制组件显示与否
	const show = ref(false)

	watch(() => props.src, (n) => {
		if (!n) {
			// 如果传入null或者''，或者false，或者undefined，标记为错误状态
			isError.value = true
		} else {
			isError.value = false
			loading.value = true
		}
	}, {
		immediate: true
	})

	const wrapStyle = computed(() => {
		const style = {}
		// 通过调用addUnit()方法，如果有单位，如百分比，px单位等，直接返回，如果是纯粹的数值，则加上rpx单位
		style.width = addUnit(props.width)
		style.height = addUnit(props.height)
		// 如果是显示圆形，设置一个很多的半径值即可
		style.borderRadius = props.shape == 'circle' ? '10000px' : addUnit(props.radius)
		// 如果设置圆角，必须要有hidden，否则可能圆角无效
		style.overflow = props.radius > 0 ? 'hidden' : 'visible'
		// if (props.fade) {
		// 	style.opacity = opacity.value
		// 	// nvue下，这几个属性必须要分开写
		// 	style.transitionDuration = `${durationTime.value}ms`
		// 	style.transitionTimingFunction = 'ease-in-out'
		// 	style.transitionProperty = 'opacity'
		// }
		return deepMerge(style, addStyle(props.customStyle))
	})

	onMounted(() => {
		show.value = true
	})

	// 点击图片
	function onClick() {
		emit('click')
	}

	// 图片加载失败
	function onErrorHandler(err) {
		loading.value = false
		isError.value = true
		emit('error', err)
	}

	// 图片加载完成，标记loading结束
	function onLoadHandler(event) {
		loading.value = false
		isError.value = false
		emit('load', event)
		removeBgColor()
		// 如果不需要动画效果，就不执行下方代码，同时移除加载时的背景颜色
		// 否则无需fade效果时，png图片依然能看到下方的背景色
		// if (!props.fade) return removeBgColor();
		// // 原来opacity为1(不透明，是为了显示占位图)，改成0(透明，意味着该元素显示的是背景颜色，默认的灰色)，再改成1，是为了获得过渡效果
		// opacity.value = 0;
		// // 这里设置为0，是为了图片展示到背景全透明这个过程时间为0，延时之后延时之后重新设置为duration，是为了获得背景透明(灰色)
		// // 到图片展示的过程中的淡入效果
		// durationTime.value = 0;
		// // 延时50ms，否则在浏览器H5，过渡效果无效
		// setTimeout(() => {
		// 	durationTime.value = props.duration;
		// 	opacity.value = 1;
		// 	setTimeout(() => {
		// 		removeBgColor();
		// 	}, durationTime.value);
		// }, 50);
	}

	// 移除图片的背景色
	function removeBgColor() {
		// 淡入动画过渡完成后，将背景设置为透明色，否则png图片会看到灰色的背景
		backgroundStyle.value = {
			backgroundColor: 'transparent'
		}
	}

	defineExpose({
		isError,
		loading,
		opacity,
		durationTime,
		backgroundStyle,
		show,
		wrapStyle,
		onClick,
		onErrorHandler,
		onLoadHandler,
		removeBgColor
	})
</script>

<style lang="scss" scoped>
	@import '../../libs/css/components.scss';

	$up-image-error-top:0px !default;
	$up-image-error-left:0px !default;
	$up-image-error-width:100% !default;
	$up-image-error-hight:100% !default;
	$up-image-error-background-color:$up-bg-color !default;
	$up-image-error-color:$up-tips-color !default;
	$up-image-error-font-size: 46rpx !default;

	.up-image {
		position: relative;
		transition: opacity 0.5s ease-in-out;

		&__image {
			width: 100%;
			height: 100%;
		}

		&__loading,
		&__error {
			position: absolute;
			top: $up-image-error-top;
			left: $up-image-error-left;
			width: $up-image-error-width;
			height: $up-image-error-hight;
			@include flex;
			align-items: center;
			justify-content: center;
			background-color: $up-image-error-background-color;
			color: $up-image-error-color;
			font-size: $up-image-error-font-size;
		}
	}
</style>
