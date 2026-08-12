# Novel Reader Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将同级 `uview-plus` 的成熟小说阅读器移植到 `uview-plus4`，同时覆盖 Vue 与 uni-app x/UTS 运行链路。

**Architecture:** 在 `uni_modules/uview-ultra/components/up-novel-reader/` 中维护同一公开契约的 `.vue` 与 `.uvue` 组件。Vue 端使用 `.js` 纯逻辑模块，UTS 端使用等价的 `.uts` 纯逻辑模块；两端共享 props、事件、插槽、class 和状态字段，但不跨语言强行复用实现。

**Tech Stack:** Vue 3 Composition API、uni-app x UTS、SCSS、uni storage API、HBuilderX CLI、Node.js 静态校验脚本。

## Global Constraints

- 公共组件名称固定为 `up-novel-reader`，easycom 继续使用 `^up-(.*)` 映射到 `uni_modules/uview-ultra/components/up-$1/up-$1.uvue`。
- 必须同时提供 `.vue` 与 `.uvue`，两端保持同一 props、事件、插槽、class 和核心行为。
- 章节请求由业务通过 `chapter-request` 与 `chapter-prefetch` 事件处理；组件不请求网络、不实现鉴权或付费逻辑。
- `currentChapter.content` 支持字符串和字符串数组，内部统一转换为段落数组。
- `mode` 只接受 `scroll` 和 `page`；默认值为 `scroll`。
- 内置主题固定为 `day`、`paper`、`green`、`night`、`dark`，主题变量必须局部隔离。
- 本仓库 `package.json` 未配置 `npm run dev`，不要使用 npm 脚本启动；统一使用 `C:\ProgramData\HBuilderX\cli.exe` 做平台编译。
- 每次代码修改后，至少执行一次对应平台的 HBuilderX CLI 编译或运行校验。
- 用户可感知的功能、API、样式和文档变更必须同步 `uni_modules/uview-ultra/changelog.md` 与 `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md`。
- 本次不 bump 版本号、不发布、不修改无关组件、不覆盖已有未提交改动。

---

## File Map

**Component and logic files**

- Create: `uni_modules/uview-ultra/components/up-novel-reader/up-novel-reader.vue` — Vue 主容器、状态组合、事件转发和弹层。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/up-novel-reader.uvue` — UTS 主容器、显式类型和 App 运行适配。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-content.vue` — Vue 正文、滚动和分页视图。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-content.uvue` — UTS 正文、滚动和分页视图。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-toolbar.vue` — Vue 顶部/底部工具栏。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-toolbar.uvue` — UTS 顶部/底部工具栏。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-catalog.vue` — Vue 目录和书签面板。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-catalog.uvue` — UTS 目录和书签面板。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-settings.vue` — Vue 阅读设置面板。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-settings.uvue` — UTS 阅读设置面板。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/theme-vars.scss` — 阅读器局部主题变量。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/novelReader.js` — Vue 默认配置。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/novelReader.uts` — UTS 默认配置。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/props.js` — Vue props 定义。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/props.uts` — UTS props 定义。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.js` — Vue 正文和进度归一化。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.uts` — UTS 正文和进度归一化。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-core.js` — Vue 设置、书签、活跃阅读状态。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-core.uts` — UTS 设置、书签、活跃阅读状态。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/persistence.js` — Vue 版本化持久化。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/persistence.uts` — UTS 版本化持久化。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.js` — Vue 文本和容器测量。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.uts` — UTS 文本和容器测量。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/layout-engine.js` — Vue 分页引擎。
- Create: `uni_modules/uview-ultra/components/up-novel-reader/layout-engine.uts` — UTS 分页引擎。

**Registry, scripts, and example**

- Modify: `uni_modules/uview-ultra/libs/config/props.js` — 注册 Vue 全局 `novelReader` 默认配置。
- Modify: `uni_modules/uview-ultra/libs/config/props.uts` — 注册 UTS 默认配置。
- Modify: `package.json` — 添加小说阅读器静态校验脚本。
- Create: `scripts/verify-novel-reader-props.mjs` — 默认参数、注册和公开 API 校验。
- Create: `scripts/verify-novel-reader-data.mjs` — 正文、进度、状态和持久化契约校验。
- Create: `scripts/verify-novel-reader-layout.mjs` — 测量、换行、分页和锚点校验。
- Create: `scripts/verify-novel-reader-ui.mjs` — 双端模板、主题、工具栏、弹层和事件校验。
- Create: `pages/componentsD/novelReader/novelReader.uvue` — 可运行示例页。
- Modify: `pages.json` — 注册示例页。

**Documentation**

- Create: `D:\Repos\xyito\open\uview-plus-doc4\docs\components\novelReader.md` — 组件说明、API、事件、插槽和示例。
- Modify: `D:\Repos\xyito\open\uview-plus-doc4\docs\.vitepress\config.mjs` — 加入组件导航。
- Modify: `uni_modules/uview-ultra/changelog.md` — 记录源码插件变更。
- Modify: `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md` — 记录重大用户可感知变更。

---

### Task 1: Define Public Contract and Defaults

**Files:**
- Create: `uni_modules/uview-ultra/components/up-novel-reader/novelReader.js`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/novelReader.uts`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/props.js`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/props.uts`
- Modify: `uni_modules/uview-ultra/libs/config/props.js`
- Modify: `uni_modules/uview-ultra/libs/config/props.uts`
- Create: `scripts/verify-novel-reader-props.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `novelReader` defaults consumed by both main components.
- Produces Vue `props` and UTS `propsNovelReader` with the same 19 public props.
- Produces `package.json` script `verify:novel-reader-props`.

- [ ] **Step 1: Write the failing contract check**

Create `scripts/verify-novel-reader-props.mjs` with these assertions:

```js
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const componentDir = resolve(root, 'uni_modules/uview-ultra/components/up-novel-reader')
const packageJson = JSON.parse(read('package.json'))

