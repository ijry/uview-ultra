<template>
	<view class="up-signature">
		<view class="up-signature__canvas-wrap" :style="{background: bgColor}">
			<up-canvas
				ref="signatureCanvas"
				:canvas-id="canvasId"
				:width="canvasWidth"
				:height="canvasHeight"
				:bg-color="bgColor"
				@touchstart="touchStart"
				@touchmove="touchMove"
				@touchend="touchEnd"
				:disable-scroll="true"
				class="up-signature__canvas"
				:style="{
					width: canvasWidth + 'px',
					height: canvasHeight + 'px',
				}">
			</up-canvas>
		</view>

		<view v-if="showToolbar" class="up-signature__toolbar">
			<view class="up-signature__toolbar-icons up-flex up-flex-x">
				<view class="up-signature__toolbar-icon" @click="undo">
					<up-icon name="arrow-left" size="22" :color="pathStack.length === 0 ? '#ccc' : '#999'"></up-icon>
				</view>
				<view class="up-signature__toolbar-icon" @click="clear">
					<up-icon name="trash" size="25" color="#999"></up-icon>
				</view>
				<view class="up-signature__toolbar-icon" @click="toggleBrushSettings">
					<up-icon name="edit-pen" size="25" color="#999"></up-icon>
				</view>
				<view class="up-signature__toolbar-icon" @click="toggleColorSettings">
					<up-icon name="grid" size="24" color="#999"></up-icon>
				</view>
				<view class="up-signature__toolbar-icon" @click="exportSignature">
					<up-icon name="checkmark" size="25" :color="isEmpty ? '#ccc' : '#999'"></up-icon>
				</view>
			</view>

			<!-- 笔画设置 -->
			<view v-if="showBrushSettings" class="up-signature__brush-settings">
				<view class="up-signature__progress">
					<text class="up-signature__progress-label">{{ t("up.signature.penSize") }}:</text>
					<up-slider
						v-model="lineWidth"
						:min="1"
						:max="20"
						:step="1"
						@show-value="true"
						:value-show="(lineWidth)"
					></up-slider>
				</view>
			</view>

			<!-- 颜色设置 -->
			<view v-if="showColorSettings" class="up-signature__color-settings">
				<view class="up-signature__color-picker">
                    <text class="up-signature__color-label">{{ t("up.signature.penColor") }}:</text>
					<view class="up-signature__colors">
						<view
							v-for="(color, index) in presetColors"
							:key="index"
							class="up-signature__color-item"
							:class="{'up-signature__color-item--active': lineColor === color}"
							:style="{ backgroundColor: color }"
							@click="selectColor(color)"
						></view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { t } from '../../libs/i18n'

defineOptions({
	name: 'up-signature',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	// 画布宽度
	width: {
		type: [String, Number],
		default: 300
	},
	// 画布高度
	height: {
		type: [String, Number],
		default: 200
	},
	// 背景颜色
	bgColor: {
		type: String,
		default: '#ffffff'
	},
	// 默认笔画颜色
	color: {
		type: String,
		default: '#000000'
	},
	// 默认笔画粗细
	thickness: {
		type: [String, Number],
		default: 3
	},
	// 是否显示工具栏
	showToolbar: {
		type: Boolean,
		default: true
	}
})
const emit = defineEmits(['confirm', 'error'])

const canvasId = ref('up-signature-' + Math.random().toString(36).substr(2, 9))
const canvasWidth = ref(300)
const canvasHeight = ref(200)
const lineColor = ref('#000000')
const lineWidth = ref(3)
const isDrawing = ref(false)
const pathStack = ref([])
const currentPath = ref([])
const isEmpty = ref(true)
const presetColors = ref([
	'#000000',
	'#ff0000',
	'#00ff00',
	'#0000ff',
	'#ffff00',
	'#00ffff',
	'#ff00ff',
	'#ffffff'
])
const showBrushSettings = ref(false)
const showColorSettings = ref(false)
const lastPoint = ref(null)
const canvasInstance = ref(null)
const signatureCanvas = ref(null)

function getCanvasInstance() {
	if (canvasInstance.value) {
		return canvasInstance.value
	}

	const canvasRef = signatureCanvas.value
	if (canvasRef) {
		canvasInstance.value = canvasRef
		return canvasRef
	}
	return null
}

function getCanvasPoint(e) {
	// #ifdef MP-WEIXIN
	const touch = e.touches && e.touches[0] ? e.touches[0] : e.mp.touches[0]
	// #endif
	// #ifndef MP-WEIXIN
	const touch = e.touches[0]
	// #endif

	return {
		x: touch.x,
		y: touch.y
	}
}

function touchStart(e) {
	if (!canvasInstance.value || !canvasInstance.value.ctx) {
		getCanvasInstance()
	}

	if (!canvasInstance.value || !canvasInstance.value.ctx) return

	isDrawing.value = true
	isEmpty.value = false
	currentPath.value = []

	const { x, y } = getCanvasPoint(e)

	canvasInstance.value.setLineStyle(lineColor.value, lineWidth.value)
	canvasInstance.value.beginPath()
	canvasInstance.value.moveTo(x, y)

	currentPath.value.push({
		x,
		y,
		type: 'start',
		color: lineColor.value,
		width: lineWidth.value
	})

	lastPoint.value = { x, y }
	e.preventDefault()
}

