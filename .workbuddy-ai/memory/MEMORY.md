# uview-plus4 项目长期记忆

## 仓库角色

- `uview-plus4`：**uni-app x** 工程（`manifest.json` 有 `uni-app-x` 段、`main.uts` 导入 `index.uts`），
  承载 `uview-ultra` 的 `.uts` / `.uvue` 实现。校验按 `AGEMTS.md` 走 HBuilderX CLI。
- `uview-plus4-vue3`（**同级目录**，非子目录）：**uni-app Vue3** 工程，
  承载 `uview-ultra` 的 `.js` / `.vue` 实现，同时是 126 个示例页组成的示例站。
  三个 junction 由 `pnpm setup:links` 建立（均 gitignore）：
  `src/uni_modules/uview-ultra`、`src/static`、`src/common` → `uview-plus4` 对应目录。
  示例页由 `pnpm sync:demo` 从 `uview-plus4/pages` 的 `.uvue` 确定性转换而来，**不要手改生成物**。
- `uview-plus`（3.x）：也是 uni-app Vue3 工程，历史上是 uview-ultra 的 Vue3 侧来源。
- 发布流程以 `D:/Repos/xyito/config/ultraUI.md` 为准。

## 核心事实：uview-ultra 是双实现

`components/up-*/` 下每个组件同时有 `.uts`/`.uvue`（uni-app x）和 `.js`/`.vue`（uni-app Vue3）两套。
**改任何一套都要同步检查另一套**，两套语义必须一致。
`.vue` 目录里除了 `up-xxx.vue` 还有 `up-calendar/header.vue` 这类子组件。

## 铁律：Vue3 侧的相对导入必须写全 `.js` 扩展名

uni-app 的 `resolve.extensions` 是 `['.uts', '.mjs', '.js', ...]`，**`.uts` 排第一，
非 uni-app x 构建也一样**（`@dcloudio/uni-cli-shared/dist/constants.js` 的 `COMMON_EXTENSIONS`）。

所以 `import { defineMixin } from '../../libs/vue'` 在 Vue3 工程里会解析到 `libs/vue.uts`；
目录导入 `'../../libs/i18n'` 会解析到 `index.uts`，运行时直接 `UTSJSONObject is not defined`。

**新增/修改 `.js`、`.vue` 里的相对导入时，只要同名 `.uts` 存在就必须写 `.js`。**
门禁 B 段（`pnpm verify:vue-modules`）会扫出来。

## Vue3 侧编译门禁

`cd D:/Repos/xyito/ultra-ui/uview-plus4-vue3 && pnpm verify:vue-build`
（`--modules-only` / `pnpm verify:vue-modules` 只跑静态扫描，约 2 秒）。
四段：SFC 全量编译扫描 / babel no-undef / Node 模块加载冒烟 / 真实 H5 构建。
完整构建日志落在 `.verify-build.log`（gitignore）。

改 `uview-ultra` 的 Vue3 侧（`.js` / `.vue`）之后，**必须跑一次这个门禁**，
否则又会出现「vue3 侧从未编译、bug 只能靠用户反馈」的情况。

## 本机环境坑（Windows）

- **本仓库是「混合行尾」**：同一个文件里既有 CRLF 又有 LF。
  改文件**必须用字符串替换**（除替换片段外一个字节都不动），
  用会统一行尾的编辑器会把 git diff 撑成几百行噪声。
  **Edit 工具同样会把混合行尾统一成 LF**（2026-10-30 在 `up-upload/utils.uts` 踩过：
  292 行 diff 里只有 4 行是真实改动）——这类文件要用 Python 读 bytes 做替换再写回。
  判断行尾用 `tr -dc '\r' < file | wc -c`；`grep -c $'\r'` 在 Git Bash 下不可靠。
- **杀软会拦管道**：Node 里 `spawnSync` 带 pipe 必然 `EBUSY`，重试无效。
  改用 `stdio: ['ignore', fd, fd]`（fd 来自 `fs.openSync(log, 'w')`）。`stdio: 'inherit'` 可以跑通但拿不到输出。
- **沙箱有批量删除保护**：删超过 50 个文件（含 uni build 清空 `dist/build/h5/assets`）
  会报 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`，需要非沙箱执行。跑 H5 构建前先 `rm -rf dist`。
- **pnpm 装依赖要放行构建脚本**：`"pnpm": { "onlyBuiltDependencies": ["esbuild", "core-js", "core-js-pure"] }`，
  否则 esbuild 二进制装不上（postinstall 会 EBUSY）。
- `git` 不认 MSYS 的 `/tmp/...` 路径，传路径要用 `C:/...` 或 `D:/...`。

## 发布渠道

- **npm 渠道自 2026-10-30 起暂停发布**（用户指示）。插件市场照常发，
  不再执行 `npm publish`，除非用户明确要求恢复。npm 上 `uview-ultra`
  最新停在 4.5.75。
- **改插件价格只能靠 `package.json`**：网页后台没有改价入口，
  价格随包上传（`sale.regular.price` 插件价 / `sale.sourcecode.price` 源码价）。
- **平台对价格变化有 24 小时一次的限制**：两次发布价格字段不同就报
  `ERROR: 24小时内仅支持修改一次价格`。所以改价必须「改本地 → 发一版 → 等 24h」，
  改错一次多等一天（4.5.76 就因把源码价临时改成 0.00 绕过限制，
  结果线上真变成免费了）。

## 与 uview-plus 3.x 的对齐基线

- **ultra 4.5.50 对齐的是 uview-plus 3.8.127 / 3.8.128**（changelog 有记录）。
  核对上游是否有漏移植时，从这里往后比。
- **3.x 的「父子组件 children 时序守卫」对 ultra 不适用**：ultra 的 `children` 在 setup
  顶部就 `ref([])`，不存在 options API 里「watch 早于 created、children 还没赋值」的 undefined。
- **3.x 的 `calc.div` 用 xyutil 的崩溃对 ultra 也不适用**：ultra 的 calc.div 引用本地 `mul`。
- **MuMu 需手动 `adb connect 127.0.0.1:16384`**：实例在跑但 HBuilderX 的 `devices list`
  会返回空，连上 adb 后才显示设备（deviceId 用 `127.0.0.1:16384`）。
- **MuMu 启动被沙箱拦 `sc.exe`**：`MuMuManager control -v 0 launch` 会因安全策略
  拒绝 `C:\WINDOWS\SYSTEM32\sc.exe` 而失败（黑名单，不可绕过）。此时 adb 端口能连上
  但 `pm list packages` 报 `Can't find service: package`，等于没有可用模拟器。
- **真机 `1569196572001LP`** 常在线（HBuilderX 显示 HUAWEI ABR-AL80），
  但 `adb exec-out screencap` 可能抓到别的 app 界面，截图验证不可信。

## uni-app x 复用 web 侧 JS 引擎（up-lottie 验证）

- `.uvue` 里 `import` 压缩过的第三方 JS（如 `lottie-miniprogram.min.js`）**能编译**，
  uni-app x 对 `.js` 走普通 JS 处理，不是 UTS 严格解析。
- 但这类库常在**模块加载期**就用小程序全局（`wx.getSystemInfoSync()`）。
  解法：生成一份在文件最前面写 `var wx = {...}` 的副本 —— 模块作用域变量比挂
  `globalThis` 可靠（UTS 产物不保证有 globalThis）。原文件保留给 `.vue` 侧。