assert.equal(packageJson.scripts['verify:novel-reader-props'], 'node scripts/verify-novel-reader-props.mjs')
for (const fileName of ['novelReader.js', 'novelReader.uts', 'props.js', 'props.uts']) {
    assert.equal(existsSync(resolve(componentDir, fileName)), true, `${fileName} should exist`)
}

const defaultsJs = read('uni_modules/uview-ultra/components/up-novel-reader/novelReader.js')
const defaultsUts = read('uni_modules/uview-ultra/components/up-novel-reader/novelReader.uts')
const propsJs = read('uni_modules/uview-ultra/components/up-novel-reader/props.js')
const propsUts = read('uni_modules/uview-ultra/components/up-novel-reader/props.uts')
const registryJs = read('uni_modules/uview-ultra/libs/config/props.js')
const registryUts = read('uni_modules/uview-ultra/libs/config/props.uts')

for (const source of [defaultsJs, defaultsUts]) {
    for (const field of [
        'chapters', 'currentChapter', 'loading', 'error', 'bookId', 'storageKey',
        'persist', 'initialProgress', 'progress', 'initialBookmarks', 'bookmarks',
        'defaultSettings', 'settings', 'mode', 'showBack', 'autoBack', 'backIcon',
        'safeAreaInsetTop', 'safeAreaInsetBottom', 'preloadThreshold', 'pageAnimation',
        'controlsAutoHide'
    ]) {
        assert.match(source, new RegExp(field), `${field} should be in defaults`)
    }
    for (const theme of ['day', 'paper', 'green', 'night', 'dark']) {
        assert.match(source, new RegExp(theme), `${theme} should be in default settings`)
    }
}

