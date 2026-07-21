<template>
    <up-transition
        :show="loading"
        :custom-style="{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: bgColor,
            display: 'flex',
            zIndex: zIndex,
            ...customStyle
        }"
    >
        <view class="up-loading-page">
            <view class="up-loading-page__warpper">
                <view class="up-loading-page__warpper__loading-icon">
                    <image
                        v-if="image"
                        :src="image"
                        class="up-loading-page__warpper__loading-icon__img"
                        mode="widthFit"
						:style="{
							width: addUnit(iconSize),
						    height: addUnit(iconSize)
						}"
                    ></image>
                    <up-loading-icon
                        v-else
                        :mode="loadingMode"
                        :size="addUnit(iconSize)"
                        :color="loadingColor"
                    ></up-loading-icon>
                </view>
                <slot>
                    <text
                        class="up-loading-page__warpper__text"
                        :style="{
                            fontSize: addUnit(fontSize),
                            color: color,
                        }"
                        >{{ loadingText }}</text
                    >
                </slot>
            </view>
        </view>
    </up-transition>
</template>

<script setup>
import { props as loadingPageProps } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { addUnit } from '../../libs/function/index.js'

defineOptions({
    name: 'up-loading-page',
    // #ifdef MP-WEIXIN
    options: {
        virtualHost: true
    }
    // #endif
})

defineProps({
    ...commonProps,
    ...loadingPageProps.props
})
</script>

<style lang="scss" scoped>
@import "../../libs/css/components.scss";

$text-color: rgb(200, 200, 200) !default;
$text-size: 19px !default;
$up-loading-icon-margin-bottom: 10px !default;

.up-loading-page {
    @include flex(column);
    flex: 1;
    align-items: center;
    justify-content: center;

    &__warpper {
        margin-top: -150px;
        justify-content: center;
        align-items: center;
        /* #ifndef APP-NVUE */
        color: $text-color;
        font-size: $text-size;
        /* #endif */
        @include flex(column);

        &__loading-icon {
            margin-bottom: $up-loading-icon-margin-bottom;

            &__img {
                width: 40px;
                height: 40px;
            }
        }

        &__text {
            font-size: $text-size;
            color: $text-color;
        }
    }
}
</style>
