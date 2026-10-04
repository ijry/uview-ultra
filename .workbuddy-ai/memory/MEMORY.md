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
  判断行尾用 `tr -dc '\r' < file | wc -c`；`grep -c $'\r'` 在 Git Bash 下不可靠。
- **杀软会拦管道**：Node 里 `spawnSync` 带 pipe 必然 `EBUSY`，重试无效。
  改用 `stdio: ['ignore', fd, fd]`（fd 来自 `fs.openSync(log, 'w')`）。`stdio: 'inherit'` 可以跑通但拿不到输出。
- **沙箱有批量删除保护**：删超过 50 个文件（含 uni build 清空 `dist/build/h5/assets`）
  会报 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`，需要非沙箱执行。跑 H5 构建前先 `rm -rf dist`。
- **pnpm 装依赖要放行构建脚本**：`"pnpm": { "onlyBuiltDependencies": ["esbuild", "core-js", "core-js-pure"] }`，
  否则 esbuild 二进制装不上（postinstall 会 EBUSY）。
- `git` 不认 MSYS 的 `/tmp/...` 路径，传路径要用 `C:/...` 或 `D:/...`。
