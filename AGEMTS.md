# AI 调试与验证规范（uview-plus4）

## 1) 基础说明
- 本仓库 `package.json` 未配置 `npm run dev`，不要使用 npm 脚本启动。
- 统一使用 HBuilderX CLI：
  - `C:\ProgramData\HBuilderX\cli.exe`

## 2) 项目导入
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" project open --path "D:\Repos\xyito\open\uview-plus4"
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
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true
```

### 3.3 指定页面编译校验（示例：table2）
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --compile true --continue-on-error true --pagePath "pages/componentsB/table2/table2"
```

### 3.4 查看最近构建日志
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\open\uview-plus4" --deviceId "emulator-5554" --mode lastBuild
```

### 3.5 Android 导出编译（强校验）
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish app-android --project "D:\Repos\xyito\open\uview-plus4" --type appResource
```

## 4) Web 编译校验（可选）
```powershell
& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\open\uview-plus4" --platform Web --webTitle "uview-plus4"
```

## 5) 强制执行规则（必须遵守）
- 每次代码修改后，必须至少执行一次对应平台的 CLI 编译/运行校验。
- 提交结果前，必须确认：
  1. 无 `error` 级别编译报错；
  2. 若有 `warning`，需说明是否影响当前需求；
  3. 在回复中附上实际执行命令与关键结果（成功/失败 + 关键日志）。
- 禁止“只改不验”。

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
   `D:\Repos\xyito\open\uview-plus-doc4\docs\components\changelog.md`
2. **插件 changelog（版本相关时强制）**  
   当前仓库：`uni_modules/uview-ultra/changelog.md`  
   （若同步维护 uview-plus，则对应其 `uni_modules/uview-plus/changelog.md`）
3. **uview-plus 文档（可选，仅当同步维护 uview-plus / 3.x 时）**  
   `D:\Repos\xyito\open\uview-plus-doc\docs\components\changelog.md`

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
