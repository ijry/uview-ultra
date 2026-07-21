<template>
    <view
        class="up-text"
        :class="[customClass]"
        v-if="show"
        :style="{
            margin: margin,
			justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end'
        }"
        @tap="clickHandler"
    >
        <text
            :class="['up-text__price', type && `up-text__value--${type}`]"
            v-if="mode === 'price'"
            :style="[valueStyle]"
            >￥</text
        >
        <view class="up-text__prefix-icon" v-if="prefixIcon">
            <up-icon
                :name="prefixIcon"
                :customStyle="addStyle(iconStyle)"
            ></up-icon>
        </view>
        <up-link
            v-if="mode === 'link'"			class="up-text__value"
            :style="{fontWeight: valueStyle.fontWeight, wordWrap: valueStyle.wordWrap, fontSize: valueStyle.fontSize}"			:class="[			    type && `up-text__value--${type}`,			    lines && `up-line-${lines}`			]"			:text="value"
            :href="href"
            underLine
        ></up-link>
        <template v-else-if="openType && isMp">
            <button
                class="up-reset-button up-text__value"
                :style="[valueStyle]"
                :data-index="index"
                :openType="openType"
                @getuserinfo="onGetUserInfo"
                @contact="onContact"
                @getphonenumber="onGetPhoneNumber"
                @error="onError"
                @launchapp="onLaunchApp"
                @opensetting="onOpenSetting"
                :lang="lang"
                :session-from="sessionFrom"
                :send-message-title="sendMessageTitle"
                :send-message-path="sendMessagePath"
                :send-message-img="sendMessageImg"
                :show-message-card="showMessageCard"
                :app-parameter="appParameter"
            >
                {{ value }}
            </button>
        </template>
        <text
            v-else
            class="up-text__value"
            :style="[valueStyle]"
            :class="[
                type && `up-text__value--${type}`,
                lines && `up-line-${lines}`
            ]"
            >{{ value }}</text
        >
        <view class="up-text__suffix-icon" v-if="suffixIcon">
            <up-icon
                :name="suffixIcon"
                :customStyle="addStyle(iconStyle)"
            ></up-icon>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue'
import { propsText } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { addStyle, addUnit, deepMerge, error, priceFormat, timeFormat } from '../../libs/function/index.js';
import test from '../../libs/function/test.js';
/**
 * Text 文本
 * @description 此组件集成了文本类在项目中的常用功能，包括状态，拨打电话，格式化日期，*替换，超链接...等功能。 您大可不必在使用特殊文本时自己定义，text组件几乎涵盖您能使用的大部分场景。
 * @tutorial https://ijry.github.io/uview-plus/components/loading.html
 * @property {String} 					type		主题颜色
 * @property {Boolean} 					show		是否显示（默认 true ）
 * @property {String | Number}			text		显示的值
 * @property {String}					prefixIcon	前置图标
 * @property {String} 					suffixIcon	后置图标
 * @property {String} 					mode		文本处理的匹配模式 text-普通文本，price-价格，phone-手机号，name-姓名，date-日期，link-超链接
 * @property {String} 					href		mode=link下，配置的链接
 * @property {String | Function} 		format		格式化规则
 * @property {Boolean} 					call		mode=phone时，点击文本是否拨打电话（默认 false ）
 * @property {String} 					openType	小程序的打开方式
 * @property {Boolean} 					bold		是否粗体，默认normal（默认 false ）
 * @property {Boolean} 					block		是否块状（默认 false ）
 * @property {String | Number} 			lines		文本显示的行数，如果设置，超出此行数，将会显示省略号
 * @property {String} 					color		文本颜色（默认 '#303133' ）
 * @property {String | Number} 			size		字体大小（默认 15 ）
 * @property {Object | String} 			iconStyle	图标的样式 （默认 {fontSize: '15px'} ）
 * @property {String} 					decoration	文字装饰，下划线，中划线等，可选值 none|underline|line-through（默认 'none' ）
 * @property {Object | String | Number}	margin		外边距，对象、字符串，数值形式均可（默认 0 ）
 * @property {String | Number} 			lineHeight	文本行高
 * @property {String} 					align		文本对齐方式，可选值left|center|right（默认 'left' ）
 * @property {String} 					wordWrap	文字换行，可选值break-word|normal|anywhere（默认 'normal' ）
 * @event {Function} click  点击触发事件
 * @example <up-text text="我用十年青春,赴你最后之约"></up-text>
 */
defineOptions({
    name: 'up-text',
    // #ifdef MP-WEIXIN
    options: {
        virtualHost: true
    }
    // #endif
})

const buttonProps = {
    sessionFrom: String,
    sendMessageTitle: String,
    sendMessagePath: String,
    sendMessageImg: String,
    showMessageCard: Boolean,
    appParameter: String,
    formType: String
}

const props = defineProps({
    ...commonProps,
    ...buttonProps,
    ...propsText.props
})

const emit = defineEmits([
    'click',
    'getuserinfo',
    'contact',
    'getphonenumber',
    'error',
    'launchapp',
    'opensetting'
])

const isNvue = computed(() => {
    let nvue = false
    // #ifdef APP-NVUE
    nvue = true
    // #endif
    return nvue
})

