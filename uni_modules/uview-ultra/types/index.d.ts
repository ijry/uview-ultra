/// <reference path="./comps.d.ts" />
declare module 'uview-ultra' {
	export function install(): void  //必要
	export function t(value: string, params?: Record<string, string | number>): string;
	export function registerLocale(locale: string, messages: Record<string, string>): void;
	export function registerLocale(localeMap: Record<string, Record<string, string>>): void;
	export function hasLocale(locale: string): boolean;
	export function getLocale(): string;
	export function setLocale(locale: string): string;
	export const en: Record<string, string>;
	export const es: Record<string, string>;
	export const fr: Record<string, string>;
	export const de: Record<string, string>;
	export const ko: Record<string, string>;
	export const ja: Record<string, string>;
	export const ru: Record<string, string>;
	export const th: Record<string, string>;
	export const zhHans: Record<string, string>;
	export const zhHant: Record<string, string>;
	export const allLocales: Record<string, Record<string, string>>;
	export const i18n: {
		settings: {
			lang: string;
			locales: Record<string, Record<string, string>>;
		}
	};
	interface test {
		/** 邮箱格式校验 */
		email(email: string): boolean
		/** 手机号校验 */
		mobile(phone: number): boolean;
		/** url路径验证 */
		url(value: string): boolean;
		/** 验证日期格式 */
		date(value: string | number): boolean;
		/** 验证ISO类型的日期格式 YYYY-MM-DD | YYYY/MM/DD */
		dateISO(value: string): boolean;
		/** 验证十进制数字 */
		number(value: number): boolean;
		/** 验证字符串 */
		string(value: string): boolean;
		/** 验证整数 */
		digits(value: number): boolean;
		/** 验证身份证号码 */
		idCard(value: string | number): boolean;
		/** 是否车牌号 */
		carNo(value: string): boolean;
		/** 金额,只允许2位小数 */
		amount(value: string | number): boolean;
		/** 校验是否是中文 */
		chinese(value: any): boolean;
		/** 校验是否是字母 */
		letter(value: any): boolean;
		/** 校验字母或者数字 */
		enOrNum(value: any): boolean;
		/** 验证是否包含某个值 */
		contains(source: string, value: string): boolean;
		/** 验证一个值范围[min, max] */
		range(value: string, between: number[]): boolean;
		/** 验证一个长度范围[min, max] */
		rangeLength(value: string, between: number[]): boolean;
		/** 是否固定电话 */
		landline(value: string | number): boolean;
		/** 判断是否为空 */
		empty(value: string | number | undefined | boolean | object | null): boolean;
		/** 是否json字符串 */
		jsonString(value: string): boolean;
		/** 是否数组 */
		array(value: any): boolean;
		/** 是否对象 */
		object(value: any): boolean;
		/** 是否短信验证码 */
		code(value: any, len: number): boolean;
		/** 是否函数方法 */
		func(value: any): boolean;
		/** 是否promise对象 */
		promise(value: any): boolean;
		/** 是否图片格式 */
		image(value: string): boolean;
		/** 是否视频格式 */
		video(value: string): boolean;
		/** 是否为正则对象 */
		regExp(value: any): boolean;
	}
	interface RouteParam {
		type: 'navigateTo' | 'redirect' | 'switchTab' | 'reLaunch' | 'navigateBack';
		/** 路由地址 */
		url: string;
		/** navigateBack页面后退时,回退的层数 */
		delta?: number;
		/** 传递的参数 */
		params?: {};
		/** 窗口动画,只在APP有效 */
		animationType?: string;
		/** 窗口动画持续时间,单位毫秒,只在APP有效 */
		animationDuration?: number;
		/** 是否需要拦截 */
		intercept?: boolean;
	}
	interface Config {
		v: string;
		version: string;
		color: Partial<Color>;
		unit: 'px' | 'rpx';
		nativeThemeSync: boolean;
		iconUrl: string;
		customIcon: {
			family: string;
			url: string;
		};
		customIcons: {
			[key: string]: string;
		};
		loadFontOnce: boolean;
		interceptor: {
			navbarLeftClick: ((navbar: any) => void) | null;
		};
		themeMode?: 'light' | 'dark';
	}
	interface Color {
		primary: string,
		info: string,
		default: string,
		warning: string,
		error: string,
		success: string,
		mainColor: string,
		contentColor: string,
		tipsColor: string,
		lightColor: string,
		borderColor: string,
		bgColor?: string,
		disabledColor?: string
	}
	interface GlobalConfig {
		config: Partial<Config>;
		props: {};
	}
	interface $u {
		route: (url: string | RouteParam) => void;
		/**
		  * 求两个颜色之间的渐变值
		  * @param {string} startColor 开始的颜色
		  * @param {string} endColor 结束的颜色
		  * @param {number} step 颜色等分的份额
		  */
		colorGradient: (startColor: string, endColor: string, step: number) => any[];
		/**
		 * 将hex表示方式转换为rgb
		 * @param color "#000000"-> "rgb(0,0,0)" | "rgb(0,0,0)" -> "#000000"
		 * @param str 是否返回颜色数组 true -> 不返回
		 * @returns 
		 */
		hexToRgb: (color: string, str?: boolean) => any[];
		/**
		 * 将rgb表示方式转换为hex
		 */
		rgbToHex: (color: string) => string;
		/**
		 * 十六进制转换为rgb或rgba
		 * @param color 
		 * @param alpha 透明度
		 * @returns  rgba（255，255，255，0.5）字符串
		 */
		colorToRgba: (color: string, alpha: number) => string;
		test: test;
		type: {},
		http: {},
		config: Config;
		zIndex: {
			toast: number;
			noNetwork: number;
			// popup包含popup，actionsheet，keyboard，picker的值
			popup: number;
			mask: number;
			navbar: number;
			topTips: number;
			sticky: number;
			indexListSticky: number;
		},
		debounce: (func, wait, immediate) => void;
		throttle: (func, wait, immediate) => void;
		calc: Record<string, (...args: any[]) => any>;
		digit: Record<string, (...args: any[]) => any>;
		i18n: {
			settings: {
				lang: string;
				locales: Record<string, Record<string, string>>;
			}
		};
		t: (value: string, params?: Record<string, string | number>) => string;
		rootToast: (options?: string | { message?: string; title?: string; duration?: number; [key: string]: any }) => void;
		setRootToastRef: (ref?: any) => void;
		rootNotify: (options?: string | { message?: string; title?: string; duration?: number; [key: string]: any }) => void;
		setRootNotifyRef: (ref?: any) => void;
		props: {},
		color: Color;
		platform: string;
		theme: {
			preference: 'system' | 'light' | 'dark';
			mode: 'light' | 'dark';
			version: number;
			vars: Record<string, string>;
		};
		setTheme: (mode?: 'light' | 'dark') => any;
		setThemePreference: (mode?: 'system' | 'light' | 'dark') => any;
		getThemePreference: () => 'system' | 'light' | 'dark';
		getSystemTheme: () => 'light' | 'dark';
		getThemeVars: (mode?: 'light' | 'dark') => Record<string, string>;
		getThemeTabBarStyle: () => {
			color: string;
			selectedColor: string;
			backgroundColor: string;
			borderStyle: string;
		};
		applyNativeThemeUI: () => void;
	}

