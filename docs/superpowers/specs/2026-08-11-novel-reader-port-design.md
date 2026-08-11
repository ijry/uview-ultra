# 小说阅读器组件移植设计

**状态：** 已确认设计，待编写实现计划

## 背景

同级 `uview-plus` 仓库已经实现了 `up-novel-reader` 的 Vue 版本，包含正文排版、纵向滚动、横向分页、目录、设置、书签、进度、阅读时长、持久化和示例页。当前 `uview-plus4` 是独立的 uni-app x/UTS 代码库，没有对应组件，不能直接复制 Vue 文件作为 App 实现。

本次工作将成熟的公开 API 和交互移植到 `uview-plus4`，同时遵循目标仓库现有的 `.vue`/`.uvue` 双文件组件结构。

## 目标

- 新增全端可用的 `up-novel-reader` 组件。
- Vue 端与 UTS 端提供一致的 props、事件、插槽、class 命名和核心交互。
- 支持纵向滚动和横向分页两种阅读模式。
- 支持目录、上下章、书签、进度恢复、阅读时长、章节预加载、加载失败重试和安全区。
- 支持字号、行高、段距、正文宽度、字体、粗体、主题和动画设置。
- 提供 `componentsD/novelReader` 示例页、组件文档、静态校验脚本和 changelog。

## 非目标

- 组件不直接请求章节接口，不包含鉴权、付费解锁、广告或业务缓存。
- 不引入第三方分页引擎或 HTML 正文解析器。
- 不修改无关组件的行为、全局主题变量或发布版本号。
- 不要求 Vue 与 UTS 共享同一个源文件；跨端一致性通过 API 和行为契约保证。

## 公开 API

### 章节数据

```js
const chapters = [
  {
    id: 'chapter-1',
    index: 0,
    title: '第一章 初见',
    isLocked: false,
    progress: 0
  }
]

const currentChapter = {
  id: 'chapter-1',
  index: 0,
  title: '第一章 初见',
  content: [
    '这是第一段正文。',
    '这是第二段正文。'
  ]
}
```

`chapters` 只负责目录和定位所需的元数据。`currentChapter.content` 接受字符串或字符串数组，组件内部统一转换为段落数组。`index` 必须是业务目录中的稳定索引。

### Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `chapters` | `Array` | `[]` | 章节目录元数据 |
| `currentChapter` | `Object \| null` | `null` | 当前章节及正文 |
| `loading` | `Boolean` | `false` | 当前章节是否正在加载 |
| `error` | `Object \| null` | `null` | 当前章节加载或排版错误 |
| `bookId` | `String \| Number` | `''` | 书籍唯一标识 |
| `storageKey` | `String` | `''` | 自定义存储键，优先于 `bookId` |
| `persist` | `Boolean` | `true` | 是否启用进度、设置和书签持久化 |
| `initialProgress` | `Object \| null` | `null` | 外部传入的初始进度 |
| `progress` | `Object \| null` | `null` | 外部受控进度 |
| `initialBookmarks` | `Array` | `[]` | 外部传入的初始书签 |
| `bookmarks` | `Array \| null` | `null` | 外部受控书签 |
| `defaultSettings` | `Object` | 见下文 | 初始阅读设置 |
| `settings` | `Object \| null` | `null` | 外部受控设置 |
| `mode` | `String` | `'scroll'` | `scroll` 纵向滚动或 `page` 横向分页 |
| `showBack` | `Boolean` | `true` | 工具栏显示后是否显示返回图标 |
| `autoBack` | `Boolean` | `false` | 点击返回是否自动调用 `uni.navigateBack()` |
| `backIcon` | `String` | `'arrow-left'` | 返回图标名称 |
| `safeAreaInsetTop` | `Boolean` | `true` | 顶部工具栏是否适配状态栏 |
| `safeAreaInsetBottom` | `Boolean` | `true` | 底部工具栏是否适配底部安全区 |
| `preloadThreshold` | `Number` | `2` | 距离章节末尾多少页触发预加载 |
| `pageAnimation` | `Boolean` | `true` | 是否启用横向分页动画 |
| `controlsAutoHide` | `Number` | `0` | 工具栏自动隐藏延迟，`0` 表示不自动隐藏 |

`defaultSettings` 默认值：

