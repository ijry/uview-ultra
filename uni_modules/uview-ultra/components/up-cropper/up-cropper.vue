<template>
	<view class="u-cropper">
		<!-- <image :src="imgSrc.imgSrc" @click="select" :style="[ imgStyle ]" class="my-avatar"></image> -->
		<canvas :canvas-id="'avatar-canvas-' + instanceId" :id="'avatar-canvas-' + instanceId" class="my-canvas" :style="{ top: styleTop, height: cvsStyleHeight }" disable-scroll="false"></canvas>
		<canvas :canvas-id="'oper-canvas-' + instanceId" :id="'oper-canvas-' + instanceId" class="oper-canvas" :style="{ top: styleTop, height: cvsStyleHeight }" disable-scroll="false" @touchstart="start" @touchmove="move" @touchend="end"></canvas>
		<canvas :canvas-id="'prv-canvas-' + instanceId" :id="'prv-canvas-' + instanceId" class="prv-canvas" disable-scroll="false" @touchstart="hideImg" :style="{ height: cvsStyleHeight, top: prvTop }"></canvas>
		<view class="oper-wrapper" :style="{ display: styleDisplay }">
			<view class="oper">
				<view class="btn-wrapper" v-if="showOper">
					<view @click="select" hover-class="hover" :style="{ width: btnWidth }">
						<text>{{ t("up.common.re-select") }}</text>
					</view>
					<view @click="close" hover-class="hover" :style="{ width: btnWidth }">
						<text>{{ t("up.common.close") }}</text>
					</view>
					<view @click="rotate" hover-class="hover" :style="{ width: btnWidth, display: btnDsp }">
						<text>{{ t("up.common.rotate") }}</text>
					</view>
					<view @click="preview" hover-class="hover" :style="{ width: btnWidth }">
						<text>{{ t("up.common.preview") }}</text>
					</view>
					<view @click="confirm" hover-class="hover" :style="{ width: btnWidth }">
						<text>{{ t("up.common.confirm") }}</text>
					</view>
				</view>
				<view class="clr-wrapper" v-else>
					<slider class="my-slider" @change="colorChange" block-size="25" value="0" min="-100" max="100" activeColor="red" backgroundColor="green" block-color="grey" show-value></slider>
					<view @click="prvUpload" hover-class="hover" :style="{ width: btnWidth }">
						<text>{{ t("up.common.confirm") }}</text>
					</view>
				</view>
			</view>
		</view>
		<view @click="chooseImage(0, {})" v-if="styleDisplay == 'none'">
			<slot>

			</slot>
		</view>
	</view>
</template>

