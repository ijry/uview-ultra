<template>
	<up-popup
		:show="show"
		mode="bottom"
		:overlay="overlay"
		:duration="duration"
		:overlayStyle="overlayStyle"
		:overlayOpacity="overlayOpacity"
		:zIndex="zIndex"
		:safeAreaInsetBottom="safeAreaInsetBottom"
		:safeAreaInsetTop="safeAreaInsetTop"
		:bgColor="bgColor"
		:closeable="calendarCloseable"
		:closeIconPos="closeIconPos"
		:pageInline="pageInline"
		@close="close"
		:round="round"
		:closeOnClickOverlay="closeOnClickOverlay"
		:zoom="zoom"
	>
		<view class="up-calendar">
			<uHeader
				:title="title"
				:subtitle="subtitle"
				:showSubtitle="showSubtitle"
				:showTitle="showTitle"
				:showSwitch="monthSwitch"
				:showToday="showToday"
				:todayText="todayText"
				:todayDisabled="todayDisabled"
				:weekText="weekText"
				:prevDisabled="switchPrevDisabled"
				:nextDisabled="switchNextDisabled"
				:prevYearDisabled="switchPrevYearDisabled"
				:nextYearDisabled="switchNextYearDisabled"
				@prev="prevMonth"
				@next="nextMonth"
				@prevYear="prevYear"
				@nextYear="nextYear"
				@today="jumpToToday"
			></uHeader>
			<view v-if="showTimePanel" class="up-calendar__time-panel">
				<view v-if="mode === 'single'" class="up-calendar__time-row">
					<text class="up-calendar__time-date">{{ singleDateLabel }}</text>
					<view class="up-calendar__time-trigger" @click="openTimePicker('single')">
						<text class="up-calendar__time-text">{{ singleTime }}</text>
					</view>
				</view>
				<view v-else-if="mode === 'range' && rangeResultMode === 'boundary'">
					<view class="up-calendar__time-row">
						<text class="up-calendar__time-date">{{ rangeStartDateLabel }}</text>
						<view class="up-calendar__time-trigger" @click="openTimePicker('start')">
							<text class="up-calendar__time-text">{{ rangeStartTime }}</text>
						</view>
					</view>
					<view class="up-calendar__time-row">
						<text class="up-calendar__time-date">{{ rangeEndDateLabel }}</text>
						<view class="up-calendar__time-trigger" @click="openTimePicker('end')">
							<text class="up-calendar__time-text">{{ rangeEndTime }}</text>
						</view>
					</view>
				</view>
			</view>
			<scroll-view
				v-if="!monthSwitch"
				:style="{
                    height: addUnit(listHeight)
                }"
				scroll-y
				@scroll="onScroll"
				:scroll-top="scrollTop"
				:scrollIntoView="scrollIntoView"
			>
				<uMonth
					:color="color"
					:rowHeight="rowHeight"
					:showMark="showMark"
					:months="months"
					:mode="mode"
					:maxCount="maxCount"
					:startText="startText"
					:endText="endText"
					:defaultDate="defaultDate"
					:minDate="innerMinDate"
					:maxDate="innerMaxDate"
					:maxMonth="monthNum"
					:readonly="readonly"
					:maxRange="maxRange"
					:rangePrompt="rangePrompt"
					:showRangePrompt="showRangePrompt"
					:allowSameDay="allowSameDay"
					:todayDate="todayDate"
					:todayColor="todayColor"
					:forbidDays="forbidDays"
					:forbidDaysToast="forbidDaysToast"
					:monthFormat="monthFormat"
					ref="monthRef"
					@monthSelected="monthSelected"
					@updateMonthTop="onUpdateMonthTop"
				></uMonth>
			</scroll-view>
			<view
				v-else
				:style="{
                    height: addUnit(listHeight)
                }"
			>
				<uMonth
					:color="color"
					:rowHeight="rowHeight"
					:showMark="showMark"
					:months="currentMonths"
					:mode="mode"
					:maxCount="maxCount"
					:startText="startText"
					:endText="endText"
					:defaultDate="defaultDate"
					:minDate="innerMinDate"
					:maxDate="innerMaxDate"
					:maxMonth="monthNum"
					:readonly="readonly"
					:maxRange="maxRange"
					:rangePrompt="rangePrompt"
					:showRangePrompt="showRangePrompt"
					:allowSameDay="allowSameDay"
					:todayDate="todayDate"
					:todayColor="todayColor"
					:forbidDays="forbidDays"
					:forbidDaysToast="forbidDaysToast"
					:monthFormat="monthFormat"
					ref="monthRef"
					@monthSelected="monthSelected"
					@updateMonthTop="onUpdateMonthTop"
				></uMonth>
			</view>
			<slot name="footer" v-if="showConfirm">
				<view class="up-calendar__confirm">
					<up-button
						shape="circle"
						:text="
                            buttonDisabled ? confirmDisabledText : confirmText
                        "
						:color="color"
						@click="confirm"
						:disabled="buttonDisabled"
					></up-button>
				</view>
			</slot>
		</view>
	</up-popup>
	<up-popup
		:show="timePickerShow"
		mode="center"
		:round="8"
		:closeOnClickOverlay="true"
		@close="closeTimePicker"
	>
		<view class="up-calendar__time-picker">
			<view class="up-calendar__time-picker__header">
				<text class="up-calendar__time-picker__cancel" @click="closeTimePicker">取消</text>
				<text class="up-calendar__time-picker__title">选择时间</text>
				<text class="up-calendar__time-picker__confirm" @click="confirmTimePicker">确定</text>
			</view>
			<picker-view class="up-calendar__time-picker__body" :value="timePickerValue" @change="onTimePickerChange">
				<picker-view-column>
					<view v-for="(item, index) in hourOptions" :key="`h-${index}`" class="up-calendar__time-picker__item">{{ item }}</view>
				</picker-view-column>
				<picker-view-column v-if="timePrecision !== 'hour'">
					<view v-for="(item, index) in minuteOptions" :key="`m-${index}`" class="up-calendar__time-picker__item">{{ item }}</view>
				</picker-view-column>
				<picker-view-column v-if="timePrecision === 'second'">
					<view v-for="(item, index) in secondOptions" :key="`s-${index}`" class="up-calendar__time-picker__item">{{ item }}</view>
				</picker-view-column>
			</picker-view>
		</view>
	</up-popup>
