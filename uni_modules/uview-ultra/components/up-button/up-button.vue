<template>
    <!-- #ifndef APP-NVUE -->
    <button
        :hover-start-time="Number(hoverStartTime)"
        :hover-stay-time="Number(hoverStayTime)"
        :form-type="formType"
        :open-type="openType"
        :app-parameter="appParameter"
        :hover-stop-propagation="hoverStopPropagation"
        :send-message-title="sendMessageTitle"
        :send-message-path="sendMessagePath"
        :lang="lang"
        :data-name="dataName"
        :session-from="sessionFrom"
        :send-message-img="sendMessageImg"
        :show-message-card="showMessageCard"
        @getphonenumber="getphonenumber"
        @getuserinfo="getuserinfo"
        @error="error"
        @opensetting="opensetting"
        @launchapp="launchapp"
        @agreeprivacyauthorization="agreeprivacyauthorization"
        :hover-class="!disabled && !loading ? 'up-button--active' : ''"
        class="up-button up-reset-button"
        :style="[baseColor, addStyle(customStyle)]"
        @tap="clickHandler"
        :class="bemClass"
    >
        <template v-if="loading">
            <up-loading-icon
                :mode="loadingMode"
                :size="loadingSize * 1.15"
                :color="loadingColor"
            ></up-loading-icon>
            <text
                class="up-button__loading-text"
                :style="[{ fontSize: textSize + 'px' }]"
                >{{ loadingText || text }}</text
            >
        </template>
        <template v-else>
            <up-icon
                v-if="icon"
                :name="icon"
                :color="iconColorCom"
                :size="textSize * 1.35"
                :customStyle="{ marginRight: '2px' }"
            ></up-icon>
            <slot>
                <text
                    class="up-button__text"
                    :style="[{ fontSize: textSize + 'px' }]"
                    >{{ text }}</text
                >
            </slot>
        </template>
    </button>
    <!-- #endif -->

    <!-- #ifdef APP-NVUE -->
    <view
        :hover-start-time="Number(hoverStartTime)"
        :hover-stay-time="Number(hoverStayTime)"
        class="up-button"
        :hover-class="
            !disabled && !loading && !color && (plain || type === 'info')
                ? 'up-button--active--plain'
                : !disabled && !loading && !plain
                ? 'up-button--active'
                : ''
        "
        @tap="clickHandler"
        :class="bemClass"
        :style="[baseColor, addStyle(customStyle)]"
    >
        <template v-if="loading">
            <up-loading-icon
                :mode="loadingMode"
                :size="loadingSize * 1.15"
                :color="loadingColor"
            ></up-loading-icon>
            <text
                class="up-button__loading-text"
                :style="[nvueTextStyle]"
                :class="[plain && `up-button__text--plain--${type}`]"
                >{{ loadingText || text }}</text
            >
        </template>
        <template v-else>
            <up-icon
                v-if="icon"
                :name="icon"
                :color="iconColorCom"
                :size="textSize * 1.35"
            ></up-icon>
            <text
                class="up-button__text"
                :style="[
                    {
                        marginLeft: icon ? '2px' : 0,
                    },
                    nvueTextStyle,
                ]"
                :class="[plain && `up-button__text--plain--${type}`]"
                >{{ text }}</text
            >
        </template>
    </view>
    <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue'
import { propsButton } from './props.js'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
import { addStyle } from '../../libs/function/index.js'
import { throttle } from '../../libs/function/throttle.js'
import color from '../../libs/config/color.js'

defineOptions({
    name: 'up-button',
    // #ifdef MP-WEIXIN
    options: {
        virtualHost: true
    }
    // #endif
})

const props = defineProps({
    ...commonProps,
    ...propsButton.props
})
const emit = defineEmits([
    'click',
    'getphonenumber',
    'getuserinfo',
    'error',
    'opensetting',
    'launchapp',
    'agreeprivacyauthorization'
])
const { bem } = useUltraUI(props)

// 生成bem风格的类名
const bemClass = computed(() => {
    if (!props.color) {
        return bem(
            'button',
            ['type', 'shape', 'size'],
            ['disabled', 'plain', 'hairline']
        )
    }
    // 有 color 时不传 type，避免生成影响最终样式的 type 类名。
    return bem(
        'button',
        ['shape', 'size'],
        ['disabled', 'plain', 'hairline']
    )
})

