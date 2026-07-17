# uview-ultra Vue Component Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the first batch of `uview-ultra` Vue component APIs closer to `uview-plus` for `up-calendar` and `up-icon`.

**Architecture:** Apply a Vue-only compatibility layer over existing `uview-ultra` component structure. Defaults stay in component default files and flow through `libs/config/props.js`; behavior is wired only in `.vue` and Vue helper `.js` files. UVue/UTS files remain untouched to avoid affecting uni-app-x behavior and dark-mode work.

**Tech Stack:** uni-app Vue 3, Vue SFC, JavaScript component props, TypeScript declaration files, HBuilderX CLI.

## Global Constraints

- Baseline: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus`
- Target: `D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity\uni_modules\uview-ultra`
- First batch components: `up-calendar` and `up-icon`.
- Modify only Vue-facing files: `*.vue`, `props.js`, Vue component helper `*.js`, and `types/**`.
- Do not modify `*.uvue`, `*.uts`, `index.uts`, demo pages, examples, or `pages/**`.
- Preserve the `up-*` public prefix.
- Preserve existing dark theme behavior and only reuse already available CSS variables where needed.
- Treat known Android compile issues as baseline unless a new error appears under `uni_modules/uview-ultra`.

---

## File Structure

Modify:

- `uni_modules/uview-ultra/components/up-calendar/calendar.js`: adds Vue default values for inline calendar and display props.
- `uni_modules/uview-ultra/components/up-calendar/props.js`: exposes the new Vue props.
- `uni_modules/uview-ultra/components/up-calendar/up-calendar.vue`: wires inline popup behavior and passes new props to child components.
- `uni_modules/uview-ultra/components/up-calendar/header.vue`: renders configurable weekday text.
- `uni_modules/uview-ultra/components/up-calendar/month.vue`: supports forbidden dates and custom month title format.
- `uni_modules/uview-ultra/types/comps/calendar.d.ts`: adds new calendar prop declarations.
- `uni_modules/uview-ultra/libs/config/config.js`: adds Vue icon font config defaults needed by `up-icon`.
- `uni_modules/uview-ultra/components/up-icon/up-icon.vue`: restores custom icon unicode resolution and custom font family behavior.
- `uni_modules/uview-ultra/types/comps/icon.d.ts`: documents `customPrefix`.
- `uni_modules/uview-ultra/types/index.d.ts`: declares icon font config fields.
- `docs/uview-ultra-vue-runtime-gap.md`: records final verification notes for this follow-up batch.

Create:

- `uni_modules/uview-ultra/components/up-icon/util.js`: Vue-only font loading helper using `uni.loadFontFace`.

Do not modify:

- `uni_modules/uview-ultra/components/**/*.uvue`
- `uni_modules/uview-ultra/**/*.uts`
- `uni_modules/uview-ultra/index.uts`
- `pages/**`

---

### Task 1: Calendar Vue Props and Types

**Files:**
- Modify: `uni_modules/uview-ultra/components/up-calendar/calendar.js`
- Modify: `uni_modules/uview-ultra/components/up-calendar/props.js`
- Modify: `uni_modules/uview-ultra/types/comps/calendar.d.ts`

**Interfaces:**
- Consumes: global default props loaded through `libs/config/props.js`
- Produces: Vue props `pageInline`, `weekText`, `forbidDays`, `forbidDaysToast`, `monthFormat`

- [ ] **Step 1: Confirm no UVue/UTS edits are pending**

Run:

```powershell
git status --short
```

Expected: clean or only files named in this task after edits begin. No `*.uvue` or `*.uts` files should appear.

- [ ] **Step 2: Add calendar default values**

Patch `uni_modules/uview-ultra/components/up-calendar/calendar.js` inside the `calendar` object after `todayColor: ''`:

```js
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
```

Also add this import near the top:

```js
import { t } from '../../libs/i18n/index.js'
```

Expected: `defProps.calendar.weekText` and the other new keys exist for `props.js`.

- [ ] **Step 3: Add calendar Vue props**

Patch `uni_modules/uview-ultra/components/up-calendar/props.js` after `todayColor`:

```js
		// 星期文案（周一到周日）
		weekText: {
			type: Array,
			default: () => defProps.calendar.weekText
		},
		// 禁用日期，格式为 YYYY-MM-DD
		forbidDays: {
			type: Array,
			default: () => defProps.calendar.forbidDays
		},
		// 点击禁用日期时的提示
		forbidDaysToast: {
			type: String,
			default: () => defProps.calendar.forbidDaysToast
		},
		// 月份标题格式，遵循 dayjs format
		monthFormat: {
			type: String,
			default: () => defProps.calendar.monthFormat
		},
		// 是否以内联模式渲染，主要用于 up-calendar-strip 内嵌完整月历
		pageInline: {
			type: Boolean,
			default: () => defProps.calendar.pageInline
		}
```

Expected: Vue consumers can pass all five props without unknown-prop gaps.

- [ ] **Step 4: Update calendar TypeScript declarations**

Patch `uni_modules/uview-ultra/types/comps/calendar.d.ts` after `todayColor?: string`:

```ts
  /**
   * 星期文案，顺序为周一到周日
   */
  weekText?: string[]
  /**
   * 禁用日期，格式为 YYYY-MM-DD；range 模式不启用该限制
   */
  forbidDays?: string[]
  /**
   * 点击禁用日期时的提示文案
   * @default "该日期不可选"
   */
  forbidDaysToast?: string
  /**
   * 月份标题格式，遵循 dayjs format
   */
  monthFormat?: string
  /**
   * 是否以内联模式渲染日历
   * @default false
   */
  pageInline?: boolean
