# uview-ultra Vue Runtime Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Vue-facing `uview-ultra` runtime closer to `uview-plus` while excluding demo/example pages and requiring Vue root host support.

**Architecture:** Implement parity in layers: first capture a source baseline, then add Vue entry/i18n/runtime exports, port theme runtime and CSS variables, add root host support, port missing Vue components, update types, and verify with HBuilderX CLI. The `uview-plus` source at `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus` is the compatibility baseline; target changes stay under `D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra` except docs and verification notes.

**Tech Stack:** uni-app Vue 3, uni_modules, Vue SFC, JavaScript, SCSS, TypeScript declaration files, HBuilderX CLI.

## Global Constraints

- Compare and modify only the library/runtime side of `uni_modules/uview-ultra`.
- Treat `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus` as the compatibility baseline.
- Preserve `uview-ultra` component prefix `up-*`.
- Keep `.uvue` demo pages out of scope.
- Root host support is mandatory and must be implemented for Vue usage.
- Maintain existing UTS/uni-app-x behavior unless a Vue parity change explicitly requires shared files.
- Do not publish a package version in this plan.
- Do not change public component APIs unless required for compatibility with `uview-plus`.
- After each code batch, run at least one relevant HBuilderX CLI compile check according to `AGEMTS.md`.
- Leave unrelated existing worktree changes untouched.

---

## File Structure

Create:

- `docs/uview-ultra-vue-runtime-gap.md` records reproducible source diffs and decisions.
- `uni_modules/uview-ultra/libs/theme/theme.js` owns Vue theme state, storage, CSS variable generation, and theme-change listeners.
- `uni_modules/uview-ultra/libs/theme/runtime.js` owns safe runtime helpers for CSS vars, native UI sync, page/card/tabbar style helpers, and fallback behavior.
- `uni_modules/uview-ultra/libs/css/theme-vars-core.scss` defines default light/dark `--up-*` variables.
- `uni_modules/uview-ultra/libs/css/theme-vars.scss` imports the core variable file.
- `uni_modules/uview-ultra/libs/css/theme-legacy-bridge.scss` provides alias compatibility when a ported Vue component expects legacy variable names.
- `uni_modules/uview-ultra/libs/root/root-toast-host.vue` registers global toast/notify refs.
- `uni_modules/uview-ultra/libs/root/runtime.js` provides a small compatibility shim for stale incremental build caches.
- `uni_modules/uview-ultra/libs/root/LICENSE` preserves upstream `uni-ku/root` license if root plugin files are ported.
- `uni_modules/uview-ultra/components/up-root-toast-host/up-root-toast-host.vue` exposes the host through easycom.
- `uni_modules/uview-ultra/components/up-calendar-strip/*` ports the missing Vue component.
- `uni_modules/uview-ultra/components/up-guide/*` ports the missing Vue component.
- `uni_modules/uview-ultra/types/comps/rootToastHost.d.ts`
- `uni_modules/uview-ultra/types/comps/calendarStrip.d.ts`
- `uni_modules/uview-ultra/types/comps/guide.d.ts`

Modify:

- `uni_modules/uview-ultra/index.js` exports and mounts i18n, theme, utility, and root host runtime APIs.
- `uni_modules/uview-ultra/index.scss` imports theme variable styles.
- `uni_modules/uview-ultra/libs/config/config.js` adds theme-related config defaults when missing.
- `uni_modules/uview-ultra/libs/config/color.js` gains fields required by theme runtime when missing.
- `uni_modules/uview-ultra/libs/config/props.js` remains API-compatible; modify only if missing component props must be added.
- `uni_modules/uview-ultra/types/index.d.ts` adds runtime APIs, theme APIs, root host methods, and missing refs.
- `uni_modules/uview-ultra/types/comps.d.ts` registers `up-root-toast-host`, `up-calendar-strip`, and `up-guide`.
- High-impact Vue components get theme variable usage where needed: `up-navbar`, `up-notice-bar`, `up-subsection`, `up-switch`, `up-tag`, `up-table2`, `up-gap`, `up-skeleton`.

Do not modify:

- `pages/**` demo/example files.
- `App.uvue`, unless a verification smoke check explicitly requires a temporary local-only change that must be reverted before commit.
- `uni_modules/uview-ultra/index.uts`, unless a shared file change breaks UTS compile.

---

### Task 1: Baseline Gap Checklist

**Files:**
- Create: `docs/uview-ultra-vue-runtime-gap.md`

