<template>
    <view class="up-qrcode"
          :id="rootId"
          :style="{
              width: useRootHeightAndWidth ? '100%' : 'auto',
              height: useRootHeightAndWidth ? '100%' : 'auto',
          }"
          @longpress="longpress">
        <view class="up-qrcode__content" @click="preview">

            <!-- #ifndef APP-NVUE || APP-PLUS -->
            <canvas
                class="up-qrcode__canvas"
                :id="cid"
                :canvas-id="cid"
                type="2d"
                :style="{ width: sizeLocal + unit, height: sizeLocal + unit }" />
            <!-- #endif -->

            <!-- #ifdef APP-VUE -->
            <canvas
                class="up-qrcode__canvas"
                :id="cid"
                :canvas-id="cid"
                :style="{ width: sizeLocal + unit, height: sizeLocal + unit }" />
            <!-- #endif -->

            <!-- #ifdef APP-NVUE -->
			<web-view v-if="icon != ''" ref="web" src="/static/app-plus/up-canvas/local.html"
				:style="'width:' + sizeLocal + 'px;height:' + sizeLocal + 'px'"
				@onPostMessage="_onMessage" />
            <gcanvas v-else class="up-qrcode__canvas" ref="gcanvess"
                :style="{ width: sizeLocal + unit, height: sizeLocal + unit }">
            </gcanvas>
            <!-- #endif -->
            <view v-if="showLoading && loading" class="up-qrcode__loading"
                  :style="{ width: sizeLocal + unit, height: sizeLocal + unit }">
                <up-loading-icon vertical :text="loadingText" textSize="14px"></up-loading-icon>
            </view>
        </view>

    </view>
</template>

<script setup>
import QRCode from "./qrcode.js"
// #ifdef APP-NVUE
// https://github.com/dcloudio/NvueCanvasDemo/blob/master/README.md
import {
	enable,
	WeexBridge,
	Image as GImage
} from '../../libs/util/gcanvas/index.js';
// #endif
import { getCurrentInstance, onMounted, ref, watch } from 'vue'
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
const popupShow = ref(false)
const list = ref([
	{
		name: '保存二维码',
	}
])
const rootId = ref(`rootId${Number(Math.random() * 100).toFixed(0)}`)
const ganvas = ref(null)
const canvasObj = ref({})
const sizeLocal = ref(props.size)
const ctx = ref(null) // ctx 在new Qrcode 时js文件内部设置
const canvas = ref(null) // ctx 在new Qrcode 时js文件内部设置
const web = ref(null)
const gcanvess = ref(null)
let _ready = false
let isNvue = false

function getVueCtx() {
	// qrcode.js 需要组件实例 (createCanvasContext / canvasToTempFilePath) 以及 drawImage
	const base = proxy || {}
	return Object.assign(Object.create(base), {
		drawImage,
		get ctx() { return ctx.value },
		set ctx(v) { ctx.value = v },
		get canvas() { return canvas.value },
		set canvas(v) { canvas.value = v },
	})
}

function _onMessage(e) {
	// console.log('post message', e)
	const message = e.detail.data[0]
	switch (message.action) {
		// web-view 初始化完毕
		case 'onJSBridgeReady':
			_ready = true
			web.value?.evalJs('setContent(' + JSON.stringify(props) + ')')
			break
		// qrcodeOk
		case 'qrcodeOk':
			_result(message.imageData)
			// emit('load')
			break
	}
}

