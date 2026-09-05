<template>
    <view class="up-datetime-picker">
        <view v-if="hasInput" class="up-datetime-picker__has-input"
            @click="showByClickInput = !showByClickInput"
        >
            <up-input
                :placeholder="placeholder"
                :readonly="!!showByClickInput"
                border="surround"
                v-model="inputValue"
            ></up-input>
        </view>
        <up-picker
            ref="pickerRef"
            :show="pageInline || show || (hasInput && showByClickInput)"
            :pageInline="pageInline"
            :popupMode="popupMode"
            :closeOnClickOverlay="closeOnClickOverlay"
            :columns="columns"
            :title="title"
            :itemHeight="itemHeight"
            :showToolbar="showToolbar"
            :visibleItemCount="visibleItemCount"
            :defaultIndex="innerDefaultIndex"
            :cancelText="cancelText"
            :confirmText="confirmText"
            :cancelColor="cancelColor"
            :confirmColor="confirmColor"
            :toolbarRightSlot="toolbarRightSlot"
            @close="close"
            @closed="closedHandler"
            @cancel="cancel"
            @confirm="confirm"
            @change="change"
        >
            <template #toolbar-right>
                <slot name="toolbar-right">
                </slot>
            </template>
            <template #toolbar-bottom>
                <slot name="toolbar-bottom">
                </slot>
            </template>
        </up-picker>
    </view>
</template>

