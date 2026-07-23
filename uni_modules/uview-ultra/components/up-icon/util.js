import config from '../../libs/config/config.js'
// #ifdef APP || APP-NVUE
import iconFontUrl from './upicon.ttf?url'
// #endif

const iconFontFamily = 'upicon-iconfont'

const params = {
	loaded: false
}

const getIconUrl = () => {
	// #ifdef APP || APP-NVUE
	return iconFontUrl
	// #endif
	return config.iconUrl
}

const markFontLoaded = () => {
	// App端使用包内本地字体，重复注册没有收益且会放大多图标页面开销。
	// #ifdef APP || APP-NVUE
	params.loaded = true
	return
	// #endif
	// 全局加载不稳定，默认关闭，需要开启可以配置 loadFontOnce。
	if (config.loadFontOnce) {
		params.loaded = true
	}
}

function loadFont() {
	const iconUrl = getIconUrl()
	markFontLoaded()
	// #ifdef APP-NVUE
	// nvue通过weex的dom模块引入字体，相关文档地址如下：
	// https://weex.apache.org/zh/docs/modules/dom.html#addrule
	const domModule = weex.requireModule('dom')
	domModule.addRule('fontFace', {
		'fontFamily': iconFontFamily,
		'src': `url('${iconUrl}')`
	})
	if (config.customIcon && config.customIcon.family) {
		domModule.addRule('fontFace', {
			'fontFamily': config.customIcon.family,
			'src': `url('${config.customIcon.url}')`
		})
	}
	// #endif
	// #ifdef APP || H5 || MP-WEIXIN || MP-ALIPAY
	if (typeof uni !== 'undefined' && typeof uni.loadFontFace === 'function') {
		uni.loadFontFace({
			global: true,
			family: iconFontFamily,
			source: 'url("' + iconUrl + '")',
			success() {},
			fail() {}
		})
		if (config.customIcon && config.customIcon.family) {
			uni.loadFontFace({
				global: true,
				family: config.customIcon.family,
				source: 'url("' + config.customIcon.url + '")',
				success() {},
				fail() {}
			})
		}
	}
	// #endif
	return true
}

export default {
	params,
	loadFont
}