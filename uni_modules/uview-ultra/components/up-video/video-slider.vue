<template>
    <view
        class="up-video-slider"
        :class="[disabled ? 'up-video-slider--disabled' : '']"
        @touchstart.stop.prevent="onTouchStart"
        @touchmove.stop.prevent="onTouchMove"
        @touchend.stop="onTouchEnd"
        @touchcancel.stop="onTouchEnd"
        @click.stop="onTrackClick"
    >
        <view class="up-video-slider__track" :style="{ height: barHeight }">
            <view
                v-if="buffered > 0"
                class="up-video-slider__buffered"
                :style="{ width: buffered + '%' }"
            ></view>
            <view
                class="up-video-slider__active"
                :style="{ width: innerPercent + '%', backgroundColor: activeColor }"
            ></view>
            <view
                class="up-video-slider__block"
                :style="blockStyle"
            ></view>
        </view>
    </view>
</template>

<script setup>
    import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
    import { upGetRect } from '../../libs/function/index.js'
    import { clampNumber } from './video-utils.js'

    defineOptions({
        name: 'video-slider',
        styleIsolation: 'app-and-page'
    })

    const props = defineProps({
        percent: {
            type: [String, Number],
            default: 0
        },
        // 已缓冲百分比，仅进度条使用
        buffered: {
            type: [String, Number],
            default: 0
        },
        activeColor: {
            type: String,
            default: '#2979ff'
        },
        barHeight: {
            type: String,
            default: '2px'
        },
        blockSize: {
            type: String,
            default: '10px'
        },
        disabled: {
            type: Boolean,
            default: false
        }
    })
    const emit = defineEmits(['start', 'changing', 'change'])

    // up-video 内部使用的拖动条，进度与音量共用。
    // 文件名不以 up- 开头，避免被 easycom 收录成公开组件。
    const instance = getCurrentInstance()?.proxy

    const dragging = ref(false)
    const innerPercent = ref(0)
    const rectLeft = ref(0)
    const rectWidth = ref(0)
    const rectReady = ref(false)
    const touchedAt = ref(0)

    const halfBlock = computed(() => {
        const size = parseFloat(props.blockSize)
        const unit = String(props.blockSize).replace(/[\d.]/g, '') || 'px'
        return `${size / 2}${unit}`
    })

    const blockStyle = computed(() => {
        return {
            left: innerPercent.value + '%',
            width: props.blockSize,
            height: props.blockSize,
            marginLeft: '-' + halfBlock.value,
            marginTop: '-' + halfBlock.value,
            backgroundColor: props.activeColor
        }
    })

    const ensureRect = async () => {
        if (rectReady.value) return
        const rect = await upGetRect('.up-video-slider__track', false, instance)
        if (rect && rect.width) {
            rectLeft.value = rect.left
            rectWidth.value = rect.width
            rectReady.value = true
        }
    }

    const percentFromPageX = (pageX) => {
        if (!rectReady.value || !rectWidth.value) return innerPercent.value
        return clampNumber(((pageX - rectLeft.value) / rectWidth.value) * 100, 0, 100)
    }

    const onTouchStart = async (event) => {
        if (props.disabled) return
        dragging.value = true
        await ensureRect()
        emit('start')
        onTouchMove(event)
    }

    const onTouchMove = (event) => {
        if (props.disabled || !dragging.value) return
        const touch = event.touches && event.touches[0]
            ? event.touches[0]
            : event.changedTouches && event.changedTouches[0]
        if (!touch) return
        innerPercent.value = percentFromPageX(touch.pageX)
        emit('changing', innerPercent.value)
    }

    const onTouchEnd = () => {
        if (props.disabled || !dragging.value) return
        dragging.value = false
        touchedAt.value = Date.now()
        emit('change', innerPercent.value)
    }

    const onTrackClick = async (event) => {
        // 触摸设备上 touchend 后浏览器还会补一个 click，这里只服务鼠标点击
        if (props.disabled || dragging.value) return
        if (touchedAt.value && Date.now() - touchedAt.value < 400) return
        const pageX = event.detail && event.detail.x !== undefined ? event.detail.x : event.pageX
        if (pageX === undefined) return
        await ensureRect()
        innerPercent.value = percentFromPageX(pageX)
        emit('change', innerPercent.value)
    }

    watch(() => props.percent, (value) => {
        // 拖动过程中不接受外部回写，否则手指会被播放进度拽走
        if (!dragging.value) innerPercent.value = clampNumber(value, 0, 100)
    })

    onMounted(() => {
        innerPercent.value = clampNumber(props.percent, 0, 100)
    })

    defineExpose({
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTrackClick
    })
</script>

<style lang="scss" scoped>
    .up-video-slider {
        flex: 1;
        padding-top: 8px;
        padding-bottom: 8px;
        justify-content: center;
    }

    .up-video-slider--disabled {
        opacity: 0.5;
    }

    .up-video-slider__track {
        position: relative;
        width: 100%;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.3);
    }

    .up-video-slider__buffered,
    .up-video-slider__active {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        border-radius: 4px;
    }

    .up-video-slider__buffered {
        background-color: rgba(255, 255, 255, 0.45);
    }

    .up-video-slider__block {
        position: absolute;
        top: 50%;
        border-radius: 50%;
    }
</style>