assert.match(propsJs, /defineMixin/)
assert.match(propsUts, /defineMixin/)
assert.match(registryJs, /novelReader/)
assert.match(registryUts, /novelReader/)
console.log('novel reader props assertions passed')
```

- [ ] **Step 2: Run the check and verify it fails**

Run:

```powershell
node scripts/verify-novel-reader-props.mjs
```

Expected: FAIL because the component directory and package script do not exist.

- [ ] **Step 3: Implement identical default objects**

Use this exact default shape in both `novelReader.js` and `novelReader.uts`:

```js
{
    chapters: [],
    currentChapter: null,
    loading: false,
    error: null,
    bookId: '',
    storageKey: '',
    persist: true,
    initialProgress: null,
    progress: null,
    initialBookmarks: [],
    bookmarks: null,
    defaultSettings: {
        theme: 'day',
        fontSize: 18,
        lineHeight: 1.8,
        paragraphSpacing: 16,
        contentWidth: '92%',
        fontFamily: 'system',
        fontWeight: 400,
        animation: true
    },
    settings: null,
    mode: 'scroll',
    showBack: true,
    autoBack: false,
    backIcon: 'arrow-left',
    safeAreaInsetTop: true,
    safeAreaInsetBottom: true,
    preloadThreshold: 2,
    pageAnimation: true,
    controlsAutoHide: 0
}
```

Export the Vue object as default `novelReader`; export the UTS object as default `novelReader` with `as UTSJSONObject`.

- [ ] **Step 4: Implement both props modules and registries**

The Vue module must import `defineMixin` from `../../libs/vue.js`, import the registered defaults, and expose every field with the matching constructor:

```js
export const props = defineMixin({
    props: {
        chapters: { type: Array, default: () => defProps.novelReader.chapters },
        currentChapter: { type: Object, default: () => defProps.novelReader.currentChapter },
        loading: { type: Boolean, default: () => defProps.novelReader.loading },
        error: { type: Object, default: () => defProps.novelReader.error },
        bookId: { type: [String, Number], default: () => defProps.novelReader.bookId },
        storageKey: { type: String, default: () => defProps.novelReader.storageKey },
        persist: { type: Boolean, default: () => defProps.novelReader.persist },
        initialProgress: { type: Object, default: () => defProps.novelReader.initialProgress },
        progress: { type: Object, default: () => defProps.novelReader.progress },
        initialBookmarks: { type: Array, default: () => defProps.novelReader.initialBookmarks },
        bookmarks: { type: Array, default: () => defProps.novelReader.bookmarks },
        defaultSettings: { type: Object, default: () => ({ ...defProps.novelReader.defaultSettings }) },
        settings: { type: Object, default: () => defProps.novelReader.settings },
        mode: { type: String, default: () => defProps.novelReader.mode },
        showBack: { type: Boolean, default: () => defProps.novelReader.showBack },
        autoBack: { type: Boolean, default: () => defProps.novelReader.autoBack },
        backIcon: { type: String, default: () => defProps.novelReader.backIcon },
        safeAreaInsetTop: { type: Boolean, default: () => defProps.novelReader.safeAreaInsetTop },
        safeAreaInsetBottom: { type: Boolean, default: () => defProps.novelReader.safeAreaInsetBottom },
        preloadThreshold: { type: Number, default: () => defProps.novelReader.preloadThreshold },
        pageAnimation: { type: Boolean, default: () => defProps.novelReader.pageAnimation },
        controlsAutoHide: { type: Number, default: () => defProps.novelReader.controlsAutoHide }
    }
})
```

The UTS module must use `../../libs/vue.uts`, `UTSJSONObject` defaults, and the same property names. Add `novelReader` to both global registries without changing other entries.

- [ ] **Step 5: Run the focused check**

Run:

```powershell
node scripts/verify-novel-reader-props.mjs
git diff --check
```

Expected: both commands succeed, with no unrelated diff.

---

### Task 2: Implement Content, State, and Persistence Logic

**Files:**
- Create: `uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.js`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.uts`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-core.js`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-core.uts`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/persistence.js`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/persistence.uts`
- Create: `scripts/verify-novel-reader-data.mjs`
- Modify: `package.json`

**Interfaces:**
- `normalizeContent(content)` returns `{ paragraphs, text, length }`; each paragraph contains `index`, `text`, `startOffset`, `endOffset`.
- `normalizeProgress(progress, chapter)` returns `chapterId`, `chapterIndex`, `pageIndex`, `pageCount`, `charOffset`, `chapterProgress`, `totalProgress`, `scrollTop`, and `updatedAt`.
- `mergeReaderSettings(sources)` clamps `fontSize` to `12..48`, `lineHeight` to `1..3`, `paragraphSpacing` to `0..80`, accepts numeric/string `contentWidth`, normalizes `fontWeight` to `400/600`, and keeps `animation !== false`.
- `normalizeMode(mode)` returns only `scroll` or `page`.
- `createBookmark(fields)` returns an ID of `${chapterId}:${charOffset}` and non-negative offsets.
- `toggleBookmark(bookmarks, bookmark)` adds or removes by bookmark ID.
- `createStorageKey(storageKey, bookId)` returns the explicit key or `uview-ultra:novel-reader:${bookId}`.
- `readPersistedState(key)` returns a version-1 state or `null`; invalid state is removed.
- `writePersistedState(key, state)` returns `true` only after a successful `uni.setStorageSync`.

- [ ] **Step 1: Write the failing data contract check**

Create `scripts/verify-novel-reader-data.mjs` that checks the exact exports and invariants:

```js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const normalizerJs = read('uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.js')
const normalizerUts = read('uni_modules/uview-ultra/components/up-novel-reader/content-normalizer.uts')
const coreJs = read('uni_modules/uview-ultra/components/up-novel-reader/reader-core.js')
const coreUts = read('uni_modules/uview-ultra/components/up-novel-reader/reader-core.uts')
const persistenceJs = read('uni_modules/uview-ultra/components/up-novel-reader/persistence.js')
const persistenceUts = read('uni_modules/uview-ultra/components/up-novel-reader/persistence.uts')
const packageJson = JSON.parse(read('package.json'))

assert.equal(packageJson.scripts['verify:novel-reader-data'], 'node scripts/verify-novel-reader-data.mjs')
for (const source of [normalizerJs, normalizerUts]) {
    assert.match(source, /normalizeContent/)
    assert.match(source, /normalizeProgress/)
    assert.match(source, /startOffset/)
    assert.match(source, /endOffset/)
}
for (const source of [coreJs, coreUts]) {
    for (const name of [
        'mergeReaderSettings', 'normalizeMode', 'setProgress', 'toggleBookmark',
        'createBookmark', 'startReading', 'pauseReading', 'consumeReadingTime'
    ]) {
        assert.match(source, new RegExp(name))
    }
    assert.match(source, /fontSize/)
    assert.match(source, /paragraphSpacing/)
}
for (const source of [persistenceJs, persistenceUts]) {
    assert.match(source, /STORAGE_VERSION/)
    assert.match(source, /DEFAULT_STORAGE_PREFIX/)
    assert.match(source, /createStorageKey/)
    assert.match(source, /readPersistedState/)
    assert.match(source, /writePersistedState/)
    assert.match(source, /removeStorageSync/)
}
console.log('novel reader data assertions passed')
```

