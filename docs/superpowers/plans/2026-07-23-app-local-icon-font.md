# App Local Icon Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port uview-plus #1044 App package-local built-in icon font loading into uview-ultra so App / App-nvue no longer request alicdn for default icons and users need no manual static copy.

**Architecture:** Ship `upicon.ttf` next to `up-icon`, resolve App font URL via `./upicon.ttf?url`, register through `uni.loadFontFace` / weex `addRule`, keep non-App remote `config.iconUrl` path, and export `fontUtil` for optional manual use. uvue keeps `/static/iconfont` local loading and is only lightly hardened if needed.

**Tech Stack:** uni-app Vue3, uni_modules, conditional compilation, `uni.loadFontFace`, weex `dom.addRule`, HBuilderX CLI.

## Global Constraints

- Scope is `uview-ultra` only; do not modify sibling `uview-plus` repo.
- Align behavior with `uview-plus` `3.8.82` / issue `#1044`.
- Preserve `up-*` naming and existing `up-icon` public props.
- App / App-nvue built-in font must be package-local; no alicdn request for default icons.
- Users must not need manual copy into business `/static` or mandatory App entry wiring for built-in icons.
- Do not introduce vite-plugin / postinstall font copy.
- Do not redesign `customIcon` hosting.
- After code changes, run at least one relevant HBuilderX CLI compile check per `AGEMTS.md`.
- User-visible change must update both `uni_modules/uview-ultra/changelog.md` and `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md`.
- Leave unrelated dirty worktree files untouched.

---

## File Structure

Create:

- `uni_modules/uview-ultra/components/up-icon/upicon.ttf` package-local built-in icon font copied from uview-plus

Modify:

- `uni_modules/uview-ultra/components/up-icon/util.js` App-local font resolution + platform load rules
- `uni_modules/uview-ultra/components/up-icon/up-icon.vue` remove remote App-nvue hardcode and restrict CSS `@font-face` platforms
- `uni_modules/uview-ultra/index.js` export `fontUtil`
- `uni_modules/uview-ultra/changelog.md` record user-visible fix
- `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md` sync user-visible fix

Optional only if verification proves needed:

- `uni_modules/uview-ultra/index.uts` auto-load guard polish
- `uni_modules/uview-ultra/components/up-icon/up-icon.uvue` component-side local load trigger

Do not modify:

- Sibling `D:\Repos\xyito\open\uview-plus\**`
- Business demo pages unless compile/smoke requires temporary local-only checks
- Font-family rename on uvue (`iconfont`)

---

### Task 1: Add package-local font and rewrite `util.js`

**Files:**
- Create: `uni_modules/uview-ultra/components/up-icon/upicon.ttf`
- Modify: `uni_modules/uview-ultra/components/up-icon/util.js`
- Reference: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components\u-icon\upicon.ttf`
- Reference: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components\u-icon\util.js`

**Interfaces:**
- Consumes: `config.iconUrl`, `config.customIcon`, `config.loadFontOnce`
- Produces:
  - default export `fontUtil = { params: { loaded: boolean }, loadFont: () => boolean }`
  - built-in family name `upicon-iconfont`
  - App/App-nvue source from `./upicon.ttf?url`

- [ ] **Step 1: Copy font asset byte-identically**

Run:

```powershell
$src = 'D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components\u-icon\upicon.ttf'
$dst = 'D:\Repos\xyito\open\uview-plus4\uni_modules\uview-ultra\components\up-icon\upicon.ttf'
Copy-Item -LiteralPath $src -Destination $dst -Force
Get-FileHash -Algorithm SHA256 $src, $dst | Format-Table Algorithm, Hash, Path -AutoSize
(Get-Item $dst).Length
```

Expected:

- both hashes identical
- size about `55940`

- [ ] **Step 2: Write static behavior checks for current util (fail before rewrite)**

Run inline baseline assertions:

```powershell
$util = Get-Content -Raw 'uni_modules/uview-ultra/components/up-icon/util.js'
if ($util -match "upicon\.ttf\?url") { throw 'already ported' }
if ($util -notmatch "config\.iconUrl") { throw 'unexpected util baseline' }
'baseline still remote-only: OK'
```

Expected: `baseline still remote-only: OK`

- [ ] **Step 3: Replace `util.js` with App-local implementation**

Write full file `uni_modules/uview-ultra/components/up-icon/util.js`:

