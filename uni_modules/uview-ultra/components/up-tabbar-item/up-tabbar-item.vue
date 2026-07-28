<template>
	<view
	    class="up-tabbar-item"
	    :style="[addStyle(customStyle)]"
	    :class="itemClassNames"
	    @tap="clickHandler"
	>
		<view class="up-tabbar-item__content" :class="contentClassNames" :style="midButtonContentStyle">
			<view
				class="up-tabbar-item__icon"
				:class="[isMidButton ? 'up-tabbar-item__icon--mid-button' : '']"
				:style="midButtonShellStyle"
			>
				<view v-if="isMidButton" class="up-tabbar-item__mid-button-border" :style="midButtonBorderStyle">
					<view class="up-tabbar-item__mid-button-border-circle" :style="midButtonBorderCircleStyle"></view>
				</view>
				<view v-if="isMidButton" class="up-tabbar-item__mid-button-inner" :style="midButtonInnerStyle"></view>
				<up-icon
				    v-if="icon"
				    :name="icon"
				    :color="isMidButton ? resolvedMidButtonIconColor : (isActive? parentData.activeColor : parentData.inactiveColor)"
				    :size="isMidButton ? midButtonIconSize : 20"
				    :customStyle="midButtonIconStyle"
				></up-icon>
				<template v-else>
					<slot
					    v-if="isActive"
					    name="active-icon"
					/>
					<slot
					    v-else
					    name="inactive-icon"
					/>
				</template>
				<up-badge
					absolute
					:offset="[0, dot ? '34rpx' : badge > 9 ? '14rpx' : '20rpx']"
				    :customStyle="badgeStyle"
				    :isDot="dot"
				    :value="badge || (dot ? 1 : null)"
				    :show="dot || badge > 0"
				></up-badge>
			</view>

			<slot name="text">
				<text
				    class="up-tabbar-item__text"
				    :style="{
						color: isActive? parentData.activeColor : parentData.inactiveColor
					}"
				>{{ text }}</text>
			</slot>
		</view>
	</view>
</template>

