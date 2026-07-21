<template>
	<view class="up-read-more">
		<view
		    class="up-read-more__content"
		    :style="{
				height: isLongContent && status === 'close' ? addUnit(showHeight) : addUnit(contentHeight),
				textIndent: textIndent
			}"
		>
			<view
			    class="up-read-more__content__inner"
			    ref="contentInnerRef"
			    :class="[elId]"
			>
				<slot></slot>
			</view>
		</view>
		<view
		    class="up-read-more__toggle"
		    :style="[innerShadowStyle]"
		    v-if="isLongContent"
		>
			<slot name="toggle">
				<view
				    class="up-read-more__toggle__text"
				    @tap="toggleReadMore"
				>
					<up-text
					    :text="status === 'close' ? closeText : openText"
					    :color="color"
					    :size="fontSize"
					    :lineHeight="fontSize"
					    margin="0 5px 0 0"
					></up-text>
					<view class="up-read-more__toggle__icon">
						<up-icon
						    :color="color"
						    :size="fontSize + 2"
						    :name="status === 'close' ? 'arrow-down' : 'arrow-up'"
						></up-icon>
					</view>
				</view>
			</slot>
		</view>
	</view>
</template>

<script setup>
// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
// #endif
import { computed, onMounted, ref } from 'vue'
import { props as readMoreProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { addUnit, guid, getPx, sleep } from '../../libs/function/index'
/**
 * readMore 阅读更多
 * @description 该组件一般用于内容较长，预先收起一部分，点击展开全部内容的场景。
 * @tutorial https://uview-plus.jiangruyi.com/components/readMore.html
 * @property {String | Number}	showHeight	内容超出此高度才会显示展开全文按钮，单位px（默认 400 ）
 * @property {Boolean}			toggle		展开后是否显示收起按钮（默认 false ）
 * @property {String}			closeText	关闭时的提示文字（默认 '展开阅读全文' ）
 * @property {String}			openText	展开时的提示文字（默认 '收起' ）
 * @property {String}			color		提示文字的颜色（默认 '#2979ff' ）
 * @property {String | Number}	fontSize	提示文字的大小，单位px （默认 14 ）
 * @property {Object}			shadowStyle	显示阴影的样式
 * @property {String}			textIndent	段落首行缩进的字符个数 （默认 '2em' ）
 * @property {String | Number}	name		用于在 open 和 close 事件中当作回调参数返回
 * @event {Function} open 内容被展开时触发
 * @event {Function} close 内容被收起时触发
 * @example <up-read-more><rich-text :nodes="content"></rich-text></up-read-more>
 */
defineOptions({
	name: 'up-read-more',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...readMoreProps.props
})
const emit = defineEmits(['open', 'close'])
const { $uGetRect } = useUltraUI(props)

const isLongContent = ref(false)
const status = ref('close')
const elId = ref(guid())
const contentHeight = ref(100)
const contentInnerRef = ref(null)

const innerShadowStyle = computed(() => {
	if (status.value === 'open') return {}
	return props.shadowStyle
})

onMounted(() => {
	init()
})

async function init() {
	const height = await getContentHeight()
	contentHeight.value = height
	if (height > getPx(props.showHeight)) {
		isLongContent.value = true
		status.value = 'close'
	} else {
		isLongContent.value = false
		status.value = 'close'
	}
}

async function getContentHeight() {
	await sleep(30)
	return new Promise((resolve) => {
		// #ifndef APP-NVUE
		$uGetRect('.' + elId.value).then((res) => {
			resolve(res.height)
		})
		// #endif

		// #ifdef APP-NVUE
		const refNode = contentInnerRef.value
		dom.getComponentRect(refNode, (res) => {
			resolve(res.size.height)
		})
		// #endif
	})
}

function toggleReadMore() {
	status.value = status.value === 'close' ? 'open' : 'close'
	if (props.toggle == false) isLongContent.value = false
	emit(status.value, props.name)
}

defineExpose({
	init
})
</script>


<style lang="scss" scoped>
.up-read-more {

	&__content {
		overflow: hidden;
		color: $up-content-color;
		font-size: 15px;
		text-align: left;
	}

	&__toggle {
		@include flex;
		justify-content: center;
		position: relative;

		&__text {
			@include flex;
			align-items: center;
			justify-content: center;
			margin-top: 5px;
		}
	}
}
</style>
