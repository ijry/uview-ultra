<template>
	<up-popup :show="popupShow" mode="bottom" :popup="false"
		:mask="true" :closeable="closeable" :safe-area-inset-bottom="true"
		close-icon-color="#ffffff" :z-index="uZIndex"
		:maskCloseAble="maskCloseAble" @close="close">
		<view class="up-p-t-30 up-p-l-20 up-m-b-10" v-if="headerDirection =='column'">
			<up-steps v-if="popupShow" dot direction="column" v-model:current="tabsIndex">
				<up-steps-item  v-for="(item, index) in genTabsList"
					@click="tabsIndex = index" :title="item.name"></up-steps-item>
			</up-steps>
		</view>
		<view class="up-p-t-20 up-m-b-10" v-else>
			<up-tabs v-if="popupShow" :list="genTabsList"
				:scrollable="true" v-model:current="tabsIndex" @change="tabsChange" ref="tabs"></up-tabs>
		</view>
		<view class="area-box">
			<view class="up-flex" :class="{ 'change':isChange }"
				:style="{transform: optionsCols == 2 && isChange ? 'translateX(-33.3333333%)' : ''}">
				<template v-for="(levelData, levelIndex) in levelList" :key="levelIndex">
					<view v-if="optionsCols == 2 || levelIndex == tabsIndex" class="area-item"
						:style="{ width: optionsCols == 2 ? '33.33333%' : '750rpx'}">
						<view class="up-padding-10 up-bg-gray" style="height: 100%;">
							<scroll-view :scroll-y="true" style="height: 100%">
								<up-cell-group v-if="levelIndex === 0 || selectedValueIndexs[levelIndex - 1] !== undefined">
									<up-cell v-for="(item,index) in levelData"
										:title="item[labelKey]" :arrow="false"
										:index="index" :key="index"
										@click="levelChange(levelIndex, index)">
										<template v-slot:right-icon>
											<up-icon v-if="selectedValueIndexs[levelIndex] === index"
												size="17" name="checkbox-mark"></up-icon>
										</template>
									</up-cell>
								</up-cell-group>
							</scroll-view>
						</view>
					</view>
				</template>
			</view>
		</view>
		<!-- 添加按钮区域 -->
		<view class="up-cascader-action up-flex up-flex-between">
			<view class="up-padding-20 up-flex-fill">
				<up-button @click="handleCancel" type="default">{{ t("up.common.cancel") }}</up-button>
			</view>
			<view class="up-padding-20 up-flex-fill">
				<up-button @click="handleConfirm" type="primary">{{ t("up.common.confirm") }}</up-button>
			</view>
		</view>
	</up-popup>
</template>

<script setup>
/**
 * up-cascader 通用无限级联选择器
 * @property {String Number} z-index 弹出时的z-index值（默认1075）
 * @property {Boolean} mask-close-able 是否允许通过点击遮罩关闭Picker（默认true）
 * @property {Array} data 级联数据
 * @property {Array} default-value 默认选中的值
 * @property {String} valueKey 指定选项的值为选项对象中的哪个属性值
 * @property {String} labelKey 指定选项标签为选项对象中的哪个属性值
 * @property {String} childrenKey 指定选项的子选项为选项对象中的哪个属性值
 * @property {Boolean} autoClose 是否在选择最后一级时自动关闭并触发confirm（默认false）
 * @property {Boolean} closeable 是否显示关闭图标（默认true）
 */
import { computed, ref, watch } from 'vue'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
import { t } from '../../libs/i18n'

defineOptions({
	name: 'up-cascader',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	// 通过双向绑定控制组件的弹出与收起
	show: {
		type: Boolean,
		default: false
	},
	// 级联数据
	data: {
		type: Array,
		default() {
			return []
		}
	},
	// 默认选中的值
	modelValue: {
		type: Array,
		default() {
			return []
		}
	},
	// 指定选项的值为选项对象中的哪个属性值
	valueKey: {
		type: String,
		default: 'value'
	},
	// 指定选项标签为选项对象中的哪个属性值
	labelKey: {
		type: String,
		default: 'label'
	},
	// 指定选项的子选项为选项对象中的哪个属性值
	childrenKey: {
		type: String,
		default: 'children'
	},
	// 是否允许通过点击遮罩关闭Picker
	maskCloseAble: {
		type: Boolean,
		default: true
	},
	// 弹出的z-index值
	zIndex: {
		type: [String, Number],
		default: 0
	},
	// 是否在选择最后一级时自动关闭并触发confirm
	autoClose: {
		type: Boolean,
		default: false
	},
	// 选中项目的展示方向direction垂直方向适合文字长度过长
	headerDirection: {
		type: String,
		default: 'row'
	},
	// 选项区域列数，支持1列和2列，默认为2列
	optionsCols: {
		type: [Number],
		default: 2
	},
	// 是否显示关闭图标
	closeable: {
		type: Boolean,
		default: true
	}
})
const emit = defineEmits(['update:modelValue', 'update:show', 'change', 'confirm', 'cancel'])
const { $u } = useUltraUI(props)