<script setup>
/**
 * DatetimePicker 时间日期选择器
 * @description 此选择器用于时间日期
 * @tutorial https://ijry.github.io/uview-plus/components/datetimePicker.html
 * @example  <up-datetime-picker :show="show" :value="value1"  mode="datetime" ></up-datetime-picker>
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { props as datetimeProps } from './props.js'
import { commonProps } from '../../libs/composable/useUltraUI'
import dayjs from './dayjs.esm.min.js'
import { range, error, padZero, timeFormat } from '../../libs/function/index.js'

function times(n, iteratee) {
	let index = -1
	const result = Array(n < 0 ? 0 : n)
	while (++index < n) {
		result[index] = iteratee(index)
	}
	return result
}

defineOptions({
	name: 'up-datetime-picker',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	...datetimeProps.props
})
const emit = defineEmits(['close', 'closed', 'cancel', 'confirm', 'change', 'update:modelValue', 'input'])

// 原来的日期选择器不方便，这里增加一个hasInput选项支持类似element的自带输入框的功能。
const inputValue = ref('') // 表单显示值
const showByClickInput = ref(false) // 是否在hasInput模式下显示日期选择弹唱
const columns = ref([])
const innerDefaultIndex = ref([])
const innerFormatter = ref((type, value) => value)
const innerValue = ref(null)
const pickerRef = ref(null)
// 记录最近一次通过change上抛给外部的值，用于去重，
// 避免边界(min/max)变化导致程序化重建列时再次触发change
const lastEmitValue = ref(null)

// 如果以下这些变量发生了变化，意味着需要重新计算各列范围，但应保留当前已选值
const propsChange = computed(() => {
	return [
		props.maxDate,
		props.minDate,
		props.minHour,
		props.maxHour,
		props.minMinute,
		props.maxMinute,
		props.minSecond,
		props.maxSecond,
		props.filter,
	]
})

watch(() => props.show, (newValue) => {
	if (!newValue && props.hasInput) {
		showByClickInput.value = false
	}
	if (newValue) {
		updateColumnValue(innerValue.value)
		// 打开时以当前值为基准，重置去重基准
		lastEmitValue.value = innerValue.value
		// 弹窗打开时，原生picker-view需要一定时间完成渲染，在Android/HarmonyOS端
		// 仅靠updateColumnValue中的$nextTick不足以保证索引设置成功，需额外兜底
		setTimeout(() => {
			updateIndexs(innerValue.value)
		}, 150)
	}
})

// #ifdef VUE3
watch(() => props.modelValue, () => {
	init()
	// getInputValue(newValue)
})
// #endif
// #ifdef VUE2
watch(() => props.value, () => {
	init()
	// getInputValue(newValue)
})
// #endif

// mode变化会改变已选值的语义(时间串<->时间戳)，需要完整重新初始化
watch(() => props.mode, () => {
	init()
})

watch(propsChange, () => {
	// 边界(min/max、filter)变化时，保留当前已选值，仅重新校正并重建各列，
	// 不回退到外部 modelValue，避免未确认前丢失用户已滚动的值
	reInitColumns()
})

onMounted(() => {
	init()
	if (props.pageInline) {
		setTimeout(() => {
			updateIndexs(innerValue.value)
		}, 200)
	}
})

function toInt(value, fallback = 0) {
	const num = parseInt(value, 10)
	return Number.isFinite(num) ? num : fallback
}

// 按列安全读取 picker 值，避免快速滚动时出现越界/空值
function safeColumnValue(values, columnIndex, optionIndex, fallback = '') {
	const column = Array.isArray(values[columnIndex]) ? values[columnIndex] : []
	if (!column.length) return fallback
	let index = Number(optionIndex)
	if (!Number.isFinite(index)) index = 0
	index = range(0, column.length - 1, index)
	const value = column[index]
	return value == null ? fallback : value
}

function columnsEqual(left = [], right = []) {
	if (left.length !== right.length) return false
	for (let i = 0; i < left.length; i++) {
		const leftColumn = left[i] || []
		const rightColumn = right[i] || []
		if (leftColumn.length !== rightColumn.length) return false
		for (let j = 0; j < leftColumn.length; j++) {
			if (leftColumn[j] !== rightColumn[j]) return false
		}
	}
	return true
}

function getInputValue(newValue) {
	if (newValue == '' || !newValue || newValue == undefined) {
		inputValue.value = ''
		return
	}
	if (props.mode === 'time' || props.mode === 'timesecond') {
		inputValue.value = newValue
	} else {
		if (props.format) {
			// 判断format中是否包含小写的y，如果有则认为是库自身的yyyy-mm-dd格式，使用timeFormat
			// 否则认为是dayjs的YYYY-MM-DD格式，直接传给dayjs
			if (/y/.test(props.format)) {
				inputValue.value = timeFormat(newValue, props.format)
			} else {
				inputValue.value = dayjs(newValue).format(props.format)
			}
		} else {
			let format = ''
			switch (props.mode) {
				case 'date':
					format = 'YYYY-MM-DD'
					break
				case 'year-month':
					format = 'YYYY-MM'
					break
				case 'datetime':
					format = 'YYYY-MM-DD HH:mm'
					break
				case 'datehour':
					format = 'YYYY-MM-DD HH'
					break
				case 'datetimesecond':
					format = 'YYYY-MM-DD HH:mm:ss'
					break
				case 'time':
					format = 'HH:mm'
					break
				case 'timesecond':
					format = 'HH:mm:ss'
					break
				default:
					break
			}
			inputValue.value = dayjs(newValue).format(format)
		}
	}
}

function init() {
	// #ifdef VUE3
	innerValue.value = correctValue(props.modelValue)
	// #endif
	// #ifdef VUE2
	innerValue.value = correctValue(props.value)
	// #endif
	updateColumnValue(innerValue.value)

	// 初始化hasInput展示
	getInputValue(innerValue.value)
	// 以外部值为基准，重置去重基准
	lastEmitValue.value = innerValue.value
}

// 边界(minMinute等)变化时调用：以当前已选值(innerValue)为基准，
// 按新的边界重新校正并重建各列，而不是回退到外部modelValue。
// 这样在未点击确认前也不会丢失/重置用户已经滚动选择的值。
function reInitColumns() {
	let base = innerValue.value
	if (base === undefined || base === null || base === '') {
		// #ifdef VUE3
		base = props.modelValue
		// #endif
		// #ifdef VUE2
		base = props.value
		// #endif
	}
	// correctValue会把小于新minMinute(或大于maxMinute)的值夹取到合法范围内，
	// 例如原选中15:30、minMinute变为51时会被夹取为15:51
	const corrected = correctValue(base)
	const changed = corrected !== innerValue.value
	innerValue.value = corrected
	updateColumnValue(corrected)
	getInputValue(corrected)
	// 仅当已选值确实因边界收紧而被夹取变化时，才补发一次change通知外部；
	// 值未变化则不上抛，避免边界变化引起的重复change
	if (changed && lastEmitValue.value !== corrected) {
		lastEmitValue.value = corrected
		emit('change', {
			value: corrected,
			mode: props.mode
		})
	}
}

// 在微信小程序中，不支持将函数当做props参数，故只能通过ref形式调用
function setFormatter(e) {
	innerFormatter.value = e
}

// 关闭选择器
function close() {
	if (props.closeOnClickOverlay) {
		if (props.hasInput) {
			showByClickInput.value = false
		}
		emit('close')
	}
}

// 弹窗离场动画结束，透传给使用者
function closedHandler() {
	emit('closed')
}

// 点击工具栏的取消按钮
function cancel() {
	if (props.hasInput) {
		showByClickInput.value = false
	}
	emit('cancel')
}

// 点击工具栏的确定按钮
function confirm() {
	// #ifdef VUE3
	emit('update:modelValue', innerValue.value)
	// #endif
	// #ifdef VUE2
	emit('input', innerValue.value)
	// #endif
	if (props.hasInput) {
		getInputValue(innerValue.value)
		showByClickInput.value = false
	}
	emit('confirm', {
		value: innerValue.value,
		mode: props.mode
	})
}

//用正则截取输出值,当出现多组数字时,抛出错误
function intercept(e, type) {
	if (e === undefined || e === null) {
		return type ? '0000' : '00'
	}
	let judge = String(e).match(/\d+/g)
	if (!judge || judge.length === 0) {
		return type ? '0000' : '00'
	}
	//判断是否掺杂数字
	if (judge.length > 1) {
		error("请勿在过滤或格式化函数时添加数字")
		return 0
	} else if (type && judge[0].length == 4) { //判断是否是年份
		return judge[0]
	} else if (judge[0].length > 2) {
		error("请勿在过滤或格式化函数时添加数字")
		return 0
	} else {
		return judge[0]
	}
}

// 列发生变化时触发
function change(e) {
	const { indexs, values } = e
	const safeValues = Array.isArray(values) ? values : []
	let selectValue = ''
	if (props.mode === 'time' || props.mode === 'timesecond') {
		// 根据value各列索引，从各列数组中，取出当前时间的选中值
		const hourText = safeColumnValue(safeValues, 0, indexs[0], padZero(props.minHour))
		const minuteText = safeColumnValue(safeValues, 1, indexs[1], padZero(props.minMinute))
		const secondText = safeColumnValue(safeValues, 2, indexs[2], padZero(props.minSecond))
		let hour = toInt(intercept(hourText), props.minHour)
		let minute = toInt(intercept(minuteText), props.minMinute)
		let second = toInt(intercept(secondText), props.minSecond)
		hour = range(props.minHour, props.maxHour, hour)
		minute = range(props.minMinute, props.maxMinute, minute)
		second = range(props.minSecond, props.maxSecond, second)
		selectValue = `${padZero(hour)}:${padZero(minute)}`
		if (props.mode === 'timesecond') {
			selectValue = `${selectValue}:${padZero(second)}`
		}
	} else {
		const validCurrent = dayjs(innerValue.value).isValid() ? dayjs(innerValue.value) : dayjs(props.minDate)
		const currentYear = validCurrent.year()
		const currentMonth = validCurrent.month() + 1
		const currentDate = validCurrent.date()
		const currentHour = validCurrent.hour()
		const currentMinute = validCurrent.minute()
		const currentSecond = validCurrent.second()

		const yearText = safeColumnValue(safeValues, 0, indexs[0], `${currentYear}`)
		const monthText = safeColumnValue(safeValues, 1, indexs[1], padZero(currentMonth))
		// 将选择的值转为数值，比如'03'转为数值的3，'2019'转为数值的2019
		let year = toInt(intercept(yearText, 'year'), currentYear)
		let month = toInt(intercept(monthText), currentMonth)
		let hour = 0, minute = 0, second = 0
		month = range(1, 12, month)
		// 此月份的最大天数
		const maxDate = dayjs(`${year}-${month}`).daysInMonth()
		const dayText = safeColumnValue(safeValues, 2, indexs[2], padZero(Math.min(currentDate, maxDate)))
		let date = toInt(intercept(dayText), Math.min(currentDate, maxDate))
		// year-month模式下，date不会出现在列中，设置为1，为了符合后边需要减1的需求
		if (props.mode === 'year-month') {
			date = 1
		}
		// 不允许超过maxDate值
		date = range(1, maxDate, date)
		if (props.mode === 'datehour' || props.mode === 'datetime' || props.mode === 'datetimesecond') {
			const hourText = safeColumnValue(safeValues, 3, indexs[3], padZero(currentHour))
			hour = range(0, 23, toInt(intercept(hourText), currentHour))
		}
		if (props.mode === 'datetime' || props.mode === 'datetimesecond') {
			const minuteText = safeColumnValue(safeValues, 4, indexs[4], padZero(currentMinute))
			minute = range(0, 59, toInt(intercept(minuteText), currentMinute))
		}
		if (props.mode === 'datetimesecond') {
			const secondText = safeColumnValue(safeValues, 5, indexs[5], padZero(currentSecond))
			second = range(0, 59, toInt(intercept(secondText), currentSecond))
		}
		// 转为时间模式
		selectValue = Number(new Date(year, month - 1, date, hour, minute, second))
		if (!Number.isFinite(selectValue)) {
			selectValue = correctValue(innerValue.value)
		}
	}
	// 取出准确的合法值，防止超越边界的情况
	selectValue = correctValue(selectValue)
	// 边界变化会程序化重建各列并回填索引，picker-view在部分原生端会再次派发change，
	// 若此时算出的值与上一次已上抛的值一致，说明并非用户真实操作，直接忽略，避免重复触发change
	if (selectValue === lastEmitValue.value && selectValue === innerValue.value) {
		return
	}
	innerValue.value = selectValue
	syncColumnsAfterChange(selectValue)
	lastEmitValue.value = selectValue
	// 发出change时间，value为当前选中的时间戳
	emit('change', {
		value: selectValue,
		// #ifndef MP-WEIXIN
		// 微信小程序不能传递this实例，会因为循环引用而报错
		// picker: pickerRef.value,
		// #endif
		mode: props.mode
	})
}

// 更新各列的值，进行补0、格式化等操作
function updateColumnValue(value) {
	innerValue.value = value
	updateColumns()
	// 延迟执行，等待up-picker组件列数据更新完后再设置选中值索引
	// 用$nextTick包裹确保columns已更新到DOM后再设置索引
	nextTick(() => {
		setTimeout(() => {
			updateIndexs(value)
		}, 0)
	})
}

function syncColumnsAfterChange(value) {
	const nextColumns = buildColumns()
	if (!columnsEqual(columns.value, nextColumns)) {
		columns.value = nextColumns
		// 延迟执行，等待up-picker组件列数据更新完后再设置选中值索引
		nextTick(() => {
			setTimeout(() => {
				updateIndexs(value)
			}, 0)
		})
	}
}

// 更新索引
function updateIndexs(value) {
	let values = []
	const formatter = props.formatter || innerFormatter.value
	if (props.mode === 'time' || props.mode === 'timesecond') {
		// 将time模式的时间用:分隔成数组
		const timeArr = value.split(':')
		// 使用formatter格式化方法进行管道处理
		values = [formatter('hour', timeArr[0]), formatter('minute', timeArr[1])]
		if (props.mode === 'timesecond') {
			values.push(formatter('second', timeArr[2]))
		}
	} else {
		const date = new Date(value)
		values = [
			formatter('year', `${dayjs(value).year()}`),
			// 月份补0
			formatter('month', padZero(dayjs(value).month() + 1))
		]
		if (props.mode === 'date' || props.mode === 'datehour' || props.mode === 'datetime' || props.mode === 'datetimesecond') {
			// date模式，需要添加天列
			values.push(formatter('day', padZero(dayjs(value).date())))
		}
		if (props.mode === 'datehour' || props.mode === 'datetime' || props.mode === 'datetimesecond') {
			values.push(formatter('hour', padZero(dayjs(value).hour())))
		}
		if (props.mode === 'datetime' || props.mode === 'datetimesecond') {
			// 数组的push方法，可以写入多个参数
			values.push(formatter('minute', padZero(dayjs(value).minute())))
		}
		if (props.mode === 'datetimesecond') {
			values.push(formatter('second', padZero(dayjs(value).second())))
		}
	}

	// 根据当前各列的所有值，从各列默认值中找到默认值在各列中的索引
	const indexs = columns.value.map((column, index) => {
		// 通过取大值，可以保证不会出现找不到索引的-1情况
		return Math.max(0, column.findIndex(item => item === values[index]))
	})
	innerDefaultIndex.value = indexs
}

// 更新各列的值
function updateColumns() {
	columns.value = buildColumns()
}

function buildColumns() {
	const formatter = props.formatter || innerFormatter.value
	// 获取各列的值，并且map后，对各列的具体值进行补0操作
	return getOriginColumns().map((column) => column.values.map((value) => formatter(column.type, value)))
}

function getOriginColumns() {
	// 生成各列的值
	const results = getRanges().map(({ type, range: rangeArr }) => {
		let values = times(rangeArr[1] - rangeArr[0] + 1, (index) => {
			let value = rangeArr[0] + index
			value = type === 'year' ? `${value}` : padZero(value)
			return value
		})
		// 进行过滤
		if (props.filter) {
			values = props.filter(type, values)
			if (!values || (values && values.length == 0)) {
				uni.showToast({
					title: '日期filter结果不能为空',
					icon: 'error',
					mask: true
				})
			}
		}
		return { type, values }
	})
	return results
}


// 把绑定值统一解析成毫秒时间戳，识别不出日期时返回null
// 支持毫秒时间戳(number或纯数字字符串)，以及'2024-10-24'、'2024/10/24 15:08:09'这类
// 文档里写明支持的String绑定值
function parseDateValue(value) {
	if (value === '' || value === null || value === undefined) {
		return null
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null
	}
	const text = String(value).trim()
	if (!text) {
		return null
	}
	// 纯数字按时间戳处理，避免dayjs把'1729699200000'当成日期字符串去解析
	if (/^-?\d+$/.test(text)) {
		const timestamp = Number(text)
		return Number.isFinite(timestamp) ? timestamp : null
	}
	const parsed = dayjs(text)
	return parsed.isValid() ? parsed.valueOf() : null
}

// 得出合法的时间
function correctValue(value) {
	const isDateMode = !['time', 'timesecond'].includes(props.mode)
	if (isDateMode) {
		// 日期类型统一解析成毫秒时间戳，没有设置合法的当前时间时才使用最小时间。
		// 这里不能用test.date(value)判断：它只认长度为10/13的时间戳与yyyy-mm-dd形态的
		// 字符串，Date对象与12位(2001年前)毫秒时间戳都会被判为非法并被替换成
		// minDate(默认当前年份-10)，选择器于是停在十年前(issue #537)
		const timestamp = parseDateValue(value)
		value = timestamp === null ? props.minDate : timestamp
	} else if (!value) {
		// 如果是时间类型，而又没有默认值的话，就用最小时间
		value = props.mode === 'timesecond'
			? `${padZero(props.minHour)}:${padZero(props.minMinute)}:${padZero(props.minSecond)}`
			: `${padZero(props.minHour)}:${padZero(props.minMinute)}`
	}
	// 时间类型
	if (!isDateMode) {
		if (String(value).indexOf(':') === -1) return error('时间错误，请传递如12:24的格式')
		const timeArr = String(value).split(':')
		let hour = timeArr[0]
		let minute = timeArr[1]
		let second = timeArr[2]
		// 对时间补零，同时控制在最小值和最大值之间
		const hourNum = Number(hour)
		const minuteNum = Number(minute)
		hour = padZero(range(props.minHour, props.maxHour, Number.isNaN(hourNum) ? props.minHour : hourNum))
		minute = padZero(range(props.minMinute, props.maxMinute, Number.isNaN(minuteNum) ? props.minMinute : minuteNum))
		if (props.mode === 'timesecond') {
			const secondNum = Number(second)
			second = padZero(range(props.minSecond, props.maxSecond, Number.isNaN(secondNum) ? props.minSecond : secondNum))
			return `${hour}:${minute}:${second}`
		}
		return `${hour}:${minute}`
	} else {
		// 如果是日期格式，控制在最小日期和最大日期之间
		value = dayjs(value).isBefore(dayjs(props.minDate)) ? props.minDate : value
		value = dayjs(value).isAfter(dayjs(props.maxDate)) ? props.maxDate : value
		return value
	}
}

// 获取每列的最大和最小值
function getRanges() {
	if (props.mode === 'time' || props.mode === 'timesecond') {
		const timeColumns = [
			{
				type: 'hour',
				range: [props.minHour, props.maxHour],
			},
			{
				type: 'minute',
				range: [props.minMinute, props.maxMinute],
			},
		]
		if (props.mode === 'timesecond') {
			timeColumns.push({
				type: 'second',
				range: [props.minSecond, props.maxSecond],
			})
		}
		return timeColumns
	}
	const { maxYear, maxDate, maxMonth, maxHour, maxMinute, maxSecond } = getBoundary('max', innerValue.value)
	const { minYear, minDate, minMonth, minHour, minMinute, minSecond } = getBoundary('min', innerValue.value)
	const result = [
		{
			type: 'year',
			range: [minYear, maxYear],
		},
		{
			type: 'month',
			range: [minMonth, maxMonth],
		},
		{
			type: 'day',
			range: [minDate, maxDate],
		},
		{
			type: 'hour',
			range: [minHour, maxHour],
		},
		{
			type: 'minute',
			range: [minMinute, maxMinute],
		},
		{
			type: 'second',
			range: [minSecond, maxSecond],
		},
	]
	// 兜底：防止边界计算异常导致日列出现空范围（快速滚动场景）
	if (result[2] && result[2].type === 'day') {
		const start = Number(result[2].range[0])
		const end = Number(result[2].range[1])
		if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
			const fallbackDays = dayjs(innerValue.value).isValid() ? dayjs(innerValue.value).daysInMonth() : 31
			result[2].range = [1, fallbackDays]
		}
	}
	if (props.mode === 'date')
		result.splice(3, 3)
	if (props.mode === 'datehour')
		result.splice(4, 2)
	if (props.mode === 'datetime')
		result.splice(5, 1)
	if (props.mode === 'year-month')
		result.splice(2, 4)
	return result
}

// 根据minDate、maxDate、minHour、maxHour等边界值，判断各列的开始和结束边界值
function getBoundary(type, currentInnerValue) {
	const value = new Date(currentInnerValue)
	const boundary = new Date(props[`${type}Date`])
	const year = dayjs(boundary).year()
	let month = 1
	let date = 1
	let hour = 0
	let minute = 0
	let second = 0
	if (type === 'max') {
		month = 12
		// 月份的天数
		date = dayjs(value).daysInMonth()
		hour = 23
		minute = 59
		second = 59
	}
	// 获取边界值，逻辑是：当年达到了边界值(最大或最小年)，就检查月允许的最大和最小值，以此类推
	if (dayjs(value).year() === year) {
		month = dayjs(boundary).month() + 1
		if (dayjs(value).month() + 1 === month) {
			date = dayjs(boundary).date()
			if (dayjs(value).date() === date) {
				hour = dayjs(boundary).hour()
				if (dayjs(value).hour() === hour) {
					minute = dayjs(boundary).minute()
					if (dayjs(value).minute() === minute) {
						second = dayjs(boundary).second()
					}
				}
			}
		}
	}
	return {
		[`${type}Year`]: year,
		[`${type}Month`]: month,
		[`${type}Date`]: date,
		[`${type}Hour`]: hour,
		[`${type}Minute`]: minute,
		[`${type}Second`]: second
	}
}

defineExpose({
	setFormatter,
	init,
	close,
	cancel,
	confirm
})
</script>


<style lang="scss" scoped>
	@import '../../libs/css/components.scss';
	.up-datetime-picker {
		/* #ifndef APP-NVUE */
		width: 100%;
        /* #endif */
        &__has-input {
        }
	}
</style>
