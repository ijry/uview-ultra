<template>
	<view class="up-lottie" :class="customClass" :style="addStyle(customStyle)">
		<!-- #ifdef H5 || APP-PLUS -->
		<!-- #ifndef APP-NVUE -->
		<view
			ref="webContainerRef"
			class="up-lottie__web"
			:style="webContentStyle"
		></view>
		<!-- #endif -->
		<!-- #endif -->

		<!-- #ifdef MP-WEIXIN || APP-HARMONY -->
		<up-canvas
			v-if="canvasVisible"
			ref="canvasRef"
			:canvas-id="canvasId"
			:width="canvasWidth"
			:height="canvasHeight"
			bg-color="transparent"
			@ready="onCanvasReady"
		/>
		<!-- #endif -->
	</view>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
import { addStyle } from '../../libs/function/index.js'
import { props as lottieProps } from './props.js'

// #ifdef APP-HARMONY
import './libs/wx-env.js'
import { createHarmonyCanvasAdapter } from './libs/harmony-canvas-adapter.js'
// #endif

// #ifdef MP-WEIXIN || APP-HARMONY
import lottieMiniprogram from './libs/lottie-miniprogram.min.js'
// #endif

// #ifdef MP-WEIXIN || APP-HARMONY
// lottie-miniprogram 内部持有全局 canvas 引用，同一时刻只允许一个实例持有引擎
let canvasEngineOwner = null
// #endif

// #ifdef APP-PLUS
// #ifndef APP-NVUE
import lottieWeb from './libs/lottie_svg.min.js'
// #endif
// #endif

// #ifdef H5
let webEnginePromise = null
function getWebEngine() {
	if (!webEnginePromise) {
		webEnginePromise = import('./libs/lottie_svg.min.js')
			.then((module) => module.default)
			.catch((error) => {
				webEnginePromise = null
				throw error
			})
	}
	return webEnginePromise
}
// #endif

// #ifdef APP-PLUS
// #ifndef APP-NVUE
function getWebEngine() {
	return Promise.resolve(lottieWeb)
}
// #endif
// #endif

/**
 * lottie 动画
 * @description 加载 AE 导出的 Lottie JSON 并播放；H5 / App-Vue 使用 SVG 渲染器，微信小程序 / 鸿蒙使用 canvas 渲染器。
 * @property {String} filePath 动画 JSON 路径，支持 http(s)；H5 / App-Vue 额外支持本地静态路径。远程 JSON 可包含可执行表达式，请仅加载可信来源
 * @property {Object} animationData 直接传入 Lottie JSON 对象，优先级高于 filePath
 * @property {String} contentModel 填充模式：ScaleToFill / AspectFill / Center
 * @property {Boolean} loop 是否循环播放
 * @property {Boolean} autoplay 就绪后是否自动播放
 * @event {Function} statechange 状态变化，type 为 ready/play/pause/resume/stop/complete/error；微信小程序为 event.detail，统一按 event.detail || event 兼容
 * @example <up-lottie :animation-data="data" content-model="AspectFill" @statechange="onState" />
 */
defineOptions({
	name: 'up-lottie'
})

const props = defineProps({
	...commonProps,
	...lottieProps.props
})
const emit = defineEmits(['statechange'])
const { $uGetRect } = useUltraUI(props)

const webContainerRef = ref(null)
const canvasRef = ref(null)
const webCenterSize = ref(null)
const canvasVisible = ref(false)
const canvasWidth = ref(300)
const canvasHeight = ref(300)
const canvasId = ref(`up-lottie-canvas-${Date.now()}${Math.floor(Math.random() * 1000)}`)

const instanceId = `up-lottie-${Date.now()}${Math.floor(Math.random() * 1000)}`

let animation = null
let requestTask = null
let loadToken = 0
let pendingPlay = false
let engineReady = false
let completed = false
let engineState = 'idle'
let failedToken = -1
let sourceData = null
let ownsCanvasEngine = false
let cancelledBeforeReady = false
let harmonyAdapter = null

const rendererKind = computed(() => {
	// #ifdef APP-NVUE
	return 'unsupported'
	// #endif
	// #ifdef MP-WEIXIN || APP-HARMONY
	return 'canvas'
	// #endif
	// #ifdef MP
	return 'unsupported'
	// #endif
	// #ifdef H5 || APP-PLUS
	return 'web'
	// #endif
	return 'unsupported'
})