```js
{
  theme: 'day',
  fontSize: 18,
  lineHeight: 1.8,
  paragraphSpacing: 16,
  contentWidth: '92%',
  fontFamily: 'system',
  fontWeight: 400,
  animation: true
}
```

组件初始隐藏工具栏，点击正文中部显示。`showBack` 只控制工具栏显示后的返回按钮。实际分页动画由 `pageAnimation` 与 `settings.animation` 共同决定。

### 事件

组件提供以下事件：

```text
back
chapter-request
chapter-prefetch
progress-change
settings-change
bookmark-change
reading-time-change
mode-change
toolbar-change
layout-ready
retry
```

章节请求和预加载 payload：

```js
{
  targetIndex: 3,
  targetId: 'chapter-4',
  direction: 'next' // 'previous' | 'catalog'
}
```

进度 payload：

```js
{
  chapterId: 'chapter-1',
  chapterIndex: 0,
  pageIndex: 2,
  pageCount: 8,
  charOffset: 420,
  chapterProgress: 0.32,
  totalProgress: 0.04,
  scrollTop: 640,
  updatedAt: 1786444800000
}
```

设置 payload：

```js
{
  mode: 'page',
  theme: 'paper',
  fontSize: 20,
  lineHeight: 1.9,
  paragraphSpacing: 18,
  contentWidth: '92%',
  fontFamily: 'system',
  fontWeight: 400,
  animation: true
}
```

章节事件只表达业务意图，不改变 `currentChapter`。业务完成加载后更新 `currentChapter`，组件使用目标章节 ID 和递增请求标识忽略过期响应。

### 插槽

- `top`：顶部工具栏右侧扩展。
- `toolbar-extra`：工具栏操作项。
- `bottom`：底部工具栏扩展。
- `catalog`：替换目录内容。
- `settings`：替换设置面板内容。
- `loading`：章节加载状态。
- `error`：错误状态，提供 `retry` 作用域方法。
- `empty`：无正文状态。

## 架构

组件目录：

```text
uni_modules/uview-ultra/components/up-novel-reader/
├── up-novel-reader.vue
├── up-novel-reader.uvue
├── reader-content.vue
├── reader-content.uvue
├── reader-toolbar.vue
├── reader-toolbar.uvue
├── reader-catalog.vue
├── reader-catalog.uvue
├── reader-settings.vue
├── reader-settings.uvue
├── novelReader.js
├── novelReader.uts
├── props.js
├── props.uts
├── content-normalizer.js
├── content-normalizer.uts
├── reader-core.js
├── reader-core.uts
├── layout-engine.js
├── layout-engine.uts
├── measure-adapter.js
├── measure-adapter.uts
├── persistence.js
├── persistence.uts
└── theme-vars.scss
```

### Vue 实现

Vue 文件使用目标仓库已有的 `commonProps` 与 `useUltraUI` 组合式工具。源仓库的功能逻辑按目标目录和 API 约定迁移，不依赖 `uview-plus` 的旧 mixin 目录。Vue 端保留动态对象和插槽作用域能力，覆盖 H5 和 Vue 小程序/App 链路。

### UTS 实现

UTS 文件使用 `<script setup lang="uts">`、`defineProps`、`defineEmits` 和显式类型：

- 章节、书签、设置和进度分别使用 `UTSJSONObject` 或明确的对象类型。
- 不使用 Vue-only 的动态组件注册、`Object.keys` 驱动的隐式类型推断或复杂可选链。
- 通过 `uni.getStorageSync`、`uni.setStorageSync` 和 `uni.removeStorageSync` 实现持久化。
- 通过 `scroll-view` 和 `swiper` 实现两种阅读模式。
- 复用 `up-icon`、`up-popup`、`up-status-bar`、`up-safe-bottom`、`up-slider` 和 `up-switch`。

两端逻辑文件不共享实现，但必须保持相同的字段、边界和事件契约。

### 默认配置

- Vue 端在 `uni_modules/uview-ultra/libs/config/props.js` 注册 `novelReader`。
- UTS 端在 `uni_modules/uview-ultra/libs/config/props.uts` 注册对应默认配置；组件本地默认值作为无全局覆盖时的兜底。
- `novelReader.js` 与 `novelReader.uts` 的默认字段完全一致。

## 数据流与状态

