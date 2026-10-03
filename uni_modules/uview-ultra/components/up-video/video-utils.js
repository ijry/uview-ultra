/**
 * up-video 的纯逻辑辅助方法。
 * 这里不允许引入 uni / vue。
 */

// 宽松转数字，无法解析时返回 fallback
export function toNumber(value, fallback = 0) {
    if (value === null || value === undefined || value === '') return fallback
    const num = parseFloat(value)
    return isNaN(num) ? fallback : num
}

// 把数值限制在 [min, max] 之间
export function clampNumber(value, min, max) {
    const number = toNumber(value, min)
    if (isNaN(number)) return min
    if (number < min) return min
    if (number > max) return max
    return number
}

// 秒数格式化为 mm:ss，超过一小时输出 hh:mm:ss
export function formatVideoTime(seconds) {
    const total = Math.floor(toNumber(seconds, 0))
    if (isNaN(total) || total <= 0) return '00:00'
    const pad = (value) => (value < 10 ? `0${value}` : `${value}`)
    const hour = Math.floor(total / 3600)
    const minute = Math.floor((total % 3600) / 60)
    const second = total % 60
    if (hour > 0) return `${pad(hour)}:${pad(minute)}:${pad(second)}`
    return `${pad(minute)}:${pad(second)}`
}

// 倍速列表去重、去掉非法值并升序排列，兜底为 [1]
export function normalizeRateList(list) {
    if (!Array.isArray(list)) return [1]
    const rates = []
    list.forEach((item) => {
        const rate = toNumber(item, 0)
        if (!isNaN(rate) && rate > 0 && rates.indexOf(rate) == -1) {
            rates.push(rate)
        }
    })
    if (!rates.length) return [1]
    return rates.sort((a, b) => a - b)
}

// 选集支持直接传地址字符串，默认标题为集数序号
export function normalizeEpisodes(list) {
    if (!Array.isArray(list)) return []
    return list.map((item, index) => {
        const episode = typeof item === 'string' ? { src: item } : (item || {})
        return {
            src: episode.src || '',
            title: episode.title === undefined || episode.title === '' ? String(index + 1) : episode.title,
            poster: episode.poster || '',
            danmuList: Array.isArray(episode.danmuList) ? episode.danmuList : null
        }
    })
}

// 广告归一化：type 默认前置贴片，图片广告没有时长时给 5 秒
export function normalizeAds(list) {
    if (!Array.isArray(list)) return []
    return list.map((item) => {
        const ad = item || {}
        const type = ['preroll', 'pause', 'postroll'].indexOf(ad.type) > -1 ? ad.type : 'preroll'
        const src = ad.src || ''
        const duration = toNumber(ad.duration, 0) > 0 ? toNumber(ad.duration, 0) : (src ? 0 : 5)
        return {
            type,
            src,
            image: ad.image || '',
            link: ad.link || '',
            text: ad.text || '',
            duration,
            skipAfter: isNaN(toNumber(ad.skipAfter, -1)) ? -1 : toNumber(ad.skipAfter, -1)
        }
    })
}

export function pickAds(ads, type) {
    if (!Array.isArray(ads)) return []
    return ads.filter((ad) => ad && ad.type === type)
}

// skipAfter: -1 不可跳过，0 立即可跳过，n 播放 n 秒后可跳过
export function adSkippable(ad, elapsed) {
    if (!ad) return false
    const skipAfter = toNumber(ad.skipAfter, -1)
    if (isNaN(skipAfter) || skipAfter < 0) return false
    return toNumber(elapsed, 0) >= skipAfter
}

export function timeToProgress(time, duration) {
    const total = toNumber(duration, 0)
    if (isNaN(total) || total <= 0) return 0
    return clampNumber((toNumber(time, 0) / total) * 100, 0, 100)
}

export function progressToTime(percent, duration) {
    const total = toNumber(duration, 0)
    if (isNaN(total) || total <= 0) return 0
    return clampNumber((clampNumber(percent, 0, 100) / 100) * total, 0, total)
}
