<template>
    <view
        class="up-video"
        :class="[customClass, fullscreen ? 'up-video--fullscreen' : '']"
        :style="[rootStyle, addStyle(customStyle)]"
    >
        <video
            :id="innerVideoId"
            class="up-video__player"
            :src="playingSrc"
            :poster="currentPoster"
            :controls="false"
            :autoplay="nativeAutoplay"
            :loop="loop"
            :muted="innerMuted"
            :initial-time="initialTime"
            :object-fit="objectFit"
            :direction="nativeDirection"
            :show-fullscreen-btn="false"
            :show-play-btn="false"
            :show-center-play-btn="false"
            :show-mute-btn="false"
            :enable-progress-gesture="enableProgressGesture"
            :page-gesture="pageGesture"
            :vslide-gesture="vslideGesture"
            :auto-pause-if-navigate="autoPauseIfNavigate"
            :auto-pause-if-open-native="autoPauseIfOpenNative"
            @play="onPlay"
            @pause="onPause"
            @ended="onEnded"
            @timeupdate="onTimeUpdate"
            @waiting="onWaiting"
            @error="onError"
            @progress="onProgress"
            @fullscreenchange="onFullscreenChange"
            @loadedmetadata="onLoadedMetadata"
        >
            <video-danmaku
                v-if="enableDanmu"
                ref="danmaku"
                class="up-video__layer"
                :list="activeDanmuList"
                :open="innerDanmuOpen"
                :color="danmuColor"
                :font-size="danmuFontSize"
                :duration="danmuDuration"
                :area="danmuArea"
                :opacity="danmuOpacity"
                :max="danmuMax"
            ></video-danmaku>

            <view class="up-video__layer" @click.stop="onPlayerTap"></view>

            <view v-if="loading" class="up-video__layer up-video__center">
                <up-loading-icon mode="circle" color="#ffffff" size="30"></up-loading-icon>
            </view>

            <view v-if="errored" class="up-video__layer up-video__center up-video__mask">
                <text class="up-video__hint">{{ t('up.video.video_error') }}</text>
                <view class="up-video__retry" @click.stop="retry">
                    <text class="up-video__retry-text">{{ t('up.common.retry') }}</text>
                </view>
            </view>

            <view v-if="coverVisible" class="up-video__layer up-video__cover" @click.stop="onCoverTap">
                <image v-if="currentPoster" class="up-video__cover-image" :src="currentPoster" mode="aspectFill"></image>
                <view class="up-video__cover-mask"></view>
                <view v-if="showCenterPlayBtn" class="up-video__cover-btn">
                    <up-icon name="play-right-fill" color="#ffffff" size="26"></up-icon>
                </view>
            </view>

            <view v-if="topBarVisible" class="up-video__top">
                <view v-if="showBack" class="up-video__icon-btn" @click.stop="onBack">
                    <up-icon :name="backIcon" color="#ffffff" size="20"></up-icon>
                </view>
                <text v-if="title" class="up-video__top-title">{{ title }}</text>
            </view>

            <view v-if="locked" class="up-video__unlock" @click.stop="toggleLock">
                <up-icon name="lock-fill" color="#ffffff" size="18"></up-icon>
            </view>

            <view v-if="barVisible" class="up-video__controls">
                <view class="up-video__row">
                    <view class="up-video__icon-btn" @click.stop="toggle">
                        <up-icon :name="playing ? 'pause' : 'play-right-fill'" color="#ffffff" size="18"></up-icon>
                    </view>
                    <text class="up-video__time">{{ timeText }}</text>
                    <video-slider
                        :percent="progressPercent"
                        :buffered="bufferedPercent"
                        :active-color="activeColor"
                        @start="onProgressStart"
                        @changing="onProgressChanging"
                        @change="onProgressChange"
                    ></video-slider>
                    <text class="up-video__time">{{ durationText }}</text>
                    <view v-if="showVolume" class="up-video__icon-btn" @click.stop="togglePanel('volume')">
                        <up-icon :name="volumeIcon" color="#ffffff" size="18"></up-icon>
                    </view>
                    <view v-if="danmuEntryVisible" class="up-video__icon-btn" @click.stop="togglePanel('danmu')">
                        <up-icon name="chat-fill" color="#ffffff" size="18"></up-icon>
                    </view>
                    <view v-if="showRate" class="up-video__text-btn" @click.stop="togglePanel('rate')">
                        <text class="up-video__btn-text">{{ rateText }}</text>
                    </view>
                    <view v-if="showLock" class="up-video__icon-btn" @click.stop="toggleLock">
                        <up-icon name="lock-fill" color="#ffffff" size="18"></up-icon>
                    </view>
                    <view v-if="showFullscreenBtn" class="up-video__icon-btn" @click.stop="toggleFullscreen">
                        <view class="up-video__fullscreen">
                            <view class="up-video__corner-tl"></view>
                            <view class="up-video__corner-tr"></view>
                            <view class="up-video__corner-bl"></view>
                            <view class="up-video__corner-br"></view>
                        </view>
                    </view>
                </view>
            </view>

            <view v-if="panel === 'rate'" class="up-video__layer up-video__panel" @click.stop="closePanel">
                <view class="up-video__panel-body" @click.stop="noop">
                    <text class="up-video__panel-title">{{ t('up.video.video_rate') }}</text>
                    <view
                        v-for="(item, index) in rates"
                        :key="index"
                        class="up-video__panel-item"
                        @click.stop="setRate(item)"
                    >
                        <text
                            class="up-video__panel-text"
                            :style="{ color: item === innerRate ? activeColor : '#ffffff' }"
                        >{{ item }}x</text>
                    </view>
                </view>
            </view>

            <view v-if="panel === 'episode'" class="up-video__layer up-video__panel" @click.stop="closePanel">
                <view class="up-video__panel-body up-video__panel-body--wide" @click.stop="noop">
                    <text class="up-video__panel-title">{{ t('up.video.video_episodes') }}</text>
                    <view class="up-video__episode-grid">
                        <view
                            v-for="(item, index) in episodeList"
                            :key="index"
                            class="up-video__episode-cell"
                            :style="{ width: episodeWidth }"
                            @click.stop="switchEpisode(index)"
                        >
                            <view class="up-video__episode" :style="episodeStyle(index)">
                                <text class="up-video__episode-text">{{ item.title }}</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <view v-if="panel === 'volume'" class="up-video__volume" @click.stop="noop">
                <view class="up-video__icon-btn" @click.stop="toggleMute">
                    <up-icon :name="volumeIcon" color="#ffffff" size="16"></up-icon>
                </view>
                <text class="up-video__volume-label">{{ t('up.video.video_volume') }}</text>
                <video-slider
                    :percent="volumePercent"
                    :active-color="activeColor"
                    @changing="onVolumeChanging"
                    @change="onVolumeChange"
                ></video-slider>
                <text class="up-video__volume-value">{{ volumeText }}</text>
            </view>
        </video>

        <view v-if="currentAd" class="up-video__ad">
            <video
                v-if="currentAd.src"
                :id="adVideoId"
                class="up-video__ad-media"
                :src="currentAd.src"
                :controls="false"
                :muted="innerMuted"
                autoplay
                object-fit="contain"
                @timeupdate="onAdTimeUpdate"
                @ended="finishAd"
                @error="finishAd"
            ></video>
            <image
                v-else-if="currentAd.image"
                class="up-video__ad-media"
                :src="currentAd.image"
                mode="aspectFill"
                @click="onAdClick"
            ></image>
            <view class="up-video__ad-bar">
                <text class="up-video__ad-tag">{{ adTagText }}</text>
                <view v-if="currentAd.link" class="up-video__ad-btn" @click.stop="onAdClick">
                    <text class="up-video__ad-btn-text">{{ t('up.video.video_adDetail') }}</text>
                </view>
                <view v-if="adCanSkip" class="up-video__ad-btn" @click.stop="skipAd">
                    <text class="up-video__ad-btn-text">{{ t('up.video.video_skipAd') }}</text>
                </view>
            </view>
        </view>

        <view v-if="pauseAdVisible" class="up-video__pause-ad">
            <image
                class="up-video__pause-ad-media"
                :src="pauseAdItem.image"
                mode="aspectFit"
                @click="onAdClick"
            ></image>
            <view class="up-video__pause-ad-close" @click.stop="closePauseAd">
                <up-icon name="close" color="#ffffff" size="14"></up-icon>
            </view>
        </view>

        <view v-if="panel === 'danmu'" class="up-video__danmu-input">
            <input
                v-model="danmuText"
                class="up-video__danmu-field"
                type="text"
                :placeholder="t('up.video.video_danmuPlaceholder')"
                placeholder-style="color: rgba(255, 255, 255, 0.5)"
                confirm-type="send"
                @confirm="sendDanmu"
            />
            <view class="up-video__danmu-send" :style="{ backgroundColor: activeColor }" @click.stop="sendDanmu">
                <text class="up-video__danmu-send-text">{{ t('up.video.video_send') }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
    import { addStyle, addUnit, guid, toast } from '../../libs/function/index.js'
    import { commonProps } from '../../libs/composable/useUltraUI.js'
    import { t } from '../../libs/i18n/index.js'
    import { props as videoProps } from './props.js'
    import VideoDanmaku from './video-danmaku.vue'
    import VideoSlider from './video-slider.vue'
    import {
        adSkippable,
        clampNumber,
        formatVideoTime,
        normalizeAds,
        normalizeEpisodes,
        normalizeRateList,
        pickAds,
        progressToTime,
        timeToProgress
    } from './video-utils.js'

    defineOptions({
        name: 'up-video',
        styleIsolation: 'app-and-page'
    })

    const props = defineProps({
        ...commonProps,
        ...videoProps
    })

    const emit = defineEmits([
        'play', 'pause', 'ended', 'timeupdate', 'waiting', 'error', 'progress',
        'fullscreenchange', 'loadedmetadata', 'ratechange', 'controlstoggle', 'lock',
        'back', 'volumechange', 'danmu-toggle', 'danmu', 'episode-change',
        'ad-start', 'ad-end', 'ad-skip', 'ad-click',
        'update:rate', 'update:volume', 'update:danmuOpen', 'update:episodeIndex'
    ])

    // ============ 内部状态 ============
    const instance = getCurrentInstance()?.proxy
    const danmaku = ref(null)
    const ctx = ref(null)
    const hideTimer = ref(null)
    const adTimer = ref(null)

    const innerVideoId = ref(props.videoId || `up-video-${guid(10, false)}`)
    const adVideoId = ref(`${innerVideoId.value}-ad`)

    const playing = ref(false)
    const started = ref(false)
    const loading = ref(false)
    const errored = ref(false)
    const currentTime = ref(0)
    const videoDuration = ref(0)
    const buffered = ref(0)
    const dragging = ref(false)
    const dragPercent = ref(0)
    const controlsVisible = ref(true)
    const locked = ref(false)
    const fullscreen = ref(false)
    // '' | rate | episode | volume | danmu
    const panel = ref('')
    const innerRate = ref(Number(props.rate) || 1)
    const innerVolume = ref(clampNumber(props.volume, 0, 1))
    const innerMuted = ref(props.muted)
    const innerDanmuOpen = ref(props.danmuOpen)
    const innerEpisodeIndex = ref(parseInt(props.episodeIndex, 10) || 0)
    const danmuText = ref('')
    const currentAd = ref(null)
    const adRole = ref('')
    const adElapsed = ref(0)
    const adDuration = ref(0)
    const prerollCursor = ref(0)
    const postrollCursor = ref(0)
    const pauseAdVisible = ref(false)

    const noop = () => {}

    // ============ 计算属性 ============
    const rootStyle = computed(() => {
        const style = {
            width: addUnit(props.width),
            height: addUnit(props.height)
        }
        if (props.radius) style.borderRadius = addUnit(props.radius)
        return style
    })

    // uni 的 direction 只接受 0 / 90 / -90，-1 表示交给系统判断
    const nativeDirection = computed(() => {
        const direction = Number(props.direction)
        return [0, 90, -90].includes(direction) ? direction : undefined
    })

    // 有前置广告时交给组件自己调度，避免原生自动播放抢在广告之前
    const nativeAutoplay = computed(() => props.autoplay && prerollAds.value.length === 0)

    const episodeList = computed(() => normalizeEpisodes(props.episodes))
    const currentEpisode = computed(() => {
        const index = innerEpisodeIndex.value
        if (index < 0 || index >= episodeList.value.length) return null
        return episodeList.value[index]
    })
    const playingSrc = computed(() => {
        const episode = currentEpisode.value
        return (episode && episode.src) || props.src
    })
    const currentPoster = computed(() => {
        const episode = currentEpisode.value
        return (episode && episode.poster) || props.poster
    })
    const activeDanmuList = computed(() => {
        const episode = currentEpisode.value
        return (episode && episode.danmuList) || props.danmuList
    })

    const rates = computed(() => normalizeRateList(props.rateList))
    const normalizedAds = computed(() => normalizeAds(props.ads))
    const prerollAds = computed(() => pickAds(normalizedAds.value, 'preroll'))
    const postrollAds = computed(() => pickAds(normalizedAds.value, 'postroll'))
    const pauseAdItem = computed(() => pickAds(normalizedAds.value, 'pause')[0] || null)

    const coverVisible = computed(() => !started.value && !currentAd.value)
    const topBarVisible = computed(() => {
        return controlsVisible.value && !locked.value && !currentAd.value && (props.showBack || !!props.title)
    })
    const barVisible = computed(() => {
        return props.controls && controlsVisible.value && !locked.value && !currentAd.value
    })
    const danmuEntryVisible = computed(() => props.enableDanmu && props.danmuBtn)

    const progressPercent = computed(() => {
        return dragging.value ? dragPercent.value : timeToProgress(currentTime.value, videoDuration.value)
    })
    const bufferedPercent = computed(() => clampNumber(buffered.value, 0, 100))
    const timeText = computed(() => {
        const time = dragging.value ? progressToTime(dragPercent.value, videoDuration.value) : currentTime.value
        return formatVideoTime(time)
    })
    const durationText = computed(() => formatVideoTime(videoDuration.value))
    const rateText = computed(() => `${innerRate.value}x`)
    const volumePercent = computed(() => {
        return innerMuted.value ? 0 : clampNumber(innerVolume.value * 100, 0, 100)
    })
    const volumeText = computed(() => `${Math.round(volumePercent.value)}`)
    const volumeIcon = computed(() => {
        return (innerMuted.value || innerVolume.value <= 0) ? 'volume-off' : 'volume'
    })
    const episodeWidth = computed(() => {
        const columns = Math.max(1, parseInt(props.episodeColumns, 10) || 1)
        return `${(100 / columns).toFixed(4)}%`
    })
    const adCanSkip = computed(() => {
        return !!currentAd.value && adSkippable(currentAd.value, adElapsed.value)
    })
    const adTagText = computed(() => {
        if (!currentAd.value) return ''
        const total = Number(adDuration.value) || 0
        if (total > 0) {
            const left = Math.max(0, Math.ceil(total - adElapsed.value))
            return t('up.video.video_adCountdown', { seconds: left })
        }
        return t('up.video.video_ad')
    })

    const episodeStyle = (index) => {
        const active = Number(index) === Number(innerEpisodeIndex.value)
        return {
            backgroundColor: active ? props.activeColor : 'rgba(255, 255, 255, 0.16)'
        }
    }

    // ============ VideoContext ============
    const getContext = () => {
        if (!ctx.value) {
            ctx.value = uni.createVideoContext(innerVideoId.value, instance)
        }
        return ctx.value
    }

    // ============ 播放控制 ============
    const play = () => {
        if (currentAd.value) return
        if (playAdQueue('preroll')) return
        playMain()
    }

    const playMain = () => {
        started.value = true
        errored.value = false
        closePauseAd()
        const context = getContext()
        if (context) context.play()
    }

    const pause = () => {
        const context = getContext()
        if (context) context.pause()
    }

    const toggle = () => {
        if (playing.value) {
            pause()
        } else {
            play()
        }
    }

    const stop = () => {
        const context = getContext()
        if (context) context.stop()
        playing.value = false
        started.value = false
        currentTime.value = 0
    }

    const seek = (time) => {
        const target = clampNumber(time, 0, videoDuration.value || Number(time) || 0)
        const context = getContext()
        if (context) context.seek(target)
        currentTime.value = target
        if (danmaku.value) danmaku.value.reset(target)
        return target
    }

    const retry = () => {
        errored.value = false
        loading.value = true
        nextTick(() => playMain())
    }

    // 换源、换集后把播放态清干净，广告游标一起重置
    const resetPlayback = () => {
        playing.value = false
        started.value = false
        loading.value = false
        errored.value = false
        currentTime.value = 0
        videoDuration.value = 0
        buffered.value = 0
        dragging.value = false
        prerollCursor.value = 0
        postrollCursor.value = 0
        closePauseAd()
        if (danmaku.value) danmaku.value.reset(0)
    }

    // ============ 原生事件 ============
    const onPlay = (event) => {
        playing.value = true
        started.value = true
        loading.value = false
        errored.value = false
        closePauseAd()
        applyRate()
        applyVolume()
        scheduleHide()
        emit('play', event)
    }

    const onPause = (event) => {
        playing.value = false
        showControls()
        if (pauseAdItem.value && started.value && !currentAd.value) {
            pauseAdVisible.value = true
        }
        emit('pause', event)
    }

    const onEnded = (event) => {
        playing.value = false
        emit('ended', event)
        if (props.loop) return
        if (props.autoNext && innerEpisodeIndex.value < episodeList.value.length - 1) {
            switchEpisode(innerEpisodeIndex.value + 1)
            return
        }
        if (playAdQueue('postroll')) return
        started.value = false
        currentTime.value = 0
        showControls()
    }

    const onTimeUpdate = (event) => {
        const detail = (event && event.detail) || {}
        if (!dragging.value && detail.currentTime !== undefined) {
            currentTime.value = detail.currentTime
        }
        if (detail.duration) videoDuration.value = detail.duration
        loading.value = false
        if (danmaku.value) danmaku.value.sync(currentTime.value)
        emit('timeupdate', event)
    }

    const onWaiting = (event) => {
        loading.value = true
        emit('waiting', event)
    }

    const onError = (event) => {
        loading.value = false
        playing.value = false
        errored.value = true
        emit('error', event)
    }

    const onProgress = (event) => {
        const detail = (event && event.detail) || {}
        if (detail.buffered !== undefined) buffered.value = detail.buffered
        emit('progress', event)
    }

    const onFullscreenChange = (event) => {
        const detail = (event && event.detail) || {}
        fullscreen.value = !!detail.fullScreen
        showControls()
        emit('fullscreenchange', event)
    }

    const onLoadedMetadata = (event) => {
        const detail = (event && event.detail) || {}
        if (detail.duration) videoDuration.value = detail.duration
        loading.value = false
        emit('loadedmetadata', event)
    }

    // ============ 控制层显示 ============
    const onPlayerTap = () => {
        if (locked.value) return
        if (panel.value) {
            closePanel()
            return
        }
        toggleControls()
    }

    const onCoverTap = () => {
        play()
    }

    const toggleControls = () => {
        controlsVisible.value = !controlsVisible.value
        emit('controlstoggle', controlsVisible.value)
        if (controlsVisible.value) scheduleHide()
    }

    const showControls = () => {
        controlsVisible.value = true
        scheduleHide()
    }

    const clearHideTimer = () => {
        if (hideTimer.value) {
            clearTimeout(hideTimer.value)
            hideTimer.value = null
        }
    }

    const scheduleHide = () => {
        clearHideTimer()
        const delay = Number(props.autoHide)
        if (!delay || delay <= 0) return
        hideTimer.value = setTimeout(() => {
            // 面板打开或暂停时不收起，避免操作被打断
            if (panel.value || !playing.value) return
            controlsVisible.value = false
            emit('controlstoggle', false)
        }, delay)
    }

    const togglePanel = (name) => {
        panel.value = panel.value === name ? '' : name
        if (panel.value) clearHideTimer()
        else scheduleHide()
    }

    const closePanel = () => {
        panel.value = ''
        scheduleHide()
    }

    const toggleLock = () => {
        locked.value = !locked.value
        if (locked.value) {
            panel.value = ''
            controlsVisible.value = false
            toast(t('up.video.video_lock'))
        } else {
            showControls()
            toast(t('up.video.video_unlock'))
        }
        emit('lock', locked.value)
    }

    const onBack = () => {
        if (fullscreen.value) {
            exitFullScreen()
            return
        }
        emit('back')
    }

    // ============ 进度拖动 ============
    const onProgressStart = () => {
        dragging.value = true
        dragPercent.value = timeToProgress(currentTime.value, videoDuration.value)
        clearHideTimer()
    }

    const onProgressChanging = (percent) => {
        dragPercent.value = percent
    }

    const onProgressChange = (percent) => {
        dragging.value = false
        seek(progressToTime(percent, videoDuration.value))
        scheduleHide()
    }

    // ============ 倍速 ============
    const applyRate = () => {
        const context = getContext()
        if (context && context.playbackRate) context.playbackRate(innerRate.value)
    }

    const setRate = (rate, silent = false) => {
        const value = Number(rate)
        if (!isFinite(value) || value <= 0) return
        innerRate.value = value
        applyRate()
        closePanel()
        if (!silent) {
            emit('update:rate', value)
            emit('ratechange', value)
        }
    }

    // ============ 音量 ============
    const applyVolume = () => {
        const value = innerMuted.value ? 0 : clampNumber(innerVolume.value, 0, 1)
        // #ifdef H5
        if (typeof document !== 'undefined') {
            const wrapper = document.getElementById(innerVideoId.value)
            const media = wrapper ? wrapper.querySelector('video') : null
            if (media) media.volume = value
        }
        // #endif
        // #ifdef APP-PLUS
        if (typeof plus !== 'undefined' && plus.device && plus.device.setVolume) {
            plus.device.setVolume(value)
        }
        // #endif
        return value
    }

    const setVolume = (value, silent = false) => {
        innerVolume.value = clampNumber(value, 0, 1)
        if (innerVolume.value > 0) innerMuted.value = false
        applyVolume()
        if (!silent) {
            emit('update:volume', innerVolume.value)
            emit('volumechange', { volume: innerVolume.value, muted: innerMuted.value })
        }
    }

    const onVolumeChanging = (percent) => {
        setVolume(percent / 100, true)
    }

    const onVolumeChange = (percent) => {
        setVolume(percent / 100)
    }

    const toggleMute = () => {
        innerMuted.value = !innerMuted.value
        applyVolume()
        emit('volumechange', { volume: innerVolume.value, muted: innerMuted.value })
    }

    // ============ 弹幕 ============
    const toggleDanmu = () => {
        innerDanmuOpen.value = !innerDanmuOpen.value
        emit('update:danmuOpen', innerDanmuOpen.value)
        emit('danmu-toggle', innerDanmuOpen.value)
    }

    const sendDanmu = (payload) => {
        let danmu = null
        if (typeof payload === 'string') {
            danmu = { text: payload }
        } else if (payload && payload.text) {
            danmu = payload
        } else {
            danmu = { text: danmuText.value }
        }
        if (!danmu.text) return null
        const item = {
            text: danmu.text,
            color: danmu.color || props.danmuColor,
            time: currentTime.value,
            type: danmu.type || 'scroll'
        }
        if (danmaku.value) {
            if (!innerDanmuOpen.value) {
                innerDanmuOpen.value = true
                emit('update:danmuOpen', true)
            }
            danmaku.value.push(item)
        }
        danmuText.value = ''
        closePanel()
        emit('danmu', item)
        return item
    }

    // ============ 选集 ============
    const switchEpisode = (index, silent = false) => {
        closePanel()
        const target = parseInt(index, 10)
        if (!isFinite(target) || target < 0 || target >= episodeList.value.length) return
        if (target === innerEpisodeIndex.value && started.value) return
        innerEpisodeIndex.value = target
        resetPlayback()
        if (!silent) {
            emit('update:episodeIndex', target)
            emit('episode-change', { index: target, episode: episodeList.value[target] })
        }
        // 等 src 生效后再播，否则部分平台会播上一集
        nextTick(() => play())
    }

    const playNext = () => {
        switchEpisode(innerEpisodeIndex.value + 1)
    }

    // ============ 全屏 ============
    const requestFullScreen = () => {
        const context = getContext()
        if (!context || !context.requestFullScreen) return
        const direction = nativeDirection.value
        context.requestFullScreen(direction === undefined ? {} : { direction })
    }

    const exitFullScreen = () => {
        const context = getContext()
        if (context && context.exitFullScreen) context.exitFullScreen()
    }

    const toggleFullscreen = () => {
        if (fullscreen.value) {
            exitFullScreen()
        } else {
            requestFullScreen()
        }
    }

    // ============ 广告 ============
    const clearAdTimer = () => {
        if (adTimer.value) {
            clearInterval(adTimer.value)
            adTimer.value = null
        }
    }

    const startAd = (ad) => {
        // 先落 currentAd，再暂停正片，避免异步的 pause 事件把暂停贴片顶出来
        currentAd.value = ad
        adElapsed.value = 0
        adDuration.value = Number(ad.duration) || 0
        panel.value = ''
        pause()
        closePauseAd()
        emit('ad-start', ad)
        // 图片广告没有 timeupdate，用定时器走倒计时
        if (!ad.src) {
            clearAdTimer()
            adTimer.value = setInterval(() => {
                adElapsed.value += 0.5
                if (adDuration.value > 0 && adElapsed.value >= adDuration.value) finishAd()
            }, 500)
        }
    }

    const playAdQueue = (role) => {
        const list = role === 'preroll' ? prerollAds.value : postrollAds.value
        const cursor = role === 'preroll' ? prerollCursor : postrollCursor
        if (cursor.value >= list.length) return false
        const ad = list[cursor.value]
        cursor.value += 1
        adRole.value = role
        startAd(ad)
        return true
    }

    const onAdTimeUpdate = (event) => {
        const detail = (event && event.detail) || {}
        if (detail.currentTime !== undefined) adElapsed.value = detail.currentTime
        if (!adDuration.value && detail.duration) adDuration.value = detail.duration
    }

    const skipAd = () => {
        if (!adCanSkip.value) return
        emit('ad-skip', currentAd.value)
        finishAd(true)
    }

    const onAdClick = () => {
        // 只抛事件，跳转交给业务侧决定
        emit('ad-click', currentAd.value || pauseAdItem.value)
    }

    const finishAd = (skipped = false) => {
        const ad = currentAd.value
        const role = adRole.value
        clearAdTimer()
        currentAd.value = null
        adRole.value = ''
        adElapsed.value = 0
        adDuration.value = 0
        if (ad) emit('ad-end', { ad, skipped })
        nextTick(() => {
            if (role === 'preroll') {
                if (!playAdQueue('preroll')) playMain()
                return
            }
            if (role === 'postroll' && !playAdQueue('postroll')) {
                // 后置广告播完回到封面
                started.value = false
                currentTime.value = 0
            }
        })
    }

    const closePauseAd = () => {
        pauseAdVisible.value = false
    }

    // ============ 监听 ============
    watch(() => props.src, () => {
        resetPlayback()
    })

    watch(() => props.episodeIndex, (value) => {
        const index = parseInt(value, 10) || 0
        if (index !== innerEpisodeIndex.value) switchEpisode(index, true)
    })

    watch(() => props.rate, (value) => {
        setRate(value, true)
    })

    watch(() => props.volume, (value) => {
        innerVolume.value = clampNumber(value, 0, 1)
        applyVolume()
    })

    watch(() => props.muted, (value) => {
        innerMuted.value = value
        applyVolume()
    })

    watch(() => props.danmuOpen, (value) => {
        innerDanmuOpen.value = value
    })

    onMounted(() => {
        applyVolume()
        if (props.autoplay) {
            // 原生 autoplay 已经被前置广告接管时，这里补一次调度
            if (prerollAds.value.length) {
                play()
            } else {
                started.value = true
            }
        }
        scheduleHide()
    })

    onBeforeUnmount(() => {
        clearHideTimer()
        clearAdTimer()
    })

    defineExpose({
        play,
        pause,
        toggle,
        stop,
        seek,
        retry,
        sendDanmu,
        toggleDanmu,
        toggleControls,
        toggleLock,
        toggleFullscreen,
        requestFullScreen,
        exitFullScreen,
        switchEpisode,
        playNext,
        skipAd,
        closePanel,
        closePauseAd,
        playing,
        started,
        currentTime,
        videoDuration,
        fullscreen,
        locked,
        panel
    })
</script>

<style lang="scss" scoped>
    .up-video {
        position: relative;
        overflow: hidden;
        background-color: #000000;
    }

    .up-video__player {
        width: 100%;
        height: 100%;
    }

    /* 控制层统一铺满 video 节点 */
    .up-video__layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .up-video__center {
        align-items: center;
        justify-content: center;
    }

    .up-video__mask {
        background-color: rgba(0, 0, 0, 0.5);
    }

    .up-video__hint {
        color: #ffffff;
        font-size: 14px;
    }

    .up-video__retry {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin-top: 10px;
        padding: 4px 14px;
        border-radius: 30px;
        border-width: 1px;
        border-style: solid;
        border-color: rgba(255, 255, 255, 0.7);
    }

    .up-video__retry-text {
        color: #ffffff;
        font-size: 12px;
    }

    .up-video__cover {
        align-items: center;
        justify-content: center;
        background-color: #000000;
    }

    .up-video__cover-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .up-video__cover-mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.25);
    }

    .up-video__cover-btn {
        width: 52px;
        height: 52px;
        border-radius: 26px;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.45);
    }

    .up-video__top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        flex-direction: row;
        align-items: center;
        padding-left: 6px;
        padding-right: 6px;
        background-color: rgba(0, 0, 0, 0.3);
    }

    .up-video__top-title {
        flex: 1;
        margin-left: 6px;
        color: #ffffff;
        font-size: 14px;
        lines: 1;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    .up-video__icon-btn {
        width: 30px;
        height: 30px;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .up-video__text-btn {
        height: 30px;
        padding-left: 5px;
        padding-right: 5px;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .up-video__btn-text {
        color: #ffffff;
        font-size: 12px;
    }

    .up-video__controls {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding-left: 4px;
        padding-right: 4px;
        background-color: rgba(0, 0, 0, 0.35);
    }

    .up-video__row {
        flex-direction: row;
        align-items: center;
    }

    .up-video__time {
        width: 44px;
        color: #ffffff;
        font-size: 11px;
        text-align: center;
    }

    .up-video__unlock {
        position: absolute;
        left: 12px;
        top: 50%;
        margin-top: -16px;
        width: 32px;
        height: 32px;
        border-radius: 16px;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
    }

    /* 全屏图标用 4 个角括号拼出来，图标字体里没有对应字形 */
    .up-video__fullscreen {
        position: relative;
        width: 15px;
        height: 15px;
    }

    .up-video__corner-tl,
    .up-video__corner-tr,
    .up-video__corner-bl,
    .up-video__corner-br {
        position: absolute;
        width: 6px;
        height: 6px;
        border-style: solid;
        border-color: #ffffff;
        border-top-width: 0;
        border-right-width: 0;
        border-bottom-width: 0;
        border-left-width: 0;
    }

    .up-video__corner-tl {
        top: 0;
        left: 0;
        border-top-width: 2px;
        border-left-width: 2px;
    }

    .up-video__corner-tr {
        top: 0;
        right: 0;
        border-top-width: 2px;
        border-right-width: 2px;
    }

    .up-video__corner-bl {
        bottom: 0;
        left: 0;
        border-bottom-width: 2px;
        border-left-width: 2px;
    }

    .up-video__corner-br {
        bottom: 0;
        right: 0;
        border-bottom-width: 2px;
        border-right-width: 2px;
    }

    .up-video__panel {
        flex-direction: row;
        justify-content: flex-end;
        background-color: rgba(0, 0, 0, 0.4);
    }

    .up-video__panel-body {
        width: 104px;
        height: 100%;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.85);
    }

    .up-video__panel-body--wide {
        width: 240px;
    }

    .up-video__panel-title {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        margin-bottom: 6px;
    }

    .up-video__panel-item {
        height: 32px;
        justify-content: center;
    }

    .up-video__panel-text {
        font-size: 13px;
    }

    .up-video__episode-grid {
        flex-direction: row;
        flex-wrap: wrap;
    }

    .up-video__episode {
        height: 32px;
        margin: 3px;
        border-radius: 4px;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .up-video__episode-text {
        color: #ffffff;
        font-size: 12px;
    }

    .up-video__volume {
        position: absolute;
        right: 44px;
        bottom: 44px;
        width: 200px;
        flex-direction: row;
        align-items: center;
        padding-left: 4px;
        padding-right: 10px;
        border-radius: 30px;
        background-color: rgba(0, 0, 0, 0.85);
    }

    .up-video__volume-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        margin-right: 6px;
    }

    .up-video__volume-value {
        width: 28px;
        margin-left: 6px;
        color: #ffffff;
        font-size: 11px;
        text-align: right;
    }

    .up-video__ad {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #000000;
    }

    .up-video__ad-media {
        width: 100%;
        height: 100%;
    }

    .up-video__ad-bar {
        position: absolute;
        top: 8px;
        right: 8px;
        flex-direction: row;
        align-items: center;
    }

    .up-video__ad-tag {
        color: #ffffff;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 3px;
        background-color: rgba(0, 0, 0, 0.55);
    }

    .up-video__ad-btn {
        margin-left: 6px;
        padding: 2px 8px;
        border-radius: 3px;
        flex-direction: row;
        align-items: center;
        border-width: 1px;
        border-style: solid;
        border-color: rgba(255, 255, 255, 0.6);
        background-color: rgba(0, 0, 0, 0.55);
    }

    .up-video__ad-btn-text {
        color: #ffffff;
        font-size: 11px;
    }

    .up-video__pause-ad {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.6);
    }

    .up-video__pause-ad-media {
        width: 70%;
        height: 60%;
    }

    .up-video__pause-ad-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 12px;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.6);
    }

    .up-video__danmu-input {
        position: absolute;
        left: 8px;
        right: 8px;
        bottom: 8px;
        flex-direction: row;
        align-items: center;
        padding: 4px 4px 4px 12px;
        border-radius: 30px;
        background-color: rgba(0, 0, 0, 0.85);
    }

    .up-video__danmu-field {
        flex: 1;
        height: 30px;
        color: #ffffff;
        font-size: 13px;
    }

    .up-video__danmu-send {
        height: 28px;
        padding-left: 14px;
        padding-right: 14px;
        border-radius: 20px;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .up-video__danmu-send-text {
        color: #ffffff;
        font-size: 12px;
    }
</style>