</template>

<script setup>
/**
 * Calendar 日历
 * @description  此组件用于单个选择日期，范围选择日期等，日历被包裹在底部弹起的容器中.
 * @tutorial https://ijry.github.io/uview-plus/components/calendar.html
 * @example <up-calendar  :defaultDate="defaultDateMultiple" :show="show" mode="multiple" @confirm="confirm"></up-calendar>
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import uHeader from './header.vue'
import uMonth from './month.vue'
import { props as calendarProps } from './props.js'
import dayjs from '../up-datetime-picker/dayjs.esm.min.js'
import Calendar from '../../libs/util/calendar.js'
import { commonProps } from '../../libs/composable/useUltraUI'
import { addUnit, range, error, padZero } from '../../libs/function/index.js'
import test from '../../libs/function/test.js'
import { t } from '../../libs/i18n/index.js'

defineOptions({
	name: 'up-calendar',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...calendarProps.props
})
const emit = defineEmits(['confirm', 'close'])

// 需要显示的月份的数组
const months = ref([])
// 在月份滚动区域中，当前视图中月份的index索引
const monthIndex = ref(0)
// 月份滚动区域的高度
const listHeight = ref(0)
// month组件中选择的日期数组
const selected = ref([])
const scrollIntoView = ref('')
const scrollIntoViewScroll = ref('')
const scrollTop = ref(0)
// 月份数据是否已初始化，避免 mounted / watch 重复全量生成
const monthsInited = ref(false)
const timePickerShow = ref(false)
const timePickerTarget = ref('single')
const timePickerValue = ref([0, 0, 0])
const hourOptions = ref([])
const minuteOptions = ref([])
const secondOptions = ref([])
const singleTime = ref('00:00')
const rangeStartTime = ref('00:00')
const rangeEndTime = ref('00:00')
// 过滤处理方法
const innerFormatter = ref((value) => value)
const monthRef = ref(null)
let start = 0

// 由于maxDate和minDate可以为字符串(2021-10-10)，或者数值(时间戳)，但是dayjs如果接受字符串形式的时间戳会有问题，这里进行处理
const innerMaxDate = computed(() => {
	return test.number(props.maxDate)
		? Number(props.maxDate)
		: props.maxDate
})

const innerMinDate = computed(() => {
	return test.number(props.minDate)
		? Number(props.minDate)
		: props.minDate
})

const todayDate = computed(() => {
	return dayjs().format('YYYY-MM-DD')
})

const todayText = computed(() => {
	return t('up.calendar.today')
})

const todayDisabled = computed(() => {
	const today = dayjs(todayDate.value)
	const minDate = innerMinDate.value ? dayjs(innerMinDate.value) : null
	const maxDate = innerMaxDate.value ? dayjs(innerMaxDate.value) : null
	if (minDate && today.isBefore(minDate, 'day')) {
		return true
	}
	if (maxDate && today.isAfter(maxDate, 'day')) {
		return true
	}
	return false
})

// 多个条件的变化，会引起选中日期的变化，这里统一管理监听
const selectedChange = computed(() => {
	return [innerMinDate.value, innerMaxDate.value, props.defaultDate]
})

const subtitle = computed(() => {
	// 初始化时，months为空数组，所以需要特别判断处理
	if (months.value.length) {
		return `${months.value[monthIndex.value].year}年${
			months.value[monthIndex.value].month
		}月`
	} else {
		return ''
	}
})

const currentMonths = computed(() => {
	if (props.monthSwitch && months.value.length) {
		return [months.value[monthIndex.value]]
	}
	return months.value
})

const switchPrevDisabled = computed(() => {
	return monthIndex.value <= 0
})

const switchNextDisabled = computed(() => {
	return monthIndex.value >= months.value.length - 1
})

const switchPrevYearDisabled = computed(() => {
	return monthIndex.value - 12 < 0
})

const switchNextYearDisabled = computed(() => {
	return monthIndex.value + 12 > months.value.length - 1
})

const showTimePanel = computed(() => {
	if (!props.enableTime) return false
	if (props.mode === 'single') return true
	if (props.mode === 'range' && props.rangeResultMode === 'boundary') {
		return true
	}
	return false
})

const singleDateLabel = computed(() => {
	return selected.value[0] || '--'
})

const rangeStartDateLabel = computed(() => {
	return selected.value[0] || '--'
})

const rangeEndDateLabel = computed(() => {
	if (selected.value.length >= 2) {
		return selected.value[selected.value.length - 1]
	}
	return '--'
})

const buttonDisabled = computed(() => {
	// 如果为range类型，且选择的日期个数不足1个时，让底部的按钮出于disabled状态
	if (props.mode === 'range') {
		if (selected.value.length <= 1) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
})

const calendarCloseable = computed(() => {
	if (props.closeable === null || props.closeable === '') return !props.pageInline
	return props.closeable === true || props.closeable === 'true'
})

watch(scrollIntoView, (n) => {
	// console.log('scrollIntoView', n)
}, { immediate: true })

watch(selectedChange, () => {
	// 仅在初始化后、边界/默认值变化时重建，避免 mounted 与打开弹层重复生成月份
	if (monthsInited.value) {
		setMonth()
	}
})

watch(() => props.timePrecision, () => {
	initTimeOptions()
	initTimeValues()
})

watch(() => props.defaultTime, () => {
	initTimeValues()
})

// 打开弹窗时，设置月份数据
watch(() => props.show, (n) => {
	if (n) {
		// 已初始化过则复用月份数据，避免每次打开都全量重建
		if (!monthsInited.value || !months.value.length) {
			setMonth()
		}
	} else {
		// 关闭时重置scrollIntoView，否则会出现二次打开日历，当前月份数据显示不正确。
		// scrollIntoView需要有一个值变动过程，才会产生作用。
		scrollIntoView.value = ''
	}
}, { immediate: true })

onMounted(() => {
	start = Date.now()
	init()
})

function padTime(num) {
	return String(num).padStart(2, '0')
}

function initTimeOptions() {
	hourOptions.value = Array.from({ length: 24 }, (_, i) => padTime(i))
	minuteOptions.value = Array.from({ length: 60 }, (_, i) => padTime(i))
	secondOptions.value = Array.from({ length: 60 }, (_, i) => padTime(i))
}

function parseTimeValue(value = '') {
	const raw = String(value || '').trim()
	const parts = raw.length ? raw.split(':') : []
	const getNumber = (index, max) => {
		const current = Number(parts[index] || 0)
		if (Number.isNaN(current)) return 0
		return Math.max(0, Math.min(max, current))
	}
	const hour = getNumber(0, 23)
	const minute = getNumber(1, 59)
	const second = getNumber(2, 59)
	return [hour, minute, second]
}

function getDefaultTimeValue() {
	const [hour, minute, second] = parseTimeValue(props.defaultTime)
	if (props.timePrecision === 'hour') {
		return padTime(hour)
	}
	if (props.timePrecision === 'second') {
		return `${padTime(hour)}:${padTime(minute)}:${padTime(second)}`
	}
	return `${padTime(hour)}:${padTime(minute)}`
}

function initTimeValues() {
	const value = getDefaultTimeValue()
	singleTime.value = value
	rangeStartTime.value = value
	rangeEndTime.value = value
}

function timeToPickerValue(value = '') {
	const [hour, minute, second] = parseTimeValue(value)
	return [hour, minute, second]
}

function pickerValueToTime(value = []) {
	const hour = Number(value[0] || 0)
	const minute = Number(value[1] || 0)
	const second = Number(value[2] || 0)
	if (props.timePrecision === 'hour') {
		return padTime(hour)
	}
	if (props.timePrecision === 'second') {
		return `${padTime(hour)}:${padTime(minute)}:${padTime(second)}`
	}
	return `${padTime(hour)}:${padTime(minute)}`
}

function openTimePicker(target) {
	timePickerTarget.value = target
	let currentValue = singleTime.value
	if (target === 'start') currentValue = rangeStartTime.value
	if (target === 'end') currentValue = rangeEndTime.value
	timePickerValue.value = timeToPickerValue(currentValue)
	timePickerShow.value = true
}

function onTimePickerChange(e) {
	timePickerValue.value = e.detail.value
}

function closeTimePicker() {
	timePickerShow.value = false
}

function confirmTimePicker() {
	const value = pickerValueToTime(timePickerValue.value)
	if (timePickerTarget.value === 'single') singleTime.value = value
	if (timePickerTarget.value === 'start') rangeStartTime.value = value
	if (timePickerTarget.value === 'end') rangeEndTime.value = value
	timePickerShow.value = false
}

function timeToSecond(timeText = '') {
	const [hour, minute, second] = parseTimeValue(timeText)
	return hour * 3600 + minute * 60 + second
}

function validateSameDayRangeTime() {
	if (!props.enableTime || props.mode !== 'range' || props.rangeResultMode !== 'boundary') {
		return true
	}
	if (selected.value.length < 2) return true
	const startDate = selected.value[0]
	const endDate = selected.value[selected.value.length - 1]
	if (startDate !== endDate) return true
	const startSeconds = timeToSecond(rangeStartTime.value)
	const endSeconds = timeToSecond(rangeEndTime.value)
	if (endSeconds < startSeconds) {
		uni.showToast({
			title: '结束时间不能早于开始时间',
			icon: 'none'
		})
		return false
	}
	return true
}

function appendTime(dateText, timeText) {
	return `${dateText} ${timeText}`
}

function getConfirmValue(selectedArg = selected.value) {
	let result = selectedArg
	if (
		props.mode === 'range' &&
		props.rangeResultMode === 'boundary' &&
		selectedArg.length >= 2
	) {
		const len = selectedArg.length - 1
		result = [selectedArg[0], selectedArg[len]]
	}
	if (!showTimePanel.value || !props.enableTime) {
		return result
	}
	if (props.mode === 'single' && result.length >= 1) {
		return [appendTime(result[0], singleTime.value)]
	}
	if (props.mode === 'range' && props.rangeResultMode === 'boundary' && result.length >= 2) {
		return [
			appendTime(result[0], rangeStartTime.value),
			appendTime(result[1], rangeEndTime.value)
		]
	}
	return result
}

// 在微信小程序中，不支持将函数当做props参数，故只能通过ref形式调用
function setFormatter(e) {
	innerFormatter.value = e
}

// month组件内部选择日期后，通过事件通知给父组件
function monthSelected(e, scene = 'init') {
	selected.value = e
	if (!props.showConfirm) {
		// 在不需要确认按钮的情况下，如果为单选，或者范围多选且已选长度大于2，则直接进行返还
		if (
			props.mode === 'multiple' ||
			props.mode === 'single' ||
			(props.mode === 'range' && selected.value.length >= 2)
		) {
			if (scene === 'init') {
				return
			}
			if (scene === 'tap') {
				if (!validateSameDayRangeTime()) return
				emit('confirm', getConfirmValue())
			}
		}
	}
}

function init() {
	// 校验maxDate，不能小于minDate。
	if (
		innerMaxDate.value &&
		innerMinDate.value &&
		new Date(innerMaxDate.value).getTime() < new Date(innerMinDate.value).getTime()
	) {
		return error('maxDate不能小于minDate时间')
	}
	// 滚动区域的高度
	let bottomPadding = 0
	if (!props.pageInline) {
		bottomPadding = 30
	}
	listHeight.value = props.rowHeight * (props.monthSwitch ? 6 : 5) + bottomPadding
	initTimeOptions()
	initTimeValues()
	setMonth()
}

function close() {
	emit('close')
}

// 点击确定按钮
function confirm() {
	if (!buttonDisabled.value) {
		if (!validateSameDayRangeTime()) return
		emit('confirm', getConfirmValue())
	}
}

// 获得两个日期之间的月份数
function getMonths(minDate, maxDate) {
	const minYear = dayjs(minDate).year()
	const minMonth = dayjs(minDate).month() + 1
	const maxYear = dayjs(maxDate).year()
	const maxMonth = dayjs(maxDate).month() + 1
	return (maxYear - minYear) * 12 + (maxMonth - minMonth) + 1
}

// 设置月份数据
function setMonth() {
	// 最小日期的毫秒数
	const minDate = innerMinDate.value || dayjs().valueOf()
	// 如果没有指定最大日期，则往后推3个月
	const maxDate =
		innerMaxDate.value ||
		dayjs(minDate)
			.add(props.monthNum - 1, 'month')
			.valueOf()
	// 最大最小月份之间的共有多少个月份，
	const monthsCount = range(
		1,
		props.monthNum,
		getMonths(minDate, maxDate)
	)
	const minDateStr = dayjs(minDate).format('YYYY-MM-DD')
	const maxDateStr = dayjs(maxDate).format('YYYY-MM-DD')
	const formatter = props.formatter || innerFormatter.value
	// 先清空数组
	const monthsData = []
	for (let i = 0; i < monthsCount; i++) {
		// 缓存当月 dayjs，避免每个日期重复 create/add
		const monthBase = dayjs(minDate).add(i, 'month')
		const daysInMonth = monthBase.daysInMonth()
		const monthValue = monthBase.month() + 1
		const yearValue = monthBase.year()
		const dateList = []
		for (let day = 1; day <= daysInMonth; day++) {
			const dayBase = monthBase.date(day)
			const date = dayBase.format('YYYY-MM-DD')
			const week = dayBase.day()
			let bottomInfo = ''
			if (props.showLunar) {
				// 将日期转为农历格式
				const lunar = Calendar.solar2lunar(
					dayBase.year(),
					dayBase.month() + 1,
					dayBase.date()
				)
				bottomInfo = lunar.IDayCn
			}
			const config = {
				day,
				week,
				// 小于最小允许的日期，或者大于最大的日期，则设置为disabled状态
				disabled: date < minDateStr || date > maxDateStr,
				// 返回一个日期对象，供外部的formatter获取当前日期的年月日等信息，进行加工处理
				date: new Date(date),
				bottomInfo,
				dot: false,
				month: monthValue
			}
			dateList.push(formatter(config))
		}
		monthsData.push({
			date: dateList,
			// 当前所属的月份
			month: monthValue,
			// 当前年份
			year: yearValue
		})
	}
	months.value = monthsData
	monthsInited.value = true
	if (props.monthSwitch) {
		monthIndex.value = getDefaultMonthIndex()
	}
}

function getDefaultMonthIndex() {
	let selectedMonth = dayjs().format('YYYY-MM')
	if (props.defaultDate) {
		if (!test.array(props.defaultDate)) {
			selectedMonth = dayjs(props.defaultDate).format('YYYY-MM')
		} else if (props.defaultDate.length) {
			selectedMonth = dayjs(props.defaultDate[0]).format('YYYY-MM')
		}
	}
	const index = months.value.findIndex(({ year, month }) => {
		return `${year}-${padZero(month)}` === selectedMonth
	})
	return index === -1 ? 0 : index
}

function prevMonth() {
	if (!switchPrevDisabled.value) {
		monthIndex.value -= 1
	}
}

function nextMonth() {
	if (!switchNextDisabled.value) {
		monthIndex.value += 1
	}
}

function prevYear() {
	if (!switchPrevYearDisabled.value) {
		monthIndex.value -= 12
	}
}

function nextYear() {
	if (!switchNextYearDisabled.value) {
		monthIndex.value += 12
	}
}

function jumpToToday() {
	if (todayDisabled.value) {
		return
	}
	const targetMonth = dayjs(todayDate.value).format('YYYY-MM')
	const selectToday = () => {
		if (props.mode === 'range') {
			return
		}
		monthRef.value && monthRef.value.selectDate(todayDate.value)
	}
	if (props.monthSwitch) {
		const todayMonthIndex = months.value.findIndex(({ year, month }) => {
			return `${year}-${padZero(month)}` === targetMonth
		})
		if (todayMonthIndex !== -1) {
			monthIndex.value = todayMonthIndex
			nextTick(selectToday)
		}
		return
	}
	scrollIntoDefaultMonth(targetMonth)
	nextTick(selectToday)
}

// 滚动到默认设置的月份
function scrollIntoDefaultMonth(selectedMonth) {
	// 查询默认日期在可选列表的下标
	const _index = months.value.findIndex(({
		year,
		month
	}) => {
		const monthStr = padZero(month)
		return `${year}-${monthStr}` === selectedMonth
	})
	if (_index !== -1) {
		// #ifndef MP-WEIXIN
		nextTick(() => {
			scrollIntoView.value = ''
			scrollIntoView.value = `month-${_index}`
			scrollIntoViewScroll.value = scrollIntoView.value
		})
		// #endif
		// #ifdef MP-WEIXIN
		scrollTop.value = months.value[_index].top || 0
		// #endif
	}
}

// scroll-view滚动监听
function onScroll(event) {
	// 不允许小于0的滚动值，如果scroll-view到顶了，继续下拉，会出现负数值
	const nextScrollTop = Math.max(0, event.detail.scrollTop)
	// 将当前滚动条数值，除以滚动区域的高度，可以得出当前滚动到了哪一个月份的索引
	for (let i = 0; i < months.value.length; i++) {
		if (nextScrollTop >= (months.value[i].top || listHeight.value)) {
			monthIndex.value = i
			scrollIntoViewScroll.value = `month-${i}`
		}
	}
}

// 更新月份的top值
function onUpdateMonthTop(topArr = []) {
	if (props.monthSwitch) {
		return
	}
	updateMonthTop(topArr)
}

function updateMonthTop(topArr = []) {
	// 设置对应月份的top值，用于onScroll方法更新月份
	topArr.map((item, index) => {
		months.value[index].top = item
	})

	// 获取默认日期的下标
	if (!props.defaultDate) {
		// 如果没有设置默认日期，则将当天日期设置为默认选中的日期
		const selectedMonth = dayjs().format("YYYY-MM")
		scrollIntoDefaultMonth(selectedMonth)
		return
	}
	let selectedMonth = dayjs().format("YYYY-MM")
	// 单选模式，可以是字符串或数组，Date对象等
	if (!test.array(props.defaultDate)) {
		selectedMonth = dayjs(props.defaultDate).format("YYYY-MM")
	} else {
		selectedMonth = dayjs(props.defaultDate[0]).format("YYYY-MM")
	}
	scrollIntoDefaultMonth(selectedMonth)
}

defineExpose({
	setFormatter,
	init,
	confirm,
	close
})
</script>


<style lang="scss" scoped>
@import '../../libs/css/components.scss';

.up-calendar {
	/* 保证底部确认按钮始终在弹层可视区域内 */
	width: 100%;

	&__time-panel {
		padding: 8px 16px 0;
	}

	&__time-row {
		height: 34px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	&__time-date {
		font-size: 13px;
		color: #303133;
	}

	&__time-trigger {
		min-width: 92px;
		height: 30px;
		padding: 0 10px;
		border-radius: 15px;
		border: 1px solid #dcdfe6;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__time-text {
		font-size: 14px;
		color: #303133;
	}

	&__time-picker {
		width: 320px;
		background-color: #ffffff;
		border-radius: 8px;
		overflow: hidden;
	}

	&__time-picker__header {
		height: 44px;
		padding: 0 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #f0f0f0;
	}

	&__time-picker__cancel {
		font-size: 14px;
		color: #909399;
	}

	&__time-picker__title {
		font-size: 15px;
		color: #303133;
		font-weight: 600;
	}

	&__time-picker__confirm {
		font-size: 14px;
		color: #3c9cff;
	}

	&__time-picker__body {
		width: 320px;
		height: 200px;
	}

	&__time-picker__item {
		height: 40px;
		line-height: 40px;
		text-align: center;
		font-size: 16px;
		color: #303133;
	}

	&__confirm {
		padding: 7px 18px;
		/* 防止在 bottom popup + safe-area 下被挤出可视区 */
		flex-shrink: 0;
	}
}
</style>
