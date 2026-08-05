<template>
    <view class="up-qrcode"
          :id="rootId"
          :style="{
              width: useRootHeightAndWidth ? '100%' : 'auto',
              height: useRootHeightAndWidth ? '100%' : 'auto',
          }"
          @longpress="longpress">
        <view class="up-qrcode__content" @click="preview">
            <up-canvas
                ref="qrcodeCanvas"
                class="up-qrcode__canvas"
                :canvas-id="cid"
                :width="sizeLocal"
                :height="sizeLocal"
                :unit="unit"
                bg-color="transparent"
                :style="{ width: sizeLocal + unit, height: sizeLocal + unit }"
            ></up-canvas>
            <view v-if="showLoading && loading" class="up-qrcode__loading"
                  :style="{ width: sizeLocal + unit, height: sizeLocal + unit }">
                <up-loading-icon vertical :text="loadingText" textSize="14px"></up-loading-icon>
            </view>
        </view>

    </view>
</template>

<script setup>
import QRCode from "./qrcode.js"
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

let qrcode

defineOptions({
	name: 'up-qrcode',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	cid: {
		type: String,
		default: () => `up-qrcode-canvas${Math.floor(Math.random() * 1000000)}`
	},
	size: {
		type: Number,
		default: 200
	},
	unit: {
		type: String,
		default: 'px'
	},
	show: {
		type: Boolean,
		default: true
	},
	val: {
		type: String,
		default: ''
	},
	background: {
		type: String,
		default: '#ffffff'
	},
	foreground: {
		type: String,
		default: '#000000'
	},
	pdground: {
		type: String,
		default: '#000000'
	},
	icon: {
		type: String,
		default: ''
	},
	iconSize: {
		type: Number,
		default: 40
	},
	lv: {
		type: Number,
		default: 3
	},
	quietZone: {
		type: Number,
		default: 0
	},
	onval: {
		type: Boolean,
		default: true
	},
	loadMake: {
		type: Boolean,
		default: true
	},
	usingComponents: {
		type: Boolean,
		default: true
	},
	showLoading: {
		type: Boolean,
		default: true
	},
	loadingText: {
		type: String,
		default: '生成中'
	},
	allowPreview: {
		type: Boolean,
		default: false
	},
	// 是否使用根节点宽高
	useRootHeightAndWidth: {
		type: Boolean,
		default: () => false
	},
})

const emit = defineEmits(['result', 'longpressCallback', 'preview'])
const instance = getCurrentInstance()
const proxy = instance?.proxy

const loading = ref(false)
const result = ref('')
const rootId = ref(`rootId${Number(Math.random() * 100).toFixed(0)}`)
const sizeLocal = ref(props.size)
const qrcodeCanvas = ref(null)
const canvasHost = ref(null)
const ctx = ref(null)
let isNvue = false

function getVueCtx() {
	// qrcode.js 需要组件实例 (createCanvasContext / canvasToTempFilePath) 以及 drawImage
	const base = proxy || {}
	return Object.assign(Object.create(base), {
		drawImage,
		get ctx() { return ctx.value },
		set ctx(v) { ctx.value = v },
	})
}

async function _makeCode() {
	if (!await initCanvas()) {
		return
	}
	if (!_empty(props.val)) {
		// #ifndef APP-NVUE
		loading.value = true
		// #endif
		const vuectx = getVueCtx()
		qrcode = new QRCode({
			vuectx,
			canvasId: props.cid,
			ctx: ctx.value,
			canvasHost: canvasHost.value,
			isNvue,
			usingComponents: props.usingComponents,
			showLoading: false,
			loadingText: props.loadingText,
			text: props.val,
			size: sizeLocal.value,
			width: sizeLocal.value,
			height: sizeLocal.value,
			background: props.background,
			foreground: props.foreground,
			pdground: props.pdground,
			quietZone: props.quietZone,
			correctLevel: props.lv,
			image: props.icon,
			imageSize: props.iconSize,
			cbResult: function (res) {
				_result(res)
			},
		});
	} else {
		uni.showToast({
			title: '二维码内容不能为空',
			icon: 'none',
			duration: 2000
		});
	}
}

function _clearCode() {
	_result('')
	qrcode && qrcode.clear()
}

async function _saveCode() {
	if (result.value != "") {
		uni.saveImageToPhotosAlbum({
			filePath: result.value,
			success: function () {
				uni.showToast({
					title: '二维码保存成功',
					icon: 'success',
					duration: 2000
				});
			}
		});
	} else {
		try {
			await toTempFilePath({
				success: res => {
					result.value = res.tempFilePath
					uni.saveImageToPhotosAlbum({
						filePath: result.value,
						success: function () {
							uni.showToast({
								title: '二维码保存成功',
								icon: 'success',
								duration: 2000
							});
						}
					});
				},
				fail: err => {
				}
			})
		} catch {
		}
	}
}

