<template>
	<view class="up-upload" :style="[addStyle(customStyle)]">
		<view class="up-upload__wrap" >
			<template v-if="previewImage">
				<view
				    class="up-upload__wrap__preview"
				    v-for="(item, index) in lists"
				    :key="index"
				>
					<image
					    v-if="item.isImage || (item.type && item.type === 'image')"
					    :src="item.thumb || item.url"
					    :mode="imageMode"
					    class="up-upload__wrap__preview__image"
					    @tap="onClickPreview(item, index)"
						:style="[{
							width: addUnit(width),
							height: addUnit(height)
						}]"
					/>
					<view class="up-upload__wrap__preview__video"
						:style="{
							width: addUnit(width),
							height: addUnit(height)
						}"
						v-else-if="(item.isVideo || (item.type && item.type === 'video')) && getVideoThumb">
						<image
							v-if="item.thumb"
						    :src="item.thumb"
						    :mode="imageMode"
						    class="up-upload__wrap__preview__image"
						    @tap="onClickPreview(item, index)"
							:style="[{
								width: addUnit(width),
								height: addUnit(height)
							}]"
						/>
						<up-icon
							v-else
						    color="#80CBF9"
						    size="26"
						    :name="item.isVideo || (item.type && item.type === 'video') ? 'movie' : 'file-text'"
						></up-icon>
						<view v-if="item.status === 'success'"
							class="up-upload__wrap__play"
							@tap="onClickPreview(item, index)">
							<slot name="playIcon"></slot>
							<up-icon v-if="!$slots['playIcon']"
								class="up-upload__wrap__play__icon"
								name="play-right" size="22px"></up-icon>
						</view>
					</view>
					<view
					    v-else
					    class="up-upload__wrap__preview__other"
						@tap="onClickPreview(item, index)"
						:style="[{
							width: addUnit(width),
							height: addUnit(height)
						}]"
					>
						<up-icon
						    color="#80CBF9"
						    size="26"
						    :name="item.isVideo || (item.type && item.type === 'video') ? 'movie' : 'folder'"
						></up-icon>
						<text class="up-upload__wrap__preview__other__text">
							{{item.isVideo || (item.type && item.type === 'video') ? item.name || t("up.common.video") : item.name || t("up.common.file")}}
						</text>
					</view>
					<view
					    class="up-upload__status"
					    v-if="item.status === 'uploading' || item.status === 'failed'"
					>
						<view class="up-upload__status__icon">
							<up-icon
							    v-if="item.status === 'failed'"
							    name="close-circle"
							    color="#ffffff"
							    size="25"
							/>
							<up-loading-icon
							    size="22"
							    mode="circle"
							    v-else
							/>
						</view>
						<text
						    v-if="item.message"
						    class="up-upload__status__message"
						>{{ item.message }}</text>
						<up-gap class="up-upload__progress" height="3px"
							:style="{width: item.progress + '%'}"></up-gap>
					</view>
					<view
					    class="up-upload__deletable"
					    v-if="item.status !== 'uploading' && (deletable || item.deletable)"
					    @tap.stop="deleteItem(index)"
					>
						<view class="up-upload__deletable__icon">
							<up-icon
							    name="close"
							    color="#ffffff"
							    size="10"
							></up-icon>
						</view>
					</view>
					<slot name="success">
						<view
							class="up-upload__success"
							v-if="item.status === 'success'"
						>
							<!-- #ifdef APP-NVUE -->
							<image
								:src="successIcon"
								class="up-upload__success__icon"
							></image>
							<!-- #endif -->
							<!-- #ifndef APP-NVUE -->
							<view class="up-upload__success__icon">
								<up-icon
									name="checkmark"
									color="#ffffff"
									size="12"
								></up-icon>
							</view>
							<!-- #endif -->
						</view>
					</slot>
				</view>
			</template>
			<canvas id="myCanvas" type="2d"
				style="width: 100px; height: 150px;display: none;"></canvas>
			<template v-if="isInCount">
				<view
				    v-if="$slots.trigger"
				    @tap="chooseFile"
				>
					<slot name="trigger" />
				</view>
				<view
				    v-else-if="!$slots.trigger && ($slots.default || $slots.$default)"
				    @tap="chooseFile"
				>
					<slot />
				</view>
				<view
				    v-else
				    class="up-upload__button"
				    :hover-class="!disabled ? 'up-upload__button--hover' : ''"
				    hover-stay-time="150"
				    @tap="chooseFile"
				    :class="[disabled && 'up-upload__button--disabled']"
					:style="[{
						width: addUnit(width),
						height: addUnit(height)
					}]"
				>
					<up-icon
					    :name="uploadIcon"
					    size="26"
					    :color="uploadIconColor"
					></up-icon>
					<text
					    v-if="uploadText"
					    class="up-upload__button__text"
					>{{ uploadText }}</text>
				</view>
			</template>
		</view>
		<up-popup
			mode="center"
			v-model:show="popupShow">
			<video id="myVideo" v-if="popupShow"
				:src="currentItemIndex >= 0 ? lists[currentItemIndex].url : ''"
				@error="videoErrorCallback" show-center-play-btn
				:object-fit='videoPreviewObjectFit' show-fullscreen-btn='true'
				enable-play-gesture controls
				:autoplay="true" auto-pause-if-open-native
				@loadedmetadata="loadedVideoMetadata"
				:initial-time='0.1'>
			</video>
		</up-popup>
	</view>