```

Expected: Type hints match the newly exposed Vue props.

- [ ] **Step 5: Check diff scope**

Run:

```powershell
git diff --name-only
```

Expected output contains only:

```text
uni_modules/uview-ultra/components/up-calendar/calendar.js
uni_modules/uview-ultra/components/up-calendar/props.js
uni_modules/uview-ultra/types/comps/calendar.d.ts
```

- [ ] **Step 6: Compile-check calendar prop batch**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no new error under `uni_modules/uview-ultra`. Existing baseline `pages/componentsC/navbar/navbar.uvue:26` and `up-swipe-action-item.uvue:29` warning may remain.

- [ ] **Step 7: Commit calendar props/types**

Run:

```powershell
git add -- uni_modules/uview-ultra/components/up-calendar/calendar.js uni_modules/uview-ultra/components/up-calendar/props.js uni_modules/uview-ultra/types/comps/calendar.d.ts
git commit -m "补齐uview-ultra日历Vue属性声明" -m "为up-calendar新增pageInline、weekText、forbidDays、forbidDaysToast和monthFormat的Vue默认值、props与类型声明，不触碰uvue和uts实现。"
```

---

### Task 2: Calendar Vue Runtime Wiring

**Files:**
- Modify: `uni_modules/uview-ultra/components/up-calendar/up-calendar.vue`
- Modify: `uni_modules/uview-ultra/components/up-calendar/header.vue`
- Modify: `uni_modules/uview-ultra/components/up-calendar/month.vue`

**Interfaces:**
- Consumes: props added in Task 1
- Produces: inline calendar rendering, configurable weekday labels, forbidden date behavior, and custom month title format

- [ ] **Step 1: Wire inline popup and header week text**

Patch the first `<up-popup>` in `up-calendar.vue`:

```vue
		:closeable="!pageInline"
		:pageInline="pageInline"
```

Replace the existing `closeable` attribute with the bound `:closeable` shown above.

Add this prop to `<uHeader>`:

```vue
				:weekText="weekText"
```

Expected: inline mode disables close affordance and passes weekday labels to the header.

- [ ] **Step 2: Pass forbidden date and month format props to month component**

In both `<uMonth>` usages in `up-calendar.vue`, add:

```vue
					:forbidDays="forbidDays"
					:forbidDaysToast="forbidDaysToast"
					:monthFormat="monthFormat"
