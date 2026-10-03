import { AllowedComponentProps, VNodeProps } from './_common'

declare interface VideoEpisode {
  /** 选集标题 */
  title?: string
  /** 视频地址 */
  src?: string
  /** 封面图 */
  poster?: string
  /** 该集的弹幕列表 */
  danmuList?: Array<any>
}

declare interface VideoAd {
  /** 弹幕类型：preroll 前置贴片 / pause 暂停贴片 / postroll 后置贴片 */
  type?: 'preroll' | 'pause' | 'postroll'
  /** 广告视频地址，与 image 二选一 */
  src?: string
  /** 广告图片 */
  image?: string
  /** 广告时长，秒，0 表示由视频自带 */
  duration?: number
  /** 播放多少秒后可跳过，-1 不可跳过 */
  skipAfter?: number
  /** 点击后的外链 */
  link?: string
  /** 自定义文案 */
  text?: string
}

declare interface VideoDanmu {
  /** 弹幕文字 */
  text: string
  /** 弹幕颜色，留空取默认色 */
  color?: string
  /** 出现时间，秒 */
  time?: number
  /** scroll 滚动 / top 顶部 / bottom 底部 */
  type?: 'scroll' | 'top' | 'bottom'
}

declare interface VideoProps {
  /** 视频地址，传了 episodes 时作为兜底地址 */
  src?: string
  /** 封面图，首次播放前展示 */
  poster?: string
  /** 标题，显示在顶部信息栏 */
  title?: string
  /**
   * 宽度
   * @default "100%"
   */
  width?: string | number
  /** 高度 */
  height?: string | number
  /** 圆角 */
  radius?: string | number
  /** 视频填充模式 contain | fill | cover */
  objectFit?: 'contain' | 'fill' | 'cover'
  /** 是否自动播放 */
  autoplay?: boolean
  /** 是否循环播放 */
  loop?: boolean
  /** 是否静音 */
  muted?: boolean
  /** 指定开始播放的位置，单位秒 */
  initialTime?: string | number
  /** 是否显示自绘控制层 */
  controls?: boolean
  /** 封面上是否显示大播放按钮 */
  showCenterPlayBtn?: boolean
  /** 是否显示全屏按钮 */
  showFullscreenBtn?: boolean
  /** 是否显示顶部返回按钮 */
  showBack?: boolean
  /** 返回按钮图标 */
  backIcon?: string
  /** 控制层自动隐藏的毫秒数，0 表示不隐藏 */
  autoHide?: string | number
  /** 是否显示锁屏按钮 */
  showLock?: boolean
  /** 是否显示倍速入口 */
  showRate?: boolean
  /** 当前倍速，支持 v-model:rate */
  rate?: string | number
  /** 可选倍速 */
  rateList?: Array<number | string>
  /** 是否显示音量入口 */
  showVolume?: boolean
  /** 音量 0-1，支持 v-model:volume */
  volume?: string | number
  /** 是否开启弹幕 */
  enableDanmu?: boolean
  /** 弹幕列表 */
  danmuList?: Array<string | VideoDanmu>
  /** 是否显示弹幕开关与输入入口 */
  danmuBtn?: boolean
  /** 弹幕是否可见，支持 v-model:danmuOpen */
  danmuOpen?: boolean
  /** 默认弹幕颜色 */
  danmuColor?: string
  /** 弹幕字号 */
  danmuFontSize?: string | number
  /** 一条滚动弹幕走完全屏的秒数 */
  danmuDuration?: string | number
  /** 弹幕区域 full | half | top */
  danmuArea?: 'full' | 'half' | 'top'
  /** 弹幕透明度 */
  danmuOpacity?: string | number
  /** 同屏最大弹幕数 */
  danmuMax?: string | number
  /** 选集列表 */
  episodes?: Array<string | VideoEpisode>
  /** 当前集索引，支持 v-model:episodeIndex */
  episodeIndex?: string | number
  /** 选集面板列数 */
  episodeColumns?: string | number
  /** 播完是否自动下一集 */
  autoNext?: boolean
  /** 广告列表 */
  ads?: Array<VideoAd>
  /** 是否启用原生进度手势 */
  enableProgressGesture?: boolean
  /** 是否开启亮度与音量手势 */
  pageGesture?: boolean
  /** 是否开启竖向手势 */
  vslideGesture?: boolean
  /** 全屏方向，-1 表示由系统判断 */
  direction?: string | number
  /** 页面切换时自动暂停 */
  autoPauseIfNavigate?: boolean
  /** 打开原生页面时自动暂停 */
  autoPauseIfOpenNative?: boolean
  /** 自定义 video 节点 id，留空自动生成 */
  videoId?: string
  /** 进度条与选中态颜色 */
  activeColor?: string
  /** 弹幕发送回调 */
  onDanmu?: (danmu: VideoDanmu) => any
  /** 弹幕开关回调 */
  onDanmuToggle?: (open: boolean) => any
  /** 音量变更回调 */
  onVolumechange?: (payload: { volume: number; muted: boolean }) => any
  /** 倍速变更回调 */
  onRatechange?: (rate: number) => any
  /** 封屏状态变更回调 */
  onFullscreenchange?: (event: any) => any
  /** 播庌回调 */
  onEnded?: (event: any) => any
  /** 选集切换回调 */
  onEpisodeChange?: (payload: { index: number; episode: VideoEpisode }) => any
  /** 广告开始回调 */
  onAdStart?: (ad: VideoAd) => any
  /** 广告结束回调 */
  onAdEnd?: (payload: { ad: VideoAd; skipped: boolean }) => any
  /** 广告跳过回调 */
  onAdSkip?: (ad: VideoAd) => any
  /** 广告点击回调 */
  onAdClick?: (ad: VideoAd) => any
}

declare interface _Video {
  new (): {
    $props: AllowedComponentProps &
      VNodeProps &
      VideoProps
  }
}

export declare const Video: _Video
