# AI 调试与验证规范（uview-plus4）

## 1) 基础说明
- 本仓库 `package.json` 未配置 `npm run dev`，不要使用 npm 脚本启动。
- 统一使用 HBuilderX CLI：
  - `C:\ProgramData\HBuilderX\cli.exe`

## 2) 项目导入
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" project open --path "D:\Repos\xyito\ultra-ui\uview-plus4"
```

## 3) Android 调试（优先）
### 3.0 MuMu 模拟器
- 本仓库默认使用 MuMu 模拟器进行 Android 调试。
- 先启动 MuMu，再执行设备检测命令确认 `deviceId`（常见为 `emulator-5554`，以实际输出为准）。

### 3.1 查看设备
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" devices list --platform android
```

### 3.2 运行到 Android（仅编译校验）
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\ultra-ui\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

### 3.3 指定页面编译校验（示例：table2）
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\ultra-ui\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true --pagePath "pages/componentsB/table2/table2"
```

### 3.4 查看最近构建日志
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\ultra-ui\uview-plus4" --deviceId "emulator-5554" --mode lastBuild
```

### 3.5 Android 导出编译（强校验）
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish app-android --project "D:\Repos\xyito\ultra-ui\uview-plus4" --type appResource
```

### 3.6 任务提交与版本发布前完整编译（强制）
- **每次任务提交前、每次版本发布前，必须执行一次完整 Android 项目编译校验。**
- 标准命令必须使用 `launch app-android --compile true --continue-on-error true`，且**不得带 `--pagePath`**，以编译整个工程，而不是只校验单个页面：
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\ultra-ui\uview-plus4" --deviceId "<实际设备ID>" --compile true --continue-on-error true
```
- 必须看到类似 `当前工程 N 个页面，正在编译为android class` 与 `项目 uview-plus4 编译成功` 的完整工程结果；单页编译不能替代全项目编译。
- 若日志只出现 `检测到编译缓存有效，跳过编译` + `项目 uview-plus4 编译成功`，说明本次并未真正编译，**不构成校验证明**。需先移开 `unpackage/cache` 再重跑，直到看到上面那两行完整工程结果为止。
- `publish app-android --type appResource` 仅是资源导出/补充校验，**不得作为任务提交前或版本发布前的完整编译证明**。
- 若设备不可用，必须先启动 MuMu 或连接 Android 设备；仍无法编译时应明确报告阻塞原因，不得以 `appResource` 导出结果代替。

### 3.7 真机 / 模拟器运行验证（强制，编译通过 ≠ 校验完成）
- **`--compile true` 是「只编译不运行」**，它只能证明代码能编译，**不能证明代码能跑**。
  编译产物里完全可能藏着运行期才炸的东西（见本节末尾的事故记录），
  所以凡是改了 `.uts` / `.uvue` / 组件逻辑，**必须真正运行到设备上看一眼**。
- 运行命令（注意**不带** `--compile`，带了就只编译）：
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\ultra-ui\uview-plus4" --deviceId "<实际设备ID>" --pagePath "<要验证的页面>" --native-log true
```
- 该命令会**常驻**（不是跑完就退），必须用后台任务方式执行；日志出现 `ready` 之后应用才真正跑起来。
- 纯 CLI 模式需要 adb 反向端口转发，否则调试基座停在 `Failed to connect to /127.0.0.1:8002`：
```bash
adb -s "<设备ID>" reverse tcp:8002 tcp:8002
adb -s "<设备ID>" reverse --list   # 确认 8002 在列表里
```
  正常应能看到 8000/8001/8002/8003 四条，缺 8002 时应用起不来。
- 验证三件套，缺一不可：
  1. **运行时日志无异常**：`V8JSException` / `ReferenceError` / `TypeError` 必须为 0。
     `ReferenceError` 若出现在 app-service 求值阶段，是**整个应用白屏**，不是单页问题。
  2. **截图确认画面**：`adb exec-out screencap -p`；动画类组件要连拍两帧确认在动。
  3. **状态事件确认**：组件通过 `statechange` 之类的 error 通道报出的错误也要清零。
- 截图前先用 `adb shell dumpsys window | grep mCurrentFocus` 确认前台是不是自己的应用。
  真机被占用时 `screencap` 可能抓到别的 app，**不要拿错图当验证结果**。
- 改了 `.uts` / `.uvue` 后若日志显示没有重新编译该文件（编译走了缓存），
  必须加 `--cleanCache true` 全量重编，否则设备上跑的还是旧产物。
- 产物自查：`unpackage/dist/dev/app-android/app-service.js` 里不应出现孤立的 `as;` 语句
  （`grep -c "^  as;$"` 必须为 0）。
- **已知事故（务必避免重犯）**：`.uts` 里把类型断言写成跨行形式

```ts
}
 as UTSJSONObject