const loadingColor = computed(() => {
    if (props.plain) {
        return props.color ? props.color : color[`up-${props.type}`]
    }
    if (props.type === 'info') {
        return '#c9c9c9'
    }
    return 'rgb(200, 200, 200)'
})

const iconColorCom = computed(() => {
    if (props.iconColor) return props.iconColor
    if (props.plain) {
        return props.color ? props.color : props.type
    }
    return props.type === 'info' ? '#000000' : '#ffffff'
})

const baseColor = computed(() => {
    const style = {}
    if (props.color) {
        style.color = props.plain ? props.color : 'white'
        if (!props.plain) {
            style['background-color'] = props.color
        }
        if (props.color.indexOf('gradient') !== -1) {
            style.borderTopWidth = 0
            style.borderRightWidth = 0
            style.borderBottomWidth = 0
            style.borderLeftWidth = 0
            if (!props.plain) {
                style.backgroundImage = props.color
            }
        } else {
            style.borderColor = props.color
            style.borderWidth = '1px'
            style.borderStyle = 'solid'
        }
    }
    return style
})

const nvueTextStyle = computed(() => {
    const style = {}
    if (props.type === 'info') {
        style.color = '#323233'
    }
    if (props.color) {
        style.color = props.plain ? props.color : 'white'
    }
    style.fontSize = textSize.value + 'px'
    return style
})

const textSize = computed(() => {
    let fontSize = 14
    if (props.size === 'large') fontSize = 16
    if (props.size === 'normal') fontSize = 14
    if (props.size === 'small') fontSize = 12
    if (props.size === 'mini') fontSize = 10
    return fontSize
})

function clickHandler() {
    if (!props.disabled && !props.loading) {
        throttle(() => {
            emit('click')
        }, props.throttleTime)
    } else {
        console.log('按钮被禁用或处于加载中状态')
    }
}

function getphonenumber(res) {
    emit('getphonenumber', res)
}

function getuserinfo(res) {
    emit('getuserinfo', res)
}

function error(res) {
    emit('error', res)
}

function opensetting(res) {
    emit('opensetting', res)
}

function launchapp(res) {
    emit('launchapp', res)
}

function agreeprivacyauthorization(res) {
    emit('agreeprivacyauthorization', res)
}
</script>

<style lang="scss" scoped>
@import "../../libs/css/components.scss";

/* #ifndef APP-NVUE */
@import "./vue.scss";
/* #endif */

/* #ifdef APP-NVUE */
@import "./nvue.scss";
/* #endif */

$up-button-up-button-height: 40px !default;
$up-button-text-font-size: 15px !default;
$up-button-loading-text-font-size: 15px !default;
$up-button-loading-text-margin-left: 4px !default;
$up-button-large-width: 100% !default;
$up-button-large-height: 50px !default;
$up-button-normal-padding: 0 12px !default;
$up-button-large-padding: 0 15px !default;
$up-button-normal-font-size: 14px !default;
$up-button-small-min-width: 60px !default;
$up-button-small-height: 30px !default;
$up-button-small-padding: 0px 8px !default;
$up-button-mini-padding: 0px 8px !default;
$up-button-small-font-size: 12px !default;
$up-button-mini-height: 22px !default;
$up-button-mini-font-size: 10px !default;
$up-button-mini-min-width: 50px !default;
$up-button-disabled-opacity: 0.5 !default;
$up-button-info-color: #323233 !default;
$up-button-info-background-color: #fff !default;
$up-button-info-border-color: #ebedf0 !default;
$up-button-info-border-width: 1px !default;
$up-button-info-border-style: solid !default;
$up-button-success-color: #fff !default;
$up-button-success-background-color: $up-success !default;
$up-button-success-border-color: $up-button-success-background-color !default;
$up-button-success-border-width: 1px !default;
$up-button-success-border-style: solid !default;
$up-button-primary-color: #fff !default;
$up-button-primary-background-color: $up-primary !default;
$up-button-primary-border-color: $up-button-primary-background-color !default;
$up-button-primary-border-width: 1px !default;
$up-button-primary-border-style: solid !default;
$up-button-error-color: #fff !default;
$up-button-error-background-color: $up-error !default;
$up-button-error-border-color: $up-button-error-background-color !default;
$up-button-error-border-width: 1px !default;
$up-button-error-border-style: solid !default;
$up-button-warning-color: #fff !default;
$up-button-warning-background-color: $up-warning !default;
$up-button-warning-border-color: $up-button-warning-background-color !default;
$up-button-warning-border-width: 1px !default;
$up-button-warning-border-style: solid !default;
$up-button-block-width: 100% !default;
$up-button-circle-border-top-right-radius: 100px !default;
$up-button-circle-border-top-left-radius: 100px !default;
$up-button-circle-border-bottom-left-radius: 100px !default;
$up-button-circle-border-bottom-right-radius: 100px !default;
$up-button-square-border-top-right-radius: 3px !default;
$up-button-square-border-top-left-radius: 3px !default;
$up-button-square-border-bottom-left-radius: 3px !default;
$up-button-square-border-bottom-right-radius: 3px !default;
$up-button-icon-min-width: 1em !default;
$up-button-plain-background-color: transparent !default;
$up-button-hairline-border-width: 0.5px !default;