1. 读取 `chapters`、`currentChapter` 和外部受控状态。
2. 通过 `content-normalizer` 将正文转换为段落、连接文本和字符偏移。
3. `scroll` 模式渲染段落；`page` 模式由 `layout-engine` 按视口和设置生成页面。
4. 滚动、翻页或设置变更后，生成统一进度对象并触发 `progress-change`。
5. 接近章节末尾且存在下一章时，触发一次带目标信息的 `chapter-prefetch`。
6. 用户点击上下章或目录时，发出 `chapter-request`；相同目标请求未完成前不重复发出。
7. `currentChapter` 更新后校验目标 ID，重新排版并尽量按字符偏移恢复位置。
8. 本地状态优先级为：显式 props > 版本化本地存储 > 默认值。

持久化结构：

```js
{
  version: 1,
  progress: {},
  settings: {},
  bookmarks: [],
  readingTime: 0,
  updatedAt: 1786444800000
}
```

存储键优先使用 `storageKey`，否则使用 `uview-ultra:novel-reader:${bookId}`。无有效键时不读写本地状态。损坏、过期或版本不兼容的数据清理后回退默认值，不能影响正文渲染。

## 主题与交互

内置主题：

| 主题 | 背景 | 正文 |
| --- | --- | --- |
| `day` | `#f7f8fa` | `#303133` |
| `paper` | `#f3ead7` | `#51483d` |
| `green` | `#e7f1e4` | `#3f5140` |
| `night` | `#202124` | `#d6d7da` |
| `dark` | `#111214` | `#e5e7eb` |

主题变量通过组件局部 CSS 变量提供背景、正文、次要文字、工具栏、边框、激活色和禁用色，不修改全局主题。

顶部工具栏使用 `up-status-bar`，底部工具栏使用 `up-safe-bottom`。工具栏默认隐藏；正文左侧/中部/右侧点击区域分别支持上一章、显示工具栏、下一章意图。顶部返回按钮只在工具栏显示时存在。

阅读时长只统计组件可见、非加载且发生过用户交互的时间。组件隐藏或销毁前刷新累计值并触发 `reading-time-change`，不内置上传。

## 错误处理

- 章节请求使用递增 token，过期响应被忽略。
- 加载、错误和空正文状态通过插槽呈现。
- `retry` 只触发事件，不伪造章节数据。
- 分页测量失败时保留正文，并允许切换为滚动模式。
- 持久化读写失败只影响恢复能力，不阻断当前阅读。
- 无章节或锁定章节时禁用对应导航和目录跳转。

## 文件与页面变更

源码变更：

- 新增上述 `up-novel-reader` 组件目录。
- 修改 `uni_modules/uview-ultra/libs/config/props.js` 与 `props.uts`。
- 新增 `pages/componentsD/novelReader/novelReader.uvue`。
- 在 `pages.json` 的 `componentsD` 分组中注册示例页。
- 新增 `scripts/verify-novel-reader-*.mjs` 和 `package.json` 脚本入口。

文档变更：

- 新增 `D:\Repos\xyito\open\uview-plus-doc4\docs\components\novelReader.md`。
- 在文档导航中加入 `novelReader`。
- 更新 `uni_modules/uview-ultra/changelog.md`。
- 更新 `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md`。

不修改版本号，不执行发布。

## 验收

自动校验覆盖：

- 组件目录、easycom 可发现性、双端默认配置和全局 props 注册。
- props、事件 payload、插槽名称和 class 命名一致性。
- 长段落、换行、空内容、字符偏移、分页边界和缓存键。
- 持久化版本、书籍隔离、状态优先级、损坏数据恢复和节流写入。
- 主题、安全区、返回按钮、目录、设置、书签和重试接线。

编译校验：

- 使用 HBuilderX CLI 进行 H5 编译。
- 使用 HBuilderX CLI 进行 Android 编译校验；若设备可用则运行示例页。
- 编译输出不得出现本功能新增的 error 级别错误。

手工验收：

- 纵向滚动与横向分页可切换。
- 设置变更后正文样式立即生效且字符位置尽量保持。
- 目录、上下章、书签、加载失败重试和空正文插槽可用。
- 退出后重新打开同一本书，进度、设置和书签按配置恢复。
- 工具栏、状态栏、底部安全区和返回按钮行为正确。