</template>

<script setup>
/**
 * upload 上传
 * @description 该组件用于上传图片场景
 * @tutorial https://uview-plus.jiangruyi.com/components/upload.html
 * @example <up-upload :action="action" :fileList="fileList" ></up-upload>
 */
import { ref, watch } from 'vue'
import { chooseFile as chooseFileUtil } from './utils'
import { props as uploadProps } from './props'
import { commonProps } from '../../libs/composable/useUltraUI'
import { addStyle, addUnit, toast, error } from '../../libs/function/index'
import test from '../../libs/function/test'
import { t } from '../../libs/i18n'

defineOptions({
	name: 'up-upload',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...uploadProps.props
})
const emit = defineEmits([
	'error',
	'beforeRead',
	'oversize',
	'afterRead',
	'delete',
	'clickPreview',
	'update:fileList',
	'afterAutoUpload'
])

// #ifdef APP-NVUE
const successIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAKKADAAQAAAABAAAAKAAAAAB65masAAACP0lEQVRYCc3YXygsURwH8K/dpcWyG3LF5u/6/+dKVylSypuUl6uUPMifKMWL8oKEB1EUT1KeUPdR3uTNUsSLxb2udG/cbvInNuvf2rVnazZ/ZndmZ87snjM1Z+Z3zpzfp9+Z5mEAhlvjRtZgCKs+gnPAOcAkkMOR4jEHfItjDvgRxxSQD8cM0BuOCaAvXNCBQrigAsXgggYUiwsK0B9cwIH+4gIKlIILGFAqLiBAOTjFgXJxigJp4BQD0sIpAqSJow6kjSNAFTnRaHJwLenD6Mud52VQAcrBfTd2oyq+HtGaGGWAcnAVcXWoM3bCZrdi+ncPfaAcXE5UKVpdW/vitGPqqAtn98d0gXJwX7Qp6MmegUYVhvmTIezdmHlxJCjpHRTCFerLkRRu4k0aqdajN3sWOo0BK//msHa+xDuPC/oNFMKRhTtM4xjIX0SCNpXL4+7VIaHuyiWEp2L7ahWLf8fejfPdqPmC3mJicORZUp1CQzm+GiphvljGk+PBvWRbxii+xVTj5M6CiZ/tsDufvaXyxEUDxeLIyvu3m0iOyEFWVAkydcVYdyFrE9tQk9iMq6f/GNlvwt3LjQfh60LUrw9/cFyyMJUW/XkLSNMV4Mi6C5ML+ui4x5ClAX9sB9w0wV6wglJwJCv5fOxcr6EstgbGiEw4XcfUry4cWrcEUW8n+ARKxXEJHhw2WG43UKSvwI/TSZgvl7kh0b3XLZaLEy0QmMgLZAVH7J+ALOE+AVnDvQOyiPMAWcW5gSzjCPAV+78S5WE0GrQAAAAASUVORK5CYII='
// #endif
const lists = ref([])
const isInCount = ref(true)
const popupShow = ref(false)
const currentItemIndex = ref(-1)

