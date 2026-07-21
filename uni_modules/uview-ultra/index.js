// 看到此报错，是因为没有配置vite.config.js的【transpileDependencies】
// const pleaseSetTranspileDependencies = {}, babelTest = pleaseSetTranspileDependencies?.test

// 全局挂载引入http相关请求拦截插件
import Request from './libs/luch-request'

// 路由封装
import route from './libs/util/route.js'
// 颜色渐变相关,colorGradient-颜色渐变,hexToRgb-十六进制颜色转rgb颜色,rgbToHex-rgb转十六进制
import colorGradient from './libs/function/colorGradient.js'

// 规则检验
import test from './libs/function/test.js'
// 防抖方法
import debounce from './libs/function/debounce.js'
// 节流方法
import throttle from './libs/function/throttle.js'
// 浮点计算
import calc from './libs/function/calc.js'
// 高精度数字处理
import digit from './libs/function/digit.js'
// 公共文件写入的方法
import index from './libs/function/index.js'
// i18n
import i18n, { t } from './libs/i18n/index.js'
import {
    themeState,
    setTheme,
    setThemePreference,
    getThemePreference,
    getSystemTheme,
    getThemeVars,
    initThemeSystem,
    refreshThemeFromConfig,
    syncThemeColorOverrideState
} from './libs/theme/theme.js'
import {
    applyNativeThemeUI,
    getThemeCardStyle,
    getThemeIsDark,
    getThemePageStyle,
    getThemeTabBarStyle,
    getThemeVar,
    getThemeVarsForStyle
} from './libs/theme/runtime.js'

// 配置信息
import config from './libs/config/config.js'
// props配置信息
import props from './libs/config/props.js'
// 各个需要fixed的地方的z-index配置文件
import zIndex from './libs/config/zIndex.js'
// 关于颜色的配置，特殊场景使用
import color from './libs/config/color.js'
// 平台
import platform from './libs/function/platform'

// 导出
const http = new Request()
let themeType = ['primary', 'success', 'error', 'warning', 'info'];
export { route, http, debounce, throttle, calc, digit, platform, themeType, props, color, test, zIndex, i18n, t }
export * from './libs/function/index.js'
export * from './libs/function/colorGradient.js'

const rootToastState = {
    ref: null
}
const rootNotifyState = {
    ref: null
}

function normalizeRootToastOptions(options = {}) {
    const toastOptions = typeof options === 'string'
        ? { message: options }
        : (options && typeof options === 'object' ? { ...options } : {})
    if (!toastOptions.message && toastOptions.title) {
        toastOptions.message = toastOptions.title
    }
    return toastOptions
}

function setRootToastRef(ref = null) {
    rootToastState.ref = ref || null
}

function rootToast(options = {}) {
    const toastOptions = normalizeRootToastOptions(options)
    const toastRef = rootToastState.ref
    if (toastRef && typeof toastRef.show === 'function') {
        toastRef.show(toastOptions)
        return
    }
    if (!toastOptions.message) return
    if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
        uni.showToast({
            title: toastOptions.message,
            icon: 'none',
            duration: Number(toastOptions.duration) || 2000,
        })
    }
}

function normalizeRootNotifyOptions(options = {}) {
    const notifyOptions = typeof options === 'string'
        ? { message: options }
        : (options && typeof options === 'object' ? { ...options } : {})
    if (!notifyOptions.message && notifyOptions.title) {
        notifyOptions.message = notifyOptions.title
    }
    return notifyOptions
}

function setRootNotifyRef(ref = null) {
    rootNotifyState.ref = ref || null
}

function rootNotify(options = {}) {
    const notifyOptions = normalizeRootNotifyOptions(options)
    const notifyRef = rootNotifyState.ref
    if (notifyRef && typeof notifyRef.show === 'function') {
        notifyRef.show(notifyOptions)
        return
    }
    if (!notifyOptions.message) return
    if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
        uni.showToast({
            title: notifyOptions.message,
            icon: 'none',
            duration: Number(notifyOptions.duration) || 3000,
        })
    }
}

/**
 * @description 修改uView内置属性值
 * @param {object} props 修改内置props属性
 * @param {object} config 修改内置config属性
 * @param {object} color 修改内置color属性
 * @param {object} zIndex 修改内置zIndex属性
 */