```

Expected: both scroll mode and `monthSwitch` mode receive the same feature props.

- [ ] **Step 3: Adjust inline calendar list height padding**

In `up-calendar.vue`, find the method that computes `listHeight` and uses a `bottomPadding` value. Ensure it follows this logic:

```js
			let bottomPadding = 0
			if (!this.pageInline) {
				bottomPadding = 30
			}
```

Expected: inline calendars do not reserve popup footer padding when they should be embedded in another component.

- [ ] **Step 4: Add configurable week text to header**

Patch `uni_modules/uview-ultra/components/up-calendar/header.vue`.

Replace the seven hardcoded weekday nodes with:

```vue
			<text class="up-calendar-header__weekdays__weekday">{{ weekText[0] }}</text>
			<text class="up-calendar-header__weekdays__weekday">{{ weekText[1] }}</text>
			<text class="up-calendar-header__weekdays__weekday">{{ weekText[2] }}</text>
			<text class="up-calendar-header__weekdays__weekday">{{ weekText[3] }}</text>
			<text class="up-calendar-header__weekdays__weekday">{{ weekText[4] }}</text>
			<text class="up-calendar-header__weekdays__weekday">{{ weekText[5] }}</text>
			<text class="up-calendar-header__weekdays__weekday">{{ weekText[6] }}</text>
```

Add this prop after `showSubtitle`:

```js
			// 星期文本
			weekText: {
				type: Array,
				default: () => ['一', '二', '三', '四', '五', '六', '日']
			},
```

Expected: default rendering stays unchanged, custom `weekText` works.

- [ ] **Step 5: Add forbidden date props to month**

Patch `uni_modules/uview-ultra/components/up-calendar/month.vue` props after `allowSameDay`:

```js
			// 禁用日期，格式为 YYYY-MM-DD；range 模式不启用该限制
			forbidDays: {
				type: Array,
				default: () => []
			},
			// 点击禁用日期时的提示
			forbidDaysToast: {
				type: String,
				default: ''
			},
			// 月份标题格式，遵循 dayjs format
			monthFormat: {
				type: String,
				default: ''
			},
```

Expected: month receives the new props without affecting existing modes.

- [ ] **Step 6: Render custom month title format**

In the month template, replace:

```vue
<text v-if="index !== 0" class="up-calendar-month__title">{{ item.year }}年{{ item.month }}月</text>
```

with:

```vue
<text v-if="index !== 0" class="up-calendar-month__title">{{ getMonthTitle(item) }}</text>
```

Add this method before `dateSame`:

```js
			getMonthTitle(item) {
				if (!item) return ''
				const month = String(item.month).padStart(2, '0')
				const monthDate = dayjs(`${item.year}-${month}-01`)
				if (this.monthFormat && monthDate.isValid()) {
					return monthDate.format(this.monthFormat)
				}
				return `${item.year}年${item.month}月`
			},
```

Expected: default title stays the same; `monthFormat="YYYY/MM"` renders custom titles.

- [ ] **Step 7: Block forbidden date clicks**

Add this method before `clickHandler`:

```js
			isForbid(item) {
				const date = dayjs(item.date).format('YYYY-MM-DD')
				if (this.mode !== 'range' && this.forbidDays.includes(date)) {
					return true
				}
				return false
			},
```

Then in `clickHandler(index, index1, item)`, immediately after:

```js
				if (item.disabled) return
```

add:

```js
				if (this.isForbid(item)) {
					uni.showToast({
						title: this.forbidDaysToast,
						icon: 'none'
					})
					return
				}
