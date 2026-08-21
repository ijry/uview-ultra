<template>
	<view class="up-navbar" :class="[customClass]">
		<!-- ios 模式：in-flow 层，恒定渲染，随页面原生滚动被带走 -->
		<view v-if="isIosMode" class="up-navbar__flow">
			<view :style="{ height: flowSpacerHeight }"></view>
			<view
				v-if="title"
				class="up-navbar__large-title"
				:style="{ height: addUnit(largeTitleHeight) }"
			>
				<text
					class="up-line-1 up-navbar__large-title__text"
					:style="[addStyle(titleStyle)]"
				>{{ title }}</text>
			</view>
		</view>
		<!-- default 模式：原有占位块，行为保持不变 -->
		<view
			class="up-navbar__placeholder"
			v-if="!isIosMode && fixed && placeholder"
			:style="{
				height: addUnit(getPx(height) + sys().statusBarHeight,'px'),
			}"
		></view>
		<view :class="[(isIosMode || fixed) && 'up-navbar--fixed']">
			<!-- ios 模式的磨砂层：随滚动淡入，位于内容之下 -->
			<view
				v-if="isIosMode"
				class="up-navbar__glass"
				:style="{ opacity: glassOpacity, background: glassBgColor }"
			></view>
			<up-status-bar
				v-if="safeAreaInsetTop"
				:bgColor="isIosMode ? 'transparent' : bgColor"
			></up-status-bar>
			<view
				class="up-navbar__content"
				:class="[border && !isIosMode && 'up-border-bottom']"
				:style="{
					height: addUnit(height),
					backgroundColor: isIosMode ? 'transparent' : bgColor,
				}"
			>
				<view
					class="up-navbar__content__left"
					hover-class="up-navbar__content__left--hover"
					hover-start-time="150"
					@tap="leftClick"
				>
					<slot name="left">
						<up-icon
							v-if="leftIcon"
							:name="leftIcon"
							:size="leftIconSize"
							:color="leftIconColor"
						></up-icon>
						<text
							v-if="leftText"
							:style="{
								color: leftIconColor
							}"
							class="up-navbar__content__left__text"
						>{{ leftText }}</text>
					</slot>
				</view>
				<view
					class="up-navbar__content__center"
					:style="[centerStyle]"
				>
					<slot name="center">
						<text
							class="up-line-1 up-navbar__content__title"
							:style="[{
								width: addUnit(titleWidth),
							}, addStyle(titleStyle)]"
						>{{ title }}</text>
					</slot>
				</view>
				<view
					class="up-navbar__content__right"
					v-if="$slots.right || rightIcon || rightText"
					@tap="rightClick"
				>
					<slot name="right">
						<up-icon
							v-if="rightIcon"
							:name="rightIcon"
							size="20"
						></up-icon>
						<text
							v-if="rightText"
							class="up-navbar__content__right__text"
						>{{ rightText }}</text>
					</slot>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { props as navbarProps } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import config from '../../libs/config/config.js'
import { addUnit, addStyle, getPx, sys } from '../../libs/function/index.js'
import { computed, getCurrentInstance } from 'vue'

// iOS 大标题行高，同时是压缩进度的分母
const LARGE_TITLE_HEIGHT = 52
// 居中标题上浮的起始偏移，与淡入同步归零
const CENTER_TITLE_RISE = 12
/**
 * Navbar 自定义导航栏
 * @description 此组件一般用于在特殊情况下，需要自定义导航栏的时候用到，一般建议使用uni-app带的导航栏。
 * @tutorial https://ijry.github.io/uview-plus/components/navbar.html
 * @property {Boolean}			safeAreaInsetTop	是否开启顶部安全区适配  （默认 true ）
 * @property {Boolean}			placeholder			固定在顶部时，是否生成一个等高元素，以防止塌陷 （默认 false ）
 * @property {Boolean}			fixed				导航栏是否固定在顶部 （默认 false ）
 * @property {Boolean}			border				导航栏底部是否显示下边框 （默认 false ）
 * @property {String}			leftIcon			左边返回图标的名称，只能为uView自带的图标 （默认 'arrow-left' ）
 * @property {String}			leftText			左边的提示文字
 * @property {String}			rightText			右边的提示文字
 * @property {String}			rightIcon			右边返回图标的名称，只能为uView自带的图标
 * @property {String}			title				导航栏标题，如设置为空字符，将会隐藏标题占位区域
 * @property {String}			bgColor				导航栏背景设置 （默认 '#ffffff' ）
 * @property {String | Number}	titleWidth			导航栏标题的最大宽度，内容超出会以省略号隐藏 （默认 '400rpx' ）
 * @property {String | Number}	height				导航栏高度(不包括状态栏高度在内，内部自动加上)（默认 '44px' ）
 * @property {String | Number}	leftIconSize		左侧返回图标的大小（默认 20px ）
 * @property {String | Number}	leftIconColor		左侧返回图标的颜色（默认 #303133 ）
 * @property {Boolean}	        autoBack			点击左侧区域(返回图标)，是否自动返回上一页（默认 false ）
 * @property {Object | String}	titleStyle			标题的样式，对象或字符串
 * @property {String}			mode				导航栏模式，default-常规，ios-大标题模式（默认 'default' ）
 * @property {String | Number}	scrollTop			页面滚动距离，仅 ios 模式使用，由页面 onPageScroll 传入（默认 0 ）
 * @event {Function} leftClick		点击左侧区域
 * @event {Function} rightClick		点击右侧区域
 * @example <up-navbar title="剑未配妥，出门已是江湖" left-text="返回" right-text="帮助" @click-left="onClickBack" @click-right="onClickRight"></up-navbar>
 */