<script setup>
	import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRef, useSlots } from 'vue'
	import { props as tabbarItemProps } from './props'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { addStyle, error } from '../../libs/function/index'
	/**
	 * TabbarItem 底部导航栏子组件
	 * @description 此组件提供了自定义tabbar的能力。
	 * @tutorial https://uview-plus.jiangruyi.com/components/tabbar.html
	 * @property {String | Number}	name		item标签的名称，作为与up-tabbar的value参数匹配的标识符
	 * @property {String}			icon		uView内置图标或者绝对路径的图片
	 * @property {String | Number}	badge		右上角的角标提示信息
	 * @property {Boolean}			dot			是否显示圆点，将会覆盖badge参数（默认 false ）
	 * @property {String}			text		描述文本
	 * @property {Object | String}	badgeStyle	控制徽标的位置，对象或者字符串形式，可以设置top和right属性（默认 'top: 6px;right:2px;' ）
	 * @property {Object}			customStyle	定义需要用到的外部样式
	 * 
	 * @example <up-tabbar :value="value2" :placeholder="false" @change="name => value2 = name" :fixed="false" :safeAreaInsetBottom="false"><up-tabbar-item text="首页" icon="home" dot ></up-tabbar-item></up-tabbar>
	 */
	defineOptions({
		name: 'up-tabbar-item',
		// 微信小程序中 options 选项
		options: {
			virtualHost: true //将自定义节点设置成虚拟的，更加接近Vue组件的表现。我们不希望自定义组件的这个节点本身可以设置样式、响应 flex 布局等
		},
	})

	const props = defineProps({
		...commonProps,
		...tabbarItemProps.props
	})
	const emit = defineEmits(['click', 'change'])
	const instance = getCurrentInstance()
	const slots = useSlots()
	const parentData = reactive({
		value: null,
		activeColor: '',
		inactiveColor: '',
		borderColor: ''
	})
	const { parent, getParentData } = useUltraUI(props, parentData)
	const name = toRef(props, 'name')
	const isActive = ref(false) // 是否处于激活状态
	const routeSyncTimer = ref(null)
	const routeSyncLast = ref('')

	// 计算是否为中间按钮
	const isMidButton = computed(() => {
		return props.mode === 'midButton'
	})

	const hasMidButtonText = computed(() => {
		return !!slots.text || String(props.text || '').length > 0
	})

	const itemClassNames = computed(() => {
		return [
			isMidButton.value ? 'up-tabbar-item--mid-button' : '',
			isMidButton.value && !hasMidButtonText.value ? 'up-tabbar-item--mid-button-no-text' : ''
		]
	})

	const contentClassNames = computed(() => {
		return [
			isMidButton.value ? 'up-tabbar-item__content--mid-button' : ''
		]
	})

	const resolvedMidButtonIconColor = computed(() => {
		return props.midButtonIconColor || '#3c9cff'
	})

	const midButtonOffsetValue = computed(() => {
		const offset = Number.parseFloat(props.midButtonOffsetY)
		return Number.isFinite(offset) ? offset : -10
	})

	const midButtonContentStyle = computed(() => {
		return isMidButton.value
			? {
				transform: `translateY(${midButtonOffsetValue.value}px)`
			}
			: {}
	})

	const midButtonBorderStyle = computed(() => {
		if (!isMidButton.value) return {}
		const clipBaseHeight = hasMidButtonText.value ? 15.5 : 7
		const clipHeight = Math.min(Math.max(clipBaseHeight - midButtonOffsetValue.value, 0), 64)
		return {
			height: `${clipHeight}px`
		}
	})

	const midButtonBorderCircleStyle = computed(() => {
		return isMidButton.value && parentData.borderColor
			? {
				borderColor: parentData.borderColor
			}
			: {}
	})

	const midButtonShellStyle = computed(() => {
		return isMidButton.value
			? {
				boxShadow: props.midButtonBoxShadow || 'none'
			}
			: {}
	})

	const midButtonInnerStyle = computed(() => {
		return isMidButton.value
			? {
				background: props.midButtonBgColor || '#ffffff',
				boxShadow: props.midButtonInnerBoxShadow
			}
			: {}
	})

	const midButtonIconStyle = computed(() => {
		return isMidButton.value
			? {
				position: 'relative',
				zIndex: 2
			}
			: {}
	})

	function clearRouteSync() {
		if (routeSyncTimer.value) {
			clearInterval(routeSyncTimer.value)
			routeSyncTimer.value = null
		}
	}

	function getCurrentRoutePath() {
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
		if (!pages || !pages.length) return ''
		const currentPage = pages[pages.length - 1] || {}
		const route = currentPage.route || currentPage.$page?.fullPath || ''
		return route ? (route.startsWith('/') ? route : `/${route}`) : ''
	}

	function normalizeRoutePath(path) {
		if (typeof path !== 'string') return ''
		return path.replace(/^[#\\/]+/, '')
	}

	function syncActiveByRouteOrValue() {
		// 支付宝小程序不支持provide/inject，所以使用这个方法获取整个父组件
		updateParentData()
		if (!parent.value) {
			error('up-tabbar-item必须搭配up-tabbar组件使用')
			return
		}
		// 本子组件在up-tabbar的children数组中的索引
		const index = parent.value.children.indexOf(instance.proxy)
		const itemName = props.name || index
		const routePath = getCurrentRoutePath()
		if (typeof itemName === 'string' && routePath) {
			const isRouteMatch =
				normalizeRoutePath(itemName) === normalizeRoutePath(routePath)
			if (isRouteMatch) {
				isActive.value = true
				return
			}
		}
		isActive.value = itemName === parentData.value
	}

	function startRouteSync() {
		clearRouteSync()
		if (typeof props.name !== 'string' || props.name.indexOf('/') === -1) return
		routeSyncLast.value = getCurrentRoutePath()
		routeSyncTimer.value = setInterval(() => {
			const current = getCurrentRoutePath()
			if (current !== routeSyncLast.value) {
				routeSyncLast.value = current
				syncActiveByRouteOrValue()
			}
		}, 200)
	}

	function init() {
		syncActiveByRouteOrValue()
	}

	function updateParentData() {
		getParentData('up-tabbar')
	}

	// 此方法将会被父组件up-tabbar调用
	function updateFromParent() {
		// 重新初始化
		init()
	}

	function clickHandler() {
		nextTick(() => {
			const index = parent.value?.children?.indexOf(instance.proxy) ?? 0
			const itemName = props.name || index
			// 点击的item为非激活的item才发出change事件
			if (itemName !== parentData.value) {
				parent.value?.emitChange?.(itemName)
			}
			emit('click', itemName)
		})
	}

	onMounted(() => {
		init()
		startRouteSync()
	})

	onBeforeUnmount(() => {
		clearRouteSync()
	})

	defineExpose({
		name,
		isActive,
		init,
		updateParentData,
		updateFromParent,
		clearRouteSync
	})
</script>

<style lang="scss" scoped>
	.up-tabbar-item {
		@include flex(column);
		align-items: center;
		justify-content: center;
		flex: 1;
		/* #ifndef APP-NVUE */
		width: 100%;
		height: 100%;
		/* #endif */
		/* #ifdef H5 */
		cursor: pointer;
		/* #endif */
		
		&__icon {
			@include flex;
			position: relative;
			width: 150rpx;
			justify-content: center;
		}

		&__content {
			@include flex(column);
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;

			&--mid-button {
				position: relative;
				z-index: 1;
			}
		}

		&__text {
			margin-top: 2px;
			font-size: 12px;
			color: $up-content-color;
		}
	}
	
	// 中间按钮样式
	.up-tabbar-item--mid-button {
		z-index: 2;
		flex: 1;
	}
	
	.up-tabbar-item__icon--mid-button {
		width: 64px;
		height: 64px;
		border-radius: 999px;
		background: #ffffff;
		box-shadow: none;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: visible;
	}

	.up-tabbar-item__mid-button-border {
		position: absolute;
		left: 0;
		top: 0;
		width: 64px;
		box-sizing: border-box;
		background: transparent;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.up-tabbar-item__mid-button-border-circle {
		width: 64px;
		height: 64px;
		box-sizing: border-box;
		background: transparent;
		border: 1px solid var(--up-border-color, rgba(0, 0, 0, 0.08));
		border-radius: 999px;
	}

	.up-tabbar-item__mid-button-inner {
		position: absolute;
		left: 6px;
		top: 6px;
		right: 6px;
		bottom: 6px;
		border-radius: 999px;
		z-index: 1;
	}

	.up-tabbar-item--mid-button .up-tabbar-item__text {
		margin-top: 0;
		transform: translateY(-4px);
	}

	/* #ifdef MP */
	// 由于小程序都使用shadow DOM形式实现，需要给影子宿主设置flex: 1才能让其撑开
	:host {
		flex: 1;
		width: 100%;
	}
	/* #endif */
</style>