const preserveAspectRatio = computed(() => {
	if (props.contentModel === 'ScaleToFill') return 'none'
	if (props.contentModel === 'Center') return 'xMidYMid meet'
	return 'xMidYMid slice'
})

const webContentStyle = computed(() => {
	if (props.contentModel !== 'Center') {
		return { width: '100%', height: '100%', flex: '0 0 auto' }
	}
	if (webCenterSize.value) {
		return {
			width: `${webCenterSize.value.width}px`,
			height: `${webCenterSize.value.height}px`,
			flex: '0 0 auto'
		}
	}
	return { width: '100%', height: '100%', flex: '0 0 auto' }
})

async function reload() {
	const token = loadToken + 1
	loadToken = token
	if (requestTask && typeof requestTask.abort === 'function') {
		requestTask.abort()
	}
	requestTask = null
	destroyEngine()
	canvasVisible.value = false
	sourceData = null
	webCenterSize.value = null
	engineReady = false
	completed = false
	pendingPlay = false
	cancelledBeforeReady = false
	failedToken = -1
	engineState = 'idle'

	const kind = rendererKind.value
	if (kind === 'unsupported') {
		fail('当前平台不支持 up-lottie', token)
		return
	}

	try {
		const source = await resolveSource()
		if (token !== loadToken) return
		if (kind === 'web') {
			await initWeb(source, token)
			return
		}
		await initCanvasLayout(source, token)
	} catch (error) {
		if (token !== loadToken) return
		fail(normalizeError(error), token)
	}
}

async function resolveSource() {
	if (props.animationData && typeof props.animationData === 'object') {
		return { data: props.animationData }
	}
	const path = typeof props.filePath === 'string' ? props.filePath.trim() : ''
	if (!path) {
		throw new Error('up-lottie: filePath 与 animationData 不能同时为空')
	}
	if (/^https?:\/\//i.test(path)) {
		return { data: await requestJson(path) }
	}

	// #ifdef APP-HARMONY
	try {
		return { data: await requestJson(path) }
	} catch (error) {
		throw new Error('up-lottie: 鸿蒙暂不支持读取本地 JSON，请改用 animationData')
	}
	// #endif

	// #ifdef H5 || APP-PLUS
	// #ifndef APP-NVUE
	return { path }
	// #endif
	// #endif

	// #ifdef MP-WEIXIN
	throw new Error('up-lottie: 微信小程序无法读取本地 JSON，请改用 animationData')
	// #endif

	throw new Error('up-lottie: 当前平台不支持该数据源')
}

function requestJson(url) {
	return new Promise((resolve, reject) => {
		const task = uni.request({
			url,
			method: 'GET',
			dataType: 'json',
			responseType: 'text',
			success: (response) => {
				if (requestTask === task) requestTask = null
				if (response.statusCode < 200 || response.statusCode >= 300) {
					reject(new Error(`up-lottie: 请求失败 (${response.statusCode})`))
					return
				}
				let data = response.data
				if (typeof data === 'string') {
					try {
						data = JSON.parse(data)
					} catch (error) {
						reject(new Error('up-lottie: JSON 解析失败'))
						return
					}
				}
				if (!data || typeof data !== 'object') {
					reject(new Error('up-lottie: 返回内容不是有效的 Lottie JSON'))
					return
				}
				resolve(data)
			},
			fail: (error) => {
				if (requestTask === task) requestTask = null
				const suffix = error && error.errMsg ? ` - ${error.errMsg}` : ''
				reject(new Error(`up-lottie: 请求失败${suffix}`))
			}
		})
		requestTask = task
	})
}

async function initWeb(source, token) {
	// #ifdef H5 || APP-PLUS
	// #ifndef APP-NVUE
	let engine
	try {
		engine = await getWebEngine()
	} catch (error) {
		fail(normalizeError(error), token)
		return
	}
	if (token !== loadToken) return
	if (!engine || typeof engine.loadAnimation !== 'function') {
		fail('lottie-web 引擎未加载', token)
		return
	}
	if (source.data && props.contentModel === 'Center') {
		applyWebCenterSize(source.data)
	}
	await nextTick()
	if (token !== loadToken) return
	const containerRef = webContainerRef.value
	const container = containerRef && (containerRef.$el || containerRef)
	if (!container) {
		fail('动画容器不存在', token)
		return
	}
	const options = {
		container,
		renderer: 'svg',
		loop: props.loop,
		autoplay: false,
		rendererSettings: {
			preserveAspectRatio: preserveAspectRatio.value
		}
	}
	if (source.data) {
		options.animationData = source.data
	} else {
		options.path = source.path
	}
	let created
	try {
		created = engine.loadAnimation(options)
	} catch (error) {
		fail(normalizeError(error), token)
		return
	}
	if (token !== loadToken) {
		created.destroy()
		return
	}
	animation = created
	bindEngineEvents(created, token)
	// #endif
	// #endif
}

