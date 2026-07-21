<template>
    <view class="up-goods-sku">
        <view @click="open">
            <slot name="trigger"></slot>
        </view>
        <up-popup
            v-model:show="show"
            mode="bottom"
            :closeable="pageInline ? false : closeable"
            :pageInline="pageInline"
            :border-radius="20"
            @close="close"
        >
            <view class="up-goods-sku-container" :style="{padding: pageInline ? '0px' : ''}">
                <view class="up-goods-sku__header">
                    <slot name="header">
                        <view class="up-goods-sku__header__image">
                            <image :src="goodsInfo.image || goodsInfo.picture" mode="aspectFill"></image>
                        </view>
                        <view class="up-goods-sku__header__info">
                            <view class="up-goods-sku__header__info__price">
                                <text class="up-goods-sku__header__info__price__symbol">¥</text>
                                <text class="up-goods-sku__header__info__price__value">{{ price }}</text>
                            </view>
                            <view class="up-goods-sku__header__info__stock">{{ t('up.goodsSku.stock') }} {{ stock }} {{ t('up.goodsSku.amount') }}</view>
                            <view class="up-goods-sku__header__info__selected">{{ t('up.goodsSku.choosed') }}: {{ selectedSkuText }}</view>
                        </view>
                    </slot>
                </view>

                <scroll-view class="up-goods-sku__content" scroll-y>
                    <view v-for="(treeItem, index) in skuTree" :key="index" class="up-goods-sku__content__item">
                        <view class="up-goods-sku__content__item__title">{{ treeItem.label }}</view>
                        <view class="up-goods-sku__content__item__list">
                            <view
                                v-for="(leafItem, leafIndex) in treeItem.children"
                                :key="leafIndex"
                                class="up-goods-sku__content__item__list__item"
                                :class="{
                                    'up-goods-sku__content__item__list__item--active': isSelected(treeItem.name, leafItem.id),
                                    'up-goods-sku__content__item__list__item--disabled': isDisabled(treeItem.name, leafItem.id)
                                }"
                                @click="onSkuClick(treeItem.name, leafItem)"
                            >
                                <text>{{ leafItem.name }}</text>
                            </view>
                        </view>
                    </view>

                    <view class="up-goods-sku__content__count">
                        <view class="up-goods-sku__content__count__title">{{ t('up.goodsSku.buyAmount') }}</view>
                        <view class="up-goods-sku__content__count__control">
                            <up-number-box
                                v-model="buyNum"
                                :min="1"
                                :max="maxBuyNum"
                                :disabled="!canBuy"
                                @change="onNumChange"
                            ></up-number-box>
                        </view>
                    </view>
                </scroll-view>

                <view class="up-goods-sku__footer">
                    <up-button
                        type="primary"
                        :disabled="!canBuy"
                        @click="onConfirm"
                    >
                        {{ confirmText }}
                    </up-button>
                </view>
            </view>
        </up-popup>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { t } from '../../libs/i18n'

defineOptions({
	name: 'up-goods-sku',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	// 商品信息
	goodsInfo: {
		type: Object,
		default: () => ({})
	},
	// SKU树形结构
	skuTree: {
		type: Array,
		default: () => []
	},
	// SKU列表
	skuList: {
		type: Array,
		default: () => []
	},
	// 最大购买数量
	maxBuy: {
		type: Number,
		default: 999
	},
	// 确认按钮文字
	confirmText: {
		type: String,
		default: '确定'
	},
	// 是否显示关闭弹窗按钮
	closeable: {
		type: Boolean,
		default: true
	},
	// 是否页面内联模式
	pageInline: {
		type: Boolean,
		default: false
	}
})
const emit = defineEmits(['open', 'confirm', 'close'])

const show = ref(false)
const selectedSku = ref({})
const buyNum = ref(1)

if (props.pageInline) {
	show.value = true
}

function getSkuComb(selected) {
	const next = { ...selected }

	Object.keys(next).forEach(key => {
		if (!next[key]) {
			delete next[key]
		}
	})

	if (Object.keys(next).length !== props.skuTree.length) {
		return null
	}

	for (let i = 0; i < props.skuList.length; i++) {
		const sku = props.skuList[i]
		let match = true

		for (const key in next) {
			if (sku[key] !== next[key]) {
				match = false
				break
			}
		}

		if (match) {
			return sku
		}
	}

	return null
}

function getSelectedSkuComb() {
	return getSkuComb(selectedSku.value)
}

const price = computed(() => {
	const selectedSkuComb = getSelectedSkuComb()
	if (selectedSkuComb) {
		return selectedSkuComb.price || selectedSkuComb.price_fee
	}
	return props.goodsInfo.price || props.goodsInfo.price_fee || 0
})

const stock = computed(() => {
	const selectedSkuComb = getSelectedSkuComb()
	if (selectedSkuComb) {
		return selectedSkuComb.stock || selectedSkuComb.quantity
	}
	return props.goodsInfo.stock || props.goodsInfo.quantity || 0
})