const isMp = computed(() => {
    let mp = false
    // #ifdef MP
    mp = true
    // #endif
    return mp
})

const valueStyle = computed(() => {
    const style = {
        textDecoration: props.decoration,
        fontWeight: props.bold ? 'bold' : 'normal',
        wordWrap: props.wordWrap,
        fontSize: addUnit(props.size)
    }
    !props.type && (style.color = props.color)
    isNvue.value && props.lines && (style.lines = props.lines)
    props.lineHeight &&
        (style.lineHeight = addUnit(props.lineHeight))
    !isNvue.value && props.block && (style.display = 'block')
    return deepMerge(style, addStyle(props.customStyle))
})

const value = computed(() => {
    const {
        text,
        mode,
        format,
        href
    } = props
    // 价格类型
    if (mode === 'price') {
        // 如果text不为金额进行提示
        if (!/^\d+(\.\d+)?$/.test(text)) {
            error('金额模式下，text参数需要为金额格式');
        }
        // 进行格式化，判断用户传入的format参数为正则，或者函数，如果没有传入format，则使用默认的金额格式化处理
        if (test.func(format)) {
            // 如果用户传入的是函数，使用函数格式化
            return format(text)
        }
        // 如果format非正则，非函数，则使用默认的金额格式化方法进行操作
        return priceFormat(text, 2)
    } if (mode === 'date') {
        // 判断是否合法的日期或者时间戳
        !test.date(text) && error('日期模式下，text参数需要为日期或时间戳格式')
        // 进行格式化，判断用户传入的format参数为正则，或者函数，如果没有传入format，则使用默认的格式化处理
        if (test.func(format)) {
            // 如果用户传入的是函数，使用函数格式化
            return format(text)
        } if (format) {
            // 如果format非正则，非函数，则使用默认的时间格式化方法进行操作
            return timeFormat(text, format)
        }
        // 如果没有设置format，则设置为默认的时间格式化形式
        return timeFormat(text, 'yyyy-mm-dd')
    } if (mode === 'phone') {
        // 判断是否合法的手机号
        // !test.mobile(text) && error('手机号模式下，text参数需要为手机号码格式')
        if (test.func(format)) {
            // 如果用户传入的是函数，使用函数格式化
            return format(text)
        } if (format === 'encrypt') {
            // 如果format为encrypt，则将手机号进行星号加密处理
            return `${text.substr(0, 3)}****${text.substr(7)}`
        }
        return text
    } if (mode === 'name') {
        // 判断是否合法的字符粗
        !(typeof (text) === 'string') && error('姓名模式下，text参数需要为字符串格式')
        if (test.func(format)) {
            // 如果用户传入的是函数，使用函数格式化
            return format(text)
        } if (format === 'encrypt') {
            // 如果format为encrypt，则将姓名进行星号加密处理
            return formatName(text)
        }
        return text
    } if (mode === 'link') {
        // 判断是否合法的字符粗
        !test.url(href) && error('超链接模式下，href参数需要为URL格式')
        return text
    }
    return text
})

// 默认的姓名脱敏规则
function formatName(name) {
    let value = ''
    if (name.length === 2) {
        value = name.substr(0, 1) + '*'
    } else if (name.length > 2) {
        let char = ''
        for (let i = 0, len = name.length - 2; i < len; i++) {
            char += '*'
        }
        value = name.substr(0, 1) + char + name.substr(-1, 1)
    } else {
        value = name
    }
    return value
}

function clickHandler() {
    // 如果为手机号模式，拨打电话
    if (props.call && props.mode === 'phone') {
        uni.makePhoneCall({
            phoneNumber: props.text
        })
    }
    emit('click')
}

function onGetUserInfo(event) {
    emit('getuserinfo', event.detail)
}

function onContact(event) {
    emit('contact', event.detail)
}

function onGetPhoneNumber(event) {
    emit('getphonenumber', event.detail)
}

function onError(event) {
    emit('error', event.detail)
}

function onLaunchApp(event) {
    emit('launchapp', event.detail)
}

function onOpenSetting(event) {
    emit('opensetting', event.detail)
}
</script>

<style lang="scss" scoped>
@import '../../libs/css/components.scss';

.up-text {
    @include flex(row);
    align-items: center;
    flex-wrap: nowrap;
    flex: 1;
	/* #ifndef APP-NVUE */
	width: 100%;
	/* #endif */

    &__price {
        font-size: 14px;
        color: $up-content-color;
    }

    &__value {
        font-size: 14px;
        @include flex;
        color: $up-content-color;
        flex-wrap: wrap;
        // flex: 1;
        text-overflow: ellipsis;
        align-items: center;

        &--primary {
            color: $up-primary;
        }

        &--warning {
            color: $up-warning;
        }

        &--success {
            color: $up-success;
        }

        &--info {
            color: $up-info;
        }

        &--error {
            color: $up-error;
        }

        &--main {
            color: $up-main-color;
        }

        &--content {
            color: $up-content-color;
        }

        &--tips {
            color: $up-tips-color;
        }

        &--light {
            color: $up-light-color;
        }
    }
}
</style>