- [ ] **Step 2: Run the check and verify it fails**

Run:

```powershell
node scripts/verify-novel-reader-data.mjs
```

Expected: FAIL because the six logic modules and package script are absent.

- [ ] **Step 3: Implement Vue logic modules**

Implement the source behavior in `.js` files with these concrete rules:

```js
const LINE_BREAK_PATTERN = /\r\n|\r|\n/
const DEFAULT_READER_SETTINGS = {
    theme: 'day',
    fontSize: 18,
    lineHeight: 1.8,
    paragraphSpacing: 16,
    contentWidth: '92%',
    fontFamily: 'system',
    fontWeight: 400,
    animation: true
}
export function normalizeContent(content) {}
export function normalizeProgress(progress, chapter) {}
export function mergeReaderSettings(...sources) {}
export function normalizeMode(mode) {}
export function createBookmark({ chapterId, chapterIndex, charOffset, pageIndex, scrollTop, excerpt, createdAt } = {}) {}
export function toggleBookmark(bookmarks, bookmark) {}
export function startReading(state, timestamp = Date.now()) {}
export function pauseReading(state, timestamp = Date.now()) {}
export function consumeReadingTime(state, timestamp = Date.now()) {}
```

`normalizeContent` must split both array items and embedded newlines, join normalized text using `\n`, and return an empty result for whitespace-free empty content. `normalizeProgress` must clamp `charOffset` to the current content length and calculate `chapterProgress` from that length.

Persistence must use `STORAGE_VERSION = 1`, `DEFAULT_STORAGE_PREFIX = 'uview-ultra:novel-reader:'`, reject negative numeric fields and progress outside `0..1`, and delete invalid storage records with `uni.removeStorageSync`.

- [ ] **Step 4: Implement typed UTS equivalents**

Implement `.uts` modules with explicit signatures and no dynamic Vue-only helpers:

```ts
export function normalizeContent(content: any): UTSJSONObject
export function normalizeProgress(progress: UTSJSONObject | null, chapter: UTSJSONObject | null): UTSJSONObject
export function mergeReaderSettings(sources: Array<UTSJSONObject | null>): UTSJSONObject
export function normalizeMode(mode: String): String
export function createBookmark(fields: UTSJSONObject): UTSJSONObject
export function toggleBookmark(bookmarks: Array<UTSJSONObject>, bookmark: UTSJSONObject): Array<UTSJSONObject>
export function createStorageKey(storageKey: String, bookId: any): String
export function readPersistedState(key: String): UTSJSONObject | null
export function writePersistedState(key: String, state: UTSJSONObject): Boolean
```

Use `uni.getStorageSync`, `uni.setStorageSync`, and `uni.removeStorageSync`; return `null`/`false` rather than throwing when storage is unavailable or malformed.

- [ ] **Step 5: Run the data check**

Run:

```powershell
node scripts/verify-novel-reader-data.mjs
git diff --check
```

Expected: both commands succeed. The check must cover both `.js` and `.uts` source files.

---

### Task 3: Implement Measurement and Pagination

**Files:**
- Create: `uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.js`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.uts`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/layout-engine.js`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/layout-engine.uts`
- Create: `scripts/verify-novel-reader-layout.mjs`
- Modify: `package.json`

**Interfaces:**
- `measureTextWidth(text, style, measureText)` returns a number.
- `createMeasureText(options)` returns `(text) => number`.
- `measureContainer(selector, vmOrInstance)` resolves a bounding rectangle or `null`.
- `createLayoutKey({ chapterId, settings, width, height })` returns a deterministic JSON key.
- `wrapText(text, width, measureText)` returns line objects with `text`, `startOffset`, and `endOffset`.
- `paginateParagraphs(paragraphs, layout)` returns `{ pages, pageCount, charOffsetToPage }`.
- `resolveAnchor(pages, charOffset)` returns `{ pageIndex, localOffset }`.

- [ ] **Step 1: Write the failing layout check**

Create `scripts/verify-novel-reader-layout.mjs`:

```js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const layoutJs = read('uni_modules/uview-ultra/components/up-novel-reader/layout-engine.js')
const layoutUts = read('uni_modules/uview-ultra/components/up-novel-reader/layout-engine.uts')
const measureJs = read('uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.js')
const measureUts = read('uni_modules/uview-ultra/components/up-novel-reader/measure-adapter.uts')
const packageJson = JSON.parse(read('package.json'))