// 监听accept的变化，判断是否符合各平台要求
watch(() => props.accept, (val) => {
	// #ifndef MP-WEIXIN
	if (val === 'all' || val === 'media') {
		error('只有微信小程序才支持把accept配置为all、media之一')
	}
	// #endif
	// #ifndef H5 || MP-WEIXIN
	if (val === 'file') {
		error('只有微信小程序和H5(HX2.9.9)才支持把accept配置为file')
	}
	// #endif
}, { immediate: true })

// 监听文件列表的变化，重新整理内部数据
watch(() => props.fileList, () => {
	formatFileList()
}, { immediate: true, deep: true })

watch(() => props.deletable, () => {
	formatFileList()
})

watch(() => props.maxCount, () => {
	formatFileList()
})

watch(() => props.accept, () => {
	formatFileList()
})

watch(popupShow, (newVal) => {
	if (!newVal) {
		currentItemIndex.value = -1
	}
})

function videoErrorCallback() {}

function loadedVideoMetadata(e) {
	if (currentItemIndex.value < 0) {
		return
	}
	if (props.autoUploadDriver != 'local') {
		return
	}
	if (!props.getVideoThumb) {
		return
	}
	// 截取第一帧作为封面，oss等云存储场景直接使用拼接参数。
	let w = lists.value[currentItemIndex.value].width
	let h = lists.value[currentItemIndex.value].height
	const dpr = uni.getSystemInfoSync().pixelRatio
	uni.createSelectorQuery().select('#myVideo').context(res => {
		console.log('select video', res)
		const myVideo = res.context
		uni.createSelectorQuery()
			.select('#myCanvas')
			.fields({ node: true, size: true })
			.exec(([res2]) => {
				console.log('select canvas', res2)
				const ctx1 = res2[0].node.getContext('2d')
				res2[0].node.width = w * dpr
				res2[0].node.height = h * dpr
				// Draw the first frame and export it as an image
				setTimeout(() => {
					captureFirstFrame()
				}, 500)
				const captureFirstFrame = () => {
					ctx1.drawImage(myVideo, 0, 0, w * dpr, h * dpr)
					wx.canvasToTempFilePath({
						canvas: res2[0].node,
						success: (result) => {
							console.log('First frame image path:', result.tempFilePath)
							// Now you can use the image path (result.tempFilePath)
							props.fileList['currentItemIndex'].thumb = result.tempFilePath
						},
						fail: (err) => {
							console.error('Failed to export image:', err)
						}
					})
				}

				// Capture the first frame
				setInterval(() => {
					ctx1.drawImage(myVideo, 0, 0, w * dpr, h * dpr)
				}, 1000 / 24)
			})
	}).exec()
}

function formatFileList() {
	const fileList = props.fileList || []
	const maxCount = props.maxCount
	const nextLists = fileList.map((item) => {
		const name = item.name || item.url || item.thumb
		return Object.assign(Object.assign({}, item), {
			// 如果item.url为本地选择的blob文件的话，无法判断其为video还是image，此处优先通过accept做判断处理
			isImage: item.name ? test.image(item.name) : (props.accept === 'image' || test.image(name)),
			isVideo: item.name ? test.video(item.name) : (props.accept === 'video' || test.video(name)),
			deletable: typeof item.deletable === 'boolean' ? item.deletable : props.deletable,
		})
	})
	lists.value = nextLists
	isInCount.value = nextLists.length < maxCount
}