**Interfaces:**
- Consumes: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus`, `D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra`
- Produces: a gap checklist used by all implementation tasks

- [ ] **Step 1: Generate normalized component diff**

Run:

```powershell
$plus = 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components'
$ultra = 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\components'
$p = Get-ChildItem -LiteralPath $plus -Directory | ForEach-Object { $_.Name -replace '^u-', '' -replace '^uview-plus$', 'uview-plus' } | Sort-Object -Unique
$u = Get-ChildItem -LiteralPath $ultra -Directory | ForEach-Object { $_.Name -replace '^up-', '' } | Sort-Object -Unique
'Only in uview-plus:'
Compare-Object $u $p | Where-Object SideIndicator -eq '=>' | ForEach-Object InputObject
'Only in uview-ultra:'
Compare-Object $u $p | Where-Object SideIndicator -eq '<=' | ForEach-Object InputObject
"plus=$($p.Count)"
"ultra=$($u.Count)"
```

Expected current output includes:

```text
Only in uview-plus:
calendar-strip
guide
root-toast-host
uview-plus
Only in uview-ultra:
plus=140
ultra=136
```

- [ ] **Step 2: Generate runtime folder diff**

Run:

```powershell
$plusRoot = 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus'
$ultraRoot = 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra'
$plusFiles = Get-ChildItem -LiteralPath "$plusRoot\libs" -Recurse -File | ForEach-Object { $_.FullName.Substring($plusRoot.Length + 1) } | Sort-Object
$ultraFiles = Get-ChildItem -LiteralPath "$ultraRoot\libs" -Recurse -File | ForEach-Object { $_.FullName.Substring($ultraRoot.Length + 1) } | Sort-Object
'Runtime files only in uview-plus:'
Compare-Object $ultraFiles $plusFiles | Where-Object SideIndicator -eq '=>' | ForEach-Object InputObject
'Runtime files only in uview-ultra:'
Compare-Object $ultraFiles $plusFiles | Where-Object SideIndicator -eq '<=' | ForEach-Object InputObject
```

Expected: `libs/theme/*`, `libs/root/*`, and theme CSS files appear in the `uview-plus` side.

- [ ] **Step 3: Write the gap document**

Create `docs/uview-ultra-vue-runtime-gap.md` with this content:

```markdown
# uview-ultra Vue Runtime Gap Checklist

## Scope

- Baseline: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus`
- Target: `D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra`
- Demo and example pages are excluded.
- Vue root host is required.

## Component Gaps

- Missing in `uview-ultra`: `calendar-strip`, `guide`, `root-toast-host`.
- `uview-plus` package wrapper component is not required unless a compatibility failure appears.

## Runtime Gaps

- `uview-ultra/index.js` must expose Vue i18n helpers, theme helpers, and root host methods through named exports and `uni.$u`.
- `uview-ultra` lacks Vue theme runtime files under `libs/theme`.
- `uview-ultra` lacks root host files under `libs/root` and an easycom-facing `up-root-toast-host`.

## Type Gaps

- `types/index.d.ts` must include i18n, theme, root host methods, and missing refs.
- `types/comps.d.ts` must include `up-root-toast-host`, `up-calendar-strip`, and `up-guide`.
- Component-specific declaration files must be added under `types/comps`.

## Verification Matrix

- H5/Vue compile after entry, i18n, theme, and root host batches.
- Android compile after final batch using HBuilderX CLI.
```

- [ ] **Step 4: Commit the baseline checklist**

Run:

```powershell
git add -- docs/uview-ultra-vue-runtime-gap.md
git commit -m "记录uview-ultra Vue运行时差异清单" -m "记录与uview-plus的组件、运行时和类型声明差异，明确示例页不纳入本轮范围并要求补齐Vue root host。"
```

Expected: commit succeeds and does not include unrelated `.gitignore`, `AGEMTS.md`, or `.claude/` changes.

---

### Task 2: Entry, Utility, and I18n Parity

**Files:**
- Modify: `uni_modules/uview-ultra/index.js`
- Modify: `uni_modules/uview-ultra/types/index.d.ts`

**Interfaces:**
- Consumes: existing `libs/i18n/index.js`, `libs/function/digit.js`, optional `libs/function/calc.js` if present or ported
- Produces: named exports `i18n`, `t`, `digit`, and mounted `uni.$u.t`, `uni.$u.i18n`, `uni.$u.digit`

- [ ] **Step 1: Check whether `calc.js` exists in target**

Run:

```powershell
Test-Path -LiteralPath 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\function\calc.js'
```

Expected current result: `False`.

- [ ] **Step 2: Port `calc.js` if absent**

If Step 1 returned `False`, copy the baseline file:

```powershell
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\function\calc.js' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\function\calc.js'
```

Expected: `uni_modules/uview-ultra/libs/function/calc.js` exists and exports the same API as `uview-plus`.

- [ ] **Step 3: Update `index.js` imports**

Patch `uni_modules/uview-ultra/index.js` by adding imports near the existing function imports:

```js
import calc from './libs/function/calc.js'
import digit from './libs/function/digit.js'
import i18n, { t } from './libs/i18n/index.js'
```

- [ ] **Step 4: Update `index.js` named exports**

Change the existing export list from:

```js
export { route, http, debounce, throttle, platform, themeType, mixin, mpMixin, props, color, test, zIndex }
```

to:

```js
export { route, http, debounce, throttle, calc, digit, platform, themeType, mixin, mpMixin, props, color, test, zIndex, i18n, t }
```

- [ ] **Step 5: Update `$u` runtime object**

Add these fields to the `$u` object in `uni_modules/uview-ultra/index.js`:

```js
calc,
digit,
i18n,
t,
```

Expected: after `app.use(ultraUI)`, consumers can call `uni.$u.t('key')`.

- [ ] **Step 6: Update type declarations**

In `uni_modules/uview-ultra/types/index.d.ts`, add the following public API declarations inside `declare module 'uview-plus'` after `export function install(): void`:

```ts
	export function t(value: string, params?: Record<string, string | number>): string;
	export const i18n: {
		settings: {
			lang: string;
			locales: Record<string, Record<string, string>>;
		}
	};
```

Inside interface `$u`, add:

```ts
		calc: Record<string, (...args: any[]) => any>;
		digit: Record<string, (...args: any[]) => any>;
		i18n: {
			settings: {
				lang: string;
				locales: Record<string, Record<string, string>>;
			}
		};
		t: (value: string, params?: Record<string, string | number>) => string;
```

- [ ] **Step 7: Compile-check the entry batch**

Run HBuilderX Android compile check:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no error-level compile failures caused by `index.js`, `calc.js`, or `i18n` imports. If no Android device is available, run the same command after starting MuMu and record the blocker in the task commit body.

- [ ] **Step 8: Commit the entry batch**

Run:

```powershell
git add -- uni_modules/uview-ultra/index.js uni_modules/uview-ultra/libs/function/calc.js uni_modules/uview-ultra/types/index.d.ts
git commit -m "补齐uview-ultra Vue入口基础能力" -m "为Vue入口导出并挂载calc、digit、i18n和t，保持现有up组件使用方式不变。"
```

---

### Task 3: Theme Runtime and CSS Variables

**Files:**
- Create: `uni_modules/uview-ultra/libs/theme/theme.js`
- Create: `uni_modules/uview-ultra/libs/theme/runtime.js`
- Create: `uni_modules/uview-ultra/libs/css/theme-vars-core.scss`
- Create: `uni_modules/uview-ultra/libs/css/theme-vars.scss`
- Create: `uni_modules/uview-ultra/libs/css/theme-legacy-bridge.scss`
- Modify: `uni_modules/uview-ultra/index.js`
- Modify: `uni_modules/uview-ultra/index.scss`
- Modify: `uni_modules/uview-ultra/libs/config/config.js`
- Modify: `uni_modules/uview-ultra/libs/config/color.js`

**Interfaces:**
- Consumes: `uview-plus` theme files from `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\theme`
- Produces: `uni.$u.theme`, `uni.$u.setTheme`, `uni.$u.setThemePreference`, `uni.$u.getThemePreference`, `uni.$u.getSystemTheme`, `uni.$u.getThemeVars`, `uni.$u.getThemeTabBarStyle`, `uni.$u.applyNativeThemeUI`

- [ ] **Step 1: Copy baseline theme files**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\theme'
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\theme\theme.js' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\theme\theme.js'
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\theme\runtime.js' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\theme\runtime.js'
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\css\theme-vars-core.scss' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\css\theme-vars-core.scss'
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\css\theme-vars.scss' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\css\theme-vars.scss'
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\css\theme-legacy-bridge.scss' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\css\theme-legacy-bridge.scss'
```

- [ ] **Step 2: Adapt theme files to `uview-ultra` path assumptions**

Review imports in:

```text
uni_modules/uview-ultra/libs/theme/theme.js
uni_modules/uview-ultra/libs/theme/runtime.js
```

Expected valid imports:

```js
import config from '../config/config.js'
import color from '../config/color.js'
import index from '../function/index.js'
```

Keep both `--up-*` and `--u-*` alias handling from the baseline files because it protects users migrating from `uview-plus`.

- [ ] **Step 3: Add theme imports to `index.js`**

Add:

```js
import {
    themeState,
    setTheme,
    setThemePreference,
    getThemePreference,
    getSystemTheme,
    getThemeVars,
    initThemeSystem,
    refreshThemeFromConfig,
    syncThemeColorOverrideState
} from './libs/theme/theme.js'
import {
    applyNativeThemeUI,
    getThemeCardStyle,
    getThemeIsDark,
    getThemePageStyle,
    getThemeTabBarStyle,
    getThemeVar,
    getThemeVarsForStyle
} from './libs/theme/runtime.js'
```

- [ ] **Step 4: Update `setConfig` theme refresh behavior**

In `uni_modules/uview-ultra/index.js`, replace the existing `setConfig` body with:

```js
export function setConfig(configs) {
    const settings = configs || {}
	index.shallowMerge(config, settings.config || {})
	index.shallowMerge(props, settings.props || {})
	index.shallowMerge(color, settings.color || {})
	index.shallowMerge(zIndex, settings.zIndex || {})
    syncThemeColorOverrideState({
        color: settings.color,
        configColor: settings?.config?.color
    })
    const shouldRefreshTheme = !!settings.color
        || !!settings?.config?.color
        || themeState.version > 0
    if (shouldRefreshTheme) {
        refreshThemeFromConfig()
    }
}
```

- [ ] **Step 5: Add theme APIs to `$u`**

Add these fields to the `$u` object:

```js
theme: themeState,
setTheme,
setThemePreference,
getThemePreference,
getSystemTheme,
getThemeVars,
getThemeTabBarStyle,
applyNativeThemeUI,
```

- [ ] **Step 6: Initialize theme during mount/install**

Update `mount$u`:

```js
export const mount$u = function() {
    uni.$u = $u
    initThemeSystem()
}
```

Inside `install`, after `uni.$u = $u`, add:

```js
initThemeSystem()
```

- [ ] **Step 7: Add global theme helper getters**

Add this helper function to `index.js` before `install`:

```js
function defineGlobalThemeHelpers(Vue) {
    const globalProperties = Vue?.config?.globalProperties
    if (!globalProperties) return
    Object.defineProperty(globalProperties, 'upThemeIsDark', {
        configurable: true,
        get() {
            return getThemeIsDark()
        }
    })
    Object.defineProperty(globalProperties, 'upThemeVars', {
        configurable: true,
        get() {
            return getThemeVarsForStyle()
        }
    })
    Object.defineProperty(globalProperties, 'upThemePageStyle', {
        configurable: true,
        get() {
            return getThemePageStyle()
        }
    })
    Object.defineProperty(globalProperties, 'upThemeCardStyle', {
        configurable: true,
        get() {
            return getThemeCardStyle()
        }
    })
    globalProperties.upThemeVar = function(varName, fallbackColor) {
        return getThemeVar(varName, fallbackColor)
    }
    globalProperties.upApplyNativeThemeUI = function() {
        return applyNativeThemeUI()
    }
}
```

Inside `install`, after `Vue.config.globalProperties.$u = $u`, add:

```js
defineGlobalThemeHelpers(Vue)
```

- [ ] **Step 8: Import theme SCSS in `index.scss`**

At the top of `uni_modules/uview-ultra/index.scss`, add:

```scss
@import "./libs/css/theme-vars.scss";
@import "./libs/css/theme-legacy-bridge.scss";
```

- [ ] **Step 9: Ensure config defaults exist**

In `uni_modules/uview-ultra/libs/config/config.js`, ensure the default object includes:

```js
themeMode: 'light',
nativeThemeSync: false,
```

In `uni_modules/uview-ultra/libs/config/color.js`, ensure these keys exist:

```js
bgColor: '#f3f4f6',
disabledColor: '#c8c9cc',
```

- [ ] **Step 10: Compile-check the theme batch**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no error-level compile failures from theme imports or SCSS imports.

- [ ] **Step 11: Commit the theme runtime**

Run:

```powershell
git add -- uni_modules/uview-ultra/index.js uni_modules/uview-ultra/index.scss uni_modules/uview-ultra/libs/theme uni_modules/uview-ultra/libs/css/theme-vars-core.scss uni_modules/uview-ultra/libs/css/theme-vars.scss uni_modules/uview-ultra/libs/css/theme-legacy-bridge.scss uni_modules/uview-ultra/libs/config/config.js uni_modules/uview-ultra/libs/config/color.js
git commit -m "补齐uview-ultra Vue暗黑主题运行时" -m "迁移并适配主题状态、CSS变量、系统主题监听和原生UI同步入口，为后续组件主题适配提供基础。"
```

---

### Task 4: Root Host Runtime and Easycom Component

**Files:**
- Create: `uni_modules/uview-ultra/libs/root/root-toast-host.vue`
- Create: `uni_modules/uview-ultra/libs/root/runtime.js`
- Create: `uni_modules/uview-ultra/libs/root/LICENSE`
- Create: `uni_modules/uview-ultra/components/up-root-toast-host/up-root-toast-host.vue`
- Modify: `uni_modules/uview-ultra/index.js`
- Modify: `uni_modules/uview-ultra/types/index.d.ts`
- Modify: `uni_modules/uview-ultra/types/comps.d.ts`
- Create: `uni_modules/uview-ultra/types/comps/rootToastHost.d.ts`

**Interfaces:**
- Produces: `uni.$u.rootToast(options)`, `uni.$u.setRootToastRef(ref)`, `uni.$u.rootNotify(options)`, `uni.$u.setRootNotifyRef(ref)`, `up-root-toast-host`

- [ ] **Step 1: Create root directory and copy license/runtime shim**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\root'
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\root\LICENSE' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\root\LICENSE'
Copy-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\libs\root\runtime.js' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\libs\root\runtime.js'
```

- [ ] **Step 2: Add library root host Vue SFC**

Create `uni_modules/uview-ultra/libs/root/root-toast-host.vue` with:

```vue
<template>
  <up-toast ref="upGlobalToastRef" />
  <up-notify ref="upGlobalNotifyRef" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const upGlobalToastRef = ref(null)
const upGlobalNotifyRef = ref(null)

onMounted(() => {
  if (typeof uni === 'undefined' || !uni.$u) return
  if (typeof uni.$u.setRootToastRef === 'function') {
    uni.$u.setRootToastRef(upGlobalToastRef.value)
  }
  if (typeof uni.$u.setRootNotifyRef === 'function') {
    uni.$u.setRootNotifyRef(upGlobalNotifyRef.value)
  }
})

onBeforeUnmount(() => {
  if (typeof uni === 'undefined' || !uni.$u) return
  if (typeof uni.$u.setRootToastRef === 'function') {
    uni.$u.setRootToastRef(null)
  }
  if (typeof uni.$u.setRootNotifyRef === 'function') {
    uni.$u.setRootNotifyRef(null)
  }
})
</script>
```

- [ ] **Step 3: Add easycom-facing component wrapper**

Create `uni_modules/uview-ultra/components/up-root-toast-host/up-root-toast-host.vue` with:

```vue
<template>
  <root-toast-host />
</template>

<script>
import RootToastHost from '../../libs/root/root-toast-host.vue'

export default {
  name: 'up-root-toast-host',
  components: {
    RootToastHost
  }
}
</script>
```

- [ ] **Step 4: Add root host state and fallback methods to `index.js`**

Add this block after the theme imports and before `setConfig`:

```js
const rootToastState = {
    ref: null
}
const rootNotifyState = {
    ref: null
}

function normalizeRootToastOptions(options = {}) {
    const toastOptions = typeof options === 'string'
        ? { message: options }
        : (options && typeof options === 'object' ? { ...options } : {})
    if (!toastOptions.message && toastOptions.title) {
        toastOptions.message = toastOptions.title
    }
    return toastOptions
}

function setRootToastRef(ref = null) {
    rootToastState.ref = ref || null
}

function rootToast(options = {}) {
    const toastOptions = normalizeRootToastOptions(options)
    const toastRef = rootToastState.ref
    if (toastRef && typeof toastRef.show === 'function') {
        toastRef.show(toastOptions)
        return
    }
    if (!toastOptions.message) return
    if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
        uni.showToast({
            title: toastOptions.message,
            icon: 'none',
            duration: Number(toastOptions.duration) || 2000,
        })
    }
}

function normalizeRootNotifyOptions(options = {}) {
    const notifyOptions = typeof options === 'string'
        ? { message: options }
        : (options && typeof options === 'object' ? { ...options } : {})
    if (!notifyOptions.message && notifyOptions.title) {
        notifyOptions.message = notifyOptions.title
    }
    return notifyOptions
}

function setRootNotifyRef(ref = null) {
    rootNotifyState.ref = ref || null
}

function rootNotify(options = {}) {
    const notifyOptions = normalizeRootNotifyOptions(options)
    const notifyRef = rootNotifyState.ref
    if (notifyRef && typeof notifyRef.show === 'function') {
        notifyRef.show(notifyOptions)
        return
    }
    if (!notifyOptions.message) return
    if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
        uni.showToast({
            title: notifyOptions.message,
            icon: 'none',
            duration: Number(notifyOptions.duration) || 3000,
        })
    }
}
```

- [ ] **Step 5: Mount root host methods on `$u`**

Add these fields to `$u`:

```js
rootToast,
setRootToastRef,
rootNotify,
setRootNotifyRef,
```

- [ ] **Step 6: Add root host types**

Create `uni_modules/uview-ultra/types/comps/rootToastHost.d.ts` with:

```ts
import { DefineComponent } from './_common'

export type RootToastHost = DefineComponent<Record<string, never>>
```

In `types/comps.d.ts`, add under feedback components:

```ts
    ['up-root-toast-host']: typeof import('./comps/rootToastHost')['RootToastHost']
```

In interface `$u` in `types/index.d.ts`, add:

```ts
		rootToast: (options?: string | { message?: string; title?: string; duration?: number; [key: string]: any }) => void;
		setRootToastRef: (ref?: any) => void;
		rootNotify: (options?: string | { message?: string; title?: string; duration?: number; [key: string]: any }) => void;
		setRootNotifyRef: (ref?: any) => void;
```

- [ ] **Step 7: Compile-check root host**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no error-level compile failures from `up-root-toast-host`, `up-toast`, or `up-notify`.

- [ ] **Step 8: Commit root host**

Run:

```powershell
git add -- uni_modules/uview-ultra/index.js uni_modules/uview-ultra/libs/root uni_modules/uview-ultra/components/up-root-toast-host uni_modules/uview-ultra/types/index.d.ts uni_modules/uview-ultra/types/comps.d.ts uni_modules/uview-ultra/types/comps/rootToastHost.d.ts
git commit -m "补齐uview-ultra Vue root host" -m "新增up-root-toast-host并挂载rootToast/rootNotify运行时方法，支持宿主渲染和无宿主fallback。"
```

---

### Task 5: Component Theme Adaptation

**Files:**
- Modify: `uni_modules/uview-ultra/components/up-navbar/up-navbar.vue`
- Modify: `uni_modules/uview-ultra/components/up-notice-bar/up-notice-bar.vue`
- Modify: `uni_modules/uview-ultra/components/up-subsection/up-subsection.vue`
- Modify: `uni_modules/uview-ultra/components/up-switch/up-switch.vue`
- Modify: `uni_modules/uview-ultra/components/up-tag/up-tag.vue`
- Modify: `uni_modules/uview-ultra/components/up-table2/up-table2.vue`
- Modify: `uni_modules/uview-ultra/components/up-gap/up-gap.vue`
- Modify: `uni_modules/uview-ultra/components/up-skeleton/up-skeleton.vue`

**Interfaces:**
- Consumes: `--up-*` CSS variables from Task 3
- Produces: readable light/dark styling while preserving explicit prop precedence

- [ ] **Step 1: Port per-component theme variable files where baseline has them**

For components that have baseline files, copy and rename:

```powershell
$pairs = @(
  @{ src='u-navbar'; dst='up-navbar' },
  @{ src='u-notice-bar'; dst='up-notice-bar' },
  @{ src='u-subsection'; dst='up-subsection' },
  @{ src='u-switch'; dst='up-switch' },
  @{ src='u-tag'; dst='up-tag' }
)
foreach ($pair in $pairs) {
  $source = "D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components\$($pair.src)\theme-vars.scss"
  $target = "D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\components\$($pair.dst)\theme-vars.scss"
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination $target
  }
}
```

- [ ] **Step 2: Import component theme vars**

For each component that now has `theme-vars.scss`, add this line at the top of its `<style lang="scss">` block:

```scss
@import "./theme-vars.scss";
```

Expected target files:

```text
uni_modules/uview-ultra/components/up-navbar/up-navbar.vue
uni_modules/uview-ultra/components/up-notice-bar/up-notice-bar.vue
uni_modules/uview-ultra/components/up-subsection/up-subsection.vue
uni_modules/uview-ultra/components/up-switch/up-switch.vue
uni_modules/uview-ultra/components/up-tag/up-tag.vue
```

- [ ] **Step 3: Replace hardcoded fallback colors with CSS vars only where props are absent**

Use this pattern in computed style methods:

```js
const themedColor = explicitPropColor || 'var(--up-main-color, #303133)'
```

Do not replace code paths where the component intentionally uses a user-provided prop value.

- [ ] **Step 4: Apply standard theme fallback variables**

Use these component-specific fallbacks:

```text
up-navbar background: var(--up-navbar-bg-color, #ffffff)
up-navbar text: var(--up-main-color, #303133)
up-notice-bar background: var(--up-warning-light, #fdf6ec)
up-notice-bar text: var(--up-warning, #f9ae3d)
up-subsection inactive text: var(--up-content-color, #606266)
up-switch inactive background: var(--up-disabled-color, #c8c9cc)
up-tag border/text: var(--up-primary, #3c9cff)
up-table2 header: var(--up-table2-header-bg-color, #f5f7fa)
up-gap background: var(--up-gap-bg-color, #f3f4f6)
up-skeleton background: var(--up-skeleton-bg-color, #f1f2f4)
```

- [ ] **Step 5: Compile-check theme component batch**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no SCSS import or CSS variable compile errors.

- [ ] **Step 6: Commit component theme adaptation**

Run:

```powershell
git add -- uni_modules/uview-ultra/components/up-navbar uni_modules/uview-ultra/components/up-notice-bar uni_modules/uview-ultra/components/up-subsection uni_modules/uview-ultra/components/up-switch uni_modules/uview-ultra/components/up-tag uni_modules/uview-ultra/components/up-table2 uni_modules/uview-ultra/components/up-gap uni_modules/uview-ultra/components/up-skeleton
git commit -m "适配uview-ultra核心Vue组件暗黑变量" -m "为导航、反馈、分段、开关、标签、表格、间隔和骨架屏组件接入主题变量，同时保留显式颜色属性优先级。"
```

---

### Task 6: Missing Vue Components

**Files:**
- Create: `uni_modules/uview-ultra/components/up-calendar-strip/*`
- Create: `uni_modules/uview-ultra/components/up-guide/*`
- Modify: `uni_modules/uview-ultra/libs/config/props.js` if copied components require missing default props
- Create: `uni_modules/uview-ultra/types/comps/calendarStrip.d.ts`
- Create: `uni_modules/uview-ultra/types/comps/guide.d.ts`
- Modify: `uni_modules/uview-ultra/types/comps.d.ts`
- Modify: `uni_modules/uview-ultra/types/index.d.ts`

**Interfaces:**
- Consumes: baseline `u-calendar-strip`, `u-guide`
- Produces: `up-calendar-strip`, `up-guide`

- [ ] **Step 1: Copy component directories**

Run:

```powershell
Copy-Item -Recurse -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components\u-calendar-strip' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\components\up-calendar-strip'
Copy-Item -Recurse -LiteralPath 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components\u-guide' -Destination 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\components\up-guide'
```

- [ ] **Step 2: Rename copied component files**

Run:

```powershell
Rename-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\components\up-calendar-strip\u-calendar-strip.vue' -NewName 'up-calendar-strip.vue'
Rename-Item -LiteralPath 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\components\up-guide\u-guide.vue' -NewName 'up-guide.vue'
```

- [ ] **Step 3: Replace component names and paths**

In all files under `up-calendar-strip` and `up-guide`, replace:

```text
u-calendar-strip -> up-calendar-strip
u-guide -> up-guide
u- -> up-
@/uni_modules/uview-plus -> @/uni_modules/uview-ultra
```

Keep non-component words untouched; verify replacements manually where strings include CSS class names.

- [ ] **Step 4: Ensure easycom component names are correct**

In `up-calendar-strip.vue`, ensure:

```js
name: 'up-calendar-strip'
```

In `up-guide.vue`, ensure:

```js
name: 'up-guide'
```

- [ ] **Step 5: Add component declarations**

Create `types/comps/calendarStrip.d.ts`:

```ts
import { DefineComponent } from './_common'

export type CalendarStrip = DefineComponent<Record<string, any>>
export type CalendarStripRef = any
```

Create `types/comps/guide.d.ts`:

```ts
import { DefineComponent } from './_common'

export type Guide = DefineComponent<Record<string, any>>
export type GuideRef = any
```

Add to `types/comps.d.ts`:

```ts
    ['up-calendar-strip']: typeof import('./comps/calendarStrip')['CalendarStrip']
    ['up-guide']: typeof import('./comps/guide')['Guide']
```

Add to `types/index.d.ts` near other refs:

```ts
declare type UniCalendarStripRef = typeof import('./comps/calendarStrip')['CalendarStripRef']
declare type UniGuideRef = typeof import('./comps/guide')['GuideRef']
```

- [ ] **Step 6: Compile-check missing components**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no missing import, bad component name, or style compile errors caused by `up-calendar-strip` or `up-guide`.

- [ ] **Step 7: Commit missing components**

Run:

```powershell
git add -- uni_modules/uview-ultra/components/up-calendar-strip uni_modules/uview-ultra/components/up-guide uni_modules/uview-ultra/types/comps/calendarStrip.d.ts uni_modules/uview-ultra/types/comps/guide.d.ts uni_modules/uview-ultra/types/comps.d.ts uni_modules/uview-ultra/types/index.d.ts uni_modules/uview-ultra/libs/config/props.js
git commit -m "补齐uview-ultra缺失Vue组件" -m "移植calendar-strip和guide为up前缀组件，并同步easycom类型与组件引用声明。"
```

---

### Task 7: Final Type Parity Review

**Files:**
- Modify: `uni_modules/uview-ultra/types/index.d.ts`
- Modify: `uni_modules/uview-ultra/types/comps.d.ts`
- Modify: `uni_modules/uview-ultra/types/comps/*.d.ts`

**Interfaces:**
- Consumes: runtime APIs and components added in Tasks 2 through 6
- Produces: consistent Vue TypeScript declarations

- [ ] **Step 1: Compare public runtime API declarations**

Run:

```powershell
Select-String -Path 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\types\index.d.ts' -Pattern 'setTheme|rootToast|i18n|t\(|CalendarStrip|Guide|theme:' -Context 1,2
Select-String -Path 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\types\index.d.ts' -Pattern 'setTheme|rootToast|i18n|t\(|CalendarStrip|Guide|theme:' -Context 1,2
```

Expected: `uview-ultra` includes all APIs implemented in Tasks 2 through 6.

- [ ] **Step 2: Add theme declarations if missing**

Inside interface `$u`, ensure:

```ts
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
```

- [ ] **Step 3: Validate component declarations resolve**

Run:

```powershell
$types = @(
  'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\types\comps\rootToastHost.d.ts',
  'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\types\comps\calendarStrip.d.ts',
  'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\types\comps\guide.d.ts'
)
$types | ForEach-Object { if (!(Test-Path -LiteralPath $_)) { throw "Missing $_" } }
```

Expected: no missing declaration file.

- [ ] **Step 4: Compile-check final types**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no TypeScript declaration or easycom errors.

- [ ] **Step 5: Commit type parity**

Run:

```powershell
git add -- uni_modules/uview-ultra/types
git commit -m "完善uview-ultra Vue类型声明" -m "同步入口、多语言、主题、root host和缺失组件的类型声明，保证Vue项目获得完整类型提示。"
```

---

### Task 8: Final Verification and Notes

**Files:**
- Modify: `docs/uview-ultra-vue-runtime-gap.md`

**Interfaces:**
- Consumes: all previous tasks
- Produces: final verification record

- [ ] **Step 1: Run Android compile verification**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected: no error-level compile failures.

- [ ] **Step 2: Capture latest build log**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --mode lastBuild
```

Expected: log is available for summarizing final result.

- [ ] **Step 3: Run optional Web publish check**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\open\uview-plus4" --platform Web --webTitle "uview-plus4"
```

Expected: Web build succeeds or fails only for pre-existing project configuration unrelated to this work; record the result.

- [ ] **Step 4: Update verification notes**

Append to `docs/uview-ultra-vue-runtime-gap.md`:

```markdown
## Final Verification

- Android compile command: `& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true`
- Android result: pass or recorded blocker with key error lines.
- Web command: `& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\open\uview-plus4" --platform Web --webTitle "uview-plus4"`
- Web result: pass, skipped, or recorded blocker with key error lines.
- Warnings: list warning lines that remain and whether they affect Vue runtime parity.
```

Replace each result line with the actual result before committing.

- [ ] **Step 5: Commit verification notes**

Run:

```powershell
git add -- docs/uview-ultra-vue-runtime-gap.md
git commit -m "记录uview-ultra Vue运行时验证结果" -m "记录Android和Web编译校验命令、结果与残留警告，作为本轮Vue运行时对齐验收依据。"
```

---

## Self-Review Checklist

- Spec coverage: Tasks cover baseline diff, entry utilities, i18n, dark theme runtime, component theme adaptation, mandatory root host, missing Vue components, types, and verification.
- Scope guard: No task modifies `pages/**` examples or rebuilds Vue examples.
- Root host: Task 4 makes root host mandatory and includes runtime APIs, fallback, easycom component, and types.
- Type consistency: Runtime method names are consistently `rootToast`, `setRootToastRef`, `rootNotify`, `setRootNotifyRef`, `setTheme`, `setThemePreference`, `getThemePreference`, `getSystemTheme`, `getThemeVars`, `getThemeTabBarStyle`, and `applyNativeThemeUI`.
- Verification: Every code batch ends with HBuilderX compile and a Chinese commit message with head and body.