```js
import config from '../../libs/config/config.js'
// #ifdef APP || APP-NVUE
import iconFontUrl from './upicon.ttf?url'
// #endif

const iconFontFamily = 'upicon-iconfont'

const params = {
	loaded: false
}

const getIconUrl = () => {
	// #ifdef APP || APP-NVUE
	return iconFontUrl
	// #endif
	return config.iconUrl
}

const markFontLoaded = () => {
	// App端使用包内本地字体，重复注册没有收益且会放大多图标页面开销。
	// #ifdef APP || APP-NVUE
	params.loaded = true
	return
	// #endif
	// 全局加载不稳定，默认关闭，需要开启可以配置 loadFontOnce。
	if (config.loadFontOnce) {
		params.loaded = true
	}
}

function loadFont() {
	const iconUrl = getIconUrl()
	markFontLoaded()
	// #ifdef APP-NVUE
	// nvue通过weex的dom模块引入字体，相关文档地址如下：
	// https://weex.apache.org/zh/docs/modules/dom.html#addrule
	const domModule = weex.requireModule('dom')
	domModule.addRule('fontFace', {
		'fontFamily': iconFontFamily,
		'src': `url('${iconUrl}')`
	})
	if (config.customIcon && config.customIcon.family) {
		domModule.addRule('fontFace', {
			'fontFamily': config.customIcon.family,
			'src': `url('${config.customIcon.url}')`
		})
	}
	// #endif
	// #ifdef APP || H5 || MP-WEIXIN || MP-ALIPAY
	if (typeof uni !== 'undefined' && typeof uni.loadFontFace === 'function') {
		uni.loadFontFace({
			global: true,
			family: iconFontFamily,
			source: 'url("' + iconUrl + '")',
			success() {},
			fail() {}
		})
		if (config.customIcon && config.customIcon.family) {
			uni.loadFontFace({
				global: true,
				family: config.customIcon.family,
				source: 'url("' + config.customIcon.url + '")',
				success() {},
				fail() {}
			})
		}
	}
	// #endif
	return true
}

export default {
	params,
	loadFont
}
```

Notes for implementer:

- Keep family as `upicon-iconfont` for uview-ultra Vue, not `uicon-iconfont`.
- Keep silent fail callbacks.
- Keep App always-once mark via `markFontLoaded`.

- [ ] **Step 4: Verify util source now points at local App font**

Run:

```powershell
$util = Get-Content -Raw 'uni_modules/uview-ultra/components/up-icon/util.js'
if ($util -notmatch "upicon\.ttf\?url") { throw 'missing local ttf?url import' }
if ($util -notmatch "upicon-iconfont") { throw 'missing ultra family name' }
if ($util -notmatch "loadFontOnce") { throw 'missing non-App once flag handling' }
if ($util -notmatch "customIcon") { throw 'missing custom icon support' }
'util local-font port checks: OK'
```

Expected: `util local-font port checks: OK`

- [ ] **Step 5: Commit**

```powershell
git add uni_modules/uview-ultra/components/up-icon/upicon.ttf uni_modules/uview-ultra/components/up-icon/util.js
git commit -m "fix(icon): load App built-in font from package-local ttf"
```

Commit body:

```text
Port uview-plus #1044 util path so App/App-nvue use upicon.ttf?url instead of alicdn.
```

---

### Task 2: Update `up-icon.vue` load path and `@font-face` platforms