function applyWebCenterSize(data) {
	const width = Number(data && data.w)
	const height = Number(data && data.h)
	if (width > 0 && height > 0) {
		webCenterSize.value = { width, height }
	}
}

async function initCanvasLayout(source, token) {
	if (!source.data) {
		fail('画布平台仅支持 animationData 或 http(s) 数据源', token)
		return
	}
	sourceData = source.data
	const rect = await measureRoot()
	if (token !== loadToken) return
	if (!rect) {
		fail('组件宽高为 0，请为 up-lottie 设置明确的宽高', token)
		return
	}
	let width = rect.width
	let height = rect.height
	if (props.contentModel === 'Center') {
		const naturalWidth = Number(source.data.w)
		const naturalHeight = Number(source.data.h)
		if (naturalWidth > 0 && naturalHeight > 0) {
			width = naturalWidth
			height = naturalHeight
		}
	}
	canvasWidth.value = width
	canvasHeight.value = height
	canvasId.value = `up-lottie-canvas-${Date.now()}${Math.floor(Math.random() * 1000)}`
	canvasVisible.value = true
}

async function measureRoot() {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const rect = await $uGetRect('.up-lottie')
		if (rect && rect.width > 0 && rect.height > 0) {
			return rect
		}
		await new Promise((resolve) => setTimeout(resolve, 30))
	}
	return null
}

function onCanvasReady() {
	if (!canvasVisible.value) return
	const refValue = canvasRef.value
	if (!refValue) return
	const token = loadToken
	nextTick(() => {
		if (!canvasVisible.value || token !== loadToken) return
		initCanvasEngine(token)
	})
}

function initCanvasEngine(token) {
	// #ifdef MP-WEIXIN || APP-HARMONY
	if (token !== loadToken) return
	if (animation) {
		destroyEngine()
	}
	const refValue = canvasRef.value
	if (!refValue) {
		fail('画布未就绪', token)
		return
	}
	if (canvasEngineOwner && canvasEngineOwner !== instanceId) {
		fail('当前应用仅支持一个并行的 up-lottie 实例', token)
		return
	}
	if (!canvasEngineOwner) {
		canvasEngineOwner = instanceId
		ownsCanvasEngine = true
	}
	try {
		// #ifdef MP-WEIXIN
		const node = refValue.getCanvasElement()
		const context = refValue.getRawContext()
		if (!node || !context) {
			throw new Error('画布节点初始化失败')
		}
		if (typeof context.setTransform === 'function') {
			context.setTransform(1, 0, 0, 1, 0, 0)
		}
		lottieMiniprogram.setup(node)
		startCanvasAnimation(context, token)
		// #endif

		// #ifdef APP-HARMONY
		const legacyContext = refValue.getRawContext()
		if (!legacyContext) {
			throw new Error('画布上下文初始化失败')
		}
		const adapter = createHarmonyCanvasAdapter({
			context: legacyContext,
			width: canvasWidth.value,
			height: canvasHeight.value
		})
		harmonyAdapter = adapter
		lottieMiniprogram.setup(adapter.canvas)
		startCanvasAnimation(adapter.context, token)
		// #endif
	} catch (error) {
		// #ifdef APP-HARMONY
		if (harmonyAdapter) {
			harmonyAdapter.destroy()
			harmonyAdapter = null
		}
		// #endif
		releaseCanvasOwner()
		fail(normalizeError(error), token)
	}
	// #endif
}

function startCanvasAnimation(context, token) {
	// #ifdef MP-WEIXIN || APP-HARMONY
	const created = lottieMiniprogram.loadAnimation({
		animationData: sourceData,
		loop: props.loop,
		autoplay: false,
		rendererSettings: {
			context,
			preserveAspectRatio: preserveAspectRatio.value,
			dpr: 1,
			clearCanvas: true
		}
	})
	if (token !== loadToken) {
		created.destroy()
		releaseCanvasOwner()
		return
	}
	animation = created
	bindEngineEvents(created, token)
	// #endif
}