function _makeCode() {
	if (!_empty(props.val)) {
		// #ifndef APP-NVUE
		loading.value = true
		// #endif
		// nvue下时因为gcanvas的GImage不生效，因此icon模式会采用webview
		if ((props.icon == '' && isNvue) || !isNvue) {
			const vuectx = getVueCtx()
			qrcode = new QRCode({
				vuectx, // 上下文环境
				canvasId: props.cid, // canvas-id
				canvas: canvas.value,
				ctx: ctx.value,
				isNvue,
				usingComponents: props.usingComponents, // 是否是自定义组件
				showLoading: false, // 是否显示loading
				loadingText: props.loadingText, // loading文字
				text: props.val, // 生成内容
				size: sizeLocal.value, // 二维码大小
				background: props.background, // 背景色
				foreground: props.foreground, // 前景色
				pdground: props.pdground, // 定位角点颜色
				quietZone: props.quietZone, // 静区宽度
				correctLevel: props.lv, // 容错级别
				image: props.icon, // 二维码图标
				imageSize: props.iconSize,// 二维码图标大小
				cbResult: function (res) { // 生成二维码的回调
					_result(res)
				},
			});
		}
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

function _saveCode() {
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
		toTempFilePath({
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

async function toTempFilePath({ success, fail }) {
	if (ctx.value && ctx.value.toTempFilePath) {
		ctx.value.toTempFilePath(
			0,
			0,
			sizeLocal.value,
			sizeLocal.value,
			sizeLocal.value,
			sizeLocal.value,
			"",
			1,
			res => {
				success(res)
			}
		);
	}
	else {
		// #ifdef H5
		success({
			tempFilePath: ctx.value.canvas.toDataURL("image/png", 1)
		})
		// #endif

		// #ifndef H5
		uni.canvasToTempFilePath(
			{
				canvasId: props.cid,
				success: res => {
					success(res)
				},
				fail: fail
			},
			proxy)
		// #endif
	}
}

async function longpress() {
	toTempFilePath({
		success: res => {
			emit('longpressCallback', res.tempFilePath)
		},
		fail: err => {
		}
	})
}

/**
 * 使用根节点宽高 设置新的size
 * @return {Promise<void>}
 */
async function setNewSize() {
	const rootNode = await getCanvasNode(rootId.value, false);
	const { width, height } = rootNode;
	// 将最短的设置为二维码 的size
	if (width > height) {
		sizeLocal.value = height
	}
	else {
		sizeLocal.value = width
	}
}

/**
 * 获取节点
 * @param id 节点id
 * @param isCanvas 是否为Canvas节点
 * @return {Promise<unknown>}
 */
async function getCanvasNode(id, isCanvas = true) {
	return new Promise((resolve, reject) => {
		try {
			// #ifdef APP-NVUE
			setTimeout(() => {
				/*获取元素引用*/
				ganvas.value = gcanvess.value
				/*通过元素引用获取canvas对象*/
				let canvasNode = enable(ganvas.value, {
					bridge: WeexBridge
				})
				resolve(canvasNode)
			}, 200)
			// #endif
			// #ifndef APP-NVUE
			const query = uni.createSelectorQuery().in(proxy);
			query.select(`#${id}`)
				.fields({
					node: true,
					size: true
				})
				.exec((res) => {
					if (isCanvas) {
						resolve(res[0].node)
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

function getContext() {
	// #ifdef APP-PLUS
	return uni.createCanvasContext(props.cid, proxy);
	// #endif
	// #ifndef APP-PLUS
	return canvas.value.getContext('2d');
	// #endif
}

function drawImage(url, x, y, w, h) {
	try {
		let img = {}
		// #ifdef APP-NVUE
		img = new GImage();
		// #endif

		// #ifdef H5
		// APP下不支持会一直卡住
		img = new Image();
		// #endif

		// #ifdef MP
		// 小程序2d
		// https://developers.weixin.qq.com/miniprogram/dev/api/canvas/Canvas.createImage.html
		img = canvas.value.createImage();
		// #endif
		// #ifdef APP-NVUE
		console.log(img)
		img.onload = function() {
			if (process.env.NODE_ENV === 'development') {
				console.log('drawImage绘制2...')
			}
			ctx.value.drawImage(img, x, y, w, h);
		}
		// #endif
		// #ifdef H5 || MP
		img.onload = () => {
			ctx.value.drawImage(img, x, y, w, h);
		};
		// #endif
		img.src = url;
		// #ifdef APP-PLUS
		ctx.value.drawImage(url, x, y, w, h);
		// #endif
	} catch (error) {
		console.log('drawImage绘制出错', error)
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
	canvas.value = await getCanvasNode(props.cid)
	// #ifdef APP-NVUE
	isNvue = true
	/*获取绘图所需的上下文，目前不支持3d*/
	ctx.value = canvas.value.getContext('2d')
	// #endif
	// #ifndef APP-NVUE
	ctx.value = getContext()
	// #endif

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
	_clearCode,
	_saveCode,
	toTempFilePath,
	preview,
	longpress
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