```

Expected: forbidden dates cannot be selected in `single` or `multiple` mode, and range mode behavior stays unchanged.

- [ ] **Step 8: Check forbidden date text style remains disabled only for min/max**

Run:

```powershell
Select-String -Path 'uni_modules/uview-ultra/components/up-calendar/month.vue' -Pattern 'isForbid|forbidDays|monthFormat|getMonthTitle' -Context 1,2
```

Expected: new logic is present; there is no CSS class change that would affect dark-mode tokens.

- [ ] **Step 9: Compile-check calendar runtime batch**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no new error under `uni_modules/uview-ultra`.

- [ ] **Step 10: Commit calendar runtime**

Run:

```powershell
git add -- uni_modules/uview-ultra/components/up-calendar/up-calendar.vue uni_modules/uview-ultra/components/up-calendar/header.vue uni_modules/uview-ultra/components/up-calendar/month.vue
git commit -m "补齐uview-ultra日历Vue运行时能力" -m "为up-calendar接入内联渲染、星期文案、禁用日期和月份格式逻辑，支撑up-calendar-strip内嵌完整月历。"
```

---

### Task 3: Icon Vue Custom Font Compatibility

**Files:**
- Create: `uni_modules/uview-ultra/components/up-icon/util.js`
- Modify: `uni_modules/uview-ultra/components/up-icon/up-icon.vue`
- Modify: `uni_modules/uview-ultra/libs/config/config.js`
- Modify: `uni_modules/uview-ultra/types/comps/icon.d.ts`
- Modify: `uni_modules/uview-ultra/types/index.d.ts`

**Interfaces:**
- Consumes: `config.iconUrl`, `config.customIcon`, `config.customIcons`, `config.loadFontOnce`
- Produces: `up-icon` custom icon unicode fallback and custom font-family support in Vue

- [ ] **Step 1: Add icon font config defaults**

Patch `uni_modules/uview-ultra/libs/config/config.js` after the `color` object and before `unit`:

```js
    iconUrl: 'https://at.alicdn.com/t/font_2225171_8kdcwk4po24.ttf',
    customIcon: {
        family: '',
        url: ''
    },
    customIcons: {},
    loadFontOnce: false,
```

Expected: Vue icon helper has safe defaults and `setConfig({ config: customConfig })` can override them.

- [ ] **Step 2: Create Vue-only font loading helper**

Create `uni_modules/uview-ultra/components/up-icon/util.js`:

```js
import config from '../../libs/config/config.js'

const params = {
    loaded: false
}

function loadFontFace(family, url) {
    if (!family || !url || typeof uni === 'undefined' || typeof uni.loadFontFace !== 'function') {
        return
    }
    uni.loadFontFace({
        global: true,
        family,
        source: `url("${url}")`,
        success() {},
        fail() {}
    })
}

function loadFont() {
    if (params.loaded) return true
    loadFontFace('upicon-iconfont', config.iconUrl)
    if (config.customIcon && config.customIcon.family && config.customIcon.url) {
        loadFontFace(config.customIcon.family, config.customIcon.url)
    }
    if (config.loadFontOnce) {
        params.loaded = true
    }
    return true
}

export default {
    params,
    loadFont
}
```

Expected: helper has no nvue/weex branch and is safe on platforms without `uni.loadFontFace`.

- [ ] **Step 3: Import and call the helper in `up-icon.vue`**

Patch `uni_modules/uview-ultra/components/up-icon/up-icon.vue`.

Add:

```js
	import fontUtil from './util.js';
```

Add this component option before `data()`:

```js
		beforeCreate() {
			if (!fontUtil.params.loaded) {
				fontUtil.loadFont();
			}
		},
```

Expected: built-in and configured custom fonts are loaded for Vue usage.

- [ ] **Step 4: Restore custom font family in icon style**

In `iconStyle()`, after the style object assignment and before color handling, add:

```js
				if (this.customPrefix !== 'upicon') {
					style.fontFamily = this.customPrefix
				}
```

Expected: custom icon classes render with their configured font family.

- [ ] **Step 5: Restore custom icon unicode fallback**

Replace the current custom-prefix guard in `icon()`:

```js
				if (this.customPrefix !== "upicon") return "";
```

with:

```js
				if (this.customPrefix !== 'upicon') {
					return config.customIcons[this.name] || this.name;
				}
