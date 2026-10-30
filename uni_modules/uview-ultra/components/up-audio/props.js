import { defineMixin } from '../../libs/vue.js'
import defProps from '../../libs/config/props.js'
export const props = defineMixin({
    props: {
        // 音频地址，支持单个地址或地址数组（多源，加载失败自动切换）
        src: {
            type: [String, Array],
            default: () => defProps.audio.src
        },
        // 标题，显示在音频条上
        title: {
            type: String,
            default: () => defProps.audio.title
        },
        // 是否循环播放
        loop: {
            type: Boolean,
            default: () => defProps.audio.loop
        },
        // 是否显示倍速切换
        showRate: {
            type: Boolean,
            default: () => defProps.audio.showRate
        },
        // 可切换的倍速档位
        rateList: {
            type: Array,
            default: () => defProps.audio.rateList
        },
        // 主题色（播放按钮、进度条选中色）
        activeColor: {
            type: String,
            default: () => defProps.audio.activeColor
        },
        // 是否显示标题
        showTitle: {
            type: Boolean,
            default: () => defProps.audio.showTitle
        }
    }
})

export default props