defineOptions({
	name: 'up-navbar',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...navbarProps.props
})
const emit = defineEmits(['leftClick', 'rightClick'])

const isIosMode = computed(() => props.mode === 'ios')

// 有效大标题行高：title 为空时不渲染大标题行，行高塌陷为 0
const largeTitleHeight = computed(() => (props.title ? LARGE_TITLE_HEIGHT : 0))

// in-flow 层顶部让位块高度，为固定层腾出空间
const flowSpacerHeight = computed(() => {
	const statusBarHeight = props.safeAreaInsetTop ? sys().statusBarHeight : 0
	return addUnit(getPx(props.height) + statusBarHeight, 'px')
})

// 压缩进度。progress=1 即大标题恰好完全没入导航栏
const iosProgress = computed(() => {
	if (!isIosMode.value) return 1
	const distance = largeTitleHeight.value
	if (distance <= 0) return 1
	const offset = getPx(props.scrollTop) || 0
	return Math.min(Math.max(offset / distance, 0), 1)
})

// 磨砂在前半段走完，为居中标题的出现铺好不透明底
const glassOpacity = computed(() => {
	if (!isIosMode.value) return 0
	return Math.min(Math.max(iosProgress.value / 0.5, 0), 1)
})

// 居中标题在后段才启动，此时磨砂已满不透明，不会与大标题互相透出
const centerOpacity = computed(() => {
	if (!isIosMode.value) return 1
	return Math.min(Math.max((iosProgress.value - 0.75) / 0.25, 0), 1)
})

// 0.82 是可读性下限的承重值：backdrop-filter 不生效时，仅靠该不透明度也须保证文字不读串
const glassBgColor = computed(() => {
	return 'var(--up-navbar-glass-bg-color, rgba(255, 255, 255, 0.82))'
})

// 居中标题由下往上浮现：与淡入同一段行程，位移随之归零
const centerStyle = computed(() => {
	if (!isIosMode.value) return {}
	const opacity = centerOpacity.value
	return {
		opacity,
		transform: `translateY(${(1 - opacity) * CENTER_TITLE_RISE}px)`
	}
})

function leftClick() {
	emit('leftClick')
	if (config.interceptor.navbarLeftClick != null) {
		const proxy = getCurrentInstance()?.proxy
		config.interceptor.navbarLeftClick.call(proxy, proxy)
	} else if (props.autoBack) {
		uni.navigateBack()
	}
}

function rightClick() {
	emit('rightClick')
}
</script>


<style lang="scss" scoped>
	@import "../../libs/css/components.scss";
	@import "./theme-vars.scss";

	.up-navbar {

		&--fixed {
			position: fixed;
			left: 0;
			right: 0;
			top: 0;
			z-index: 11;
		}

		&__flow {
			width: 100%;
		}

		&__large-title {
			@include flex(row);
			align-items: center;
			padding: 0 13px;

			&__text {
				font-size: 34px;
				font-weight: 700;
				line-height: 1.2;
				color: var(--up-main-color, #303133);
			}
		}

		&__glass {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			// 模糊半径写在静态 class 内使 -webkit- 前缀在编译期确定；
			// iOS 16 之前的 WKWebView 只认前缀版本，两条都必须保留。
			-webkit-backdrop-filter: saturate(180%) blur(var(--up-navbar-glass-blur, 20px));
			        backdrop-filter: saturate(180%) blur(var(--up-navbar-glass-blur, 20px));
		}

		&__content {
			@include flex(row);
			align-items: center;
			height: 44px;
			background-color: var(--up-navbar-bg-color, #ffffff);
			// 磨砂层是绝对定位的，会盖住同级非定位元素，故内容区显式提升层级
			position: relative;
			z-index: 1;
			justify-content: center;

			&__left,
			&__right {
				padding: 0 13px;
				position: absolute;
				top: 0;
				bottom: 0;
				@include flex(row);
				align-items: center;
			}

			&__left {
				left: 0;

				&--hover {
					opacity: 0.7;
				}

				&__text {
					font-size: 15px;
					margin-left: 3px;
				}
			}

			&__center {
				@include flex(row);
				align-items: center;
				justify-content: center;
				// 滚动事件离散到达，补一段短过渡让上浮与淡入连续
				transition: opacity 0.15s linear, transform 0.15s ease-out;
			}

			&__title {
				text-align: center;
				font-size: 16px;
				color: var(--up-main-color, #303133);
			}

			&__right {
				right: 0;

				&__text {
					font-size: 15px;
					margin-left: 3px;
				}
			}
		}
	}
</style>