```

Expected: custom icon names resolve to configured unicode or fall back to `name`, matching `uview-plus` behavior with `upicon` prefix preserved.

- [ ] **Step 6: Add icon type declarations**

Patch `uni_modules/uview-ultra/types/comps/icon.d.ts` after `hoverClass?: string`:

```ts
  /**
   * 自定义扩展前缀，方便用户扩展自己的图标库
   * @default "upicon"
   */
  customPrefix?: string
```

Patch `uni_modules/uview-ultra/types/index.d.ts` inside `interface Config` after `nativeThemeSync: boolean;`:

```ts
		iconUrl: string;
		customIcon: {
			family: string;
			url: string;
		};
		customIcons: {
			[key: string]: string;
		};
		loadFontOnce: boolean;
```

Expected: `setConfig` users get type hints for custom icon font config.

- [ ] **Step 7: Search for accidental UVue/UTS edits**

Run:

```powershell
git diff --name-only | Select-String -Pattern '\.uvue$|\.uts$|index\.uts$|^pages/'
```

Expected: no output.

- [ ] **Step 8: Compile-check icon batch**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no new error under `uni_modules/uview-ultra`.

- [ ] **Step 9: Commit icon compatibility**

Run:

```powershell
git add -- uni_modules/uview-ultra/components/up-icon/up-icon.vue uni_modules/uview-ultra/components/up-icon/util.js uni_modules/uview-ultra/libs/config/config.js uni_modules/uview-ultra/types/comps/icon.d.ts uni_modules/uview-ultra/types/index.d.ts
git commit -m "补齐uview-ultra图标Vue自定义字体能力" -m "为up-icon恢复自定义prefix、customIcons映射和Vue侧字体加载配置，不改动uvue和uts实现。"
```

---

### Task 4: Final Verification and Notes

**Files:**
- Modify: `docs/uview-ultra-vue-runtime-gap.md`

**Interfaces:**
- Consumes: Tasks 1 through 3
- Produces: final verification record for this Vue-only component parity batch

- [ ] **Step 1: Run final Android compile**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no new error under `uni_modules/uview-ultra`. Baseline `pages/componentsC/navbar/navbar.uvue:26` may remain.

- [ ] **Step 2: Capture lastBuild log**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --mode lastBuild
```

Expected: log is available and can be summarized.

- [ ] **Step 3: Append verification notes**

Append this section to `docs/uview-ultra-vue-runtime-gap.md`, replacing result text with the actual observed result:

```markdown
## Vue Component Parity Verification

- Scope: Vue-only `up-calendar` and `up-icon` component parity; no `.uvue`, `.uts`, `index.uts`, demo, or `pages/**` files changed.
- Android compile command: `& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true`
- Android result: pass with existing baseline blocker only, or record new key error lines.
- lastBuild command: `& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --mode lastBuild`
- lastBuild result: available or record blocker.
- Warnings: record remaining warnings and whether they affect Vue component parity.
```

- [ ] **Step 4: Verify final diff excludes UVue/UTS**

Run:

```powershell
git diff --name-only HEAD | Select-String -Pattern '\.uvue$|\.uts$|index\.uts$|^pages/'
```

Expected: no output.

- [ ] **Step 5: Commit verification notes**

Run:

```powershell
git add -- docs/uview-ultra-vue-runtime-gap.md
git commit -m "记录uview-ultra Vue组件对齐验证" -m "记录calendar和icon首批Vue-only组件功能对齐的编译结果、范围约束和残留基线问题。"
```

---

## Self-Review Checklist

- Spec coverage: covers Vue-only `up-calendar` and `up-icon`, excludes UVue/UTS and demo pages.
- Calendar coverage: includes `pageInline`, `weekText`, `forbidDays`, `forbidDaysToast`, and `monthFormat` defaults, props, runtime wiring, and types.
- Icon coverage: includes custom icon unicode resolution, custom font family styling, font loading config, helper, and types.
- Safety: every task includes a check that `.uvue`, `.uts`, `index.uts`, and `pages/**` are untouched.
- Verification: every code task ends with HBuilderX Android compile and a Chinese commit message with body.