assert.equal(packageJson.scripts['verify:novel-reader-layout'], 'node scripts/verify-novel-reader-layout.mjs')
for (const source of [layoutJs, layoutUts]) {
    for (const name of ['createLayoutKey', 'wrapText', 'paginateParagraphs', 'resolveAnchor']) {
        assert.match(source, new RegExp(name))
    }
    assert.match(source, /startOffset/)
    assert.match(source, /endOffset/)
    assert.match(source, /pageCount/)
    assert.match(source, /charOffsetToPage/)
}
for (const source of [measureJs, measureUts]) {
    assert.match(source, /measureTextWidth/)
    assert.match(source, /createMeasureText/)
    assert.match(source, /measureContainer/)
}
console.log('novel reader layout assertions passed')
```

- [ ] **Step 2: Run the check and verify it fails**

Run:

```powershell
node scripts/verify-novel-reader-layout.mjs
```

Expected: FAIL because the layout and measurement modules are absent.

- [ ] **Step 3: Implement deterministic measurement**

Use the following fallback widths when no platform text measurer is available:

```js
function getCharacterWidth(character, fontSize) {
    if (/[\u3400-\u9fff\u3040-\u30ff\uff00-\uffef]/.test(character)) return fontSize
    if (/\s/.test(character)) return fontSize * 0.28
    return fontSize * 0.56
}
```

Prefer a supplied `measureText` callback, then a canvas context, then the fallback. `measureContainer` must resolve `null` when `uni.createSelectorQuery` is unavailable.

- [ ] **Step 4: Implement line wrapping, pagination, and anchor restoration**

Tokenize CJK characters and whitespace separately, split over-wide tokens into characters, keep each line’s UTF-16 offsets, and paginate by `layout.height` using the resolved line height:

```js
export function paginateParagraphs(paragraphs = [], layout = {}) {
    const width = Math.max(1, Number(layout.width) || 320)
    const height = Math.max(1, Number(layout.height) || 500)
    const lineHeight = Math.max(1, getLineHeight(layout))
    const paragraphSpacing = Math.max(0, Number(layout.paragraphSpacing) || 0)
    // produce pages: [{ index, text, lines, startOffset, endOffset }]
    // return { pages, pageCount: pages.length, charOffsetToPage }
}
```

`resolveAnchor` must return page `0` for empty pages, clamp negative offsets to zero, and use the final page when the requested offset exceeds the document.

- [ ] **Step 5: Run the layout check**

Run:

```powershell
node scripts/verify-novel-reader-layout.mjs
git diff --check
```

Expected: both commands succeed.

---

### Task 4: Build the Vue Reader UI

**Files:**
- Create: `uni_modules/uview-ultra/components/up-novel-reader/up-novel-reader.vue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-content.vue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-toolbar.vue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-catalog.vue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-settings.vue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/theme-vars.scss`
- Create: `scripts/verify-novel-reader-ui.mjs`
- Modify: `package.json`

**Interfaces:**
- `up-novel-reader.vue` consumes the Vue `props` module and emits the 11 public events.
- `reader-content.vue` emits `content-scroll`, `page-change`, `tap-zone`, and `retry`.
- `reader-toolbar.vue` emits `back`, `toggle-catalog`, `toggle-settings`, `toggle-bookmark`, `previous`, `next`, and `toggle-controls`.
- `reader-catalog.vue` emits `chapter-select` and `bookmark-select`.
- `reader-settings.vue` emits `update-settings` and `close`.

- [ ] **Step 1: Write the failing UI contract check**

Create `scripts/verify-novel-reader-ui.mjs` with assertions for both Vue and UTS files:

```js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = filePath => readFileSync(resolve(root, filePath), 'utf8')
const dir = 'uni_modules/uview-ultra/components/up-novel-reader'
const packageJson = JSON.parse(read('package.json'))