**Files:**
- Modify: `uni_modules/uview-ultra/components/up-icon/up-icon.vue`
- Reference: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus\components\u-icon\u-icon.vue`

**Interfaces:**
- Consumes: `fontUtil.loadFont()`, `fontUtil.params.loaded`
- Produces: Vue icon component that auto-loads font and no longer hardcodes App-nvue remote font

- [ ] **Step 1: Remove App-nvue remote hardcode block**

In `up-icon.vue` script setup, delete this whole block:

```js
// #ifdef APP-NVUE
// nvue通过weex的dom模块引入字体，相关文档地址如下：
// https://weex.apache.org/zh/docs/modules/dom.html#addrule
const fontUrl = 'https://at.alicdn.com/t/font_2225171_8kdcwk4po24.ttf'
const domModule = weex.requireModule('dom')
domModule.addRule('fontFace', {
	'fontFamily': "upicon-iconfont",
	'src': `url('${fontUrl}')`
})
// #endif
```

Keep existing:

```js
import fontUtil from './util.js'
// ...
if (!fontUtil.params.loaded) {
	fontUtil.loadFont()
}
```

- [ ] **Step 2: Restrict CSS `@font-face` to non-App CSS-fallback platforms**

Replace style section font-face condition from:

```scss
/* #ifndef APP-NVUE */
// 非nvue下加载字体
@font-face {
	font-family: 'upicon-iconfont';
	src: url('https://at.alicdn.com/t/font_2225171_8kdcwk4po24.ttf') format('truetype');
}
/* #endif */
```

to:

```scss
/* #ifdef MP-QQ || MP-TOUTIAO || MP-BAIDU || MP-KUAISHOU || MP-XHS */
// App端通过 uni.loadFontFace 加载包内本地字体，避免远程字体阻塞页面渲染。
@font-face {
	font-family: 'upicon-iconfont';
	src: url('https://at.alicdn.com/t/font_2225171_8kdcwk4po24.ttf') format('truetype');
}
/* #endif */
```

Keep:

```scss
&__icon {
	font-family: upicon-iconfont;
}
```

- [ ] **Step 3: Verify no App remote hardcode remains in component**

Run:

```powershell
$vue = Get-Content -Raw 'uni_modules/uview-ultra/components/up-icon/up-icon.vue'
if ($vue -match "weex\.requireModule\('dom'\)") { throw 'App-nvue remote hardcode still present' }
if ($vue -notmatch "fontUtil\.loadFont\(\)") { throw 'auto loadFont missing' }
if ($vue -notmatch "MP-QQ \|\| MP-TOUTIAO \|\| MP-BAIDU \|\| MP-KUAISHOU \|\| MP-XHS") { throw 'font-face platform gate missing' }
if ($vue -match "#ifndef APP-NVUE[\s\S]*@font-face") { throw 'old non-nvue font-face gate still present' }
'up-icon.vue local-font checks: OK'
```

Expected: `up-icon.vue local-font checks: OK`

- [ ] **Step 4: Commit**

```powershell
git add uni_modules/uview-ultra/components/up-icon/up-icon.vue
git commit -m "fix(icon): stop App remote @font-face and nvue hardcode"
```

Commit body:

```text
Route App icon font registration through fontUtil local package path only.
```

---

### Task 3: Export `fontUtil` from Vue entry

**Files:**
- Modify: `uni_modules/uview-ultra/index.js`
- Optional modify: `uni_modules/uview-ultra/types/index.d.ts` only if export typing is already patterned nearby and easy to keep accurate

**Interfaces:**
- Consumes: `./components/up-icon/util.js` default export
- Produces: named export `fontUtil`

- [ ] **Step 1: Import and export fontUtil**

Near other utility imports in `index.js`, add:

```js
// fontUtil
import fontUtil from './components/up-icon/util.js'
```

Update the existing named export line from:

```js
export { route, http, debounce, throttle, calc, digit, platform, themeType, props, color, test, zIndex, i18n, t }
```

to:

```js
export { route, http, debounce, throttle, calc, digit, platform, themeType, props, color, test, zIndex, fontUtil, i18n, t }
```

Do not put `fontUtil` onto `uni.$u` unless already required elsewhere; named export parity with plus is enough.

- [ ] **Step 2: Verify export presence**

Run:

```powershell
$index = Get-Content -Raw 'uni_modules/uview-ultra/index.js'
if ($index -notmatch "import fontUtil from './components/up-icon/util.js'") { throw 'fontUtil import missing' }
if ($index -notmatch "fontUtil, i18n, t") { throw 'fontUtil named export missing' }
'index.js fontUtil export checks: OK'
```

Expected: `index.js fontUtil export checks: OK`

- [ ] **Step 3: Commit**

```powershell
git add uni_modules/uview-ultra/index.js
git commit -m "feat(icon): export fontUtil for optional manual font loading"
```

Commit body:

```text
Align Vue entry export surface with uview-plus for App local icon font control.
```

---

### Task 4: uvue local-load sanity (no forced `?url`)

**Files:**
- Review: `uni_modules/uview-ultra/index.uts`
- Review: `uni_modules/uview-ultra/components/up-icon/up-icon.uvue`
- Review: `App.uvue`
- Modify only if current path still requires mandatory business wiring beyond already-present demo `loadFont()` call

**Interfaces:**
- Consumes: existing `loadFont()` from `index.uts` using `/static/iconfont/iconfont.ttf`
- Produces: unchanged or minimally hardened auto-local load path; family remains `iconfont` on uvue

- [ ] **Step 1: Confirm current uvue local source**

Run:

```powershell
$uts = Get-Content -Raw 'uni_modules/uview-ultra/index.uts'
$app = Get-Content -Raw 'App.uvue'
if ($uts -notmatch "/static/iconfont/iconfont.ttf") { throw 'uvue loadFont missing local static path' }
if ($app -notmatch "loadFont\(\)") { throw 'demo App.uvue no longer calls loadFont' }
'uvue local path baseline: OK'
```

Expected: `uvue local path baseline: OK`

- [ ] **Step 2: Decide no-code or minimal guard**

Default decision from design: **no uvue code change** if local static path already works.

Only if compile/runtime shows first-screen icon missing without manual call, add component-side once-guard in `up-icon.uvue` setup:

```ts
// only if needed
import { loadFont } from '../../index.uts'
let iconFontLoaded = false
if (!iconFontLoaded) {
	loadFont()
	iconFontLoaded = true
}
```

Do **not** switch uvue to `ttf?url`.
Do **not** rename `font-family: iconfont`.

- [ ] **Step 3: Commit only if uvue files changed**

```powershell
git add uni_modules/uview-ultra/index.uts uni_modules/uview-ultra/components/up-icon/up-icon.uvue
git commit -m "fix(icon): harden uvue local icon font auto load"
```

Commit body if used:

```text
Keep static local font path and avoid requiring extra business App wiring.
```

If no uvue file changed, skip commit and note `uvue unchanged` in final summary.

---

### Task 5: Changelog sync and HBuilderX verification

**Files:**
- Modify: `uni_modules/uview-ultra/changelog.md`
- Modify: `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md`

- [ ] **Step 1: Add plugin changelog entry under current unreleased / next patch notes**

At top of `uni_modules/uview-ultra/changelog.md`, prepend:

```md
## 4.5.7
fix: App 端内置图标字体改为包内本地加载