	export function setConfig(config: Partial<GlobalConfig>): void;

	// ---- 组件类型：与 types/comps/*.d.ts 同步，勿手工增删 ----
	export type ActionSheetProps = import('./comps/actionSheet')['ActionSheetProps']
	export type AlbumProps = import('./comps/album')['AlbumProps']
	export type AlertProps = import('./comps/alert')['AlertProps']
	export type AvatarProps = import('./comps/avatar')['AvatarProps']
	export type AvatarGroupProps = import('./comps/avatarGroup')['AvatarGroupProps']
	export type BackTopProps = import('./comps/backTop')['BackTopProps']
	export type BackTopSlots = import('./comps/backTop')['BackTopSlots']
	export type BadgeProps = import('./comps/badge')['BadgeProps']
	export type ButtonProps = import('./comps/button')['ButtonProps']
	export type CalendarProps = import('./comps/calendar')['CalendarProps']
	export type CalendarRef = typeof import('./comps/calendar')['CalendarRef']
	export type CalendarStripPayload = import('./comps/calendarStrip')['CalendarStripPayload']
	export type CalendarStripProps = import('./comps/calendarStrip')['CalendarStripProps']
	export type CalendarStripRef = typeof import('./comps/calendarStrip')['CalendarStripRef']
	export type CellProps = import('./comps/cell')['CellProps']
	export type CellSlots = import('./comps/cell')['CellSlots']
	export type CellGroupProps = import('./comps/cellGroup')['CellGroupProps']
	export type CheckboxProps = import('./comps/checkbox')['CheckboxProps']
	export type CheckboxSlots = import('./comps/checkbox')['CheckboxSlots']
	export type CheckboxGroupProps = import('./comps/checkboxGroup')['CheckboxGroupProps']
	export type CodeProps = import('./comps/code')['CodeProps']
	export type CodeRef = typeof import('./comps/code')['CodeRef']
	export type CodeInputProps = import('./comps/codeInput')['CodeInputProps']
	export type ColProps = import('./comps/col')['ColProps']
	export type CollapseProps = import('./comps/collapse')['CollapseProps']
	export type CollapseRef = typeof import('./comps/collapse')['CollapseRef']
	export type CollapseItemProps = import('./comps/collapseItem')['CollapseItemProps']
	export type CollapseItemSlots = import('./comps/collapseItem')['CollapseItemSlots']
	export type CountDownProps = import('./comps/countDown')['CountDownProps']
	export type CountDownRef = typeof import('./comps/countDown')['CountDownRef']
	export type CountToProps = import('./comps/countTo')['CountToProps']
	export type CountToRef = typeof import('./comps/countTo')['CountToRef']
	export type DatetimePickerProps = import('./comps/datetimePicker')['DatetimePickerProps']
	export type DatetimePickerRef = typeof import('./comps/datetimePicker')['DatetimePickerRef']
	export type DividerProps = import('./comps/divider')['DividerProps']
	export type EmptyProps = import('./comps/empty')['EmptyProps']
	export type EmptySlots = import('./comps/empty')['EmptySlots']
	export type FormProps = import('./comps/form')['FormProps']
	export type FormRef = typeof import('./comps/form')['FormRef']
	export type FormItemProps = import('./comps/formItem')['FormItemProps']
	export type FormItemSlots = import('./comps/formItem')['FormItemSlots']
	export type GapProps = import('./comps/gap')['GapProps']
	export type GridProps = import('./comps/grid')['GridProps']
	export type GridItemProps = import('./comps/gridItem')['GridItemProps']
	export type GuideItem = import('./comps/guide')['GuideItem']
	export type GuideProps = import('./comps/guide')['GuideProps']
	export type GuideRef = typeof import('./comps/guide')['GuideRef']
	export type IconProps = import('./comps/icon')['IconProps']
	export type ImageProps = import('./comps/image')['ImageProps']
	export type ImageSlots = import('./comps/image')['ImageSlots']
	export type IndexAnchorProps = import('./comps/indexAnchor')['IndexAnchorProps']
	export type IndexItemSlots = import('./comps/indexItem')['IndexItemSlots']
	export type IndexListProps = import('./comps/indexList')['IndexListProps']
	export type InputProps = import('./comps/input')['InputProps']
	export type InputSlots = import('./comps/input')['InputSlots']
	export type InputRef = typeof import('./comps/input')['InputRef']
	export type KeyboardProps = import('./comps/keyboard')['KeyboardProps']
	export type KeyboardSlots = import('./comps/keyboard')['KeyboardSlots']
	export type LineProps = import('./comps/line')['LineProps']
	export type LineProgressProps = import('./comps/lineProgress')['LineProgressProps']
	export type LineProgressSlots = import('./comps/lineProgress')['LineProgressSlots']
	export type LinkProps = import('./comps/link')['LinkProps']
	export type LinkSlots = import('./comps/link')['LinkSlots']
	export type ListProps = import('./comps/list')['ListProps']
	export type ListItemProps = import('./comps/listItem')['ListItemProps']
	export type LoadMoreProps = import('./comps/loadMore')['LoadMoreProps']
	export type LoadingIconProps = import('./comps/loadingIcon')['LoadingIconProps']
	export type LoadingPageProps = import('./comps/loadingPage')['LoadingPageProps']
	export type ModalProps = import('./comps/modal')['ModalProps']
	export type ModalSlots = import('./comps/modal')['ModalSlots']
	export type NavbarProps = import('./comps/navbar')['NavbarProps']
	export type NavbarSlots = import('./comps/navbar')['NavbarSlots']
	export type NavbarMiniProps = import('./comps/navbarMini')['NavbarMiniProps']
	export type NavbarMiniSlots = import('./comps/navbarMini')['NavbarMiniSlots']
	export type NoNetworkProps = import('./comps/noNetwork')['NoNetworkProps']
	export type NoticeBarProps = import('./comps/noticeBar')['NoticeBarProps']
	export type NotifyProps = import('./comps/notify')['NotifyProps']
	export type NotifySlots = import('./comps/notify')['NotifySlots']
	export type NotifyRef = typeof import('./comps/notify')['NotifyRef']
	export type NovelReaderProps = import('./comps/novelReader')['NovelReaderProps']
	export type NovelReaderSlots = import('./comps/novelReader')['NovelReaderSlots']
	export type NumberBoxProps = import('./comps/numberBox')['NumberBoxProps']
	export type NumberBoxSlots = import('./comps/numberBox')['NumberBoxSlots']
	export type OverlayProps = import('./comps/overlay')['OverlayProps']
	export type OverlaySlots = import('./comps/overlay')['OverlaySlots']
	export type ParseProps = import('./comps/parse')['ParseProps']
	export type PickerProps = import('./comps/picker')['PickerProps']
	export type PickerRef = typeof import('./comps/picker')['PickerRef']
	export type PopupProps = import('./comps/popup')['PopupProps']
	export type PopupSlots = import('./comps/popup')['PopupSlots']
	export type RadioProps = import('./comps/radio')['RadioProps']
	export type RadioSlots = import('./comps/radio')['RadioSlots']
	export type RadioGroupProps = import('./comps/radioGroup')['RadioGroupProps']
	export type RateProps = import('./comps/rate')['RateProps']
	export type ReadMoreProps = import('./comps/readMore')['ReadMoreProps']
	export type ReadMoreRef = typeof import('./comps/readMore')['ReadMoreRef']
	export type RowProps = import('./comps/row')['RowProps']
	export type SafeBottomProps = import('./comps/safeBottom')['SafeBottomProps']
	export type ScrollListProps = import('./comps/scrollList')['ScrollListProps']
	export type SearchProps = import('./comps/search')['SearchProps']
	export type SkeletonProps = import('./comps/skeleton')['SkeletonProps']
	export type SliderProps = import('./comps/slider')['SliderProps']
	export type StatusBarProps = import('./comps/statusBar')['StatusBarProps']
	export type StepsProps = import('./comps/steps')['StepsProps']
	export type StepsItemProps = import('./comps/stepsItem')['StepsItemProps']
	export type StepsItemSlots = import('./comps/stepsItem')['StepsItemSlots']
	export type StickyProps = import('./comps/sticky')['StickyProps']
	export type StickySlots = import('./comps/sticky')['StickySlots']
	export type SubsectionProps = import('./comps/subsection')['SubsectionProps']
	export type SwipeActionProps = import('./comps/swipeAction')['SwipeActionProps']
	export type SwipeActionItemProps = import('./comps/swipeActionItem')['SwipeActionItemProps']
	export type SwiperProps = import('./comps/swiper')['SwiperProps']
	export type SwiperIndicatorProps = import('./comps/swiperIndicator')['SwiperIndicatorProps']
	export type SwitchProps = import('./comps/switch')['SwitchProps']
	export type TabbarProps = import('./comps/tabbar')['TabbarProps']
	export type TabbarItemProps = import('./comps/tabbarItem')['TabbarItemProps']
	export type TabsProps = import('./comps/tabs')['TabsProps']
	export type TabsProProps = import('./comps/tabsPro')['TabsProProps']
	export type TagProps = import('./comps/tag')['TagProps']
	export type TextProps = import('./comps/text')['TextProps']
	export type TextareaProps = import('./comps/textarea')['TextareaProps']
	export type TextareaRef = typeof import('./comps/textarea')['TextareaRef']
	export type ToastProps = import('./comps/toast')['ToastProps']
	export type ToastRef = typeof import('./comps/toast')['ToastRef']
	export type TooltipProps = import('./comps/tooltip')['TooltipProps']
	export type TransitionProps = import('./comps/transition')['TransitionProps']
	export type UploadProps = import('./comps/upload')['UploadProps']
	export type UploadSlots = import('./comps/upload')['UploadSlots']
	export type UploadRef = typeof import('./comps/upload')['UploadRef']
	// ---- 组件类型结束 ----

