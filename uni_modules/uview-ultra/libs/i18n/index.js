import zhHans from './locales/zh-Hans.js'

const settings = {
    lang: typeof uni !== 'undefined' && typeof uni.getLocale === 'function'
        ? uni.getLocale()
        : 'zh-Hans',
    locales: {
        'zh-Hans': zhHans
    }
}

if (typeof uni !== 'undefined' && typeof uni.onLocaleChange === 'function') {
    uni.onLocaleChange((locale) => {
        settings.lang = typeof locale === 'string'
            ? locale
            : (locale && locale.locale) || settings.lang
    })
}

function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]'
}

export function hasLocale(locale) {
    return !!(locale && settings.locales[locale])
}

export function getLocale() {
    return settings.lang
}

export function setLocale(locale) {
    if (!locale || typeof locale !== 'string') return settings.lang
    settings.lang = locale
    if (typeof uni !== 'undefined' && typeof uni.setLocale === 'function') {
        try {
            uni.setLocale(locale)
        } catch (e) {
            // ignore platform limitations
        }
    }
    return settings.lang
}

/**
 * registerLocale('en', messages)
 * registerLocale({ en: messages, ja: messages2 })
 */
export function registerLocale(localeOrMap, messages) {
    if (typeof localeOrMap === 'string') {
        if (!localeOrMap || !isPlainObject(messages)) return
        settings.locales[localeOrMap] = messages
        return
    }
    if (!isPlainObject(localeOrMap)) return
    Object.keys(localeOrMap).forEach((key) => {
        const value = localeOrMap[key]
        if (isPlainObject(value)) {
            settings.locales[key] = value
        }
    })
}

/**
 * 多语言方法（ultra 保留 . -> _ 变换）
 */
export function t(value, params = {}) {
    if (value != null && value !== '') {
        let key = String(value).replaceAll('.', '_')
        let lang = settings.lang
        if (!settings.locales[settings.lang]) {
            lang = 'zh-Hans'
        }
        let result = settings.locales[lang][key] || value
        if (params && typeof params === 'object') {
            Object.keys(params).forEach((paramKey) => {
                const reg = new RegExp(`{${paramKey}}`, 'g')
                result = String(result).replace(reg, params[paramKey])
            })
        }
        return result
    }
    return value
}

export default {
    settings
}
