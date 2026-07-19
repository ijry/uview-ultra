/*
 * @Author       : LQ,jry
 * @Description  :
 * @version      : 3.0
 * @Date         : 2021-08-20 16:44:21
 * @LastAuthor   : jry
 * @lastTime     : 2024-08-20 14:20:58
 * @FilePath     : /uview-ultra/libs/config/props/calendar.js
 */
import { t } from '../../libs/i18n/index.js'

export default {
    // calendar 组件
    calendar: {
        title: '日期选择',
        showTitle: true,
        showSubtitle: true,
        mode: 'single',
        startText: '开始',
        endText: '结束',
        customList: [],
        color: '#3c9cff',
        minDate: 0,
        maxDate: 0,
        defaultDate: null,
        maxCount: Number.MAX_SAFE_INTEGER, // Infinity
        rowHeight: 56,
        formatter: null,
        showLunar: false,
        showMark: true,
        confirmText: '确定',
        confirmDisabledText: '确定',
        show: false,
        closeOnClickOverlay: false,
        readonly: false,
        showConfirm: true,
        maxRange: Number.MAX_SAFE_INTEGER, // Infinity
        rangePrompt: '',
		showRangePrompt: true,
		allowSameDay: false,
		rangeResultMode: 'all',
		enableTime: false,
		timePrecision: 'minute',
		defaultTime: '',
		round: 0,
		overlay: true,
		duration: 300,
		overlayStyle: {},
		overlayOpacity: 0.5,
		zIndex: 10075,
		safeAreaInsetBottom: true,
		safeAreaInsetTop: false,
		bgColor: '',
		monthNum: 3,
		monthSwitch: false,
		showToday: true,
		todayColor: '',
		weekText: [
			t('up.week.one'),
			t('up.week.two'),
			t('up.week.three'),
			t('up.week.four'),
			t('up.week.five'),
			t('up.week.six'),
			t('up.week.seven')
		],
		forbidDays: [],
		forbidDaysToast: t('up.calendar.disabled'),
		monthFormat: '',
		pageInline: false
    }
}
