<template>
	<view class="up-collapse-item">
		<up-cell
			:title="$slots.title ? '' : title"
			:value="value"
			:label="label"
			:icon="icon"
			:isLink="isLink"
			:clickable="clickable"
			:border="parentData.border && showBorder"
			@click="clickHandler"
			:arrowDirection="expanded ? 'up' : 'down'"
			:disabled="disabled"
		>
			<!-- 微信小程序不支持，因为微信中不支持 <slot name="title" #title />的写法 -->
			<template #title>
				<slot name="title">
					<text v-if="!$slots.title && title">
						{{title}}
					</text>
				</slot>
			</template>
			<template #icon>
				<slot name="icon">
					<up-icon v-if="!$slots.icon && icon" :size="22" :name="icon"></up-icon>
				</slot>
			</template>
			<template #value>
				<slot name="value">
					<text v-if="!$slots.value && value">
						{{value}}
					</text>
				</slot>
			</template>
			<template #right-icon>
				<template v-if="showRight">
					<up-icon v-if="!$slots['right-icon']" :size="16" name="arrow-right"></up-icon>
					<slot name="right-icon">
					</slot>
				</template>
			</template>
		</up-cell>
		<view
			class="up-collapse-item__content"
			:animation="animationData"
			ref="animation"
		>
			<view
				class="up-collapse-item__content__text content-class"
				:id="elId"
				:ref="elId"
			><slot /></view>
		</view>
		<up-line v-if="parentData.border"></up-line>
	</view>
</template>

<script setup>
	import { getCurrentInstance, nextTick, onMounted, reactive, ref, toRef, watch } from 'vue'
	import { props as collapseItemProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import { guid, sleep, error } from '../../libs/function/index.js'
	import test from '../../libs/function/test.js'
	// #ifdef APP-NVUE
	const animation = uni.requireNativePlugin('animation')
	const dom = uni.requireNativePlugin('dom')
	// #endif
	/**
	 * collapseItem 折叠面板Item
	 * @description 通过折叠面板收纳内容区域（搭配up-collapse使用）
	 * @tutorial https://ijry.github.io/uview-plus/components/collapse.html
	 * @property {String}			title 		标题
	 * @property {String}			value 		标题右侧内容
	 * @property {String}			label 		标题下方的描述信息
	 * @property {Boolean}			disbled 	是否禁用折叠面板 ( 默认 false )
	 * @property {Boolean}			isLink 		是否展示右侧箭头并开启点击反馈 ( 默认 true )
	 * @property {Boolean}			clickable	是否开启点击反馈 ( 默认 true )
	 * @property {Boolean}			border		是否显示内边框 ( 默认 true )
	 * @property {String}			align		标题的对齐方式 ( 默认 'left' )
	 * @property {String | Number}	name		唯一标识符
	 * @property {String}			icon		标题左侧图片，可为绝对路径的图片或内置图标
	 * @event {Function}			change 			某个item被打开或者收起时触发
	 * @example <up-collapse-item :title="item.head" v-for="(item, index) in itemList" :key="index">{{item.body}}</up-collapse-item>
	 */
	defineOptions({
		name: 'up-collapse-item',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...collapseItemProps.props
	})
	const instance = getCurrentInstance()
	const parentData = reactive({
		accordion: false,
		border: false
	})
	const { parent, getParentData, $uGetRect } = useUltraUI(props, parentData)
	const elId = ref(guid())
	// uni.createAnimation的导出数据
	const animationData = ref({})
	// 是否展开状态
	const expanded = ref(false)
	// 根据expanded确定是否显示border，为了控制展开时，cell的下划线更好的显示效果，进行一定时间的延时
	const showBorder = ref(false)
	// 是否动画中，如果是则不允许继续触发点击
	const animating = ref(false)
	const timer = ref(null)
	const name = toRef(props, 'name')

	// 异步获取内容，或者动态修改了内容时，需要重新初始化
	async function init() {
		// 初始化数据
		updateParentData()
		if (!parent.value) {
			return error('up-collapse-item必须要搭配up-collapse组件使用')
		}
		const parentProps = typeof parent.value.getProps === 'function'
			? parent.value.getProps()
			: parent.value
		const { value, accordion } = parentProps

		if (accordion) {
			if (test.array(value)) {
				return error('手风琴模式下，up-collapse组件的value参数不能为数组')
			}
			expanded.value = props.name == value
		} else {
			if (!test.array(value) && value !== null) {
				return error('非手风琴模式下，up-collapse组件的value参数必须为数组')
			}
			expanded.value = (value || []).some(item => item == props.name)
		}
		// 设置组件的展开或收起状态
		await nextTick()
		setContentAnimate()
	}

	function updateParentData() {
		getParentData('up-collapse')
	}

	async function setContentAnimate() {
		// 每次面板打开或者收起时，都查询元素尺寸
		// 好处是，父组件从服务端获取内容后，变更折叠面板后可以获得最新的高度
		const rect = await queryRect()
		const height = expanded.value ? rect.height : 0
		animating.value = true
		// #ifdef APP-NVUE
		const ref = instance.proxy.$refs['animation'].ref
		animation.transition(ref, {
			styles: {
				height: height + 'px'
			},
			duration: props.duration,
			// 必须设置为true，否则会到面板收起或展开时，页面其他元素不会随之调整它们的布局
			needLayout: true,
			timingFunction: 'ease-in-out',
		}, () => {
			animating.value = false
		})
		// #endif

		// #ifndef APP-NVUE
		const animationInstance = uni.createAnimation({
			timingFunction: 'ease-in-out',
		})
		animationInstance
			.height(height)
			.step({
				duration: props.duration,
			})
			.step()
		// 导出动画数据给面板的animationData值
		animationData.value = animationInstance.export()
		// 标识动画结束
		sleep(props.duration).then(() => {
			animating.value = false
		})
		// #endif
	}

	// 点击collapsehead头部
	function clickHandler() {
		if (props.disabled && animating.value) return
		// 设置本组件为相反的状态
		parent.value && parent.value.onChange(instance.proxy)
	}

	// 查询内容高度
	function queryRect() {
		// #ifndef APP-NVUE
		// $uGetRect为uView自带的节点查询简化方法，详见文档介绍：https://ijry.github.io/uview-plus/js/getRect.html
		// 组件内部一般用$uGetRect，对外的为uni.$u.getRect，二者功能一致，名称不同
		return $uGetRect(`#${elId.value}`)
		// #endif

		// #ifdef APP-NVUE
		// nvue下，使用dom模块查询元素高度
		// 返回一个promise，让调用此方法的主体能使用then回调
		return new Promise(resolve => {
			dom.getComponentRect(instance.proxy.$refs[elId.value], res => {
				const size = res.size || {}
				size.height = 'auto'
				resolve(size)
			})
		})
		// #endif
	}

	watch(expanded, (n) => {
		clearTimeout(timer.value)
		timer.value = null
		// 这里根据expanded的值来进行一定的延时，是为了cell的下划线更好的显示效果
		timer.value = setTimeout(() => {
			showBorder.value = n
		}, n ? 10 : 290)
	})

	onMounted(() => {
		init()
	})

	defineExpose({
		name,
		expanded,
		init,
		updateParentData,
		setContentAnimate
	})
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-collapse-item {

		&__content {
			overflow: hidden;
			height: 0;

			&__text {
				padding: 12px 15px;
				color: $up-content-color;
				font-size: 14px;
				line-height: 18px;
			}
		}
	}
</style>