export function setConfig(configs) {
    const settings = configs || {}
	index.shallowMerge(config, settings.config || {})
	index.shallowMerge(props, settings.props || {})
	index.shallowMerge(color, settings.color || {})
	index.shallowMerge(zIndex, settings.zIndex || {})
    syncThemeColorOverrideState({
        color: settings.color,
        configColor: settings?.config?.color
    })
    const shouldRefreshTheme = !!settings.color
        || !!settings?.config?.color
        || themeState.version > 0
    if (shouldRefreshTheme) {
        refreshThemeFromConfig()
    }
}
index.setConfig = setConfig

const $u = {
    route,
    date: index.timeFormat, // 另名date
    colorGradient: colorGradient.colorGradient,
    hexToRgb: colorGradient.hexToRgb,
    rgbToHex: colorGradient.rgbToHex,
    colorToRgba: colorGradient.colorToRgba,
    test,
    type: themeType,
    http,
    config, // uview-plus配置信息相关，比如版本号
    zIndex,
    debounce,
    throttle,
    calc,
    digit,
    i18n,
    t,
    props,
    ...index,
    color,
    platform,
    theme: themeState,
    setTheme,
    setThemePreference,
    getThemePreference,
    getSystemTheme,
    getThemeVars,
    getThemeTabBarStyle,
    applyNativeThemeUI,
    rootToast,
    setRootToastRef,
    rootNotify,
    setRootNotifyRef
}

export const mount$u = function() {
    uni.$u = $u
    initThemeSystem()
}

// #ifdef H5
const importFn = import.meta.glob('./components/up-*/up-*.vue', { eager: true })
const miniImportFn = import.meta.glob('./components/up-*/up-*.uvue', { eager: true })
let components = [];

// 批量注册全局组件
for (const key in importFn) {
    let component = importFn[key].default;
    if (component.name) {
        // console.log('component', component.name)
        component.install = function (Vue) {
            Vue.component(component.name, component);
        };
        
        // 导入组件
        components.push(component);
    }
}

// 注册 .uvue 组件
for (const key in miniImportFn) {
    let component = miniImportFn[key].default;
    if (component.name) {
        component.install = function (Vue) {
            Vue.component(component.name, component);
        };
        
        components.push(component);
    }
}
// #endif

function defineGlobalThemeHelpers(Vue) {
    const globalProperties = Vue?.config?.globalProperties
    if (!globalProperties) return
    Object.defineProperty(globalProperties, 'upThemeIsDark', {
        configurable: true,
        get() {
            return getThemeIsDark()
        }
    })
    Object.defineProperty(globalProperties, 'upThemeVars', {
        configurable: true,
        get() {
            return getThemeVarsForStyle()
        }
    })
    Object.defineProperty(globalProperties, 'upThemePageStyle', {
        configurable: true,
        get() {
            return getThemePageStyle()
        }
    })
    Object.defineProperty(globalProperties, 'upThemeCardStyle', {
        configurable: true,
        get() {
            return getThemeCardStyle()
        }
    })
    globalProperties.upThemeVar = function(varName, fallbackColor) {
        return getThemeVar(varName, fallbackColor)
    }
    globalProperties.upApplyNativeThemeUI = function() {
        return applyNativeThemeUI()
    }
}

function toCamelCase(str) {
    return str.replace(/-([a-z])/g, function(match, group1) {
      return group1.toUpperCase();
    }).replace(/^[a-z]/, function(match) {
      return match.toUpperCase();
    });
}

const install = (Vue) => {
    // #ifdef H5
    components.forEach(function(component) {
        Vue.component(component.name, component);
    });
    // #endif

    // 同时挂载到uni和Vue.prototype中
    // $u挂载到uni对象上
    uni.$u = $u
    initThemeSystem()

    // #ifndef APP-NVUE
    // 只有vue，挂载到Vue.prototype才有意义，因为nvue中全局Vue.prototype无效
    Vue.config.globalProperties.$u = $u
    defineGlobalThemeHelpers(Vue)
    // #endif
}

export default {
    install,
    UpNoNetwork,
}