function chooseFileHandler(params) {
	const maxCount = props.maxCount
	const disabled = props.disabled
	const currentLists = lists.value
	if (disabled) return Promise.reject()
	const chooseParams = Object.assign({
		accept: props.accept,
		extension: props.extension,
		multiple: props.multiple,
		capture: props.capture,
		compressed: props.compressed,
		maxDuration: props.maxDuration,
		sizeType: props.sizeType,
		camera: props.camera,
	}, {
		maxCount: maxCount - currentLists.length,
		...params
	})
	return chooseFileUtil(chooseParams)
		.then((res) => {
			const result = chooseParams.multiple ? res : res[0]
			onBeforeRead(result)
			return result
		})
		.catch((error) => {
			emit('error', error)
		})
}

// 文件读取之前
function onBeforeRead(file) {
	const beforeRead = props.beforeRead
	const useBeforeRead = props.useBeforeRead
	let res = file
	// beforeRead是否为一个方法
	if (test.func(beforeRead)) {
		// 如果用户定义了此方法，则去执行此方法，并传入读取的文件回调
		res = beforeRead(file, getDetail())
	}
	if (useBeforeRead) {
		res = new Promise((resolve, reject) => {
			emit(
				'beforeRead',
				Object.assign(Object.assign({
					file
				}, getDetail()), {
					callback: (ok) => {
						ok ? resolve() : reject()
					},
				})
			)
		})
	}
	if (test.promise(res)) {
		res.then((data) => onAfterRead(data || file))
	} else {
		onAfterRead(res || file)
	}
}

function getDetail(index) {
	return {
		name: props.name,
		index: index == null ? props.fileList.length : index,
	}
}

async function onAfterRead(file) {
	const maxSize = props.maxSize
	const afterRead = props.afterRead
	const oversize = Array.isArray(file) ?
		file.some((item) => item.size > maxSize) :
		file.size > maxSize
	if (oversize) {
		uni.showToast({
			title: t("up.upload.sizeExceed")
		})
		emit('oversize', Object.assign({
			file
		}, getDetail()))
		return
	}
	let len = props.fileList.length
	if (props.autoUpload) {
		// 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
		let uploadLists = [].concat(file)
		uploadLists.map((item) => {
			props.fileList.push({
				...item,
				status: 'uploading',
				message: t("up.upload.uploading"),
				progress: 0
			})
		})
		emit('update:fileList', props.fileList)
		for (let i = 0; i < uploadLists.length; i++) {
			let j = i
			let result = ''
			switch (props.autoUploadDriver) {
				case 'cos': // 腾讯云
					break
				case 'kodo': // 七牛云
					break
				case 'oss':
				case 'upload_oss':
					// 阿里云前端直传
					// 获取签名
					console.log()
					let formData = {}
					let ret = await uni.request({
						url: props.autoUploadAuthUrl,
						method: 'get',
						header: props.autoUploadHeader,
						data: {
							filename: uploadLists[j].name
						}
					})
					// console.log(ret);
					let res0 = ret.data
					if (res0.code == 200) {
						// 路径 + 文件名 + 扩展名
						// 不传递filename就要拼接key
						// res0.data.params.key = res0.data.params.dir + res0.data.params.uniqidName + fileExt;
						formData = res0.data.params
					} else {
						uni.showToast({
							title: res0.msg,
							duration: 1500
						})
						return
					}
					var uploadTask = uni.uploadFile({
						url: res0.data.params.host,
						filePath: uploadLists[j].url,
						name: 'file',
						// fileType: 'video', // 仅支付宝小程序，且必填。
						// header: header,
						formData: formData,
						success: (uploadFileRes) => {
							let thumb = ''
							let afterPromise = ''
							if (props.customAfterAutoUpload) {
								afterPromise = new Promise((resolve, reject) => {
									emit(
										'afterAutoUpload',
										Object.assign(res0, {
											callback: (r) => {
												r.url ? resolve(r) : reject()
											},
										})
									)
								})
							}
							if (test.promise(afterPromise)) {
								afterPromise.then((data) => succcessUpload(len + j, data.url, data.thumb))
							} else {
								result = res0.data.params.host + '/' + res0.data.params.key
								if (props.accept === 'video' || test.video(result)) {
									thumb = result + '?x-oss-process=video/snapshot,t_10000,m_fast'
								}
								succcessUpload(len + j, result, thumb)
							}
						}
					})
					uploadTask.onProgressUpdate((res) => {
						updateUpload(len + j, {
							progress: res.progress
						})
					})
					break
				case 'local':
				default:
					// 服务器本机上传
					var uploadTaskLocal = uni.uploadFile({
						url: props.autoUploadApi,
						filePath: uploadLists[j].url,
						name: 'file',
						// fileType: 'video', // 仅支付宝小程序，且必填。
						header: props.autoUploadHeader,
						success: (uploadFileRes) => {
							let resLocal = uploadFileRes.data
							let afterPromise = ''
							if (props.customAfterAutoUpload) {
								afterPromise = new Promise((resolve, reject) => {
									emit(
										'afterAutoUpload',
										Object.assign(resLocal, {
											callback: (r) => {
												r.url ? resolve(r) : reject()
											}
										})
									)
								})
							}
							if (test.promise(afterPromise)) {
								afterPromise.then((data) => succcessUpload(len + j, data.url))
							} else {
								if (resLocal.code != 200) {
									uni.showToast({
										title: resLocal.msg
									})
								} else {
									result = resLocal.data.url
									succcessUpload(len + j, result)
								}
							}
						}
					})
					uploadTaskLocal.onProgressUpdate((res) => {
						updateUpload(len + j, {
							progress: res.progress
						})
					})
					break
			}
		}
	} else {
		if (typeof afterRead === 'function') {
			afterRead(file, getDetail())
		}
		emit('afterRead', Object.assign({
			file
		}, getDetail()))
	}
}