function releaseCanvasOwner() {
	// #ifdef MP-WEIXIN || APP-HARMONY
	if (ownsCanvasEngine && canvasEngineOwner === instanceId) {
		canvasEngineOwner = null
	}
	ownsCanvasEngine = false
	// #endif
}

function bindEngineEvents(created, token) {
	const isCurrent = () => token === loadToken
	created.addEventListener('DOMLoaded', () => {
		if (!isCurrent()) return
		if (
			rendererKind.value === 'web' &&
			props.contentModel === 'Center' &&
			!webCenterSize.value
		) {
			applyWebCenterSize(created.animationData)
			if (webCenterSize.value) {
				nextTick(() => {
					if (isCurrent() && animation) {
						animation.resize()
					}
				})
			}
		}
		engineReady = true
		emitState('ready')
		if ((props.autoplay && !cancelledBeforeReady) || pendingPlay) {
			pendingPlay = false
			startPlayback()
		}
	})
	created.addEventListener('complete', () => {
		if (!isCurrent() || props.loop) return
		completed = true
		engineState = 'completed'
		emitState('complete')
	})
	const onFailure = () => {
		if (!isCurrent()) return
		fail('动画加载失败', token)
	}
	created.addEventListener('data_failed', onFailure)
	created.addEventListener('error', onFailure)
}

function startPlayback() {
	if (!animation) {
		pendingPlay = true
		return
	}
	if (engineState === 'playing') return
	if (completed || engineState === 'stopped') {
		animation.goToAndStop(0, true)
		completed = false
	}
	animation.play()
	engineState = 'playing'
	emitState('play')
}

function playAnimation() {
	cancelledBeforeReady = false
	if (!animation || !engineReady) {
		pendingPlay = true
		return
	}
	startPlayback()
}

function pauseAnimation() {
	if (!animation || engineState !== 'playing') return
	animation.pause()
	engineState = 'paused'
	emitState('pause')
}

function resumeAnimation() {
	if (!animation || engineState !== 'paused') return
	animation.play()
	engineState = 'playing'
	emitState('resume')
}

function cancelAnimation() {
	cancelledBeforeReady = true
	pendingPlay = false
	if (!animation) return
	animation.stop()
	completed = false
	engineState = 'stopped'
	emitState('stop')
}

function emitState(type, message = '') {
	const detail = { type }
	if (type === 'error') {
		detail.message = message
	}
	emit('statechange', detail)
}

function fail(message, token) {
	if (typeof token === 'number' && token !== loadToken) return
	if (failedToken === loadToken) return
	failedToken = loadToken
	engineReady = false
	pendingPlay = false
	completed = false
	destroyEngine()
	engineState = 'error'
	emitState('error', message || '动画初始化失败')
}

function normalizeError(error) {
	if (!error) return '动画初始化失败'
	if (typeof error === 'string') return error
	return error.message || error.errMsg || '动画初始化失败'
}

function destroyEngine() {
	if (animation) {
		try {
			animation.destroy()
		} catch (error) {
			// 引擎可能尚未完成初始化，销毁失败不影响后续重载
		}
		animation = null
	}
	// #ifdef APP-HARMONY
	if (harmonyAdapter) {
		harmonyAdapter.destroy()
		harmonyAdapter = null
	}
	// #endif
	releaseCanvasOwner()
	engineReady = false
	engineState = 'idle'
}

// 监听数据源与填充模式变化，重新加载
watch(() => props.filePath, () => { reload() })
watch(() => props.animationData, () => { reload() })
watch(() => props.contentModel, () => { reload() })
watch(() => props.loop, (value) => {
	if (animation) {
		animation.loop = value
	}
})

onMounted(() => {
	reload()
})

onBeforeUnmount(() => {
	loadToken += 1
	if (requestTask && typeof requestTask.abort === 'function') {
		requestTask.abort()
	}
	requestTask = null
	destroyEngine()
})

defineExpose({
	reload,
	playAnimation,
	pauseAnimation,
	resumeAnimation,
	cancelAnimation
})
</script>

<style lang="scss" scoped>
	.up-lottie {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.up-lottie__web {
		flex: 0 0 auto;
	}
</style>
