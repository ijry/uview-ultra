<template>
	<view
		v-if="innerShow && pageList.length"
		class="up-guide"
		:style="{ zIndex: `${zIndex}` }"
		@touchmove.stop.prevent
	>
		<swiper
			class="up-guide__swiper"
			:current="current"
			@change="onSwiperChange"
		>
			<swiper-item v-for="(item, index) in pageList" :key="index">
				<view class="up-guide__page" :style="{ backgroundColor: item.backgroundColor || bgColor }">
					<template v-if="item.image">
						<image class="up-guide__image" :src="item.image" mode="aspectFit"></image>
					</template>
					<view v-else class="up-guide__placeholder">暂无引导图</view>
					<text v-if="item.title" class="up-guide__title">{{ item.title }}</text>
					<text v-if="item.desc" class="up-guide__desc">{{ item.desc }}</text>
				</view>
			</swiper-item>
		</swiper>

		<view class="up-guide__footer">
			<view v-if="indicator" class="up-guide__dots">
				<view
					v-for="(_, dotIndex) in pageList"
					:key="dotIndex"
					class="up-guide__dot"
					:class="{ 'up-guide__dot--active': dotIndex === current }"
				></view>
			</view>
			<view class="up-guide__actions">
				<view v-if="showSkip" class="up-guide__btn up-guide__btn--ghost" @tap="onSkip">
					{{ skipText }}
				</view>
				<view class="up-guide__btn up-guide__btn--primary" @tap="onPrimaryAction">
					{{ isLastPage() ? finishText : nextText }}
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { props as guideProps } from './props'
import { commonProps } from '../../libs/composable/useUltraUI'
/**
 * Guide 首屏引导
 * @description 全屏首屏引导组件，支持一次性记忆与多页滑动
 */
defineOptions({
	name: 'up-guide',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...guideProps.props
})
const emit = defineEmits(['update:show', 'change', 'skip', 'finish', 'close'])

const innerShow = ref(false)
const current = ref(0)
const closing = ref(false)

const pageList = computed(() => (Array.isArray(props.list) ? props.list : []))
const resolvedStorageKey = computed(() => props.storageKey || 'up-guide-default')

watch(() => props.show, (value) => {
	innerShow.value = !!value
})

onMounted(() => {
	bootstrap()
})

function bootstrap() {
	if (!pageList.value.length) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('[up-guide] list is empty')
		}
		return
	}
	if (props.once && readRemembered()) {
		innerShow.value = false
		emit('update:show', false)
		return
	}
	innerShow.value = !!props.show
}

function isLastPage() {
	return current.value >= pageList.value.length - 1
}

function onSwiperChange(event) {
	const next = Number(event?.detail?.current ?? 0)
	current.value = next
	emit('change', { current: next })
}

function onPrimaryAction() {
	if (isLastPage()) {
		emit('finish')
		close(true)
		return
	}
	current.value += 1
	emit('change', { current: current.value })
}

function onSkip() {
	emit('skip')
	close(true)
}

function open() {
	current.value = 0
	innerShow.value = true
	emit('update:show', true)
}

function close(remember = true) {
	if (closing.value) return
	closing.value = true
	if (remember && props.once) {
		writeRemembered()
	}
	innerShow.value = false
	emit('update:show', false)
	emit('close')
	nextTick(() => {
		closing.value = false
	})
}

function reset() {
	try {
		uni.removeStorageSync(resolvedStorageKey.value)
	} catch (error) {}
}

function readRemembered() {
	try {
		const value = uni.getStorageSync(resolvedStorageKey.value)
		return value === true || value === 1 || value === '1'
	} catch (error) {
		return false
	}
}

function writeRemembered() {
	try {
		uni.setStorageSync(resolvedStorageKey.value, 1)
	} catch (error) {}
}

defineExpose({
	open,
	close,
	reset
})
</script>


<style lang="scss" scoped>
	.up-guide {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
	}

	.up-guide__swiper {
		flex: 1;
	}

	.up-guide__page {
		height: 100%;
		padding: 120rpx 40rpx 40rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: #ffffff;
	}

	.up-guide__image {
		width: 560rpx;
		height: 560rpx;
	}

	.up-guide__placeholder {
		width: 560rpx;
		height: 560rpx;
		border-radius: 24rpx;
		background: rgba(255, 255, 255, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.up-guide__title {
		margin-top: 48rpx;
		font-size: 40rpx;
		font-weight: 600;
	}

	.up-guide__desc {
		margin-top: 18rpx;
		font-size: 28rpx;
		opacity: 0.85;
		text-align: center;
	}

	.up-guide__footer {
		padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
	}

	.up-guide__dots {
		display: flex;
		justify-content: center;
		gap: 12rpx;
		margin-bottom: 26rpx;
	}

	.up-guide__dot {
		width: 14rpx;
		height: 14rpx;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.35);
	}

	.up-guide__dot--active {
		width: 34rpx;
		background: #ffffff;
	}

	.up-guide__actions {
		display: flex;
		gap: 16rpx;
	}

	.up-guide__btn {
		flex: 1;
		height: 84rpx;
		border-radius: 42rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
	}

	.up-guide__btn--ghost {
		color: #ffffff;
		border: 2rpx solid rgba(255, 255, 255, 0.42);
	}

	.up-guide__btn--primary {
		color: #111111;
		background: #ffffff;
		font-weight: 600;
	}
</style>