function updateUpload(index, param) {
	let item = props.fileList[index]
	props.fileList.splice(index, 1, {
		...item,
		// 注意这里不判断会出现succcessUpload先执行又被覆盖的问题
		status: param.progress == 100 ? 'success' : 'uploading',
		message: '',
		progress: param.progress
	})
	emit('update:fileList', props.fileList)
}

function succcessUpload(index, url, thumb = '') {
	let item = props.fileList[index]
	props.fileList.splice(index, 1, {
		...item,
		status: 'success',
		message: '',
		url: url,
		progress: 100,
		thumb: thumb
	})
	emit('update:fileList', props.fileList)
}

function deleteItem(index) {
	if (props.autoDelete) {
		props.fileList.splice(index, 1)
		emit('update:fileList', props.fileList)
	} else {
		emit(
			'delete',
			Object.assign(Object.assign({}, getDetail(index)), {
				file: props.fileList[index],
			})
		)
	}
}

// 预览图片
function onPreviewImage(previewItem, index) {
	if (!previewItem.isImage || !props.previewFullImage) return
	let current = 0
	const urls = []
	let imageIndex = 0
	for (var i = 0; i < lists.value.length; i++) {
		const item = lists.value[i]
		if (item.isImage || (item.type && item.type === 'image')) {
			urls.push(item.url || item.thumb)
			if (i === index) {
				current = imageIndex
			}
			imageIndex += 1
		}
	}
	if (urls.length < 1) {
		return
	}
	uni.previewImage({
		urls: urls,
		current: current,
		fail() {
			toast(t("up.upload.previewImageFail"))
		},
	})
}

function onPreviewVideo(previewItem, index) {
	if (!props.previewFullImage) return
	let current = 0
	const sources = []
	let videoIndex = 0
	for (var i = 0; i < lists.value.length; i++) {
		const item = lists.value[i]
		if (item.isVideo || (item.type && item.type === 'video')) {
			sources.push(Object.assign(Object.assign({}, item), {
				type: 'video'
			}))
			if (i === index) {
				current = videoIndex
			}
			videoIndex += 1
		}
	}
	if (sources.length < 1) {
		return
	}
	// #ifndef MP-WEIXIN
	popupShow.value = true
	currentItemIndex.value = index
	console.log(lists.value[currentItemIndex.value])
	// #endif
	// #ifdef MP-WEIXIN
	wx.previewMedia({
		sources: sources,
		current: current,
		fail() {
			toast(t("up.upload.previewVideoFail"))
		},
	})
	// #endif
}

