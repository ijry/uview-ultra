<template>
	<view class="up-skeleton">
		<view
		    class="up-skeleton__wrapper"
		    ref="skeletonWrapperRef"
		    v-if="loading"
			style="display: flex; flex-direction: row;"
		>
			<view
			    class="up-skeleton__wrapper__avatar"
			    v-if="avatar"
			    :class="[`up-skeleton__wrapper__avatar--${avatarShape}`, animate && 'animate']"
			    :style="{
						height: addUnit(avatarSize),
						width: addUnit(avatarSize)
					}"
			></view>
			<view
			    class="up-skeleton__wrapper__content"
			    ref="skeletonContentRef"
				style="flex: 1;"
			>
				<view
				    class="up-skeleton__wrapper__content__title"
				    v-if="title"
				    :style="{
							width: uTitleWidth,
							height: addUnit(titleHeight),
						}"
				    :class="[animate && 'animate']"
				></view>
				<view
				    class="up-skeleton__wrapper__content__rows"
				    :class="[animate && 'animate']"
				    v-for="(item, index) in rowsArray"
				    :key="index"
				    :style="{
							 width: item.width,
							 height: item.height,
							 marginTop: item.marginTop
						}"
				>

				</view>
			</view>
		</view>
		<slot v-else />
	</view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { props as skeletonProps } from './props'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI'
import { addUnit, sleep, error } from '../../libs/function/index'
import test from '../../libs/function/test'
// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
const animation = uni.requireNativePlugin('animation')
// #endif
/**
 * Skeleton 骨架屏
 * @description 骨架屏一般用于页面在请求远程数据尚未完成时，页面用灰色块预显示本来的页面结构，给用户更好的体验。
 * @tutorial https://uview-plus.jiangruyi.com/components/skeleton.html
 * @property {Boolean}					loading		是否显示骨架占位图，设置为false将会展示子组件内容 (默认 true )
 * @property {Boolean}					animate		是否开启动画效果 (默认 true )
 * @property {String | Number}			rows		段落占位图行数 (默认 0 )
 * @property {String | Number | Array}	rowsWidth	段落占位图的宽度，可以为百分比，数值，带单位字符串等，可通过数组传入指定每个段落行的宽度 (默认 '100%' )
 * @property {String | Number | Array}	rowsHeight	段落的高度 (默认 18 )
 * @property {Boolean}					title		是否展示标题占位图 (默认 true )
 * @property {String | Number}			titleWidth	标题的宽度 (默认 '50%' )
 * @property {String | Number}			titleHeight	标题的高度 (默认 18 )
 * @property {Boolean}					avatar		是否展示头像占位图 (默认 false )
 * @property {String | Number}			avatarSize	头像占位图大小 (默认 32 )
 * @property {String}					avatarShape	头像占位图的形状，circle-圆形，square-方形 (默认 'circle' )
 * @example <up-search placeholder="日照香炉生紫烟" v-model="keyword"></up-search>
 */
defineOptions({
	name: 'up-skeleton',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...skeletonProps.props
})
const { $uGetRect } = useUltraUI(props)

const width = ref(0)
const skeletonWrapperRef = ref(null)
const skeletonContentRef = ref(null)

watch(() => props.loading, () => {
	getComponentWidth()
})

const rowsArray = computed(() => {
	if (/%$/.test(props.rowsHeight)) {
		error('rowsHeight参数不支持百分比单位')
	}
	const rows = []
	for (let i = 0; i < props.rows; i++) {
		const item = {}
		const rowWidth = test.array(props.rowsWidth)
			? (props.rowsWidth[i] || (i === props.rows - 1 ? '70%' : '100%'))
			: i === props.rows - 1 ? '70%' : props.rowsWidth
		const rowHeight = test.array(props.rowsHeight)
			? (props.rowsHeight[i] || '18px')
			: props.rowsHeight
		item.marginTop = !props.title && i === 0 ? 0 : props.title && i === 0 ? '20px' : '12px'
		if (/%$/.test(rowWidth)) {
			item.width = addUnit(width.value * parseInt(rowWidth) / 100)
		} else {
			item.width = addUnit(rowWidth)
		}
		item.height = addUnit(rowHeight)
		rows.push(item)
	}
	return rows
})

const uTitleWidth = computed(() => {
	let tWidth = 0
	if (/%$/.test(props.titleWidth)) {
		tWidth = addUnit(width.value * parseInt(props.titleWidth) / 100)
	} else {
		tWidth = addUnit(props.titleWidth)
	}
	return addUnit(tWidth)
})

onMounted(() => {
	init()
})

function init() {
	getComponentWidth()
	// #ifdef APP-NVUE
	props.loading && props.animate && setNvueAnimation()
	// #endif
}

async function setNvueAnimation() {
	// #ifdef APP-NVUE
	await sleep(500)
	const skeleton = skeletonWrapperRef.value
	skeleton && props.loading && props.animate && animation.transition(skeleton, {
		styles: {
			opacity: 0.5
		},
		duration: 600,
	}, () => {
		animation.transition(skeleton, {
			styles: {
				opacity: 1
			},
			duration: 600,
		}, () => {
			props.loading && props.animate && setNvueAnimation()
		})
	})
	// #endif
}

async function getComponentWidth() {
	await sleep(20)
	// #ifndef APP-NVUE
	$uGetRect('.up-skeleton__wrapper__content').then((size) => {
		width.value = size.width
	})
	// #endif

	// #ifdef APP-NVUE
	const refNode = skeletonContentRef.value
	refNode && dom.getComponentRect(refNode, (res) => {
		width.value = res.size.width
	})
	// #endif
}
</script>


<style lang="scss" scoped>

	@mixin background {
		/* #ifdef APP-NVUE */
		background-color: var(--up-skeleton-bg-color, #F1F2F4);
		/* #endif */
		/* #ifndef APP-NVUE */
		background: linear-gradient(90deg, var(--up-skeleton-bg-color, #F1F2F4) 25%, var(--up-skeleton-shimmer-color, #e6e6e6) 37%, var(--up-skeleton-bg-color, #F1F2F4) 50%);
		background-size: 400% 100%;
		/* #endif */
	}

	.up-skeleton {
		flex: 1;

		&__wrapper {
			@include flex(row);

			&__avatar {
				@include background;
				margin-right: 15px;

				&--circle {
					border-radius: 100px;
				}

				&--square {
					border-radius: 4px;
				}
			}

			&__content {
				flex: 1;

				&__rows,
				&__title {
					@include background;
					border-radius: 3px;
				}
			}
		}
	}

	/* #ifndef APP-NVUE */
	.animate {
		animation: skeleton 1.8s ease infinite
	}

	@keyframes skeleton {
		0% {
			background-position: 100% 50%
		}

		100% {
			background-position: 0 50%
		}
	}

	/* #endif */
</style>
