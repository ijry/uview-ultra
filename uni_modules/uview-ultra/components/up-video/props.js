import defProps from './video'

export const props = {
    // 视频地址，传了 episodes 时作为兜底地址
    src: {
        type: String,
        default: () => defProps.video.src
    },
    // 封面图，首次播放前展示
    poster: {
        type: String,
        default: () => defProps.video.poster
    },
    // 标题，显示在顶部信息栏
    title: {
        type: String,
        default: () => defProps.video.title
    },
    width: {
        type: [String, Number],
        default: () => defProps.video.width
    },
    height: {
        type: [String, Number],
        default: () => defProps.video.height
    },
    radius: {
        type: [String, Number],
        default: () => defProps.video.radius
    },
    objectFit: {
        type: String,
        default: () => defProps.video.objectFit
    },
    autoplay: {
        type: Boolean,
        default: () => defProps.video.autoplay
    },
    loop: {
        type: Boolean,
        default: () => defProps.video.loop
    },
    muted: {
        type: Boolean,
        default: () => defProps.video.muted
    },
    initialTime: {
        type: [String, Number],
        default: () => defProps.video.initialTime
    },
    // 是否显示自绘控制层
    controls: {
        type: Boolean,
        default: () => defProps.video.controls
    },
    showCenterPlayBtn: {
        type: Boolean,
        default: () => defProps.video.showCenterPlayBtn
    },
    showFullscreenBtn: {
        type: Boolean,
        default: () => defProps.video.showFullscreenBtn
    },
    showBack: {
        type: Boolean,
        default: () => defProps.video.showBack
    },
    backIcon: {
        type: String,
        default: () => defProps.video.backIcon
    },
    autoHide: {
        type: [String, Number],
        default: () => defProps.video.autoHide
    },
    showLock: {
        type: Boolean,
        default: () => defProps.video.showLock
    },
    // 是否显示倍速入口
    showRate: {
        type: Boolean,
        default: () => defProps.video.showRate
    },
    // 当前倍速
    rate: {
        type: [String, Number],
        default: () => defProps.video.rate
    },
    // 可选倍速
    rateList: {
        type: Array,
        default: () => defProps.video.rateList
    },
    showVolume: {
        type: Boolean,
        default: () => defProps.video.showVolume
    },
    // 音量 0-1
    volume: {
        type: [String, Number],
        default: () => defProps.video.volume
    },
    // 是否开启弹幕
    enableDanmu: {
        type: Boolean,
        default: () => defProps.video.enableDanmu
    },
    danmuList: {
        type: Array,
        default: () => defProps.video.danmuList
    },
    danmuBtn: {
        type: Boolean,
        default: () => defProps.video.danmuBtn
    },
    danmuOpen: {
        type: Boolean,
        default: () => defProps.video.danmuOpen
    },
    danmuColor: {
        type: String,
        default: () => defProps.video.danmuColor
    },
    danmuFontSize: {
        type: [String, Number],
        default: () => defProps.video.danmuFontSize
    },
    danmuDuration: {
        type: [String, Number],
        default: () => defProps.video.danmuDuration
    },
    danmuArea: {
        type: String,
        default: () => defProps.video.danmuArea
    },
    danmuOpacity: {
        type: [String, Number],
        default: () => defProps.video.danmuOpacity
    },
    danmuMax: {
        type: [String, Number],
        default: () => defProps.video.danmuMax
    },
    // 选集列表
    episodes: {
        type: Array,
        default: () => defProps.video.episodes
    },
    episodeIndex: {
        type: [String, Number],
        default: () => defProps.video.episodeIndex
    },
    episodeColumns: {
        type: [String, Number],
        default: () => defProps.video.episodeColumns
    },
    autoNext: {
        type: Boolean,
        default: () => defProps.video.autoNext
    },
    ads: {
        type: Array,
        default: () => defProps.video.ads
    },
    enableProgressGesture: {
        type: Boolean,
        default: () => defProps.video.enableProgressGesture
    },
    pageGesture: {
        type: Boolean,
        default: () => defProps.video.pageGesture
    },
    vslideGesture: {
        type: Boolean,
        default: () => defProps.video.vslideGesture
    },
    direction: {
        type: [String, Number],
        default: () => defProps.video.direction
    },
    autoPauseIfNavigate: {
        type: Boolean,
        default: () => defProps.video.autoPauseIfNavigate
    },
    autoPauseIfOpenNative: {
        type: Boolean,
        default: () => defProps.video.autoPauseIfOpenNative
    },
    videoId: {
        type: String,
        default: () => defProps.video.videoId
    },
    activeColor: {
        type: String,
        default: () => defProps.video.activeColor
    },
}

export default props