# App Static Icon Font Alignment Design

## 背景

`2026-07-23-app-local-icon-font-design.md` 让 uview-ultra 对齐了 `uview-plus` **3.8.82** 的 App 本地字体方案，也就是 `import iconFontUrl from './upicon.ttf?url'`，并且当时明确写了 "Do not add vite-plugin font copy in this work"。

但 `uview-plus` 在 **2026-08-03** 推翻了这个方案（见 `uview-plus/docs/superpowers/specs/2026-08-03-app-static-icon-font-design.md`）：

> 2026-07-23 的 App 本地图标字体方案把 `upicon.ttf` 交给 Vite 以 `?url` 发射，App 产物会引用 `/assets/upicon.<hash>.ttf`。iOS App 端用户反馈 `u-icon` 不显示……问题集中在 App 本地字体路径不符合 uni-app 对 `static` 资源的使用约定。

uview-ultra 没有跟进这次修正，于是 Vue / App-vue 路径停留在已被证明在 iOS 上不生效的 `?url` 方案上。

值得注意的是，uview-ultra 自己的 uvue 路径早就写对了 —— `index.uts` 里就是 `url('/static/iconfont/iconfont.ttf')`，注释还写着"本地字体请放在 `/static` 目录下，否则打包时不会把字体文件打进去"。同一个仓库里两条路径采用了互相矛盾的策略。

## 目标

- Vue / App-vue / App-nvue 路径改用 `static` 本地字体，与 `uview-plus` 对齐，不再依赖 `?url` 发射的产物路径。
- 提供与 `uview-plus` 同构的通用 Vite 插件入口 `UpVite()`，字体复制只是它的第一个 feature，后续新增构建期能力不需要用户改 `vite.config`。
- 本地字体缺失时自动回退 `config.iconUrl`，老项目升级不出现图标丢失。
- uvue / uni-app-x 路径保持不变。

## 非目标

- 不改变 `up-icon` 的 props、class 名、unicode 映射或字体 family 名（仍为 `upicon-iconfont`）。
- 不改动 uvue 路径的 `/static/iconfont/iconfont.ttf` 策略，也不动 `index.uts`。
- 不为非 App 平台复制字体。
- 不在本仓库引入 `vite` 依赖（见下方"插件目录自包含"）。

## 方案

### 新增 `libs/vite/`（与 uview-plus 同构）

```
uni_modules/uview-ultra/libs/vite/
  index.js           # UpVite() 通用入口，createUpViteFeatures() 组合 feature
  app-icon-font.js   # feature: App 端本地图标字体
  utils.js           # normalizePath / detectProjectRoot / isAppPlatform / toCleanId
```

feature 统一接口 `{ name, ensure(), transform(code, id), generateBundle(bundle) }`，钩子均可选。用户侧只需：

```js
import UpVite from 'uview-ultra/libs/vite/index.js'
export default defineConfig({ plugins: [UpVite(), uni()] })
```

`ensure()` 在 App 平台把 `components/up-icon/upicon.ttf` 复制到应用 `static/app-plus/uview-ultra/upicon.ttf`（复制前比对大小与内容，避免无意义重写）。`transform` / `generateBundle` 兜底移除 App 端已编译进产物的远程 `@font-face`，防止本地字体与远程字体同时加载。

### 插件目录自包含

`libs/vite/*` **不 import `vite` 包**，`normalizePath` 自行实现。原因：uview-ultra 走 HBuilderX 构建，宿主项目不一定安装 vite 包；同时让 `scripts/verify-app-local-icon-font.mjs` 可以脱离 vite 独立运行。

### `components/up-icon/util.js`

对齐 `uview-plus` 的实现：

- `useAppStaticIconFont` 默认 `true`，App / App-nvue 优先使用 `_www/static/app-plus/uview-ultra/upicon.ttf`。
- `plus.io.convertLocalFileSystemURL` 可用时转换成本机绝对路径。
- **App-Vue 兜底**：`uni.loadFontFace` 失败后用 `config.iconUrl` 重试一次，每个页面只回退一次（`appVueFallbackPages`）。
- **App-nvue 兜底**：`dom.addRule` 没有失败回调，注册前用 `plus.io.resolveLocalFileSystemURL` 探测字体文件，不存在时改用 `config.iconUrl`。
- 新增 App Vue 的页面级状态（`appVueLoadedPages` / `appVueLoadingPages` / `isLoaded`），并导出 `isLoaded`。

### `components/up-icon/up-icon.vue`

App Vue 的字体注册只对当前页面 WebView 生效，而页面未挂载时取不到 `getCurrentPages()`，因此加载时机要分开：

- 非 App Vue：保持原有 setup 时机，用 `fontUtil.isLoaded()` 判断。
- App Vue：移到 `onMounted` 中注册。

`up-icon.vue` 的 `@font-face` 条件保持现状（仅 `MP-QQ || MP-TOUTIAO || MP-BAIDU || MP-KUAISHOU || MP-XHS`，不含 APP）。

## 测试

新增 `scripts/verify-app-local-icon-font.mjs`（`npm run verify:app-local-icon-font`），断言：

- `util.js` 不含 `?url`，包含 `_www/static/app-plus/uview-ultra/upicon.ttf` 与 `plus.io.convertLocalFileSystemURL`。
- `util.js` 默认开关为 `true`，且保留 `config.iconUrl` 回退分支。
- App Vue 的页面级状态、远程回退只执行一次、nvue 文件探测与回退都在位。
- `up-icon.vue` 不在 App 端注入远程 `@font-face`，且 App Vue 走 `onMounted` 注册。
- 在临时 uni-app 项目中执行 `UpVite().buildStart()`：App 平台复制字体且内容一致，H5 平台不复制。
- `UpVite().transform()` 能移除已编译的远程 `@font-face`，`generateBundle` 只清理 CSS asset。
- `UpVite({ appStaticIconFont: false })` 不复制字体并把开关改回 `false`。

## 影响

- App 构建会向业务项目的 `static/app-plus/uview-ultra/` 写入一份组件库内置字体，用户无需手动拷贝；若同路径已存在不同内容，会以组件库内置字体覆盖，保证 unicode 映射一致。
- 未引入任何构建插件的项目：本地字体不存在，App-Vue 回退 `config.iconUrl`、App-nvue 探测后回退，行为与改造前等价。
- 用户若不希望 App 端使用本地字体，可传 `UpVite({ appStaticIconFont: false })`。
- uvue / uni-app-x、H5、小程序均不受影响。