assert.equal(packageJson.scripts['verify:novel-reader-ui'], 'node scripts/verify-novel-reader-ui.mjs')
for (const suffix of ['vue', 'uvue']) {
    const main = read(`${dir}/up-novel-reader.${suffix}`)
    const content = read(`${dir}/reader-content.${suffix}`)
    const toolbar = read(`${dir}/reader-toolbar.${suffix}`)
    const catalog = read(`${dir}/reader-catalog.${suffix}`)
    const settings = read(`${dir}/reader-settings.${suffix}`)
    assert.match(main, /up-novel-reader/)
    for (const event of [
        'chapter-request', 'chapter-prefetch', 'progress-change', 'settings-change',
        'bookmark-change', 'reading-time-change', 'mode-change', 'toolbar-change',
        'layout-ready', 'retry', 'back'
    ]) assert.match(main, new RegExp(event))
    assert.match(content, /scroll-view/)
    assert.match(content, /swiper/)
    assert.match(toolbar, /arrow-left/)
    assert.match(toolbar, /setting/)
    assert.match(catalog, /chapter-select/)
    assert.match(settings, /fontSize/)
    assert.match(settings, /paragraphSpacing/)
}
for (const theme of ['day', 'paper', 'green', 'night', 'dark']) {
    assert.match(read(`${dir}/theme-vars.scss`), new RegExp(theme))
}
console.log('novel reader UI assertions passed')
```

- [ ] **Step 2: Run the check and verify it fails**

Run:

```powershell
node scripts/verify-novel-reader-ui.mjs
```

Expected: FAIL because the Vue UI files and package script are absent.

- [ ] **Step 3: Implement the Vue content and toolbar**

`reader-content.vue` must render loading, error, empty, scroll, and page states. The page state must use `swiper` and forward its current index; the scroll state must use `scroll-view` with `scroll-top`. The center tap zone must calculate `left`, `center`, or `right`.

`reader-toolbar.vue` must render:

```text
Top: back icon, chapter title, catalog, bookmark, toolbar-extra, close
Bottom: chapter/percent progress, previous, next, settings, bottom slot
```

Use existing `up-icon` names only; do not use emoji. Disabled previous/next buttons must remain visible with the disabled color.

- [ ] **Step 4: Implement the Vue main state container**

Use `commonProps` and `useUltraUI` from `../../libs/composable/useUltraUI.js`. Register child components locally and expose `name: 'up-novel-reader'`.

Implement these methods with the listed responsibilities:

```js
initializeReaderState()
refreshContent()
refreshLayout()
handleContentScroll(event)
handlePageChange(payload)
handleTapZone(zone)
requestChapter(direction, targetIndex, targetId)
handleChapterSelect(chapter)
handleBookmarkSelect(bookmark)
toggleBookmark()
handleSettingsUpdate(settings)
handleBack()
handleRetry()
queuePersist()
flushPersistence()
pauseReading()
```

The main template must place `up-status-bar` only inside the visible top toolbar and `up-safe-bottom` only inside the visible bottom toolbar. Catalog and settings must be wrapped by `up-popup`; the child panels must not create nested popups.

Use `mergeReaderSettings`, `normalizeMode`, `normalizeContent`, `normalizeProgress`, `paginateParagraphs`, `resolveAnchor`, `createBookmark`, `createStorageKey`, `readPersistedState`, and `writePersistedState` from Tasks 2 and 3. Emit `mode-change` when the resolved mode changes and `toolbar-change` whenever `controlsVisible` changes.

- [ ] **Step 5: Implement the Vue catalog, settings, and scoped theme**

The catalog must show chapter index/title, current chapter, lock state, bookmarks, empty state, and emit the selected target. The settings panel must expose:

```text
theme, fontSize, lineHeight, paragraphSpacing, contentWidth,
fontFamily, fontWeight, animation
```

Use existing `up-slider` for numeric settings and `up-switch` for `fontWeight`/`animation` controls. Use `up-popup` only in the main component. Keep all colors behind `--up-novel-reader-*` variables.

- [ ] **Step 6: Run UI and source checks**

Run:

```powershell
node scripts/verify-novel-reader-ui.mjs
node scripts/verify-novel-reader-props.mjs
node scripts/verify-novel-reader-data.mjs
node scripts/verify-novel-reader-layout.mjs
git diff --check
```

Expected: all four scripts pass and no whitespace errors are reported.

---

### Task 5: Build the UTS Reader UI

**Files:**
- Create: `uni_modules/uview-ultra/components/up-novel-reader/up-novel-reader.uvue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-content.uvue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-toolbar.uvue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-catalog.uvue`
- Create: `uni_modules/uview-ultra/components/up-novel-reader/reader-settings.uvue`

**Interfaces:**
- UTS component names, props, emits, slots, and CSS class names match the Vue files from Task 4.
- The UTS main component consumes `propsNovelReader`, `reader-core.uts`, `content-normalizer.uts`, `layout-engine.uts`, and `persistence.uts`.
- UTS events use the same payload keys as the Vue implementation.

- [ ] **Step 1: Implement typed UTS child components**

Use `<script setup lang="uts">`, `defineOptions({ styleIsolation: 'app-and-page', name: 'up-novel-reader' })`, explicit `ref`/`computed` types, and `defineEmits`.

The child components must use only tags and props supported by the target package:

```text
view, text, scroll-view, swiper, swiper-item,
up-icon, up-slider, up-switch
```

Avoid `Object.keys`-driven template loops for typed settings and avoid dynamic component names. Preserve named slots `top`, `toolbar-extra`, `bottom`, `catalog`, `settings`, `loading`, `error`, and `empty`.

- [ ] **Step 2: Implement the typed UTS main state container**

Use:

```ts
const props = defineProps({
    chapters: { type: Array, default: () => defaults['chapters'] },
    currentChapter: { type: UTSJSONObject, default: null },
    loading: { type: Boolean, default: false },
    error: { type: UTSJSONObject, default: null },
    mode: { type: String, default: 'scroll' }
})