	global {
		interface Uni {
			$u: $u
		}
	}
}
declare type UniCountDownRef = typeof import('./comps/countDown')['CountDownRef']
declare type UniCountToRef = typeof import('./comps/countTo')['CountToRef']
declare type UniReadMoreRef = typeof import('./comps/readMore')['ReadMoreRef']
declare type UniToastRef = typeof import('./comps/toast')['ToastRef']
declare type UniCollapseRef = typeof import('./comps/collapse')['CollapseRef']
declare type UniNotifyRef = typeof import('./comps/notify')['NotifyRef']
declare type UniCodeRef = typeof import('./comps/code')['CodeRef']
declare type UniInputRef = typeof import('./comps/input')['InputRef']
declare type UniUploadRef = typeof import('./comps/upload')['UploadRef']
declare type UniDatetimePickerRef = typeof import('./comps/datetimePicker')['DatetimePickerRef']
declare type UniPickerRef = typeof import('./comps/picker')['PickerRef']
declare type UniCalendarRef = typeof import('./comps/calendar')['CalendarRef']
declare type UniCalendarStripRef = typeof import('./comps/calendarStrip')['CalendarStripRef']
declare type UniGuideRef = typeof import('./comps/guide')['GuideRef']
declare type UniTextareaRef = typeof import('./comps/textarea')['TextareaRef']
declare type UniFormRef = typeof import('./comps/form')['FormRef']