function touchMove(e) {
	if (!isDrawing.value || !canvasInstance.value || !canvasInstance.value.ctx) return

	e.preventDefault()

	const { x, y } = getCanvasPoint(e)

	canvasInstance.value.lineTo(x, y)
	canvasInstance.value.stroke()
	currentPath.value.push({
		x,
		y,
		type: 'move'
	})
	canvasInstance.value.draw(false)

	lastPoint.value = { x, y }
}

function touchEnd(e) {
	if (!isDrawing.value || !canvasInstance.value || !canvasInstance.value.ctx) return

	isDrawing.value = false
	canvasInstance.value.closePath()
	lastPoint.value = null

	if (currentPath.value.length > 0) {
		pathStack.value.push([...currentPath.value])
	}

	canvasInstance.value.draw(true)
}

function selectColor(color) {
	lineColor.value = color
}

function redraw() {
	if (!canvasInstance.value) {
		getCanvasInstance()
	}

	if (!canvasInstance.value) return

	canvasInstance.value.clearCanvas()

	if (pathStack.value.length === 0) {
		isEmpty.value = true
		return
	}

	isEmpty.value = false

	pathStack.value.forEach(path => {
		if (path.length === 0) return

		canvasInstance.value.beginPath()

		path.forEach((point, index) => {
			if (index === 0 && point.type === 'start') {
				canvasInstance.value.setLineStyle(point.color, point.width)
				canvasInstance.value.moveTo(point.x, point.y)
			} else if (point.type === 'move') {
				canvasInstance.value.lineTo(point.x, point.y)
			}
		})
		canvasInstance.value.stroke()
		canvasInstance.value.draw(true)
	})
}

function undo() {
	if (pathStack.value.length === 0) return
	pathStack.value.pop()
	redraw()
}

function clearCanvas() {
	if (!canvasInstance.value) {
		getCanvasInstance()
	}

	if (!canvasInstance.value) return

	canvasInstance.value.clearCanvas()
	pathStack.value = []
	isEmpty.value = true
}

async function exportSignature() {
	if (isEmpty.value) {
		console.warn('签名为空，无法导出')
		return
	}

	if (!canvasInstance.value) {
		getCanvasInstance()
	}

	if (!canvasInstance.value) {
		console.error('无法获取画布实例')
		return
	}

	try {
		redraw()
		const imagePath = await canvasInstance.value.exportImage('png', 1)
		emit('confirm', imagePath)
	} catch (error) {
		console.error('导出签名图片失败:', error)
		emit('error', error)
	}
}

function toggleBrushSettings() {
	showBrushSettings.value = !showBrushSettings.value
	if (showBrushSettings.value) {
		showColorSettings.value = false
	}
}

function toggleColorSettings() {
	showColorSettings.value = !showColorSettings.value
	if (showColorSettings.value) {
		showBrushSettings.value = false
	}
}

watch(() => props.width, (newVal) => {
	canvasWidth.value = Number(newVal)
}, { immediate: true })

watch(() => props.height, (newVal) => {
	canvasHeight.value = Number(newVal)
}, { immediate: true })

watch(() => props.color, (newVal) => {
	lineColor.value = newVal
}, { immediate: true })

watch(() => props.thickness, (newVal) => {
	lineWidth.value = Number(newVal)
}, { immediate: true })

onMounted(() => {
	nextTick(() => {
		getCanvasInstance()
		clearCanvas()
	})
})

defineExpose({
	exportSignature,
	clearCanvas,
	undo
})
</script>


<style lang="scss" scoped>
	.up-signature {
		display: flex;
		flex-direction: column;

		&__canvas-wrap {
			border: 1px solid #e0e0e0;
			border-radius: 4px;
			overflow: hidden;
		}

		&__canvas {
			width: 100%;
			height: 100%;
		}

		&__toolbar {
			margin-top: 5px;
            background-color: #fff;
		}

		&__toolbar-icons {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1px 0;
			// border: 1px solid #e0e0e0;
			border-radius: 4px;
		}

		&__toolbar-icon {
			padding: 5px;
		}

		&__brush-settings,
		&__color-settings {
			margin-top: 15px;
			padding: 1px;
			// border: 1px solid #e0e0e0;
			border-radius: 4px;
		}

		&__progress {
			&-label {
				display: block;
				margin-bottom: 10px;
				font-size: 14px;
				color: #999;
			}
		}

		&__color-picker {
			margin-bottom: 10px;
		}

		&__color-label {
			display: block;
			margin-bottom: 10px;
			font-size: 14px;
			color: #999;
		}

		&__colors {
			display: flex;
            flex-direction: row;
			flex-wrap: wrap;
			gap: 10px;
		}

		&__color-item {
			width: 30px;
			height: 30px;
			border-radius: 50%;
			border: 2px solid #f0f0f0;
			cursor: pointer;

			&--active {
				border-color: #2979ff;
				transform: scale(1.1);
			}
		}

		&__actions {
			display: flex;
            flex-direction: row;
			gap: 10px;
			justify-content: center;
		}
	}
</style>