- 同步 uview-plus #1044：App / App-nvue 内置 up-icon 字体改为从包内 `upicon.ttf` 加载，不再依赖 alicdn 网络请求
- 使用 `upicon.ttf?url` 由构建产物发射本地字体资源，配合 `uni.loadFontFace` / weex `addRule`，避免弱网阻塞页面渲染
- 无需手动拷贝到 static；Vue 入口导出 `fontUtil` 便于可选手动加载
```

If version number policy differs at implementation time, keep the same content under the active next version heading, but do not invent unrelated release notes.

- [ ] **Step 2: Sync doc4 timeline entry**

In `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md`, under the latest `4.5.X` / pending section list, add:

```html
<li>
	<span class="fix">修复</span>
	App 端内置图标字体改为包内本地加载（同步 uview-plus #1044）：up-icon 使用包内 upicon.ttf，避免 alicdn 弱网阻塞；无需手动拷贝 static
</li>
```

- [ ] **Step 3: Android compile verification**

Run device list:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" devices list --platform android
```

Then compile (replace device id if needed):

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true --pagePath "pages/componentsA/icon/icon"
```

If icon demo path differs, first resolve actual icon page path:

```powershell
Get-ChildItem -Path pages -Recurse -Filter *icon* | Select-Object FullName
```

Expected:

- no project-level compile `error`
- warnings only if pre-existing / unrelated; note them

Optional stronger check:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish app-android --project "D:\Repos\xyito\open\uview-plus4" --type appResource
```

- [ ] **Step 4: Source-level acceptance checks**

Run:

```powershell
$files = @(
  'uni_modules/uview-ultra/components/up-icon/util.js',
  'uni_modules/uview-ultra/components/up-icon/up-icon.vue',
  'uni_modules/uview-ultra/index.js'
)
$joined = ($files | ForEach-Object { Get-Content -Raw $_ }) -join "`n"
if ($joined -notmatch "upicon\.ttf\?url") { throw 'local ttf url missing' }
if ((Get-Content -Raw 'uni_modules/uview-ultra/components/up-icon/up-icon.vue') -match "weex\.requireModule\('dom'\)") { throw 'remote nvue hardcode remains' }
if ((Get-Content -Raw 'uni_modules/uview-ultra/index.js') -notmatch "fontUtil") { throw 'fontUtil export missing' }
if (-not (Test-Path 'uni_modules/uview-ultra/components/up-icon/upicon.ttf')) { throw 'font asset missing' }
'acceptance source checks: OK'
```

Expected: `acceptance source checks: OK`

Manual smoke if app launches:

1. open icon demo page
2. confirm built-in icons render
3. if network inspector available, confirm no default request to `at.alicdn.com` for built-in icon font on App

- [ ] **Step 5: Commit changelog / docs**

In uview-plus4:

```powershell
git add uni_modules/uview-ultra/changelog.md
git commit -m "docs: record App local icon font fix for #1044"
```

If doc4 is a separate git repo, commit there separately:

```powershell
Set-Location 'D:\Repos\xyito\open\uview-plus-doc4'
git add docs/components/changelog.md
git commit -m "docs: note App local icon font fix for uview-ultra #1044"
```

---

## Spec Coverage Self-Review

- Goal package-local App font: Task 1 + Task 2
- No manual static copy / no mandatory entry wiring for Vue built-in icons: Task 1 auto path + Task 2 component auto load + Task 3 optional export only
- Align uview-plus #1044 / 3.8.82: Tasks 1-3 mirror plus util/export/font-face gates
- Keep non-App remote strategy: Task 1 `config.iconUrl` + Task 2 mini-program CSS fallback
- customIcon preserved: Task 1 load rules
- uvue static path retained / no forced `?url`: Task 4
- changelog + HBuilderX verification: Task 5
- No vite-plugin / no uview-plus repo edits: Global Constraints + File Structure

## Placeholder / Consistency Self-Review

- No TBD/TODO left
- Family name consistently `upicon-iconfont` on Vue path
- Export name consistently `fontUtil`
- Font file name consistently `upicon.ttf`