const emit = defineEmits([
    'chapter-request', 'chapter-prefetch', 'progress-change',
    'settings-change', 'bookmark-change', 'reading-time-change',
    'back', 'mode-change', 'toolbar-change', 'layout-ready', 'retry'
])
```

Expand the remaining props to match Task 1, and use typed helper functions instead of spreading untyped objects. Use `onMounted` to measure and lay out the reader, `uni.onWindowResize` to refresh layout, and `onBeforeUnmount` to pause reading, flush storage, clear timers, and unregister the resize callback.

- [ ] **Step 3: Implement UTS event and storage parity**

Ensure these paths produce identical payload keys:

```text
scroll-view @scroll -> progress-change
swiper @change -> pageIndex and progress-change
center tap -> toolbar-change
previous/next/catalog -> chapter-request
near end -> chapter-prefetch
settings update -> settings-change
bookmark toggle -> bookmark-change
retry action -> retry
```

Use `UTSJSONObject.assign` or explicit object construction for payloads; do not mutate a prop object when updating local settings, progress, or bookmarks.

- [ ] **Step 4: Run static parity checks**

Run:

```powershell
node scripts/verify-novel-reader-ui.mjs
node scripts/verify-novel-reader-props.mjs
node scripts/verify-novel-reader-data.mjs
node scripts/verify-novel-reader-layout.mjs
git diff --check
```

Expected: all checks pass for both `.vue` and `.uvue` source.

- [ ] **Step 5: Compile the changed UTS components**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\open\uview-plus4" --platform Web --webTitle "uview-plus4"
```

Expected: H5 compilation completes without a new error in any `up-novel-reader` file. If compilation fails, fix only the reported reader issue and rerun the command.

---

### Task 6: Add the Example Page and Route

**Files:**
- Create: `pages/componentsD/novelReader/novelReader.uvue`
- Modify: `pages.json`

**Interfaces:**
- Example page demonstrates controlled `chapters` and `currentChapter`.
- Example page implements `chapter-request` by switching among local sample chapters.
- Example page exposes reset persistence and mode/theme/settings interactions.

- [ ] **Step 1: Add the route entry**

Insert this page after the existing `pdfReader/pdfReader` entry in the `pages/componentsD` group:

```json
{
    "path": "novelReader/novelReader",
    "style": {
        "navigationBarTitleText": "NovelReader小说阅读器"
    }
}
```

- [ ] **Step 2: Implement deterministic local demo data**

The demo must define at least six local chapters with stable IDs and indexes:

```ts
const chapters = ref<Array<UTSJSONObject>>([
    { id: 'demo-1', index: 0, title: '第一章 初见', isLocked: false },
    { id: 'demo-2', index: 1, title: '第二章 夜行', isLocked: false },
    { id: 'demo-3', index: 2, title: '第三章 回声', isLocked: false },
    { id: 'demo-4', index: 3, title: '第四章 雨幕', isLocked: false },
    { id: 'demo-5', index: 4, title: '第五章 远方', isLocked: false },
    { id: 'demo-6', index: 5, title: '第六章 新程', isLocked: false }
])
```

Provide local content for every chapter, use `bookId: 'demo-novel'`, and update `currentChapter` only after selecting a target chapter. The page must not make network requests.

- [ ] **Step 3: Wire reader events**

Handle at minimum:

```text
chapter-request -> resolve target index -> assign currentChapter
settings-change -> display current setting summary
progress-change -> display current chapter percentage
bookmark-change -> display bookmark count
mode-change -> display scroll/page mode
back -> call uni.navigateBack only when the page was opened from another page
```

Add a reset action that calls `uni.removeStorageSync('uview-ultra:novel-reader:demo-novel')` and restores the first chapter.

- [ ] **Step 4: Run route and static checks**

Run:

```powershell
node scripts/verify-novel-reader-ui.mjs
& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\open\uview-plus4" --platform Web --webTitle "uview-plus4"
```

Expected: the route is included in the build and the example page compiles without new errors.

---

### Task 7: Write Component Documentation and Changelogs

**Files:**
- Create: `D:\Repos\xyito\open\uview-plus-doc4\docs\components\novelReader.md`
- Modify: `D:\Repos\xyito\open\uview-plus-doc4\docs\.vitepress\config.mjs`
- Modify: `uni_modules/uview-ultra/changelog.md`
- Modify: `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md`

