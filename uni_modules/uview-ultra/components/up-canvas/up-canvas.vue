<template>
    <view class="up-canvas"
        :id="rootId"
        :style="{
            width: useRootHeightAndWidth ? '100%' : 'auto',
            height: useRootHeightAndWidth ? '100%' : 'auto',
        }">
        <!-- #ifdef MP || H5 -->
        <canvas
            class="up-canvas__canvas"
            :id="canvasId"
            :canvas-id="canvasId"
            type="2d"
            :style="{ width: width + unit, height: height + unit }"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"/>
        <!-- #endif -->

        <!-- #ifdef APP-PLUS || APP-HARMONY -->
        <canvas
            class="up-canvas__canvas"
            :id="canvasId"
            :canvas-id="canvasId"
            :style="{ width: width + unit, height: height + unit }"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"/>
        <!-- #endif -->

        <!-- #ifdef APP-NVUE -->
        <gcanvas class="up-canvas__canvas" ref="gcanvess"
            :style="{ width: width + unit, height: height + unit }"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd">
        </gcanvas>
        <!-- #endif -->
    </view>
</template>

<script setup>
// #ifdef APP-NVUE
// https://github.com/dcloudio/NvueCanvasDemo/blob/master/README.md
import {
	enable,
	WeexBridge,
	Image as GImage
} from '../../libs/util/gcanvas/index.js';
// #endif
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-canvas',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	canvasId: {
		type: String,
		default: () => {
			return `up-canvas${Math.floor(Math.random() * 1000000)}`
		}
	},
	width: {
		type: [String, Number],
		default: 300
	},
	height: {
		type: [String, Number],
		default: 300
	},
	unit: {
		type: String,
		default: 'px'
	},
	useRootHeightAndWidth: {
		type: Boolean,
		default: false
	},
	// 背景色
	bgColor: {
		type: String,
		default: '#ffffff'
	}
})
const emit = defineEmits(['touchstart', 'touchmove', 'touchend'])
const instance = getCurrentInstance()
const proxy = instance?.proxy

const rootId = ref(`rootId${Number(Math.random() * 100).toFixed(0)}`)
const ganvas = ref(null)
const canvasContext = ref(null)
const widthLocal = ref(props.width)
const heightLocal = ref(props.height)
const ctx = ref(null)
const dpr = ref(1)
const gcanvess = ref(null)
const imageCache = Object.create(null)
let canvasNode = null
let canvasElement = null
let _initPromise = null
let isNvue = false

const actualWidth = computed(() => {
	return props.useRootHeightAndWidth ? Number(widthLocal.value) : Number(props.width)
})
const actualHeight = computed(() => {
	return props.useRootHeightAndWidth ? Number(heightLocal.value) : Number(props.height)
})

function onTouchStart(e) {
	emit('touchstart', e)
}
function onTouchMove(e) {
	emit('touchmove', e)
}
function onTouchEnd(e) {
	emit('touchend', e)
}

/**
 * 获取节点
 * @param id 节点id
 * @param isCanvas 是否为Canvas节点
 * @return {Promise<unknown>}
 */
async function getCanvasNode(id, isCanvas = true) {
	return new Promise((resolve) => {
		try {
			// #ifdef APP-NVUE
			setTimeout(() => {
				/*获取元素引用*/
				ganvas.value = gcanvess.value
				isNvue = true
				/*通过元素引用获取canvas对象*/
				let node = enable(ganvas.value, {
					bridge: WeexBridge
				})
				resolve(node)
			}, 200)
			// #endif
			// #ifndef APP-PLUS-NVUE
			const query = uni.createSelectorQuery().in(proxy).select(`#${id}`);
			query.fields({
					node: true,
					size: true
				})
				.exec((res) => {
					resolve(res?.[0] || false)
				})
			// #endif
		} catch (e) {
			console.error("获取节点失败", e)
			resolve(false)
		}
	})
}

/**
 * 获取Canvas上下文
 * 注意：鸿蒙(app-harmony)下 APP_PLUS 并未定义（见 uni-cli-shared 的
 * preprocess/context.js：平台为 app-harmony 时只置 APP_HARMONY），
 * 所以这里必须显式覆盖 APP-HARMONY，且末尾保留无条件兜底 return，
 * 否则新平台会把整个函数体裁空、静默返回 undefined。
 */
function getCanvasContext() {
	// #ifdef APP-PLUS || APP-HARMONY
	return uni.createCanvasContext(props.canvasId, proxy);
	// #endif
	// #ifndef APP-PLUS || APP-HARMONY
	return canvasElement && typeof canvasElement.getContext === 'function'
		? canvasElement.getContext('2d')
		: null;
	// #endif
}

/**
 * 初始化Canvas
 */
async function initCanvas(force = false) {
	if (_initPromise) {
		return _initPromise
	}

	const initPromise = _initializeCanvas(force)
	_initPromise = initPromise

	try {
		return await initPromise
	} finally {
		if (_initPromise === initPromise) {
			_initPromise = null
		}
	}
}

function getRawContext() {
	return ctx.value
}

function getCanvasElement() {
	return canvasElement
}

