<template>
    <view class="up-album">
        <view
            class="up-album__row"
            ref="albumRowRefs"
            v-for="(arr, index) in showUrls"
            :forComputedUse="albumWidth"
            :key="index"
            :style="{flexWrap: autoWrap ? 'wrap' : 'nowrap'}"
        >
            <view
                class="up-album__row__wrapper"
                v-for="(item, index1) in arr"
                :key="index1"
                :style="[imageStyle(index + 1, index1 + 1)]"
                @tap="onPreviewTap($event, getSrc(item))"
            >
                <image
                    :src="getSrc(item)"
                    :mode="
                        urls.length === 1
                            ? imageHeight > 0
                                ? singleMode
                                : 'widthFix'
                            : multipleMode
                    "
                    :style="[
                        {
                            width: imageWidth,
                            height: imageHeight,
                            borderRadius: shape == 'circle' ? '10000px' : addUnit(radius)
                        }
                    ]"
                ></image>
                <view
                    v-if="
                        showMore &&
                        urls.length > rowCount * showUrls.length &&
                        index === showUrls.length - 1 &&
                        index1 === showUrls[showUrls.length - 1].length - 1
                    "
                    class="up-album__row__wrapper__text"
                    :style="{
					    borderRadius: shape == 'circle' ? '50%' : addUnit(radius),
				    }"
                >
                    <up-text
                        :text="`+${urls.length - maxCount}`"
                        color="#fff"
                        :size="multipleSize * 0.3"
                        align="center"
                        customStyle="justify-content: center"
                    ></up-text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { props as albumProps } from './props.js'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
import { addUnit, sleep } from '../../libs/function/index.js'
import test from '../../libs/function/test.js'
// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
// #endif

/**
 * Album 相册
 * @description 本组件提供一个类似相册的功能，让开发者开发起来更加得心应手。减少重复的模板代码
 * @tutorial https://ijry.github.io/uview-plus/components/album.html
 *
 * @property {Array}           urls             图片地址列表 Array<String>|Array<Object>形式
 * @property {String}          keyName          指定从数组的对象元素中读取哪个属性作为图片地址
 * @property {String | Number} singleSize       单图时，图片长边的长度  （默认 180 ）
 * @property {String | Number} multipleSize     多图时，图片边长 （默认 70 ）
 * @property {String | Number} space            多图时，图片水平和垂直之间的间隔 （默认 6 ）
 * @property {String}          singleMode       单图时，图片缩放裁剪的模式 （默认 'scaleToFill' ）
 * @property {String}          multipleMode     多图时，图片缩放裁剪的模式 （默认 'aspectFill' ）
 * @property {String | Number} maxCount         取消按钮的提示文字 （默认 9 ）
 * @property {Boolean}         previewFullImage 是否可以预览图片 （默认 true ）
 * @property {String | Number} rowCount         每行展示图片数量，如设置，singleSize和multipleSize将会无效	（默认 3 ）
 * @property {Boolean}         showMore         超出maxCount时是否显示查看更多的提示 （默认 true ）
 * @property {String}          shape            图片形状，circle-圆形，square-方形 （默认 'square' ）
 * @property {String | Number} radius           圆角值，单位任意，如果为数值，则为px单位 （默认 0 ）
 * @property {Boolean}         autoWrap         自适应换行模式，不受rowCount限制，图片会自动换行 （默认 false ）
 * @property {String}          unit             图片单位 （默认 px ）
 * @event    {Function}        albumWidth       某些特殊的情况下，需要让文字与相册的宽度相等，这里事件的形式对外发送  （回调参数 width ）
 * @example <up-album :urls="urls2" @albumWidth="width => albumWidth = width" multipleSize="68" ></up-album>
 */
defineOptions({
	name: 'up-album',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...albumProps.props
})
const emit = defineEmits(['preview', 'albumWidth'])
const { $uGetRect, preventEvent } = useUltraUI(props)

const singleWidth = ref(0)
const singleHeight = ref(0)
const singlePercent = 0.6
const albumRowRefs = ref([])

watch(() => props.urls, (newVal) => {
	if (newVal.length === 1) {
		getImageRect()
	}
}, { immediate: true })

const showUrls = computed(() => {
	if (props.autoWrap) {
		return [props.urls.slice(0, props.maxCount)]
	}
	const arr = []
	props.urls.map((item, index) => {
		if (index + 1 <= props.maxCount) {
			const itemIndex = Math.floor(index / props.rowCount)
			if (!arr[itemIndex]) {
				arr[itemIndex] = []
			}
			arr[itemIndex].push(item)
		}
	})
	return arr
})

function imageStyle(index1, index2) {
	const { space, rowCount } = props
	const rowLen = showUrls.value.length
	const style = {
		marginRight: addUnit(space),
		marginBottom: addUnit(space)
	}
	if (index1 === rowLen && !props.autoWrap) style.marginBottom = 0
	if (!props.autoWrap) {
		if (
			index2 === rowCount ||
			(index1 === rowLen && index2 === showUrls.value[index1 - 1].length)
		) {
			style.marginRight = 0
		}
	}
	return style
}

const imageWidth = computed(() => addUnit(
	props.urls.length === 1 ? singleWidth.value : props.multipleSize,
	props.unit
))
const imageHeight = computed(() => addUnit(
	props.urls.length === 1 ? singleHeight.value : props.multipleSize,
	props.unit
))

const albumWidth = computed(() => {
	let width = 0
	if (props.urls.length === 1) {
		width = singleWidth.value
	} else {
		width = showUrls.value[0].length * props.multipleSize + props.space * (showUrls.value[0].length - 1)
	}
	emit('albumWidth', width)
	return width
})

function onPreviewTap(e, url) {
	const urls = props.urls.map((item) => getSrc(item))
	if (props.previewFullImage) {
		uni.previewImage({
			current: url,
			urls
		})
		props.stop && preventEvent(e)
	} else {
		emit('preview', {
			urls,
			currentIndex: urls.indexOf(url)
		})
	}
}

function getSrc(item) {
	return test.object(item)
		? (props.keyName && item[props.keyName]) || item.src
		: item
}

function getImageRect() {
	const src = getSrc(props.urls[0])
	uni.getImageInfo({
		src,
		success: (res) => {
			const isHorizotal = res.width >= res.height
			singleWidth.value = isHorizotal
				? props.singleSize
				: (res.width / res.height) * props.singleSize
			singleHeight.value = !isHorizotal
				? props.singleSize
				: (res.height / res.width) * singleWidth.value
		},
		fail: () => {
			getComponentWidth()
		}
	})
}

async function getComponentWidth() {
	await sleep(30)
	// #ifndef APP-NVUE
	$uGetRect('.up-album__row').then((size) => {
		singleWidth.value = size.width * singlePercent
	})
	// #endif

	// #ifdef APP-NVUE
	const refNode = Array.isArray(albumRowRefs.value) ? albumRowRefs.value[0] : albumRowRefs.value
	refNode && dom.getComponentRect(refNode, (res) => {
		singleWidth.value = res.size.width * singlePercent
	})
	// #endif
}
</script>


<style lang="scss" scoped>
@import '../../libs/css/components.scss';

.up-album {
    @include flex(column);

    &__row {
        @include flex(row);

        &__wrapper {
            position: relative;

            &__text {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.3);
                @include flex(row);
                justify-content: center;
                align-items: center;
            }
        }
    }
}
</style>
