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