function preview(e) {
	// 预览图片
	// console.log(result.value)
	if (props.allowPreview) {
		uni.previewImage({
			urls: [result.value],
			longPressActions: {
				itemList: ['保存二维码图片'],
				success: function(data) {
					// console.log('选中了第' + (data.tapIndex + 1) + '个按钮,第' + (data.index + 1) + '张图片');
					switch (data.tapIndex) {
						case 0:
							_saveCode();
							break;
					}
				},
				fail: function(err) {
					console.log(err.errMsg);
				}
			}
		});
	}
	emit('preview', {
		url: result.value
	}, e)
}

async function toTempFilePath(options = {}) {
	if (!canvasHost.value && !await initCanvas(true)) {
		const error = new Error('无法获取二维码画布实例')
		if (typeof options.fail === 'function') options.fail(error)
		return Promise.reject(error)
	}
	return canvasHost.value.toTempFilePath({
		...options,
		width: options.width || sizeLocal.value,
		height: options.height || sizeLocal.value,
		destWidth: options.destWidth || sizeLocal.value,
		destHeight: options.destHeight || sizeLocal.value
	})
}

async function longpress() {
	try {
		await toTempFilePath({
			success: res => {
				emit('longpressCallback', res.tempFilePath)
			},
			fail: err => {
			}
		})
	} catch {
	}
}

/**
 * 使用根节点宽高 设置新的size
 * @return {Promise<void>}
 */
async function setNewSize() {
	const rootNode = await getRootNode();
	if (!rootNode) {
		return
	}
	const { width, height } = rootNode;
	// 将最短的设置为二维码 的size
	if (width > height) {
		sizeLocal.value = height
	}
	else {
		sizeLocal.value = width
	}
}

async function initCanvas(force = false) {
	await nextTick()
	const host = qrcodeCanvas.value
	if (!host) return false
	const initialized = await host.initCanvas(force)
	if (initialized === false) return false
	canvasHost.value = host
	ctx.value = host.getRawContext()
	return !!ctx.value
}

function refresh() {
	return initCanvas(true)
}

async function getRootNode() {
	return new Promise((resolve) => {
		try {
			uni.createSelectorQuery()
				.in(proxy)
				.select(`#${rootId.value}`)
				.fields({ size: true })
				.exec((res) => resolve(res?.[0] || false))
		} catch (e) {
			console.error('获取二维码根节点失败', e)
			resolve(false)
		}
	})
}

function getUPCanvasContext() {
	return canvasHost.value ? canvasHost.value.getRawContext() : null
}

async function drawImage(url, x, y, w, h) {
	try {
		if (!canvasHost.value) {
			await initCanvas(true)
		}
		if (!canvasHost.value) return false
		return await canvasHost.value.drawImage(url, x, y, w, h)
	} catch (error) {
		console.log('drawImage绘制出错', error)
		return false
	}
}

function selectClick(index) {
	switch (index) {
		case 0:
			alert('保存二维码')
			_saveCode();
			break;
	}
}

function _result(res) {
	loading.value = false;
	result.value = res;
	emit('result', res);
}

function _empty(v) {
	let tp = typeof v,
		rt = false;
	if (tp == "number" && String(v) == "") {
		rt = true
	} else if (tp == "undefined") {
		rt = true
	} else if (tp == "object") {
		if (JSON.stringify(v) == "{}" || JSON.stringify(v) == "[]" || v == null) rt = true
	} else if (tp == "string") {
		if (v == "" || v == "undefined" || v == "null" || v == "{}" || v == "[]") rt = true
	} else if (tp == "function") {
		rt = false
	}
	return rt
}

watch(() => props.size, (n, o) => {
	if (n != o && !_empty(n)) {
		sizeLocal.value = n
		if (!_empty(props.val)) {
			setTimeout(() => {
				_makeCode()
			}, 100);
		}
	}
})

watch(() => props.val, (n, o) => {
	if (props.onval) {
		if (n != o && !_empty(n)) {
			setTimeout(() => {
				_makeCode()
			}, 0);
		}
	}
})

onMounted(async () => {
	// 如果使用根节点的宽高 则 重新设置 size
	if (props.useRootHeightAndWidth) {
		await setNewSize()
	}
	// #ifdef APP-NVUE
	isNvue = true
	// #endif
	await initCanvas()

	if (props.loadMake) {
		if (!_empty(props.val)) {
			setTimeout(() => {
				setTimeout(() => {
					_makeCode()
				})
			}, 0);
		}
	}
})

defineExpose({
	_makeCode,
	initCanvas,
	refresh,
	getUPCanvasContext,
	drawImage,
	_clearCode,
	_saveCode,
	toTempFilePath,
	preview,
	longpress,
	qrcodeCanvas,
	canvasHost,
	ctx
})
</script>

<style lang="scss" scoped>
.up-qrcode {
    &__loading {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #f7f7f7;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }

    /* #ifdef MP-TOUTIAO */
    /**字节小程序在编译时会出现一个 [hidde]:{ display: none !important; } 这个样式
     * 会导致canvas 隐藏掉 没有找到具体原因先这样处理
     */
    &__canvas {
        display: block !important;
    }
    /* #endif */

    &__content {
        position: relative;

        &__canvas {
            position: fixed;
            top: -99999rpx;
            left: -99999rpx;
            z-index: -99999;
        }
    }
}
</style>
