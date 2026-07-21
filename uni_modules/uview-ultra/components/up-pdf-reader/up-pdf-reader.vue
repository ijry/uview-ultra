<template>
	<view class="up-pdf-reader" :style="{ height: height }">
		<web-view :fullscreen="false"
			:src="viewerUrl" :style="{ width: '750rpx', height: height }"
            :webview-styles="{ width: '750rpx', height: height }"
			frameborder="0"
		></web-view>
	</view>
</template>

<script setup>
	import { onMounted, ref, watch } from 'vue'
	import pdfReaderProps from './props.js'

	/**
	 * pdfReader PDF阅读器
	 * @description 基于pdf.js的PDF阅读器组件
	 * @tutorial https://uview-plus.jiangruyi.com/components/pdfReader.html
	 * @property {String}			src				PDF文件地址
	 * @property {String}	        height			组件高度，默认为'700px'
	 * @property {String}			pdfjsDomain		pdfjs资源域名，默认为'https://uview-plus.jiangruyi.com/h5'
	 * @example <up-pdf-reader src="https://example.com/file.pdf"></up-pdf-reader>
	 */
	defineOptions({
		name: 'up-pdf-reader'
	})

	const props = defineProps({
		...pdfReaderProps.props
	})
	const baseUrlInner = ref('https://uview-plus.jiangruyi.com/h5')
	const viewerUrl = ref('')

	function setViewerUrl(src) {
		viewerUrl.value = `${baseUrlInner.value}/static/pdfjs/web/viewer.html?file=` + encodeURIComponent(src)
	}

	watch(() => props.baseUrl, (value) => {
		if (value) baseUrlInner.value = value
		setViewerUrl(props.src)
	})

	watch(() => props.src, (value) => {
		setViewerUrl(value)
	})

	onMounted(() => {
		if (props.baseUrl) {
			baseUrlInner.value = props.baseUrl
		}
		setViewerUrl(props.src)
	})
</script>

<style lang="scss" scoped>	
	.up-pdf-reader {
	}
</style>
