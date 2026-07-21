<template>
	<view class="up-calendar-strip">
		<view v-if="!fullCalendar || !innerShowFull">
			<view class="up-calendar-strip__header up-border-bottom">
				<text
					class="up-calendar-strip__header__switch"
					:class="{ 'up-calendar-strip__header__switch--disabled': switchPrevDisabled }"
					@tap="prevMonth"
				>‹</text>
				<text class="up-calendar-strip__header__title">{{ monthLabel }}</text>
				<text
					class="up-calendar-strip__header__switch"
					:class="{ 'up-calendar-strip__header__switch--disabled': switchNextDisabled }"
					@tap="nextMonth"
				>›</text>
				<text
					v-if="fullCalendar"
					class="up-calendar-strip__header__toggle"
					@click="toggleFull('button')"
				>▾</text>
			</view>
			<view
				class="up-calendar-strip__scroll-wrap"
				@touchstart="onTouchStart"
				@touchend="onTouchEnd"
			>
				<scroll-view
					class="up-calendar-strip__scroll"
					scroll-x
					enable-flex
					:show-scrollbar="false"
					:scroll-into-view="scrollIntoView"
				>
					<view class="up-calendar-strip__scroll__inner">
						<view
							v-for="(item, index) in monthDays"
							:key="index"
							class="up-calendar-strip__day"
							:id="getDateId(item.date)"
							:class="[
								item.disabled && 'up-calendar-strip__day--disabled',
								item.selected && 'up-calendar-strip__day--selected',
								item.today && showToday && !item.selected && 'up-calendar-strip__day--today',
							]"
							:style="[dayStyle(item)]"
							@tap="onDayTap(item)"
						>
							<text class="up-calendar-strip__day__date">{{ item.day }}</text>
							<text class="up-calendar-strip__day__week">{{ getWeekLabel(item.week) }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
		<view
			v-if="fullCalendar && innerShowFull"
			class="up-calendar-strip__panel-wrap"
			@touchstart="onTouchStart"
			@touchend="onTouchEnd"
		>
			<view class="up-calendar-strip__panel">
				<up-calendar
					:show="true"
					:pageInline="true"
					:showTitle="false"
					:showConfirm="false"
					:closeOnClickOverlay="false"
					:monthSwitch="true"
					mode="single"
					:defaultDate="innerSelectedDate"
					:minDate="panelMinDate"
					:maxDate="panelMaxDate"
					:monthNum="panelMonthNum"
					:readonly="readonly"
					:showToday="showToday"
					:color="color"
					v-bind="fullCalendarProps"
					@confirm="onPanelConfirm"
				></up-calendar>
			</view>
			<view class="up-calendar-strip__hint up-calendar-strip__hint--panel">
				<text class="up-calendar-strip__hint__text" @click="toggleFull('hint')">{{ collapseHint }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { props as calendarStripProps } from './props'
import { commonProps } from '../../libs/composable/useUltraUI'
import dayjs from '../up-datetime-picker/dayjs.esm.min.js'
import test from '../../libs/function/test'

/**
 * CalendarStrip 单行日历
 * @description 单行横向日期日历，支持切月、下拉展开完整月历
 */
defineOptions({
	name: 'up-calendar-strip',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...calendarStripProps.props
})
const emit = defineEmits(['change', 'confirm', 'monthChange', 'toggleFull', 'update:modelValue'])

const innerSelectedDate = ref('')
const currentMonth = ref('')
const scrollIntoView = ref('')
const innerShowFull = ref(false)
const touchStartX = ref(0)
const touchStartY = ref(0)

const innerMaxDate = computed(() => (test.number(props.maxDate) ? Number(props.maxDate) : props.maxDate))
const innerMinDate = computed(() => (test.number(props.minDate) ? Number(props.minDate) : props.minDate))
const rangeChange = computed(() => [innerMinDate.value, innerMaxDate.value])
const hasMaxDate = computed(() => !!innerMaxDate.value && dayjs(innerMaxDate.value).isValid())
const hasMinDate = computed(() => !!innerMinDate.value && dayjs(innerMinDate.value).isValid())
const minDateDay = computed(() => {
	if (!hasMinDate.value) return ''
	return dayjs(innerMinDate.value).format('YYYY-MM-DD')
})
const maxDateDay = computed(() => {
	if (!hasMaxDate.value) return ''
	return dayjs(innerMaxDate.value).format('YYYY-MM-DD')
})
const todayDate = computed(() => dayjs().format('YYYY-MM-DD'))
const monthLabel = computed(() => {
	if (!currentMonth.value) return ''
	const date = dayjs(`${currentMonth.value}-01`)
	if (props.monthFormat) return date.format(props.monthFormat)
	if (uni.getLocale() == 'zh-Hans' || uni.getLocale() == 'zh-Hant') {
		return date.format('YYYY年MM月')
	}
	return date.format('MM/YYYY')
})
const monthDays = computed(() => {
	if (!currentMonth.value) return []
	const start = dayjs(`${currentMonth.value}-01`)
	const days = start.daysInMonth()
	return new Array(days).fill(0).map((item, index) => {
		const date = start.date(index + 1).format('YYYY-MM-DD')
		return {
			day: index + 1,
			date,
			week: start.date(index + 1).day(),
			disabled: isDateDisabled(date),
			selected: dateSame(date, innerSelectedDate.value),
			today: dateSame(date, todayDate.value)
		}
	})
})
const switchPrevDisabled = computed(() => {
	if (!hasMinDate.value || !currentMonth.value) return false
	const current = dayjs(`${currentMonth.value}-01`)
	const minMonth = dayjs(minDateDay.value).startOf('month')
	return current.isSame(minMonth, 'month') || current.isBefore(minMonth, 'month')
})
const switchNextDisabled = computed(() => {
	if (!hasMaxDate.value || !currentMonth.value) return false
	const current = dayjs(`${currentMonth.value}-01`)
	const maxMonth = dayjs(maxDateDay.value).startOf('month')
	return current.isSame(maxMonth, 'month') || current.isAfter(maxMonth, 'month')
})
const panelMinDate = computed(() => {
	if (hasMinDate.value) return minDateDay.value
	const monthNum = Math.max(1, Number(props.fullMonthNum) || 24)
	const anchor = currentMonth.value || dayjs().format('YYYY-MM')
	return dayjs(`${anchor}-01`).subtract(monthNum - 1, 'month').startOf('month').format('YYYY-MM-DD')
})
const panelMaxDate = computed(() => {
	if (hasMaxDate.value) return maxDateDay.value
	const monthNum = Math.max(1, Number(props.fullMonthNum) || 24)
	const anchor = currentMonth.value || dayjs().format('YYYY-MM')
	return dayjs(`${anchor}-01`).add(monthNum - 1, 'month').endOf('month').format('YYYY-MM-DD')
})
const panelMonthNum = computed(() => getMonths(panelMinDate.value, panelMaxDate.value))
const pullHintText = computed(() => (innerShowFull.value ? props.collapseHint : props.expandHint))

watch(() => props.modelValue, (n) => {
	syncByValue(n, false, 'sync')
}, { immediate: true })

watch(rangeChange, () => {
	syncByValue(innerSelectedDate.value || props.modelValue, true, 'range')
})

function dateSame(date1, date2) {
	if (!date1 || !date2) return false
	return dayjs(date1).isSame(dayjs(date2), 'day')
}

function normalizeDate(value) {
	if (!value) return ''
	const parsed = dayjs(value)
	if (!parsed.isValid()) return ''
	return parsed.format('YYYY-MM-DD')
}

function clampDate(date) {
	let next = normalizeDate(date)
	if (!next) return ''
	if (hasMinDate.value && dayjs(next).isBefore(dayjs(minDateDay.value), 'day')) {
		next = minDateDay.value
	}
	if (hasMaxDate.value && dayjs(next).isAfter(dayjs(maxDateDay.value), 'day')) {
		next = maxDateDay.value
	}
	return next
}

function isDateDisabled(date) {
	if (!date) return true
	if (hasMinDate.value && dayjs(date).isBefore(dayjs(minDateDay.value), 'day')) {
		return true
	}
	if (hasMaxDate.value && dayjs(date).isAfter(dayjs(maxDateDay.value), 'day')) {
		return true
	}
	return false
}

function getDateId(date) {
	return `up-calendar-strip-day-${dayjs(date).format('YYYYMMDD')}`
}

function getWeekLabel(week) {
	const index = week === 0 ? 6 : week - 1
	return props.weekText[index] || ''
}

function dayStyle(item) {
	const style = {}
	if (item.selected) {
		style.backgroundColor = props.color
	}
	if (!item.selected && item.today && props.showToday) {
		style.borderColor = props.color
	}
	return style
}

function scrollToDate(date) {
	if (!date) {
		scrollIntoView.value = ''
		return
	}
	const target = getDateId(date)
	scrollIntoView.value = ''
	nextTick(() => {
		scrollIntoView.value = target
	})
}

function syncByValue(value, emitEvent = false, scene = 'sync') {
	let next = clampDate(value)
	if (!next) {
		next = clampDate(todayDate.value)
	}
	if (!next) return
	setSelectedDate(next, scene, emitEvent)
}

function setSelectedDate(date, scene = 'tap', emitEvent = true) {
	const next = clampDate(date)
	if (!next || isDateDisabled(next)) return
	const prevDate = innerSelectedDate.value
	const prevMonth = currentMonth.value
	innerSelectedDate.value = next
	currentMonth.value = dayjs(next).format('YYYY-MM')
	scrollToDate(next)
	if (!emitEvent) return
	const payload = {
		date: next,
		month: currentMonth.value,
		scene
	}
	if (!dateSame(prevDate, next)) {
		emit('update:modelValue', next)
	}
	emit('change', payload)
	emit('confirm', payload)
	if (prevMonth !== currentMonth.value) {
		emit('monthChange', {
			month: currentMonth.value,
			scene
		})
	}
}

function getMonths(minDate, maxDate) {
	const minYear = dayjs(minDate).year()
	const minMonth = dayjs(minDate).month() + 1
	const maxYear = dayjs(maxDate).year()
	const maxMonth = dayjs(maxDate).month() + 1
	return Math.max(1, (maxYear - minYear) * 12 + (maxMonth - minMonth) + 1)
}

function findFirstEnabledDate(month) {
	const start = dayjs(`${month}-01`)
	const days = start.daysInMonth()
	for (let i = 1; i <= days; i++) {
		const date = start.date(i).format('YYYY-MM-DD')
		if (!isDateDisabled(date)) {
			return date
		}
	}
	return ''
}

function switchMonth(step = 0) {
	if (step < 0 && switchPrevDisabled.value) return
	if (step > 0 && switchNextDisabled.value) return
	const baseMonth = currentMonth.value || dayjs(todayDate.value).format('YYYY-MM')
	const target = dayjs(`${baseMonth}-01`).add(step, 'month')
	const targetMonth = target.format('YYYY-MM')
	const selectedDay = dayjs(innerSelectedDate.value || todayDate.value).date()
	const dayInTargetMonth = Math.min(selectedDay, target.daysInMonth())
	let next = target.date(dayInTargetMonth).format('YYYY-MM-DD')
	next = clampDate(next)
	if (!next || !dayjs(next).isSame(target, 'month') || isDateDisabled(next)) {
		next = findFirstEnabledDate(targetMonth)
	}
	if (!next) return
	setSelectedDate(next, 'switch', true)
}

function prevMonth() {
	switchMonth(-1)
}

function nextMonth() {
	switchMonth(1)
}

function onDayTap(item) {
	if (props.readonly || item.disabled) return
	setSelectedDate(item.date, 'tap', true)
}

function setFullVisible(show, source = 'button') {
	if (!props.fullCalendar) return
	if (innerShowFull.value === show) return
	innerShowFull.value = show
	emit('toggleFull', {
		show,
		source
	})
}

function toggleFull(source = 'button') {
	setFullVisible(!innerShowFull.value, source)
}

function onPanelConfirm(e) {
	if (!Array.isArray(e) || !e.length) return
	setSelectedDate(e[0], 'full', true)
	if (props.collapseAfterSelect) {
		setFullVisible(false, 'auto')
	}
}

function onTouchStart(event) {
	if (!props.fullCalendar) return
	const point = event?.changedTouches?.[0] || event?.touches?.[0]
	if (!point) return
	touchStartX.value = point.clientX
	touchStartY.value = point.clientY
}

function onTouchEnd(event) {
	if (!props.fullCalendar) return
	const point = event?.changedTouches?.[0] || event?.touches?.[0]
	if (!point) return
	const deltaX = point.clientX - touchStartX.value
	const deltaY = point.clientY - touchStartY.value
	const threshold = Number(props.pullDownThreshold) || 40
	if (Math.abs(deltaY) < threshold || Math.abs(deltaY) <= Math.abs(deltaX)) {
		return
	}
	if (deltaY > 0 && !innerShowFull.value) {
		setFullVisible(true, 'pull-down')
	}
	if (deltaY < 0 && innerShowFull.value) {
		setFullVisible(false, 'pull-up')
	}
}
</script>


<style lang="scss" scoped>
@import "../../libs/css/components.scss";

.up-calendar-strip {
	background-color: var(--up-card-bg-color, #ffffff);
	border-radius: 10px;
	margin: 0 8px;

	&__header {
		@include flex;
		align-items: center;
		padding: 0 4px;
		height: 40px;

		&__switch {
			width: 40px;
			text-align: center;
			font-size: 20px;
			line-height: 40px;
			color: var(--up-main-color, $up-main-color);

			&--disabled {
				opacity: 0.35;
			}
		}

		&__title {
			flex: 1;
			text-align: center;
			font-size: 14px;
			font-weight: bold;
			color: var(--up-main-color, $up-main-color);
		}

		&__toggle {
			width: 40px;
			text-align: center;
			font-size: 18px;
			line-height: 40px;
			color: var(--up-content-color, $up-content-color);
		}
	}

	&__scroll-wrap {
		padding: 10px 0 6px;
	}

	&__scroll {
		&__inner {
			@include flex;
			padding: 0 8px;
		}
	}

	&__day {
		width: 54px;
		height: 62px;
		margin-right: 8px;
		border-radius: 8px;
		border: 1px solid transparent;
		@include flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&__date {
			font-size: 18px;
			line-height: 22px;
			color: var(--up-main-color, $up-main-color);
		}

		&__week {
			margin-top: 4px;
			font-size: 12px;
			line-height: 16px;
			color: var(--up-content-color, $up-content-color);
		}

		&--selected {
			.up-calendar-strip__day__date,
			.up-calendar-strip__day__week {
				color: #ffffff;
			}
		}

		&--today {
			border-style: solid;
		}

		&--disabled {
			opacity: 0.4;
		}
	}

	&__hint {
		padding: 4px 0 10px;
		text-align: center;

		&__text {
			font-size: 12px;
			color: var(--up-tips-color, $up-tips-color);
		}
	}

	&__panel {
		padding: 0 8px 8px;
	}

	&__panel-wrap {
		padding-top: 4px;
	}

	&__hint--panel {
		padding: 0 0 8px;
	}
}
</style>