<script setup>
import { getCurrentInstance, reactive, toRefs, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { t } from '../../libs/i18n'

const tabHeight = 50

defineOptions({
	name: 'up-cropper',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	minScale: { type: [String, Number], default: '' },
	maxScale: { type: [String, Number], default: '' },
	canScale: { type: Boolean, default: true },
	canRotate: { type: Boolean, default: true },
	lockWidth: { type: [String, Number, Boolean], default: '' },
	lockHeight: { type: [String, Number, Boolean], default: '' },
	stretch: { type: String, default: '' },
	lock: { type: String, default: '' },
	noTab: { type: Boolean, default: true },
	inner: { type: Boolean, default: false },
	quality: { type: [String, Number], default: '' },
	index: { type: [String, Number], default: '' },
	canChangeSize: { type: Boolean, default: false },
	areaWidth: { type: String, default: '300rpx' },
	areaHeight: { type: String, default: '300rpx' },
	exportWidth: { type: String, default: '260rpx' },
	exportHeight: { type: String, default: '260rpx' },
	fillColor: {
		type: String,
		default: 'transparent'
	},
	avatarSrc: {
		type: String,
		default: ''
	},
	imageSrc: {
		type: String,
		default: ''
	},
	avatarStyle: {
		type: [String, Boolean],
		default: ''
	}
})

const emit = defineEmits(['avtinit', 'confirm', 'cancel'])
const instance = getCurrentInstance()
const proxy = instance?.proxy

const state = reactive({
	instanceId: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
	cvsStyleHeight: '0px',
	styleDisplay: 'none',
	styleTop: '-10000px',
	prvTop: '-10000px',
	imgStyle: {},
	selStyle: {},
	showOper: true,
	imgSrc: {
		imgSrc: ''
	},
	btnWidth: '19%',
	btnDsp: 'flex',
	arWidth: '',
	arHeight: '',
	expWidth: '',
	expHeight: '',
	letChangeSize: false,
	safeAreaInsetsBottom: 0,
	// runtime fields (originally assigned on this outside data())
	platform: '',
	pixelRatio: 1,
	windowWidth: 0,
	windowHeight: 0,
	drawTop: 0,
	moreHeight: 0,
	pxRatio: 1,
	ctxCanvas: null,
	ctxCanvasOper: null,
	ctxCanvasPrv: null,
	canvas: null,
	canvasOper: null,
	qlty: 0.9,
	letRotate: 1,
	letScale: 1,
	isin: 0,
	indx: undefined,
	mnScale: 0.3,
	mxScale: 4,
	noBar: 1,
	stc: '',
	lck: '',
	imageSrc: '',
	avatarStyle: '',
	imgPath: '',
	imgWidth: 0,
	imgHeight: 0,
	path: '',
	hasSel: false,
	fSelecting: false,
	fUploading: false,
	fPrvUploading: false,
	fPreviewing: false,
	fRotateing: false,
	fixWidth: 0,
	fixHeight: 0,
	lckWidth: 0,
	lckHeight: 0,
	scaleWidth: 0,
	scaleHeight: 0,
	scaleSize: 1,
	rotateDeg: 0,
	posWidth: 0,
	posHeight: 0,
	useWidth: 0,
	useHeight: 0,
	drawTm: 0,
	prvTm: 0,
	prvImg: '',
	prvImgTmp: '',
	prvImgData: null,
	target: null,
	prvX: 0,
	prvY: 0,
	prvWidth: 0,
	prvHeight: 0,
	touch0: null,
	touch1: null,
	fgDistance: 0,
	resizeHandle: null,
	rtn: undefined
})

// expose reactive fields to template
const {
	instanceId,
	cvsStyleHeight,
	styleDisplay,
	styleTop,
	prvTop,
	imgStyle,
	selStyle,
	showOper,
	imgSrc,
	btnWidth,
	btnDsp
} = toRefs(state)

function windowResize() {
				let sysInfo = uni.getSystemInfoSync();
				state.platform = sysInfo.platform;
				state.pixelRatio = sysInfo.pixelRatio;
				state.windowWidth = sysInfo.windowWidth;
				state.safeAreaInsetsBottom = sysInfo.safeAreaInsets.bottom;
				// #ifdef H5
				state.drawTop = sysInfo.windowTop;
				state.windowHeight = sysInfo.windowHeight + sysInfo.windowBottom;
				state.cvsStyleHeight = state.windowHeight - tabHeight + 'px';
				// #endif
				// #ifdef APP-PLUS
				if (state.platform === 'android') {
					state.windowHeight = sysInfo.screenHeight + sysInfo.statusBarHeight;
					state.cvsStyleHeight = state.windowHeight - tabHeight + 'px';
				} else {
					state.windowHeight = sysInfo.windowHeight + state.moreHeight;
					state.cvsStyleHeight = state.windowHeight - tabHeight - state.safeAreaInsetsBottom + 6 + 'px';
				}
				// #endif
				// #ifdef MP
				state.windowHeight = sysInfo.windowHeight + state.moreHeight;
				state.cvsStyleHeight = state.windowHeight - tabHeight - state.safeAreaInsetsBottom - 2 + 'px';
				// #endif
				state.pxRatio = state.windowWidth / 750;

				let style = props.avatarStyle;
				if (style && style !== true && (style = style.trim())) {
					style = style.split(';');
					let obj = {};
					for (let v of style) {
						if (!v) continue;
						v = v.trim().split(':');
						if (v[1].indexOf('rpx') >= 0) {
							let arr = v[1].trim().split(' ');
							for (let k in arr) {
								if (!arr[k]) continue;
								if (arr[k].indexOf('rpx') >= 0) {
									arr[k] = parseFloat(arr[k]) * state.pxRatio + 'px';
								}
							}
							v[1] = arr.join(' ');
						}
						obj[v[0].trim()] = v[1].trim();
					}
					state.imgStyle = obj;
				}

				state.expWidth && (state.expWidth = state.expWidth.indexOf('rpx') >= 0 ? parseInt(state.expWidth) * state.pxRatio : parseInt(state.expWidth));
				state.expHeight && (state.expHeight = state.expHeight.indexOf('rpx') >= 0 ? parseInt(state.expHeight) * state.pxRatio : parseInt(state.expHeight));

				if (state.styleDisplay === 'flex') {
					drawInit(true);
				}
				hideImg();
			}
			function select() {
				if (state.fSelecting) return;
				state.fSelecting = true;
				setTimeout(() => { state.fSelecting = false; }, 500);
				uni.chooseImage({
					count: 1,
					sizeType: ['original', 'compressed'],
					sourceType: ['album', 'camera'],
					success: (r) => {
						uni.showLoading({ mask: true });
						let path = state.imgPath = r.tempFilePaths[0];
						uni.getImageInfo({
							src: path,
							success: r => {
								state.imgWidth = r.width;
								state.imgHeight = r.height;
								state.path = path;
								if (!state.hasSel) {
									let style = state.selStyle || {};
									if (state.arWidth && state.arHeight) {
										let areaWidth = state.arWidth.indexOf('rpx') >= 0 ? parseInt(state.arWidth) * state.pxRatio : parseInt(state.arWidth),
											areaHeight = state.arHeight.indexOf('rpx') >= 0 ? parseInt(state.arHeight) * state.pxRatio : parseInt(state.arHeight);
										style.width = areaWidth + 'px';
										style.height = areaHeight + 'px';
										style.top = (state.windowHeight - areaHeight - tabHeight) / 2 + 'px';
										style.left = (state.windowWidth - areaWidth) / 2 + 'px';
									} else {
										uni.showModal({
											title: t("up.cropper.emptyWidhtOrHeight"),
											showCancel: false
										})
										return;
									}
									state.selStyle = style;
								}

								if (state.noBar) {
									drawInit(true);
								} else {
									uni.hideTabBar({
										complete: () => {
											drawInit(true);
										}
									});
								}
							},
							fail: () => {
								uni.showToast({
									title: "error3",
									duration: 2000,
								})
							},
							complete() {
								uni.hideLoading();
							}
						});
					}, fail(err) {
						emit('cancel')
					}
				})
			}
			function confirm() {
				if (state.fUploading) return;
				state.fUploading = true;
				setTimeout(() => { state.fUploading = false; }, 1000)

				let style = state.selStyle,
					x = parseInt(style.left),
					y = parseInt(style.top),
					width = parseInt(style.width),
					height = parseInt(style.height),
					expWidth = state.expWidth || width,
					expHeight = state.expHeight || height;

				// #ifdef H5
				// x *= state.pixelRatio;
				// y *= state.pixelRatio;
				expWidth = width;
				expHeight = height;
				// #endif

				uni.showLoading({ mask: true });
				state.styleDisplay = 'none';
				state.styleTop = '-10000px';
				state.hasSel = false;
				hideImg();
				uni.canvasToTempFilePath({
					x: x,
					y: y,
					width: width,
					height: height,
					destWidth: expWidth,
					destHeight: expHeight,
					canvasId: 'avatar-canvas-' + state.instanceId,
					fileType: 'png',
					quality: state.qlty,
					success: (r) => {
						r = r.tempFilePath;
						// #ifdef H5
						btop(r).then((r) => {
							if (state.expWidth && state.expHeight) {
								let ctxCanvas = state.ctxCanvas;
								expWidth = state.expWidth,
									expHeight = state.expHeight;

								ctxCanvas.drawImage(r, 0, 0, expWidth, expHeight);
								ctxCanvas.draw(false, () => {
									uni.canvasToTempFilePath({
										x: 0,
										y: 0,
										width: expWidth,
										height: expHeight,
										destWidth: expWidth,
										destHeight: expHeight,
										canvasId: 'avatar-canvas-' + state.instanceId,
										fileType: 'png',
										quality: state.qlty,
										success: (r) => {
											r = r.tempFilePath;
											btop(r).then((r) => {
												emit("confirm", { avatar: state.imgSrc, path: r, index: state.indx, data: state.rtn });
											});
										},
										fail: () => {
											uni.showToast({
												title: "error0",
												duration: 2000,
											})
										}
									});
								});
							} else {
								emit("confirm", { avatar: state.imgSrc, path: r, index: state.indx, data: state.rtn });
							}
						})
						// #endif
						// #ifndef H5
						emit("confirm", { avatar: state.imgSrc, path: r, index: state.indx, data: state.rtn });
						// #endif
					},
					fail: (res) => {
						uni.showToast({
							title: "error1",
							duration: 2000,
						})
					},
					complete: () => {
						uni.hideLoading();
						state.noBar || uni.showTabBar();
					}
				}, proxy);
			}
			// 用户点击"预览"模式下的"确认"按钮时被调用，用于将预览的裁剪结果上传
			function prvUpload() {
				if (state.fPrvUploading) return;
				state.fPrvUploading = true;
				setTimeout(() => { state.fPrvUploading = false; }, 1000)

				let style = state.selStyle,
					destWidth = parseInt(style.width),
					destHeight = parseInt(style.height),
					prvX = state.prvX,
					prvY = state.prvY,
					prvWidth = state.prvWidth,
					prvHeight = state.prvHeight,
					expWidth = state.expWidth || prvWidth,
					expHeight = state.expHeight || prvHeight;

				// #ifdef H5
				// prvX *= state.pixelRatio;
				// prvY *= state.pixelRatio;
				expWidth = prvWidth;
				expHeight = prvHeight;
				// #endif

				uni.showLoading({ mask: true });

				state.styleDisplay = 'none';
				state.styleTop = '-10000px';
				state.hasSel = false;
				hideImg();
				uni.canvasToTempFilePath({
					x: prvX,
					y: prvY,
					width: prvWidth,
					height: prvHeight,
					destWidth: expWidth,
					destHeight: expHeight,
					canvasId: 'prv-canvas-' + state.instanceId,
					fileType: 'png',
					quality: state.qlty,
					success: (r) => {
						r = r.tempFilePath;
						// #ifdef H5
						btop(r).then((r) => {
							if (state.expWidth && state.expHeight) {
								let ctxCanvas = state.ctxCanvas;
								expWidth = state.expWidth,
									expHeight = state.expHeight;

								ctxCanvas.drawImage(r, 0, 0, expWidth, expHeight);
								ctxCanvas.draw(false, () => {
									uni.canvasToTempFilePath({
										x: 0,
										y: 0,
										width: expWidth,
										height: expHeight,
										destWidth: expWidth,
										destHeight: expHeight,
										canvasId: 'avatar-canvas-' + state.instanceId,
										fileType: 'png',
										quality: state.qlty,
										success: (r) => {
											r = r.tempFilePath;
											btop(r).then((r) => {
												emit("confirm", { avatar: state.imgSrc, path: r, index: state.indx, data: state.rtn });
											});
										},
										fail: () => {
											uni.showToast({
												title: "error0",
												duration: 2000,
											})
										}
									});
								});
							} else {
								emit("confirm", { avatar: state.imgSrc, path: r, index: state.indx, data: state.rtn });
							}
						})
						// #endif
						// #ifndef H5
						emit("confirm", { avatar: state.imgSrc, path: r, index: state.indx, data: state.rtn });
						// #endif
					},
					fail: () => {
						uni.showToast({
							title: "error_prv",
							duration: 2000,
						})
					},
					complete: () => {
						uni.hideLoading();
						state.noBar || uni.showTabBar();
					}
				}, proxy);
			}
			function drawInit(ini = false) {
				let allWidth = state.windowWidth,
					allHeight = state.windowHeight,
					imgWidth = state.imgWidth,
					imgHeight = state.imgHeight,
					imgRadio = imgWidth / imgHeight,
					useWidth = allWidth - 40,
					useHeight = allHeight - tabHeight - 80,
					pixelRatio = state.pixelRatio,
					selWidth = parseInt(state.selStyle.width),
					selHeight = parseInt(state.selStyle.height);

				state.fixWidth = 0;
				state.fixHeight = 0;
				state.lckWidth = 0;
				state.lckHeight = 0;
				switch (state.stc) {
					case 'x': state.fixWidth = 1; break;
					case 'y': state.fixHeight = 1; break;
					case 'long': if (imgRadio > 1) state.fixWidth = 1; else state.fixHeight = 1; break;
					case 'short': if (imgRadio > 1) state.fixHeight = 1; else state.fixWidth = 1; break;
					case 'longSel': if (selWidth > selHeight) state.fixWidth = 1; else state.fixHeight = 1; break;
					case 'shortSel': if (selWidth > selHeight) state.fixHeight = 1; else state.fixWidth = 1; break;
				}
				// lck 用于控制裁剪框的宽度和高度锁定行为
				// 'x': 锁定宽度，不允许水平方向调整
				// 'y': 锁定高度，不允许垂直方向调整
				// 'long': 根据图片长边锁定，如果图片横向较长则锁定宽度，否则锁定高度
				// 'short': 根据图片短边锁定，如果图片横向较长则锁定高度，否则锁定宽度
				// 'longSel': 根据选择框的长边锁定，如果选择框宽度大于高度则锁定宽度，否则锁定高度
				// 'shortSel': 根据选择框的短边锁定，如果选择框宽度大于高度则锁定高度，否则锁定宽度
				switch (state.lck) {
					case 'x': state.lckWidth = 1; break;
					case 'y': state.lckHeight = 1; break;
					case 'long': if (imgRadio > 1) state.lckWidth = 1; else state.lckHeight = 1; break;
					case 'short': if (imgRadio > 1) state.lckHeight = 1; else state.lckWidth = 1; break;
					case 'longSel': if (selWidth > selHeight) state.lckWidth = 1; else state.lckHeight = 1; break;
					case 'shortSel': if (selWidth > selHeight) state.lckHeight = 1; else state.lckWidth = 1; break;
				}
				if (state.fixWidth) {
					useWidth = selWidth;
					useHeight = useWidth / imgRadio;
				} else if (state.fixHeight) {
					useHeight = selHeight;
					useWidth = useHeight * imgRadio;
				} else if (imgRadio < 1) {
					if (imgHeight < useHeight) {
						useWidth = imgWidth;
						useHeight = imgHeight;
					} else {
						useHeight = useHeight;
						useWidth = useHeight * imgRadio;
					}
				} else {
					if (imgWidth < useWidth) {
						useWidth = imgWidth;
						useHeight = imgHeight;
					} else {
						useWidth = useWidth;
						useHeight = useWidth / imgRadio;
					}
				}
				if (state.isin) {
					state.scaleWidth = 0;
					state.scaleHeight = 0;
					if (useWidth < selWidth) {
						useWidth = selWidth;
						useHeight = useWidth / imgRadio;
						state.lckHeight = 0;
					}
					if (useHeight < selHeight) {
						useHeight = selHeight;
						useWidth = useHeight * imgRadio;
						state.lckWidth = 0;
					}
				}

				state.scaleSize = 1;
				state.rotateDeg = 0;
				state.posWidth = (allWidth - useWidth) / 2;
				state.posHeight = (allHeight - useHeight - tabHeight) / 2;
				state.useWidth = useWidth;
				state.useHeight = useHeight;

				let style = state.selStyle,
					left = parseInt(style.left),
					top = parseInt(style.top),
					width = parseInt(style.width),
					height = parseInt(style.height),
					canvas = state.canvas,
					canvasOper = state.canvasOper,
					ctxCanvas = state.ctxCanvas,
					ctxCanvasOper = state.ctxCanvasOper;

				ctxCanvasOper.setLineWidth(3);
				ctxCanvasOper.setStrokeStyle('grey');
				ctxCanvasOper.setGlobalAlpha(0.4);
				ctxCanvasOper.setFillStyle('black');
				ctxCanvasOper.strokeRect(left, top, width, height);
				ctxCanvasOper.fillRect(0, 0, state.windowWidth, top);
				ctxCanvasOper.fillRect(0, top, left, height);
				ctxCanvasOper.fillRect(0, top + height, state.windowWidth, state.windowHeight - height - top - tabHeight);
				ctxCanvasOper.fillRect(left + width, top, state.windowWidth - width - left, height);
				ctxCanvasOper.setStrokeStyle('red');
				ctxCanvasOper.moveTo(left + 20, top); ctxCanvasOper.lineTo(left, top); ctxCanvasOper.lineTo(left, top + 20);
				ctxCanvasOper.moveTo(left + width - 20, top); ctxCanvasOper.lineTo(left + width, top); ctxCanvasOper.lineTo(left + width, top + 20);
				ctxCanvasOper.moveTo(left + 20, top + height); ctxCanvasOper.lineTo(left, top + height); ctxCanvasOper.lineTo(left, top + height - 20);
				ctxCanvasOper.moveTo(left + width - 20, top + height); ctxCanvasOper.lineTo(left + width, top + height); ctxCanvasOper.lineTo(left + width, top + height - 20);

				// 绘制控制点（四个角）
				const controlPointSize = 10;
				ctxCanvasOper.setFillStyle('white');
				ctxCanvasOper.setStrokeStyle('grey');
				ctxCanvasOper.setLineWidth(1);
				// 左上角
				ctxCanvasOper.fillRect(left - controlPointSize / 2, top - controlPointSize / 2, controlPointSize, controlPointSize);
				ctxCanvasOper.strokeRect(left - controlPointSize / 2, top - controlPointSize / 2, controlPointSize, controlPointSize);
				// 右上角
				ctxCanvasOper.fillRect(left + width - controlPointSize / 2, top - controlPointSize / 2, controlPointSize, controlPointSize);
				ctxCanvasOper.strokeRect(left + width - controlPointSize / 2, top - controlPointSize / 2, controlPointSize, controlPointSize);
				// 左下角
				ctxCanvasOper.fillRect(left - controlPointSize / 2, top + height - controlPointSize / 2, controlPointSize, controlPointSize);
				ctxCanvasOper.strokeRect(left - controlPointSize / 2, top + height - controlPointSize / 2, controlPointSize, controlPointSize);
				// 右下角
				ctxCanvasOper.fillRect(left + width - controlPointSize / 2, top + height - controlPointSize / 2, controlPointSize, controlPointSize);
				ctxCanvasOper.strokeRect(left + width - controlPointSize / 2, top + height - controlPointSize / 2, controlPointSize, controlPointSize);

				ctxCanvasOper.stroke();

				ctxCanvasOper.draw(false, () => {
					if (ini) {
						state.styleDisplay = 'flex';
						// #ifdef H5
						state.styleTop = state.drawTop + 'px';
						// #endif
						// #ifndef H5
						state.styleTop = '0';
						// #endif
						if (props.fillColor && props.fillColor !== 'transparent') {
							ctxCanvas.setFillStyle(props.fillColor);
						}
						drawImage();
					}
				});

				emit("avtinit");
			}
			function drawImage() {
				let tm_now = Date.now();
				if (tm_now - state.drawTm < 20) return;
				state.drawTm = tm_now;
				let ctxCanvas = state.ctxCanvas;
				if (props.fillColor && props.fillColor !== 'transparent') {
					ctxCanvas.fillRect(0, 0, state.windowWidth, state.windowHeight - tabHeight);
				}
				ctxCanvas.translate(state.posWidth + state.useWidth / 2, state.posHeight + state.useHeight / 2);
				ctxCanvas.scale(state.scaleSize, state.scaleSize);
				ctxCanvas.rotate(state.rotateDeg * Math.PI / 180);
				ctxCanvas.drawImage(state.imgPath, -state.useWidth / 2, -state.useHeight / 2, state.useWidth, state.useHeight);
				ctxCanvas.draw(false);
			}
			function hideImg() {
				state.prvImg = '';
				state.prvTop = '-10000px';
				state.showOper = true;
				state.prvImgData = null;
				state.target = null;
			}
			function close() {
				console.log('up-cropper close');

				state.styleDisplay = 'none';
				state.styleTop = '-10000px';
				state.hasSel = false;
				hideImg();
				state.noBar || uni.showTabBar();
				emit('cancel');
			}
			function preview() {
				if (state.fPreviewing) return;
				state.fPreviewing = true;
				setTimeout(() => { state.fPreviewing = false; }, 1000);
				let style = state.selStyle,
					x = parseInt(style.left),
					y = parseInt(style.top),
					width = parseInt(style.width),
					height = parseInt(style.height);

				uni.showLoading({ mask: true });
				// console.log('size', x, y, width, height)
				uni.canvasToTempFilePath({
					x: x,
					y: y,
					width: width,
					height: height,
					canvasId: 'avatar-canvas-' + state.instanceId,
					fileType: 'png',
					quality: state.qlty,
					success: (r) => {
						// console.log(r)
						state.prvImgTmp = r = r.tempFilePath;

						let ctxCanvasPrv = state.ctxCanvasPrv,
							prvX = state.windowWidth,
							prvY = parseInt(state.cvsStyleHeight),
							prvWidth = parseInt(state.selStyle.width),
							prvHeight = parseInt(state.selStyle.height),
							useWidth = prvX - 40,
							useHeight = prvY - 80,
							radio = useWidth / prvWidth,
							rHeight = prvHeight * radio;
						if (rHeight < useHeight) {
							prvWidth = useWidth;
							prvHeight = rHeight;
						} else {
							radio = useHeight / prvHeight;
							prvWidth *= radio;
							prvHeight = useHeight;
						}
						if (props.fillColor && props.fillColor !== 'transparent') {
							ctxCanvasPrv.setFillStyle(props.fillColor);
							ctxCanvasPrv.fillRect(0, 0, prvX, prvY);
							ctxCanvasPrv.fillRect(x, y, width, height);
						}
						state.prvX = prvX = (prvX - prvWidth) / 2;
						state.prvY = prvY = (prvY - prvHeight) / 2;
						state.prvWidth = prvWidth;
						state.prvHeight = prvHeight;
						ctxCanvasPrv.drawImage(r, prvX, prvY, prvWidth, prvHeight);
						ctxCanvasPrv.draw(false, () => {
							// #ifdef H5
							btop(state.prvImgTmp).then((r) => {
								state.showOper = false;
								state.prvTop = state.drawTop + 'px';
							})
							// #endif
							// #ifndef H5
							if (state.platform != 'android') {
								state.showOper = false;
							}
							state.prvTop = '0';
							// #endif
						});
					},
					fail: () => {
						uni.showToast({
							title: "error2",
							duration: 2000,
						})
					},
					complete: () => {
						uni.hideLoading();
					}
				}, proxy);
			}
			function chooseImage(index = undefined, params = undefined, data = undefined) {
				if (params) {
					console.log(params)
					let areaWidth = params.areaWidth || props.areaWidth,
						areaHeight = params.areaHeight || props.areaHeight,
						expWidth = params.exportWidth || props.exportWidth,
						expHeight = params.exportHeight || props.exportHeight,
						quality = params.quality,
						canRotate = params.canRotate,
						canScale = params.canScale,
						canChangeSize = params.canChangeSize,
						minScale = params.minScale,
						maxScale = params.maxScale,
						stretch = params.stretch,
						inner = params.inner,
						lock = params.lock;
					console.log('areaWidth', props.areaWidth)

					expWidth && (state.expWidth = expWidth.indexOf('rpx') >= 0 ? parseInt(expWidth) * state.pxRatio : parseInt(expWidth));
					expHeight && (state.expHeight = expHeight.indexOf('rpx') >= 0 ? parseInt(expHeight) * state.pxRatio : parseInt(expHeight));
					state.letRotate = canRotate === false ? 0 : 1;
					state.letScale = canScale === false ? 0 : 1;
					// 设置是否允许调整裁剪框大小
					state.letChangeSize = canChangeSize || false;
					state.qlty = parseInt(quality) || 0.9;
					state.mnScale = minScale || 0.3;
					state.mxScale = maxScale || 4;
					state.stc = stretch;
					state.isin = inner === true ? 1 : 0;
					state.lck = lock;
					if (state.isin) {
						state.btnWidth = '24%';
						state.btnDsp = 'none';
					} else {
						state.btnWidth = '19%';
						state.btnDsp = 'flex';
					}

					if (areaWidth && areaHeight) {
						areaWidth = areaWidth.indexOf('rpx') >= 0 ? parseInt(areaWidth) * state.pxRatio : parseInt(areaWidth);
						areaHeight = areaHeight.indexOf('rpx') >= 0 ? parseInt(areaHeight) * state.pxRatio : parseInt(areaHeight);
						state.selStyle.width = areaWidth + 'px';
						state.selStyle.height = areaHeight + 'px';
						state.selStyle.top = (state.windowHeight - areaHeight - tabHeight) / 2 + 'px';
						state.selStyle.left = (state.windowWidth - areaWidth) / 2 + 'px';
						// console.log(state.selStyle);
						state.hasSel = true;
					}
				}
				state.rtn = data;
				state.indx = index;
				select();
			}
			function rotate() {
				// #ifdef APP-PLUS
				if (state.platform === 'android') {
					if (state.fRotateing) return;
					state.fRotateing = true;
					setTimeout(() => { state.fRotateing = false; }, 500);
				}
				// #endif

				// if(state.letRotate) {
				state.rotateDeg += 90 - state.rotateDeg % 90;
				drawImage();
				// }
			}
			function start(e) {
				let touches = e.touches,
					touch0 = touches[0],
					touch1 = touches[1];

				state.touch0 = touch0;
				state.touch1 = touch1;

				if (touch1) {
					let x = touch1.x - touch0.x,
						y = touch1.y - touch0.y;
					state.fgDistance = Math.sqrt(x * x + y * y);
				} else {
					// 只有在允许调整大小时才检查控制点
					if (state.letChangeSize) {
						// 检查是否点击在控制点上
						const controlPointSize = 20;
						const x = touch0.x;
						const y = touch0.y;
						const style = state.selStyle;
						const left = parseInt(style.left);
						const top = parseInt(style.top);
						const width = parseInt(style.width);
						const height = parseInt(style.height);

						// 检查四个控制点
						if (Math.abs(x - left) < controlPointSize && Math.abs(y - top) < controlPointSize) {
							state.resizeHandle = 'top-left';
						} else if (Math.abs(x - (left + width)) < controlPointSize && Math.abs(y - top) < controlPointSize) {
							state.resizeHandle = 'top-right';
						} else if (Math.abs(x - left) < controlPointSize && Math.abs(y - (top + height)) < controlPointSize) {
							state.resizeHandle = 'bottom-left';
						} else if (Math.abs(x - (left + width)) < controlPointSize && Math.abs(y - (top + height)) < controlPointSize) {
							state.resizeHandle = 'bottom-right';
						} else {
							state.resizeHandle = null;
						}
					} else {
						state.resizeHandle = null;
					}
				}
			}
			function move(e) {
				let touches = e.touches,
					touch0 = touches[0],
					touch1 = touches[1];

				if (touch1) {
					let x = touch1.x - touch0.x,
						y = touch1.y - touch0.y,
						fgDistance = Math.sqrt(x * x + y * y),
						scaleSize = 0.005 * (fgDistance - state.fgDistance),
						beScaleSize = state.scaleSize + scaleSize;

					do {
						if (!state.letScale) break;
						if (beScaleSize < state.mnScale) break;
						if (beScaleSize > state.mxScale) break;
						if (state.isin) {
							let imgWidth = state.useWidth * beScaleSize,
								imgHeight = state.useHeight * beScaleSize,
								rx0 = state.posWidth + state.useWidth / 2,
								ry0 = state.posHeight + state.useHeight / 2,
								l = rx0 - imgWidth / 2, t = ry0 - imgHeight / 2,
								r = l + imgWidth, b = t + imgHeight,
								left = parseInt(state.selStyle.left),
								top = parseInt(state.selStyle.top),
								width = parseInt(state.selStyle.width),
								height = parseInt(state.selStyle.height);
							if (left < l || left + width > r || top < t || top + height > b) break;
							state.scaleWidth = (state.useWidth - imgWidth) / 2;
							state.scaleHeight = (state.useHeight - imgHeight) / 2;
						}

						state.scaleSize = beScaleSize;
					} while (0);
					state.fgDistance = fgDistance;

					if (touch1.x !== touch0.x && state.letRotate) {
						x = (state.touch1.y - state.touch0.y) / (state.touch1.x - state.touch0.x);
						y = (touch1.y - touch0.y) / (touch1.x - touch0.x);
						state.rotateDeg += Math.atan((y - x) / (1 + x * y)) * 180 / Math.PI;
						state.touch0 = touch0;
						state.touch1 = touch1;
					}

					drawImage();
				} else if (state.touch0) {
					// 只有在允许调整大小时才处理裁剪框大小调整
					if (state.resizeHandle && state.letChangeSize) {
						const style = { ...state.selStyle };
						const left = parseInt(style.left);
						const top = parseInt(style.top);
						const width = parseInt(style.width);
						const height = parseInt(style.height);
						const minWidth = 50;
						const minHeight = 50;

						switch (state.resizeHandle) {
							case 'top-left':
								style.left = touch0.x + 'px';
								style.top = touch0.y + 'px';
								style.width = (left + width - touch0.x) + 'px';
								style.height = (top + height - touch0.y) + 'px';
								break;
							case 'top-right':
								style.top = touch0.y + 'px';
								style.width = (touch0.x - left) + 'px';
								style.height = (top + height - touch0.y) + 'px';
								break;
							case 'bottom-left':
								style.left = touch0.x + 'px';
								style.width = (left + width - touch0.x) + 'px';
								style.height = (touch0.y - top) + 'px';
								break;
							case 'bottom-right':
								style.width = (touch0.x - left) + 'px';
								style.height = (touch0.y - top) + 'px';
								break;
						}

						// 确保最小尺寸
						if (parseInt(style.width) >= minWidth && parseInt(style.height) >= minHeight) {
							// 确保裁剪框不超出屏幕边界
							if (parseInt(style.left) >= 0 &&
								parseInt(style.top) >= 0 &&
								(parseInt(style.left) + parseInt(style.width)) <= state.windowWidth &&
								(parseInt(style.top) + parseInt(style.height)) <= (state.windowHeight - tabHeight)) {
								state.selStyle = style;
								// 重新绘制操作层
								drawInit();
							}
						}
					} else {
						// 原有的移动图片逻辑
						let x = touch0.x - state.touch0.x,
							y = touch0.y - state.touch0.y,
							beX = state.posWidth + x,
							beY = state.posHeight + y;
						if (state.isin) {
							let imgWidth = state.useWidth * state.scaleSize,
								imgHeight = state.useHeight * state.scaleSize,
								rx0 = beX + state.useWidth / 2,
								ry0 = beY + state.useHeight / 2,
								l = rx0 - imgWidth / 2, t = ry0 - imgHeight / 2,
								r = l + imgWidth, b = t + imgHeight,
								left = parseInt(state.selStyle.left),
								top = parseInt(state.selStyle.top),
								width = parseInt(state.selStyle.width),
								height = parseInt(state.selStyle.height);
							if (!state.lckWidth && Math.abs(x) < 100) {
								if (left >= l && left + width <= r) {
									state.posWidth = beX;
								} else if (left < l) {
									state.posWidth = left - state.scaleWidth;
								} else if (left + width > r) {
									state.posWidth = left - (imgWidth - width) - state.scaleWidth;
								}
							}
							if (!state.lckHeight && Math.abs(y) < 100) {
								if (top >= t && top + height <= b) {
									state.posHeight = beY;
								} else if (top < t) {
									state.posHeight = top - state.scaleHeight;
								} else if (top + height > b) {
									state.posHeight = top - (imgHeight - height) - state.scaleHeight;
								}
							}
						} else {
							if (Math.abs(x) < 100 && !state.lckWidth) state.posWidth = beX;
							if (Math.abs(y) < 100 && !state.lckHeight) state.posHeight = beY;
						}

						state.touch0 = touch0;
						drawImage();
					}
				}
			}
			function end(e) {
				let touches = e.touches,
					touch0 = touches && touches[0],
					touch1 = touches && touches[1];
				if (touch0) {
					state.touch0 = touch0;
				} else {
					state.touch0 = null;
					state.touch1 = null;
					state.resizeHandle = null; // 重置调整手柄
				}
			}
			function getImgData() {
				return new Promise((resolve, reject) => {
					let prvX = state.prvX,
						prvY = state.prvY,
						prvWidth = state.prvWidth,
						prvHeight = state.prvHeight;
					// #ifdef APP-PLUS||H5
					prvX *= state.pixelRatio;
					prvY *= state.pixelRatio;
					prvWidth *= state.pixelRatio;
					prvHeight *= state.pixelRatio;
					// #endif
					uni.canvasGetImageData({
						canvasId: 'prv-canvas-' + state.instanceId,
						x: prvX,
						y: prvY,
						width: prvWidth,
						height: prvHeight,
						success(res) {
							resolve(res.data);
						},
						fail(err) {
							reject(err);
						}
					}, proxy);
				});
			}
			async function colorChange(e) {
				let tm_now = Date.now();
				if (tm_now - state.prvTm < 100) return;
				state.prvTm = tm_now;

				uni.showLoading({ mask: true });

				if (!state.prvImgData) {
					if (!(state.prvImgData = await getImgData().catch((res) => {
						uni.showToast({
							title: "error_read",
							duration: 2000,
						})
					}))) return;
					state.target = new Uint8ClampedArray(state.prvImgData.length);
				}

				let data = state.prvImgData,
					target = state.target,
					i = e.detail.value,
					r, g, b, a, h, s, l, d, p, q, t, min, max, hK, tR, tG, tB;

				if (i === 0) {
					target = data;
				} else {
					i = (i + 100) / 200;
					if (i < 0.005) i = 0;
					if (i > 0.995) i = 1;
					for (let n = data.length - 1; n >= 0; n -= 4) {
						r = data[n - 3] / 255;
						g = data[n - 2] / 255;
						b = data[n - 1] / 255;
						max = Math.max(r, g, b);
						min = Math.min(r, g, b);
						d = max - min;
						if (max === min) {
							h = 0;
						} else if (max === r && g >= b) {
							h = 60 * ((g - b) / d);
						} else if (max === r && g < b) {
							h = 60 * ((g - b) / d) + 360;
						} else if (max === g) {
							h = 60 * ((b - r) / d) + 120;
						} else if (max === b) {
							h = 60 * ((r - g) / d) + 240;
						}
						l = (max + min) / 2;
						if (l === 0 || max === min) {
							s = 0;
						} else if (0 < l && l <= 0.5) {
							s = d / (2 * l);
						} else if (l > 0.5) {
							s = d / (2 - 2 * l);
						}
						data[n] && (a = data[n]);

						if (i < 0.5) {
							s = s * i / 0.5;
						} else if (i > 0.5) {
							s = 2 * s + 2 * i - (s * i / 0.5) - 1;
						}

						if (s === 0) {
							r = g = b = Math.round(l * 255);
						} else {
							if (l < 0.5) {
								q = l * (1 + s);
							} else if (l >= 0.5) {
								q = l + s - (l * s);
							}
							p = 2 * l - q;
							hK = h / 360;
							tR = hK + 1 / 3;
							tG = hK;
							tB = hK - 1 / 3;
							let correctRGB = (t) => {
								if (t < 0) {
									return t + 1.0;
								}
								if (t > 1) {
									return t - 1.0;
								}
								return t;
							};
							let createRGB = (t) => {
								if (t < (1 / 6)) {
									return p + ((q - p) * 6 * t);
								} else if (t >= (1 / 6) && t < (1 / 2)) {
									return q;
								} else if (t >= (1 / 2) && t < (2 / 3)) {
									return p + ((q - p) * 6 * ((2 / 3) - t));
								}
								return p;
							};
							r = tR = Math.round(createRGB(correctRGB(tR)) * 255);
							g = tG = Math.round(createRGB(correctRGB(tG)) * 255);
							b = tB = Math.round(createRGB(correctRGB(tB)) * 255);
						}
						a && (target[n] = a);
						target[n - 3] = r;
						target[n - 2] = g;
						target[n - 1] = b;
					}
				}
				let prvX = state.prvX,
					prvY = state.prvY,
					prvWidth = state.prvWidth,
					prvHeight = state.prvHeight;

				if (props.fillColor && props.fillColor !== 'transparent') {
					state.ctxCanvasPrv.setFillStyle(props.fillColor);
					state.ctxCanvasPrv.fillRect(prvX, prvY, prvWidth, prvHeight);
				}
				state.ctxCanvasPrv.draw(true);

				// #ifdef APP-PLUS||H5
				prvX *= state.pixelRatio;
				prvY *= state.pixelRatio;
				prvWidth *= state.pixelRatio;
				prvHeight *= state.pixelRatio;
				// #endif
				uni.canvasPutImageData({
					canvasId: 'prv-canvas-' + state.instanceId,
					x: prvX,
					y: prvY,
					width: prvWidth,
					height: prvHeight,
					data: target,
					fail() {
						uni.showToast({
							title: 'error_put',
							duration: 2000
						})
					},
					complete() {
						uni.hideLoading();
					}
				}, proxy);
			}
			function btop(base64) {
				return new Promise(function (resolve, reject) {
					var arr = base64.split(','),
						mime = arr[0].match(/:(.*?);/)[1],
						bstr = atob(arr[1]),
						n = bstr.length,
						u8arr = new Uint8Array(n);
					while (n--) {
						u8arr[n] = bstr.charCodeAt(n);
					}
					return resolve((window.URL || window.webkitURL).createObjectURL(new Blob([u8arr], { type: mime })));
				});
			}
		


// setup init (was created)
state.imageSrc = props.imageSrc || props.avatarSrc || ''
state.avatarStyle = props.avatarStyle || ''
state.ctxCanvas = uni.createCanvasContext('avatar-canvas-' + state.instanceId, proxy)
state.ctxCanvasOper = uni.createCanvasContext('oper-canvas-' + state.instanceId, proxy)
state.ctxCanvasPrv = uni.createCanvasContext('prv-canvas-' + state.instanceId, proxy)
state.qlty = parseInt(props.quality) || 0.9
state.imgSrc.imgSrc = state.imageSrc
state.letRotate = (props.canRotate === false || props.inner === true) ? 0 : 1
state.letScale = props.canScale === false ? 0 : 1
state.letChangeSize = props.canChangeSize
state.isin = props.inner === true ? 1 : 0
state.indx = props.index || undefined
state.mnScale = props.minScale || 0.3
state.mxScale = props.maxScale || 4
state.noBar = props.noTab === true ? 1 : 0
state.stc = props.stretch
state.lck = props.lock
if (state.isin) {
	state.btnWidth = '24%'
	state.btnDsp = 'none'
} else {
	state.btnWidth = '19%'
	state.btnDsp = 'flex'
}
if (state.noBar) {
	state.moreHeight = 0
	windowResize()
} else {
	uni.showTabBar({
		complete: (res) => {
			state.moreHeight = (res.errMsg === 'showTabBar:ok') ? 50 : 0
			windowResize()
		}
	})
}

watch(() => props.avatarSrc, (val) => {
	state.imgSrc.imgSrc = val
})
watch(() => props.imageSrc, (val) => {
	if (val) {
		state.imageSrc = val
		state.imgSrc.imgSrc = val
	}
})

defineExpose({
	chooseImage,
	select,
	confirm,
	preview,
	close,
	rotate
})
</script>

<style lang="scss" scoped>
	.u-cropper {
		.my-canvas {
			display: flex;
			position: fixed !important;
			background: #000000;
			left: 0;
			z-index: 100000;
			width: 100%;
		}

		.my-avatar {
			width: 150rpx;
			height: 150rpx;
			border-radius: 100%;
		}

		.oper-canvas {
			display: flex;
			position: fixed !important;
			left: 0;
			z-index: 100001;
			width: 100%;
		}

		.prv-canvas {
			display: flex;
			position: fixed !important;
			background: #000000;
			left: 0;
			z-index: 200000;
			width: 100%;
		}

		.oper-wrapper {
			height: 50px;
			position: fixed !important;
			box-sizing: border-box;
			border: 1px solid #F1F1F1;
			background: #ffffff;
			width: 100%;
			left: 0;
			bottom: 0;
			z-index: 100009;
			flex-direction: row;
		}

		.oper {
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding: 10rpx 20rpx;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			align-self: center;
		}

		.btn-wrapper {
			display: flex;
			flex-direction: row;
			/* #ifndef H5 */
			flex-grow: 1;
			/* #endif */
			/* #ifdef H5 */
			height: 50px;
			/* #endif */
			justify-content: space-between;
		}

		.btn-wrapper view {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			color: #333;
			border: 1px solid #f1f1f1;
			border-radius: 6%;
		}

		.hover {
			background: #f1f1f1;
			border-radius: 6%;
		}

		.clr-wrapper {
			display: flex;
			flex-direction: row;
			flex-grow: 1;
		}

		.clr-wrapper view {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			color: #333;
			border: 1px solid #f1f1f1;
			border-radius: 6%;
		}

		.my-slider {
			flex-grow: 1;
		}
	}
</style>

