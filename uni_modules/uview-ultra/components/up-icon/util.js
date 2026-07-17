import config from '../../libs/config/config.js'

const params = {
	loaded: false
}

function loadFontFace(family, url) {
	if (!family || !url || typeof uni === 'undefined' || typeof uni.loadFontFace !== 'function') {
		return
	}
	uni.loadFontFace({
		global: true,
		family,
		source: `url("${url}")`,
		success() {},
		fail() {}
	})
}

function loadFont() {
	if (params.loaded) return true
	loadFontFace('upicon-iconfont', config.iconUrl)
	if (config.customIcon && config.customIcon.family && config.customIcon.url) {
		loadFontFace(config.customIcon.family, config.customIcon.url)
	}
	if (config.loadFontOnce) {
		params.loaded = true
	}
	return true
}

export default {
	params,
	loadFont
}