const levelList = ref([])
const selectedValueIndexs = ref([])
const tabsIndex = ref(0)
const popupShow = ref(false)
const confirmValues = ref([])
const tabs = ref(null)

const isChange = computed(() => {
	return tabsIndex.value > 1
})

const genTabsList = computed(() => {
	let tabsList = [{
		name: "请选择"
	}]

	for (let i = 0; i < selectedValueIndexs.value.length; i++) {
		if (selectedValueIndexs.value[i] !== undefined && levelList.value[i]) {
			const selectedItem = levelList.value[i][selectedValueIndexs.value[i]]
			if (selectedItem) {
				tabsList[i] = {
					name: selectedItem[props.labelKey]
				}
				if (i === selectedValueIndexs.value.length - 1 &&
					selectedItem[props.childrenKey] &&
					selectedItem[props.childrenKey].length > 0) {
					tabsList.push({
						name: "请选择"
					})
				}
			}
		}
	}

	return tabsList
})

const uZIndex = computed(() => {
	return props.zIndex ? props.zIndex : $u.zIndex?.popup
})

function getSelectedValues() {
	const result = []
	for (let i = 0; i < selectedValueIndexs.value.length; i++) {
		const selectedIndex = selectedValueIndexs.value[i]
		if (selectedIndex === undefined) continue
		if (!levelList.value[i] || !levelList.value[i][selectedIndex]) continue
		result.push(levelList.value[i][selectedIndex][props.valueKey])
	}
	return result
}

function initLevelList() {
	if (props.data && props.data.length > 0) {
		levelList.value = [props.data]
		selectedValueIndexs.value = []
	}
}

function setDefaultValue() {
	if (!props.data || props.data.length == 0) return
	if (!props.modelValue || props.modelValue.length == 0) {
		confirmValues.value = []
		return
	}
	selectedValueIndexs.value = []
	levelList.value = []
	let currentLevelData = props.data

	for (let i = 0; i < props.modelValue.length; i++) {
		const value = props.modelValue[i]
		const index = currentLevelData.findIndex(item => item[props.valueKey] === value)
		levelList.value[i] = currentLevelData

		if (index !== -1) {
			selectedValueIndexs.value.push(index)
			if (currentLevelData[index][props.childrenKey]) {
				currentLevelData = currentLevelData[index][props.childrenKey]
			} else {
				break
			}
		} else {
			break
		}
	}
	confirmValues.value = getSelectedValues()
}

function close() {
	emit('cancel')
	emit('update:show', false)
}

function tabsChange(item) {
}

function levelChange(levelIndex, index) {
	selectedValueIndexs.value[levelIndex] = index
	selectedValueIndexs.value.splice(levelIndex + 1)
	tabsIndex.value = Math.min(tabsIndex.value, levelIndex)
	levelList.value.splice(levelIndex + 1)

	const currentItem = levelList.value[levelIndex][index]

	if (currentItem && currentItem[props.childrenKey] && currentItem[props.childrenKey].length > 0) {
		if (levelList.value.length <= levelIndex + 1) {
			levelList.value.push(currentItem[props.childrenKey])
		} else {
			levelList.value[levelIndex + 1] = currentItem[props.childrenKey]
		}
		tabsIndex.value = levelIndex + 1
	} else {
		if (props.autoClose) {
			emitChange()
			handleConfirm()
		} else {
			emitChange(false)
		}
	}
}

function emitChange(closePopup = true) {
	const result = getSelectedValues()
	confirmValues.value = [...result]
	emit('change', confirmValues.value)
	if (closePopup) {
		close()
	}
}

function handleCancel() {
	close()
}

function handleConfirm() {
	const values = confirmValues.value.length ? confirmValues.value : getSelectedValues()
	confirmValues.value = [...values]
	emit('update:modelValue', values)
	emit('confirm', values)
	close()
}

watch(() => props.data, () => {
	initLevelList()
	setDefaultValue()
}, { immediate: true })

watch(() => props.show, () => {
	popupShow.value = props.show
})

watch(() => props.modelValue, () => {
	setDefaultValue()
}, { immediate: true })
</script>

<style lang="scss">
	.area-box {
		width: 100%;
		overflow: hidden;
		height: 800rpx;

		>view {
			width: 150%;
			transition: transform 0.3s ease-in-out 0s;
			transform: translateX(0);

			&.change {
				// transform: translateX(-33.3333333%);
			}
		}

		.area-item {
			// width: 750rpx;
			height: 800rpx;
		}
	}

	// 添加按钮区域样式
	.up-cascader-action {
		border-top: 1px solid #eee;
	}
</style>
