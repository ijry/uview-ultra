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

        <!-- #ifdef APP-PLUS -->
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
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
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
const gcanvess = ref(null)
let canvasNode = null

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
					if (isCanvas) {
						if (res[0]?.node) {
							resolve(res[0].node)
						} else {
							resolve(false)
							console.error("获取节点出错", res)
						}
					} else {
						resolve(res[0])
					}
				})
			// #endif
		} catch (e) {
			console.error("获取节点失败", e)
		}
	})
}

/**
 * 获取Canvas上下文
 */
function getCanvasContext() {
	// #ifdef APP-PLUS
	return uni.createCanvasContext(props.canvasId, proxy);
	// #endif
	// #ifdef APP-PLUS-NVUE || MP || H5
	return canvasNode.getContext('2d');
	// #endif
}

/**
 * 初始化Canvas
 */
async function initCanvas() {
	try {
		canvasNode = await getCanvasNode(props.canvasId);

		// #ifdef MP-WEIXIN
		// 在微信小程序中，为了提高清晰度，需要考虑设备像素比
		const dpr = uni.getSystemInfoSync().pixelRatio;
		if(canvasNode) {
			// 设置canvas实际绘制尺寸为显示尺寸的dpr倍
			canvasNode.width = actualWidth.value * dpr;
			canvasNode.height = actualHeight.value * dpr;
		}
		// #endif

		ctx.value = getCanvasContext();

		// #ifdef MP-WEIXIN
		if(ctx.value) {
			ctx.value.scale(dpr, dpr);
		}
		// #endif

		// 初始化背景，但不在微信小程序中调用draw
		clearCanvas();
	} catch (error) {
		console.error("初始化Canvas失败:", error);
	}
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

/**
 * 绘制操作
 */
function draw(isLastDraw = false) {
	// #ifndef MP-WEIXIN
	if (ctx.value && typeof ctx.value.draw === 'function') {
		ctx.value.draw(isLastDraw);
	}
	// #endif
}

/**
 * 导出图片
 */
function exportImage(fileType = 'png', quality = 1) {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		// 微信小程序中需要先完成绘制，然后导出图片
		setTimeout(() => {
			uni.canvasToTempFilePath({
				x: 0,
				y: 0,
				width: actualWidth.value,
				height: actualHeight.value,
				destWidth: actualWidth.value * 2, // 使用双倍尺寸以提高清晰度
				destHeight: actualHeight.value * 2,
				canvas: canvasNode, // 2d必须
				canvasId: props.canvasId,
				fileType: fileType,
				quality: quality,
				success: (res) => {
					resolve(res.tempFilePath);
				},
				fail: (err) => {
					console.error('导出图片失败:', err);
					reject(err);
				}
			}, proxy);
		}, 50); // 等待50毫秒确保绘制完成
		// #endif

		// #ifndef MP-WEIXIN
		uni.canvasToTempFilePath({
			canvas: canvasNode, // 2d必须
			canvasId: props.canvasId,
			fileType: fileType,
			quality: quality,
			success: (res) => {
				resolve(res.tempFilePath);
			},
			fail: (err) => {
				console.error('导出图片失败:', err);
				reject(err);
			}
		}, proxy);
		// #endif
	});
}

/**
 * 使用根节点宽高 设置新的size
 * @return {Promise<void>}
 */
async function setNewSize(){
	const rootNode = await getCanvasNode(rootId.value, false);
	const { width , height } = rootNode;
	widthLocal.value = height;
	heightLocal.value = width;
}

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
	draw,
	exportImage,
	ctx
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
