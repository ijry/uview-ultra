<template>
    <view class="up-video-danmaku" :style="{ opacity: opacity }">
        <view
            v-for="item in items"
            :key="item.id"
            class="up-video-danmaku__item"
            :style="itemStyle(item)"
        >
            <text class="up-video-danmaku__text" :style="{ color: item.color, fontSize: fontSizePx }">{{ item.text }}</text>
        </view>
    </view>
</template>

<script setup>
    import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue'
    import { upGetRect } from '../../libs/function/index.js'
    import {
        acquireDanmuTrack,
        createDanmuState,
        estimateDanmuWidth,
        findDanmuCursor,
        normalizeDanmuItem,
        normalizeDanmuList,
        resetDanmuState
    } from './danmaku.js'

    defineOptions({
        name: 'video-danmaku',
        styleIsolation: 'app-and-page'
    })

    // 顶部/底部固定弹幕的停留毫秒数
    const STATIC_HOLD = 4000

    const props = defineProps({
        list: {
            type: Array,
            default: () => []
        },
        open: {
            type: Boolean,
            default: true
        },
        color: {
            type: String,
            default: '#ffffff'
        },
        fontSize: {
            type: [String, Number],
            default: 14
        },
        duration: {
            type: [String, Number],
            default: 8
        },
        // full 全屏 / half 上半屏 / top 顶部三行
        area: {
            type: String,
            default: 'full'
        },
        opacity: {
            type: [String, Number],
            default: 1
        },
        max: {
            type: [String, Number],
            default: 30
        }
    })

    // up-video 的弹幕层。父组件在 timeupdate 里调用 sync(currentTime) 投放弹幕，
    // 发送弹幕走 push()。文件名不以 up- 开头，避免被 easycom 当成公开组件。
    const instance = getCurrentInstance()?.proxy

    const items = ref([])
    const containerWidth = ref(0)
    const containerHeight = ref(0)
    const cursor = ref(0)
    const lastTime = ref(0)
    const seq = ref(0)
    const timers = ref([])
    const state = ref(createDanmuState())

    const fontSizePx = computed(() => `${Number(props.fontSize) || 14}px`)
    const trackHeight = computed(() => Math.round((Number(props.fontSize) || 14) * 1.6))
    const sortedList = computed(() => normalizeDanmuList(props.list))

    const measure = async () => {
        const rect = await upGetRect('.up-video-danmaku', false, instance)
        if (rect && rect.width) {
            containerWidth.value = rect.width
            containerHeight.value = rect.height
        }
        return rect
    }

    const trackCount = () => {
        const height = containerHeight.value || 0
        let usable = height
        if (props.area === 'half') usable = height / 2
        if (props.area === 'top') usable = trackHeight.value * 3
        return Math.max(1, Math.floor(usable / trackHeight.value) || 1)
    }

    // 拖动进度条、切集后调用，清空在屏弹幕并把游标移到新时间点
    const reset = (time = 0) => {
        clear()
        lastTime.value = Number(time) || 0
        cursor.value = findDanmuCursor(sortedList.value, lastTime.value)
    }

    const clear = () => {
        timers.value.forEach((timer) => clearTimeout(timer))
        timers.value = []
        items.value = []
        resetDanmuState(state.value)
    }

    const remove = (id) => {
        const index = items.value.findIndex((item) => item.id === id)
        if (index > -1) items.value.splice(index, 1)
    }

    const mount = (danmu, track, width, isStatic) => {
        seq.value += 1
        const life = isStatic ? STATIC_HOLD : (Number(props.duration) || 8) * 1000
        const item = {
            id: seq.value,
            text: danmu.text,
            color: danmu.color || props.color,
            width,
            type: danmu.type,
            offset: track * trackHeight.value,
            x: isStatic ? Math.max(0, (containerWidth.value - width) / 2) : containerWidth.value,
            moving: false,
            life
        }
        items.value.push(item)
        if (!isStatic) {
            // 必须等节点带着初始 transform 上屏，再改终点值，transition 才会跑起来
            const id = item.id
            timers.value.push(setTimeout(() => {
                const target = items.value.find((current) => current.id === id)
                if (target) {
                    target.x = -width
                    target.moving = true
                }
            }, 20))
        }
        timers.value.push(setTimeout(() => remove(item.id), life + 200))
    }

    const spawn = (danmu) => {
        if (!props.open || !danmu || !danmu.text) return
        if (items.value.length >= Number(props.max)) return
        if (!containerWidth.value) measure()
        const width = estimateDanmuWidth(danmu.text, props.fontSize)
        const isStatic = danmu.type === 'top' || danmu.type === 'bottom'
        const track = acquireDanmuTrack(state.value, {
            now: Date.now(),
            itemWidth: width,
            containerWidth: containerWidth.value,
            duration: Number(props.duration) || 8,
            trackCount: trackCount(),
            hold: isStatic ? STATIC_HOLD : 0
        })
        if (track < 0) return
        mount(danmu, track, width, isStatic)
    }

    // 播放进度推进时投放到点的弹幕，跳转超过 2 秒视为 seek
    const sync = (currentTime) => {
        const time = Number(currentTime) || 0
        if (!props.open) {
            lastTime.value = time
            return
        }
        if (time < lastTime.value || time - lastTime.value > 2) {
            reset(time)
        }
        lastTime.value = time
        const list = sortedList.value
        // 宽度还没量到（首帧或隐藏中）时先不投放，避免弹幕从左边冒出来
        if (!containerWidth.value) {
            measure()
            return
        }
        while (cursor.value < list.length && list[cursor.value].time <= time) {
            spawn(list[cursor.value])
            cursor.value += 1
        }
    }

    // 主动发送一条弹幕（输入框、外部调用）
    const push = (danmu) => {
        const item = normalizeDanmuItem(danmu)
        if (!item.text) return null
        item.time = lastTime.value
        spawn(item)
        return item
    }

    const itemStyle = (item) => {
        const style = {
            transform: `translateX(${item.x}px)`
        }
        if (item.type === 'bottom') {
            style.bottom = `${item.offset}px`
        } else {
            style.top = `${item.offset}px`
        }
        if (item.moving) {
            style.transitionProperty = 'transform'
            style.transitionDuration = `${item.life}ms`
            style.transitionTimingFunction = 'linear'
        }
        return style
    }

    watch(() => props.list, () => {
        // 换集/换弹幕源后重新对齐游标
        reset(lastTime.value)
    })

    watch(() => props.open, (value) => {
        if (!value) clear()
    })

    onMounted(() => {
        measure()
    })

    onBeforeUnmount(() => {
        clear()
    })

    defineExpose({
        reset,
        sync,
        push,
        clear
    })
</script>

<style lang="scss" scoped>
    .up-video-danmaku {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
    }

    .up-video-danmaku__item {
        position: absolute;
        left: 0;
        flex-direction: row;
    }

    .up-video-danmaku__text {
        line-height: 1.6;
    }
</style>