```

  会被编译器拆成 `}); as; UTSJSONObject;` 三条语句，`as` 不是变量，
  真机启动即 `ReferenceError: as is not defined`，**整个应用白屏**。
  编译期完全正常，只有真跑才会暴露。类型断言必须与表达式同行。

## 4) Web 编译校验（可选）
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\ultra-ui\uview-plus4" --platform Web --webTitle "uview-plus4"
```

## 5) 强制执行规则（必须遵守）
- 每次代码修改后，必须至少执行一次对应平台的 CLI 编译/运行校验。
- 任务提交前和版本发布前，必须额外完成不带 `--pagePath` 的全项目 Android 编译；`publish ... --type appResource` 不可替代。
- 提交结果前，必须确认：
  1. 无 `error` 级别编译报错；
  2. 若有 `warning`，需说明是否影响当前需求；
  3. 在回复中附上实际执行命令与关键结果（成功/失败 + 关键日志）。
- 禁止“只改不验”。
- **只编译不运行不算校验**：改了 `.uts` / `.uvue` 或组件逻辑后，必须按 3.7 真正运行到真机/模拟器，并在回复中附上「运行时日志无异常 + 截图确认」的证据。

## 6) 发布新版（必须遵守）
- 发布 `uview-plus` / `uview-ultra` 新版本时，必须先阅读并严格按以下文档执行：
  - `D:\Repos\xyito\config\ultraUI.md`
- 发布命令、版本号 bump、发布说明等，均以该文档为准；禁止跳过文档自行编造发布流程。

## 7) uview-plus说明

uview-plus一般是指的同一个父目录下的uview-plus文件夹项目， 文档一般也在同一父目录下。

## 8) 变更日志同步（必须遵守）

每次完成**用户可感知**的代码变更后，必须同步写入文档 changelog，禁止“只改代码不写日志”。

### 8.1 适用范围
- 功能 / API / props / 事件 / 插槽变更
- 样式、class 命名（含 BEM）、styleIsolation、蒸汽模式（Vapor）相关适配
- bug 修复、兼容性调整、破坏性变更
- 发布前整理的版本说明

纯内部重构、仅调试示例、不影响组件对外行为的改动，可省略；但一旦对外可感知，必须写。

### 8.2 写入目标（按优先级）
1. **主文档（强制，本仓库为 uview-ultra / uview-plus4）**  
   `D:\Repos\xyito\ultra-ui\uview-plus-doc4\docs\components\changelog.md`
2. **插件 changelog（版本相关时强制）**  
   当前仓库：`uni_modules/uview-ultra/changelog.md`  
   （若同步维护 uview-plus，则对应其 `uni_modules/uview-plus/changelog.md`）
3. **uview-plus 文档（可选，仅当同步维护 uview-plus / 3.x 时）**  
   `D:\Repos\xyito\ultra-ui\uview-plus-doc\docs\components\changelog.md`

本仓库默认以 **uview-plus-doc4** 为准；维护 uview-plus 时再写 uview-plus-doc。

### 8.3 写入时机
- 每次有意义的功能/样式/API 变更完成后、**提交或发布之前**
- 发布版本时：文档 changelog 与插件 `changelog.md` 必须同一版本对齐
- 禁止在回复“已完成”时遗漏文档日志

### 8.4 文档格式（uview-plus-doc4）
文档使用 timeline HTML，写入时遵守现有结构：
- 新版本：在时间线列表**靠前**位置新增 `li.u-timeline-item`（放在已有最新条目之前）
- 同版本补充：在对应版本 `ul` 内追加 `li`
- 条目类型用既有标签：
  - `<span class="add">新增</span>`
  - `<span class="fix">修复</span>`
  - `<span class="optimize">变更</span>` / 优化
  - 删除类变更用 `optimize` 或明确写“删除”
- 内容需写清：影响组件、行为变化、破坏性 class/API 迁移提示（若有）

示例片段：
```html
<li>
	<span class="optimize">变更</span>
	适配样式隔离 2.0 / 蒸汽模式：xxx 组件 class 调整为 BEM，外部覆盖请同步修改
</li>
```

### 8.5 插件 changelog 格式
- 顶部追加版本号小节，例如 `## 4.5.4`
- 使用 `feat:` / `fix:` / `optimize:` 等前缀，中文说明
- 列出关键组件与用户需要关注的迁移点

### 8.6 禁止事项
- 禁止完成用户可感知变更后不写 `uview-plus-doc4/docs/components/changelog.md`
- 禁止只写插件 changelog 而漏写文档 changelog（发布/对外说明场景）
- 禁止编造未发生的变更；未发版可用“待发布 / 开发中”描述，发版时再落到正式版本号