.up-button {
    height: $up-button-up-button-height;
    position: relative;
    align-items: center;
    justify-content: center;
    @include flex;
    /* #ifndef APP-NVUE */
    box-sizing: border-box;
    /* #endif */
    flex-direction: row;

    &__text {
        font-size: $up-button-text-font-size;
    }

    &__loading-text {
        font-size: $up-button-loading-text-font-size;
        margin-left: $up-button-loading-text-margin-left;
    }

    &--large {
        /* #ifndef APP-NVUE */
        width: $up-button-large-width;
        /* #endif */
        height: $up-button-large-height;
        padding: $up-button-large-padding;
    }

    &--normal {
        padding: $up-button-normal-padding;
        font-size: $up-button-normal-font-size;
    }

    &--small {
        /* #ifndef APP-NVUE */
        min-width: $up-button-small-min-width;
        /* #endif */
        height: $up-button-small-height;
        padding: $up-button-small-padding;
        font-size: $up-button-small-font-size;
    }

    &--mini {
        height: $up-button-mini-height;
        font-size: $up-button-mini-font-size;
        /* #ifndef APP-NVUE */
        min-width: $up-button-mini-min-width;
        /* #endif */
        padding: $up-button-mini-padding;
    }

    &--disabled {
        opacity: $up-button-disabled-opacity;
    }

    &--info {
        color: $up-button-info-color;
        background-color: $up-button-info-background-color;
        border-color: $up-button-info-border-color;
        border-width: $up-button-info-border-width;
        border-style: $up-button-info-border-style;
    }

    &--success {
        color: $up-button-success-color;
        background-color: $up-button-success-background-color;
        border-color: $up-button-success-border-color;
        border-width: $up-button-success-border-width;
        border-style: $up-button-success-border-style;
    }

    &--primary {
        color: $up-button-primary-color;
        background-color: $up-button-primary-background-color;
        border-color: $up-button-primary-border-color;
        border-width: $up-button-primary-border-width;
        border-style: $up-button-primary-border-style;
    }

    &--error {
        color: $up-button-error-color;
        background-color: $up-button-error-background-color;
        border-color: $up-button-error-border-color;
        border-width: $up-button-error-border-width;
        border-style: $up-button-error-border-style;
    }

    &--warning {
        color: $up-button-warning-color;
        background-color: $up-button-warning-background-color;
        border-color: $up-button-warning-border-color;
        border-width: $up-button-warning-border-width;
        border-style: $up-button-warning-border-style;
    }

    &--block {
        @include flex;
        width: $up-button-block-width;
    }

    &--circle {
        border-top-right-radius: $up-button-circle-border-top-right-radius;
        border-top-left-radius: $up-button-circle-border-top-left-radius;
        border-bottom-left-radius: $up-button-circle-border-bottom-left-radius;
        border-bottom-right-radius: $up-button-circle-border-bottom-right-radius;
    }

    &--square {
        border-bottom-left-radius: $up-button-square-border-top-right-radius;
        border-bottom-right-radius: $up-button-square-border-top-left-radius;
        border-top-left-radius: $up-button-square-border-bottom-left-radius;
        border-top-right-radius: $up-button-square-border-bottom-right-radius;
    }

    &__icon {
        /* #ifndef APP-NVUE */
        min-width: $up-button-icon-min-width;
        line-height: inherit !important;
        vertical-align: top;
        /* #endif */
    }

    &--plain {
        background-color: $up-button-plain-background-color;
    }

    &--hairline {
        border-width: $up-button-hairline-border-width !important;
    }
}
</style>