**Interfaces:**
- Documentation uses the demo URL `/pages/componentsD/novelReader/novelReader`.
- Documentation names the component `up-novel-reader`, not `u-novel-reader`.
- Documentation lists every prop, event payload, slot, theme, persistence rule, and chapter shape from the approved design.

- [ ] **Step 1: Create the documentation page**

Use the existing component page format and include these sections in order:

```text
小说阅读器
基础使用
章节数据
Props
事件
插槽
阅读设置
目录、书签与持久化
纵向滚动与横向分页
示例源码链接
```

The first lines must include:

```md
## 小说阅读器 <to-api/>

<demo-model url="/pages/componentsD/novelReader/novelReader"></demo-model>
```

Use `<up-novel-reader>` in all examples and document the `chapter-request` handler as business-owned loading.

- [ ] **Step 2: Add documentation navigation**

Locate the existing `pdfReader` component entry in `docs/.vitepress/config.mjs` and add `/components/novelReader` immediately after it. Do not reorder unrelated components.

- [ ] **Step 3: Update both changelogs**

Prepend a pending-development entry to `uni_modules/uview-ultra/changelog.md` using the existing `feat:` format, and add a front timeline item to `docs/components/changelog.md` using `<span class="add">新增</span>`. Record:

```text
新增 up-novel-reader 小说阅读器组件
支持 scroll/page 双模式、目录、设置、主题、书签、进度恢复、阅读时长和安全区
Vue 与 UVue 保持同一公开 API
```

Do not add a version number because this task does not publish a release.

- [ ] **Step 4: Check documentation diffs**

Run:

```powershell
git -C "D:\Repos\xyito\open\uview-plus-doc4" diff --check
git -C "D:\Repos\xyito\open\uview-plus-doc4" status --short
git diff --check
```

Expected: only the new reader documentation, navigation, and changelog entries appear in the documentation repository.

---

### Task 8: Run Full Validation and Audit the Handoff

**Files:**
- Test: `scripts/verify-novel-reader-props.mjs`
- Test: `scripts/verify-novel-reader-data.mjs`
- Test: `scripts/verify-novel-reader-layout.mjs`
- Test: `scripts/verify-novel-reader-ui.mjs`
- Inspect: `uni_modules/uview-ultra/components/up-novel-reader/`
- Inspect: `pages/componentsD/novelReader/novelReader.uvue`

**Interfaces:**
- All static checks pass.
- H5 and Android builds report no reader-related error.
- The working tree contains no unrelated modifications.

- [ ] **Step 1: Run all targeted checks**

Run:

```powershell
node scripts/verify-novel-reader-props.mjs
node scripts/verify-novel-reader-data.mjs
node scripts/verify-novel-reader-layout.mjs
node scripts/verify-novel-reader-ui.mjs
git diff --check
```

Expected: four `assertions passed` messages and no diff errors.

- [ ] **Step 2: Build the web target**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\open\uview-plus4" --platform Web --webTitle "uview-plus4"
```

Expected: build completes without an error originating from `up-novel-reader`, its `.uts` modules, or the example page.

- [ ] **Step 3: Check Android availability and compile the example**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" devices list --platform android
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true --pagePath "pages/componentsD/novelReader/novelReader"
```

If the device listing returns a different active `deviceId`, rerun the second command with that returned ID. Expected: Android compilation completes without a reader-related error.

- [ ] **Step 4: Inspect the last build log**

Run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --mode lastBuild
```

Confirm there is no error-level reader diagnostic. Warnings must be recorded in the final handoff with their impact.

- [ ] **Step 5: Audit repository state**

Run:

```powershell
git status --short --branch
git diff --stat
git -C "D:\Repos\xyito\open\uview-plus-doc4" status --short --branch
```

Confirm the diff contains only the planned component, scripts, example, config, documentation, changelog, and design/plan files. Leave changes uncommitted unless the user explicitly requests a commit.

## Plan Self-Review

- Public props, default settings, themes, events, slots, and chapter data are implemented by Tasks 1, 4, and 5.
- Normalization, progress precedence, bookmarks, reading time, storage versioning, corruption cleanup, and request-state support are implemented by Task 2 and wired by Tasks 4 and 5.
- Measurement, line wrapping, pagination, page anchors, and viewport refresh are implemented by Task 3 and wired by Tasks 4 and 5.
- Vue/UTS dual implementation, existing component reuse, safe-area placement, and scoped theme variables are covered by Tasks 4 and 5.
- Example route and controlled business-owned chapter loading are covered by Task 6.
- Component documentation, navigation, and both changelogs are covered by Task 7.
- Static validation, H5 compilation, Android compilation, log review, and working-tree audit are covered by Task 8.
- Placeholder scan: no `TBD`, `TODO`, “implement later”, or unspecified function names are used.