function onClickPreview(item, index) {
	if (props.previewFullImage) {
		switch (item.type) {
			case 'image':
				onPreviewImage(item, index)
				break
			case 'video':
				onPreviewVideo(item, index)
				break
			default:
				break
		}
	}
	emit(
		'clickPreview',
		Object.assign(Object.assign({}, item), getDetail(index))
	)
}

// expose method name used by template
function chooseFile(params) {
	return chooseFileHandler(params)
}
</script>


<style lang="scss" scoped>
	$up-upload-preview-border-radius: 2px !default;
	$up-upload-preview-margin: 0 8px 8px 0 !default;
	$up-upload-image-width:80px !default;
	$up-upload-image-height:$up-upload-image-width;
	$up-upload-other-bgColor: rgb(242, 242, 242) !default;
	$up-upload-other-flex:1 !default;
	$up-upload-text-font-size:11px !default;
	$up-upload-text-color:$up-tips-color !default;
	$up-upload-text-margin-top:2px !default;
	$up-upload-deletable-right:0 !default;
	$up-upload-deletable-top:0 !default;
	$up-upload-deletable-bgColor:rgb(55, 55, 55) !default;
	$up-upload-deletable-height:14px !default;
	$up-upload-deletable-width:$up-upload-deletable-height;
	$up-upload-deletable-boder-bottom-left-radius:100px !default;
	$up-upload-deletable-zIndex:3 !default;
	$up-upload-success-bottom:0 !default;
	$up-upload-success-right:0 !default;
	$up-upload-success-border-style:solid !default;
	$up-upload-success-border-top-color:transparent !default;
	$up-upload-success-border-left-color:transparent !default;
	$up-upload-success-border-bottom-color: $up-success !default;
	$up-upload-success-border-right-color:$up-upload-success-border-bottom-color;
	$up-upload-success-border-width:9px !default;
	$up-upload-icon-top:0px !default;
	$up-upload-icon-right:0px !default;
	$up-upload-icon-h5-top:1px !default;
	$up-upload-icon-h5-right:0 !default;
	$up-upload-icon-width:16px !default;
	$up-upload-icon-height:$up-upload-icon-width;
	$up-upload-success-icon-bottom:-10px !default;
	$up-upload-success-icon-right:-10px !default;
	$up-upload-status-right:0 !default;
	$up-upload-status-left:0 !default;
	$up-upload-status-bottom:0 !default;
	$up-upload-status-top:0 !default;
	$up-upload-status-bgColor:rgba(0, 0, 0, 0.5) !default;
	$up-upload-status-icon-Zindex:1 !default;
	$up-upload-message-font-size:12px !default;
	$up-upload-message-color:#FFFFFF !default;
	$up-upload-message-margin-top:5px !default;
	$up-upload-button-width:80px !default;
	$up-upload-button-height:$up-upload-button-width;
	$up-upload-button-bgColor:rgb(244, 245, 247) !default;
	$up-upload-button-border-radius:2px !default;
	$up-upload-botton-margin: 0 8px 8px 0 !default;
	$up-upload-text-font-size:11px !default;
	$up-upload-text-color:$up-tips-color !default;
	$up-upload-text-margin-top: 2px !default;
	$up-upload-hover-bgColor:rgb(230, 231, 233) !default;
	$up-upload-disabled-opacity:.5 !default;

	.up-upload {
		@include flex(column);
		flex: 1;

		&__wrap {
			@include flex;
			flex-wrap: wrap;
			flex: 1;

			&__preview {
				border-radius: $up-upload-preview-border-radius;
				margin: $up-upload-preview-margin;
				position: relative;
				overflow: hidden;
				@include flex;

				&__image {
					width: $up-upload-image-width;
					height: $up-upload-image-height;
				}

				&__video,
				&__other {
					width: $up-upload-image-width;
					height: $up-upload-image-height;
					background-color: $up-upload-other-bgColor;
					flex: $up-upload-other-flex;
					@include flex(column);
					justify-content: center;
					align-items: center;

					&__text {
						font-size: $up-upload-text-font-size;
						color: $up-upload-text-color;
						margin-top: $up-upload-text-margin-top;
					}
				}
			}
		}
		&__wrap__play {
			position: absolute;
			top: 0px;
			left: 0px;
			bottom: 0px;
			right: 0px;
			display: flex;
			justify-content: center;
			align-items: center;
			&__icon {
				background: #fff;
				border-radius: 100px;
				opacity: 0.8;
			};
		}

		&__deletable {
			position: absolute;
			top: $up-upload-deletable-top;
			right: $up-upload-deletable-right;
			background-color: $up-upload-deletable-bgColor;
			height: $up-upload-deletable-height;
			width: $up-upload-deletable-width;
			@include flex;
			border-bottom-left-radius: $up-upload-deletable-boder-bottom-left-radius;
			align-items: center;
			justify-content: center;
			z-index: $up-upload-deletable-zIndex;

			&__icon {
				position: absolute;
				transform: scale(0.7);
				top: $up-upload-icon-top;
				right: $up-upload-icon-right;
				/* #ifdef H5 */
				top: $up-upload-icon-h5-top;
				right: $up-upload-icon-h5-right;
				/* #endif */
			}
		}

		&__success {
			position: absolute;
			bottom: $up-upload-success-bottom;
			right: $up-upload-success-right;
			@include flex;
			// 由于weex(nvue)为阿里巴巴的KPI(部门业绩考核)的laji产物，不支持css绘制三角形
			// 所以在nvue下使用图片，非nvue下使用css实现
			/* #ifndef APP-NVUE */
			border-style: $up-upload-success-border-style;
			border-top-color: $up-upload-success-border-top-color;
			border-left-color: $up-upload-success-border-left-color;
			border-bottom-color: $up-upload-success-border-bottom-color;
			border-right-color: $up-upload-success-border-right-color;
			border-width: $up-upload-success-border-width;
			align-items: center;
			justify-content: center;
			/* #endif */

			&__icon {
				/* #ifndef APP-NVUE */
				position: absolute;
				transform: scale(0.7);
				bottom: $up-upload-success-icon-bottom;
				right: $up-upload-success-icon-right;
				/* #endif */
				/* #ifdef APP-NVUE */
				width: $up-upload-icon-width;
				height: $up-upload-icon-height;
				/* #endif */
			}
		}
		&__progress {
			background-color: $up-primary !important;
			position: absolute;
			bottom: 0;
			left: 0;
		}

		&__status {
			position: absolute;
			top: $up-upload-status-top;
			bottom: $up-upload-status-bottom;
			left: $up-upload-status-left;
			right: $up-upload-status-right;
			background-color: $up-upload-status-bgColor;
			@include flex(column);
			align-items: center;
			justify-content: center;

			&__icon {
				position: relative;
				z-index: $up-upload-status-icon-Zindex;
			}

			&__message {
				font-size: $up-upload-message-font-size;
				color: $up-upload-message-color;
				margin-top: $up-upload-message-margin-top;
			}
		}

		&__button {
			@include flex(column);
			align-items: center;
			justify-content: center;
			width: $up-upload-button-width;
			height: $up-upload-button-height;
			background-color: $up-upload-button-bgColor;
			border-radius: $up-upload-button-border-radius;
			margin: $up-upload-botton-margin;
			/* #ifndef APP-NVUE */
			box-sizing: border-box;
			/* #endif */

			&__text {
				font-size: $up-upload-text-font-size;
				color: $up-upload-text-color;
				margin-top: $up-upload-text-margin-top;
			}

			&--hover {
				background-color: $up-upload-hover-bgColor;
			}

			&--disabled {
				opacity: $up-upload-disabled-opacity;
			}
		}
	}
</style>
