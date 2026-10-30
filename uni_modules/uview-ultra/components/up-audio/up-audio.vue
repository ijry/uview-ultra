<template>
	<view class="up-audio">
		<!-- 播放/暂停按钮 -->
		<view
			class="up-audio__btn"
			:style="{ backgroundColor: activeColor }"
			@tap.stop="toggle"
		>
			<text class="up-audio__btn-icon">{{ playing ? '❚❚' : '▶' }}</text>
		</view>
		<!-- 主体：标题 + 时间 + 进度条 -->
		<view class="up-audio__main">
			<view class="up-audio__row">
				<text
					v-if="hasTitle"
					class="up-audio__title"
				>{{ displayTitle }}</text>
				<text class="up-audio__time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</text>
			</view>
			<slider
				class="up-audio__slider"
				:value="progress"
				:max="100"
				:block-size="10"
				:activeColor="activeColor"
				backgroundColor="#e4e7ed"
				@changing="onChanging"
				@change="onChange"
			/>
		</view>
		<!-- 倍速 -->
		<view
			v-if="showRate"
			class="up-audio__rate"
			@tap.stop="changeRate"
		>
			<text class="up-audio__rate-text">{{ rateText }}</text>
		</view>
	</view>
</template>

<script setup>
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { props as audioProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { audioInstancePool } from './audio-pool.js'
	/**
	 * up-audio 音频播放器
	 * @description uni-app 在 Vue3 中已废弃 <audio> 组件，本组件基于 uni.createInnerAudioContext 实现播放，可单独使用，up-parse 的音频节点也由本组件渲染。
	 * @tutorial https://uview-plus.jiangruyi.com/components/audio.html
	 * @property {String | Array}	src			音频地址，支持数组多源，加载失败自动切换
	 * @property {String}			title		标题，显示在音频条上
	 * @property {Boolean}			loop		是否循环播放 （默认 false ）
	 * @property {Boolean}			showRate	是否显示倍速切换 （默认 true ）
	 * @property {Array}			rateList	可切换的倍速档位 （默认 [0.5, 0.75, 1, 1.25, 1.5, 2] ）
	 * @property {String}			activeColor	主题色（播放按钮、进度条选中色） （默认 '#2979ff' ）
	 * @property {Boolean}			showTitle	是否显示标题 （默认 true ）
	 * @event {Function} play 开始播放时触发，参数 { source, src }
	 * @event {Function} error 加载/播放出错时触发，参数 { source, errMsg }
	 * @example <up-audio src="https://cdn.example.com/a.mp3" title="示例音频"></up-audio>
	 */
	defineOptions({
		name: 'up-audio',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...audioProps.props
	})
	const emit = defineEmits(['play', 'error'])

	const playing = ref(false)
	const currentTime = ref(0)
	const duration = ref(0)
	const progress = ref(0)
	const srcIndex = ref(0)
	const rate = ref(1)
	const seeking = ref(false)
	const errorMsg = ref('')
	let ctx = null

	const srcList = computed(() => {
		if (Array.isArray(props.src)) return props.src.filter(Boolean)
		return props.src ? [props.src] : []
	})
	const displayTitle = computed(() => props.title || '')
	const hasTitle = computed(() => props.showTitle && displayTitle.value !== '')
	const currentSrc = computed(() => srcList.value[srcIndex.value] || '')
	const rateText = computed(() => {
		const r = rate.value
		return (Number.isInteger(r) ? r.toFixed(0) : String(r)) + 'x'
	})

	// src 变化时重建播放器
	watch(() => props.src, () => {
		reset()
	}, { deep: true })

	onMounted(() => {
		init()
	})

	onBeforeUnmount(() => {
		destroy()
	})

	// 源变化时重建
	function reset() {
		destroy()
		srcIndex.value = 0
		currentTime.value = 0
		duration.value = 0
		progress.value = 0
		playing.value = false
		init()
	}

	function init() {
		if (!currentSrc.value) return
		const audioCtx = uni.createInnerAudioContext()
		ctx = audioCtx
		audioCtx.src = currentSrc.value
		if (props.loop) audioCtx.loop = true
		audioCtx.onPlay(() => {
			playing.value = true
			// 暂停实例池中的其它音频，保证多实例互斥
			for (let i = audioInstancePool.length; i--;) {
				if (audioInstancePool[i] !== audioCtx) {
					try { audioInstancePool[i].pause() } catch (e) {}
				}
			}
			emit('play', {
				source: 'audio',
				src: currentSrc.value
			})
		})
		audioCtx.onPause(() => { playing.value = false })
		audioCtx.onStop(() => { playing.value = false })
		audioCtx.onEnded(() => {
			playing.value = false
			currentTime.value = 0
			progress.value = 0
		})
		audioCtx.onTimeUpdate(() => {
			if (seeking.value) return
			currentTime.value = audioCtx.currentTime || 0
			if (audioCtx.duration) duration.value = audioCtx.duration
			progress.value = duration.value ? (currentTime.value / duration.value) * 100 : 0
		})
		audioCtx.onCanplay(() => {
			if (audioCtx.duration) duration.value = audioCtx.duration
		})
		audioCtx.onError(err => handleError(err))
		audioInstancePool.push(audioCtx)
	}

	function destroy() {
		if (ctx) {
			const idx = audioInstancePool.indexOf(ctx)
			if (idx > -1) audioInstancePool.splice(idx, 1)
			try { ctx.destroy() } catch (e) {}
			ctx = null
		}
	}

	function toggle() {
		if (!ctx) return
		if (playing.value) {
			ctx.pause()
		} else {
			ctx.play()
		}
	}

	// 拖动进度条中（只更新本地显示）
	function onChanging(e) {
		seeking.value = true
		progress.value = e.detail.value
		currentTime.value = duration.value ? (duration.value * e.detail.value) / 100 : 0
	}

	// 拖动结束，真正 seek
	function onChange(e) {
		seeking.value = false
		progress.value = e.detail.value
		if (ctx && duration.value) {
			try { ctx.seek((duration.value * e.detail.value) / 100) } catch (err) {}
		}
	}

	function changeRate() {
		const list = (props.rateList && props.rateList.length) ? props.rateList : [0.5, 0.75, 1, 1.25, 1.5, 2]
		let i = list.indexOf(rate.value)
		if (i === -1) i = list.indexOf(1)
		rate.value = list[(i + 1) % list.length]
		if (ctx) {
			try { ctx.playbackRate = rate.value } catch (e) {}
		}
	}

	// 加载失败：尝试下一个源；全部失败则抛 error
	function handleError(err) {
		if (srcIndex.value < srcList.value.length - 1) {
			srcIndex.value += 1
			currentTime.value = 0
			progress.value = 0
			if (ctx) {
				ctx.src = currentSrc.value
				try { ctx.play() } catch (e) {}
			}
			return
		}
		playing.value = false
		errorMsg.value = (err && err.errMsg) || '音频加载失败'
		emit('error', {
			source: 'audio',
			errMsg: errorMsg.value
		})
	}

	function formatTime(sec) {
		sec = Math.floor(sec || 0)
		const m = Math.floor(sec / 60)
		const s = sec % 60
		return m + ':' + (s < 10 ? '0' + s : s)
	}

	defineExpose({
		toggle,
		reset,
		changeRate
	})
</script>

<style
	lang="scss"
	scoped
>
	.up-audio {
		display: flex;
		align-items: center;
		padding: 12rpx 16rpx;
		margin: 8rpx 0;
		border-radius: 8rpx;
		background-color: #f5f7fa;

		&__btn {
			flex-shrink: 0;
			width: 56rpx;
			height: 56rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 16rpx;
		}

		&__btn-icon {
			color: #ffffff;
			font-size: 22rpx;
			line-height: 1;
		}

		&__main {
			flex: 1;
			min-width: 0;
		}

		&__row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 2rpx;
		}

		&__title {
			flex: 1;
			font-size: 26rpx;
			color: #303133;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__time {
			flex-shrink: 0;
			font-size: 22rpx;
			color: #909399;
			margin-left: 12rpx;
		}

		&__slider {
			margin: 0;
			padding: 0;
		}

		&__rate {
			flex-shrink: 0;
			margin-left: 16rpx;
			padding: 4rpx 12rpx;
			border-radius: 20rpx;
			border: 1px solid #dcdfe6;
		}

		&__rate-text {
			font-size: 22rpx;
			color: #606266;
		}
	}
</style>