const maxBuyNum = computed(() => {
	const stockVal = stock.value
	return stockVal > props.maxBuy ? props.maxBuy : stockVal
})

const canBuy = computed(() => {
	const selectedSkuCount = Object.keys(selectedSku.value).filter((key) => selectedSku.value[key] !== '').length
	const skuTreeCount = props.skuTree.length
	return selectedSkuCount === skuTreeCount && buyNum.value > 0 && stock.value > 0
})

const selectedSkuText = computed(() => {
	const selected = []
	Object.keys(selectedSku.value).forEach(key => {
		const value = selectedSku.value[key]
		if (value) {
			props.skuTree.forEach(treeItem => {
				if (treeItem.name === key) {
					treeItem.children.forEach(leafItem => {
						if (leafItem.id === value) {
							selected.push(leafItem.name)
						}
					})
				}
			})
		}
	})
	return selected.join(', ')
})

function isSelected(skuKey, skuValueId) {
	return selectedSku.value[skuKey] === skuValueId
}

function isDisabled(skuKey, skuValueId) {
	const tempSelected = { ...selectedSku.value, [skuKey]: skuValueId }

	const selectedCount = Object.keys(tempSelected).filter(key => tempSelected[key]).length
	const totalSkuCount = props.skuTree.length

	if (selectedCount === totalSkuCount) {
		return !getSkuComb(tempSelected)
	}

	for (let i = 0; i < props.skuList.length; i++) {
		const sku = props.skuList[i]
		let match = true

		for (const key in tempSelected) {
			if (tempSelected[key] && sku[key] !== tempSelected[key]) {
				match = false
				break
			}
		}

		if (match) {
			return false
		}
	}

	return true
}

function onSkuClick(skuKey, skuValue) {
	if (isDisabled(skuKey, skuValue.id)) {
		return
	}

	if (selectedSku.value[skuKey] === skuValue.id) {
		selectedSku.value[skuKey] = ''
	} else {
		selectedSku.value[skuKey] = skuValue.id
	}
}

function onNumChange(e) {
	buyNum.value = e.value
}

function reset() {
	selectedSku.value = {}
	buyNum.value = 1
}

function open() {
	show.value = true
	emit('open')
}

function close() {
	show.value = false
	emit('close')
}

function onConfirm() {
	if (!canBuy.value) {
		return
	}

	const selectedSkuComb = getSelectedSkuComb()
	emit('confirm', {
		sku: selectedSkuComb,
		goodsInfo: props.goodsInfo,
		num: buyNum.value,
		selectedText: selectedSkuText.value
	})
}

defineExpose({
	open,
	close,
	reset
})
</script>


<style lang="scss" scoped>
	.up-goods-sku {
		background-color: #fff;
		overflow: hidden;

        .up-goods-sku-container {
            padding: 4rpx 30rpx;
        }

		&__header {
			display: flex;
            flex-direction: row;
			padding: 30rpx 0;
			position: relative;

			&__image {
				width: 180rpx;
				height: 180rpx;
				border-radius: 10rpx;
				overflow: hidden;
				margin-right: 20rpx;

				image {
					width: 100%;
					height: 100%;
				}
			}

			&__info {
				flex: 1;

				&__price {
					display: flex;
                    flex-direction: row;
					align-items: baseline;
					margin-bottom: 20rpx;

					&__symbol {
						font-size: 24rpx;
						color: #fa3534;
						margin-right: 4rpx;
					}

					&__value {
						font-size: 36rpx;
						color: #fa3534;
						font-weight: bold;
					}
				}

				&__stock {
					font-size: 26rpx;
					color: #999;
					margin-bottom: 20rpx;
				}

				&__selected {
					font-size: 26rpx;
					color: #333;
				}
			}
		}

		&__content {
			max-height: 600rpx;
			padding: 0 30rpx 30rpx 0;

			&__item {
				margin-bottom: 30rpx;

				&__title {
					font-size: 28rpx;
					color: #333;
					margin-bottom: 20rpx;
				}

				&__list {
					display: flex;
                    flex-direction: row;
					flex-wrap: wrap;

					&__item {
						padding: 10rpx 20rpx;
						border: 2rpx solid #eee;
						border-radius: 10rpx;
						margin-right: 20rpx;
						margin-bottom: 20rpx;
						font-size: 26rpx;
						color: #333;

						&--active {
							border-color: #fa3534;
							color: #fa3534;
						}

						&--disabled {
							color: #ccc;
							border-color: #eee;
						}
					}
				}
			}

			&__count {
				display: flex;
                flex-direction: row;
				align-items: center;
				justify-content: space-between;
				margin-top: 20rpx;

				&__title {
					font-size: 28rpx;
					color: #333;
				}
			}
		}

		&__footer {
			padding: 20rpx 0rpx 40rpx 0;
		}
	}
</style>