function getCanvasContextHost() {
	return canvasContext.value
}

async function _initializeCanvas(force = false) {
	try {
		if (ctx.value && !force) {
			return true
		}

		canvasNode = await getCanvasNode(props.canvasId);
		if (!canvasNode) {
			return false
		}
		canvasElement = canvasNode.node || canvasNode
		dpr.value = uni.getSystemInfoSync().pixelRatio || 1;

		// #ifdef MP
		// 在微信小程序中，为了提高清晰度，需要考虑设备像素比
		if(canvasElement) {
			// 设置canvas实际绘制尺寸为显示尺寸的dpr倍
			canvasElement.width = Math.ceil(actualWidth.value * dpr.value);
			canvasElement.height = Math.ceil(actualHeight.value * dpr.value);
		}
		// #endif

		ctx.value = getCanvasContext();
		canvasContext.value = ctx.value

		// #ifdef MP
		if(ctx.value) {
			if (typeof ctx.value.setTransform === 'function') {
				ctx.value.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)
			} else {
				ctx.value.scale(dpr.value, dpr.value);
			}
		}
		// #endif

		// 初始化背景，但不在微信小程序中调用draw
		clearCanvas();
		return !!ctx.value
	} catch (error) {
		console.error("初始化Canvas失败:", error);
		return false
	}
}

function refresh() {
	return initCanvas(true)
}

/**
 * 清空画布
 */
function clearCanvas() {
	if (!ctx.value) return;

	clearRect(0, 0, actualWidth.value, actualHeight.value);

	// 填充背景色
	beginPath();
	rect(0, 0, actualWidth.value, actualHeight.value);

	setFillStyle(props.bgColor);
	fill();

	draw();
}
function rect(x, y, width, height) {
	if (!ctx.value) return;
	ctx.value.rect(x, y, width, height);
}
function clearRect(x, y, width, height) {
	if (!ctx.value) return;
	ctx.value.clearRect(x, y, width, height);
}
function fill() {
	if (!ctx.value) return;
	ctx.value.fill();
}
function setFillStyle(color) {
	if (!ctx.value) return;

	// #ifndef APP-PLUS-NVUE
	if (ctx.value.setFillStyle) {
		ctx.value.setFillStyle(color);
	} else {
		ctx.value.fillStyle = color;
	}
	// #endif
	// #ifdef APP-PLUS-NVUE
	ctx.value.setFillStyle(color);
	// #endif
}

/**
 * 设置线条样式
 */
function setLineStyle(lineColor, lineWidth) {
	if (!ctx.value) return;
	setLineCap('round');
	setLineJoin('round');
	setStrokeStyle(lineColor);
	setLineWidth(lineWidth);
}
function setLineCap(lineCap = 'round') {
	if (!ctx.value) return;
	if (ctx.value.setLineCap) {
		ctx.value.setLineCap(lineCap);
	} else {
		ctx.value.lineCap = lineCap;
	}
}
function setLineJoin(lineJoin = 'round') {
	if (!ctx.value) return;
	if (ctx.value.setLineJoin) {
		ctx.value.setLineJoin(lineJoin);
	} else {
		ctx.value.lineJoin = lineJoin;
	}
}
function setStrokeStyle(color) {
	if (!ctx.value) return;
	if (ctx.value.setStrokeStyle) {
		ctx.value.setStrokeStyle(color);
	} else {
		ctx.value.strokeStyle = color;
	}
}
function setLineWidth(width) {
	if (!ctx.value) return;
	if (ctx.value.setLineWidth) {
		ctx.value.setLineWidth(width);
	} else {
		ctx.value.lineWidth = width;
	}
}

/**
 * 开始路径
 */
function beginPath() {
	if (!ctx.value) return;
	ctx.value.beginPath();
}

/**
 * 移动到某点
 */
function moveTo(x, y) {
	if (!ctx.value) return;
	ctx.value.moveTo(x, y);
}

/**
 * 画线到某点
 */
function lineTo(x, y) {
	if (!ctx.value) return;
	ctx.value.lineTo(x, y);
}

/**
 * 描边
 */
function stroke() {
	if (!ctx.value) return;
	ctx.value.stroke();
}

/**
 * 关闭路径
 */
function closePath() {
	if (!ctx.value) return;
	ctx.value.closePath();
}

function loadImage(src) {
	if (imageCache[src]) {
		return Promise.resolve(imageCache[src])
	}
	return new Promise((resolve, reject) => {
		let image = null
		// #ifdef APP-NVUE
		image = new GImage()
		// #endif
		// #ifdef MP
		if (canvasElement && typeof canvasElement.createImage === 'function') {
			image = canvasElement.createImage()
		}
		// #endif
		// #ifdef H5
		image = new Image()
		image.crossOrigin = 'anonymous'
		// #endif

		if (!image) {
			resolve(src)
			return
		}
		image.onload = () => {
			imageCache[src] = image
			resolve(image)
		}
		image.onerror = reject
		image.src = src
	})
}

async function drawImage(source, ...args) {
	if (!ctx.value || typeof ctx.value.drawImage !== 'function') {
		return false
	}
	if (typeof source !== 'string' || (typeof ctx.value.setFillStyle === 'function' && !isNvue)) {
		ctx.value.drawImage(source, ...args)
		return true
	}
	const image = await loadImage(source)
	ctx.value.drawImage(image, ...args)
	return true
}

/**
 * 绘制操作
 */
function draw(isLastDraw = false, callback) {
	if (ctx.value && typeof ctx.value.draw === 'function') {
		return ctx.value.draw(isLastDraw, callback);
	}
	if (typeof callback === 'function') {
		setTimeout(callback, 0)
	}
}

function toTempFilePath(options = {}) {
	return new Promise((resolve, reject) => {
		const width = options.width || actualWidth.value
		const height = options.height || actualHeight.value
		const request = {
			x: options.x || 0,
			y: options.y || 0,
			width,
			height,
			destWidth: options.destWidth || width,
			destHeight: options.destHeight || height,
			fileType: options.fileType || 'png',
			quality: options.quality === undefined ? 1 : options.quality
		}
		const success = (res) => {
			if (typeof options.success === 'function') options.success(res)
			resolve(res)
		}
		const fail = (error) => {
			if (typeof options.fail === 'function') options.fail(error)
			reject(error)
		}
		const complete = (res) => {
			if (typeof options.complete === 'function') options.complete(res)
		}

		// #ifdef H5
		const canvas = canvasElement || (ctx.value && ctx.value.canvas)
		if (canvas && typeof canvas.toDataURL === 'function') {
			try {
				let exportCanvas = canvas
				if (
					request.x !== 0 ||
					request.y !== 0 ||
					request.width !== actualWidth.value ||
					request.height !== actualHeight.value ||
					request.destWidth !== request.width ||
					request.destHeight !== request.height
				) {
					exportCanvas = document.createElement('canvas')
					exportCanvas.width = request.destWidth
					exportCanvas.height = request.destHeight
					const exportCtx = exportCanvas.getContext('2d')
					exportCtx.drawImage(
						canvas,
						request.x * dpr.value,
						request.y * dpr.value,
						request.width * dpr.value,
						request.height * dpr.value,
						0,
						0,
						request.destWidth,
						request.destHeight
					)
				}
				const mime = request.fileType === 'jpg' || request.fileType === 'jpeg'
					? 'image/jpeg'
					: 'image/png'
				const res = { tempFilePath: exportCanvas.toDataURL(mime, request.quality) }
				success(res)
				complete(res)
				return
			} catch (error) {
				fail(error)
				complete(error)
				return
			}
		}
		// #endif

		// #ifdef APP-NVUE
		if (ctx.value && typeof ctx.value.toTempFilePath === 'function') {
			ctx.value.toTempFilePath(
				request.x,
				request.y,
				request.width,
				request.height,
				request.destWidth,
				request.destHeight,
				request.fileType,
				request.quality,
				(res) => {
					success(res)
					complete(res)
				}
			)
			return
		}
		// #endif

		const uniOptions = {
			...request,
			canvasId: props.canvasId,
			success,
			fail,
			complete
		}
		if (canvasElement && typeof canvasElement.getContext === 'function') {
			uniOptions.canvas = canvasElement
		}
		uni.canvasToTempFilePath(uniOptions, proxy)
	})
}

async function exportImage(fileType = 'png', quality = 1) {
	let exportScale = 1
	// #ifdef MP-WEIXIN
	exportScale = 2
	// #endif
	const res = await toTempFilePath({
		fileType,
		quality,
		width: actualWidth.value,
		height: actualHeight.value,
		destWidth: actualWidth.value * exportScale,
		destHeight: actualHeight.value * exportScale
	})
	return res.tempFilePath || res.apFilePath
}

/**
 * 使用根节点宽高 设置新的size
 * @return {Promise<void>}
 */
async function setNewSize(){
	const rootNode = await getCanvasNode(rootId.value, false);
	if (!rootNode) return
	const { width , height } = rootNode;
	widthLocal.value = width;
	heightLocal.value = height;
}

watch(() => props.width, () => {
	refresh()
})

watch(() => props.height, () => {
	refresh()
})

watch(() => props.bgColor, () => {
	clearCanvas()
})

onMounted(async () => {
	// 如果使用根节点的宽高 则 重新设置 size
	if(props.useRootHeightAndWidth){
		await setNewSize();
	}

	// 初始化Canvas
	await initCanvas();
})

defineExpose({
	initCanvas,
	refresh,
	getRawContext,
	getCanvasElement,
	getCanvasContextHost,
	clearCanvas,
	rect,
	clearRect,
	fill,
	setFillStyle,
	setLineStyle,
	setLineCap,
	setLineJoin,
	setStrokeStyle,
	setLineWidth,
	beginPath,
	moveTo,
	lineTo,
	stroke,
	closePath,
	loadImage,
	drawImage,
	draw,
	toTempFilePath,
	exportImage,
	ctx,
	dpr
})
</script>


<style lang="scss" scoped>
    .up-canvas {
        position: relative;
        overflow: hidden;
    }

    .up-canvas__canvas {
        display: block;
    }
</style>
