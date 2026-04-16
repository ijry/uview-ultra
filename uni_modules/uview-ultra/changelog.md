## 4.3.6（2026-04-16）
fix: 修正 checkbox 事件传参顺序并清理冗余逻辑

- 移除单元格分组组件中重复定义的 border 属性
- 调整 change 事件触发时机至 v-model 更新后，确保状态同步
- 为 change 事件补充第二参数，返回当前操作复选框的选中状态与 name 值
- 简化复选框组件中 disabled 与 labelDisabled 的空值判断逻辑
- 增加 borderBottom 属性读取前的非空校验，防止潜在报错

## 4.3.5（2026-04-15）
refactor: 提取日历公共类型并清理组件冗余代码

- 将日历月份组件的日期类型抽离至独立 types.uts 文件，并重命名为 UPCalendarMonthsItemDate 实现跨组件复用
- 同步更新日历主组件与月份组件的类型引用、函数参数标注及数组声明，修正 Number 为 number
- 移除头像组件中冗余的 customStyle 属性定义
- 为操作面板的 select 事件参数补充 UTSJSONObject 类型断言以通过 UTS 类型检查
- 统一日历组件中部分模式判断与数组长度比较的运算符为 ==

## 4.3.4（2026-04-15）
refactor: 优化核心工具函数类型定义与空值处理逻辑

- 优化 timeFormat 与 toast 函数参数类型，增加空值拦截逻辑避免运行时异常
- 重构 getProperty 嵌套属性获取逻辑，补充中间节点类型校验并简化遍历流程
- 放宽 setProperty 赋值参数类型限制以支持任意数据类型写入
- 移除配置模块中残留的调试打印语句
- 调整多行文本省略样式中 CSS 属性声明顺序，提升跨端渲染兼容性
## 4.3.3（2026-04-14）
fix: 修复 useUltraUI 中父组件属性与 refs 的键值判断逻辑

- 将 propsData 与 refsData 的键值检查改为 UTSJSONObject.keys().includes()
- 提升键存在性判断的准确性，避免直接访问可能引发的空值或类型异常
- 确保仅当父组件明确传递对应字段时才同步数据至 parentData
## 4.3.2（2026-04-14）
refactor: 重写 async-validator 适配 UTS 环境

- 移除旧版 JS 兼容代码与冗余校验函数，全面采用 UTS 类型系统重写核心逻辑
- 重构 Schema 类，使用 Promise 递归调用替代原有回调与 asyncMap 机制实现串行校验
- 新增 normalizeRuleObject 统一处理规则对象，严格适配 UPFormRuleItem 类型定义
- 简化内置校验器实现，移除深层对象嵌套校验与复杂异步并行映射逻辑
- 标记消息模板替换、正则模式匹配及异步验证器 Promise 处理为待完善项

## 4.3.1（2026-04-14）
fix(i18n): 修复新版本HBuilderX下多语言报错

- 将 `uni_modules/uview-ultra/libs/i18n/locales` 下多语言资源从 `*.json` 调整为 `*.js`（保留原内容）
- 新增各语言 `*.uts` 资源文件，补齐 uni-app x/UTS 侧可直接导入的本地化模块
- 更新 `libs/i18n/index.js` 与 `libs/i18n/index.uts` 的导入路径，分别指向对应平台资源
- 调整 `components/page-nav/page-nav.vue` 为 `script setup` 写法，保持原有展示与跳转逻辑

## 4.3.0（2026-04-14）
add(form): 新增 uni-app x 表单校验支持及 Android 兼容问题

- 重构 `up-form`/`up-form-item` 为 `script setup`，统一通过 `defineExpose + $callMethod` 交互，移除对子组件 `$data` 的直接访问
- 修复表单校验链路：规则读取、触发器过滤、字段消息回写、Promise 回调处理，避免校验结果丢失
- 增加 `UPFormRuleItem` 类型定义并在 `types/index.uts` 导出，统一表单规则结构
- 修复 async-validator 在 uni-app x Android 的多处兼容问题（空值强转、函数调用、first 选项判空、字段聚合 NPE）
- 调整 `up-form-item` 默认 `rules` 结构与取值逻辑，保证规则在 UTS 下可稳定识别
- 重新启用 `pages/componentsC/form/form` 页面路由并同步相关配置格式

## 4.2.60（2026-03-08）
refactor: 【组合式API重构】 up-gap组件（uni-app-x）

## 4.2.59（2026-03-07）
refactor: 【组合式API重构】 优化up-loading-icon、up-index-anchor等（uni-app-x）

## 4.2.58（2026-03-07）
refactor: 【组合式API重构】 优化up-td、up-row等（uni-app-x）

## 4.2.57（2026-03-06）
refactor: 【组合式API重构】 优化up-waterfall（uni-app-x）

## 4.2.56（2026-03-05）
refactor: 【组合式API重构】 优化getParent（uni-app-x）

## 4.2.55（2026-03-05）
refactor: 【组合式API重构】 优化colorGradent支持常用名称颜色（uni-app-x）

## 4.2.54（2026-03-04）
refactor: 【组合式API重构】 优化index.uts（uni-app-x）

## 4.2.53（2026-03-02）
refactor: 【组合式API重构】 up-column-notice组件（uni-app-x）

## 4.2.52（2026-02-27）
refactor: 【组合式API重构】 up-car-keyboard组件（uni-app-x）

## 4.2.51（2026-02-26）
refactor: 【组合式API重构】 up-button组件（uni-app-x）

## 4.2.50（2026-02-26）
refactor: 【组合式API重构】 up-icon组件（uni-app-x）

## 4.2.49（2026-02-25）
refactor: 【组合式API重构】 up-image组件（uni-app-x）

## 4.2.48（2026-02-23）
refactor: 【组合式API重构】 up-input输入框组件（uni-app-x）

## 4.2.47（2026-02-14）
refactor: 【组合式API重构】 up-grid宫格组件（uni-app-x）

## 4.2.46（2026-02-13）
refactor: 【组合式API重构】 up-index-list索引列表组件（uni-app-x）

## 4.2.45（2026-02-12）
refactor: 【组合式API重构】 修复up-row-notice组件在app-android箭头函数导致递归报错（uni-app-x）

## 4.2.44（2026-02-12）
refactor: 【组合式API重构】 up-datetime-picker组件（uni-app-x）

## 4.2.43（2026-02-09）
refactor: 【组合式API重构】 up-row-notice组件（uni-app-x）

## 4.2.42（2026-02-07）
refactor: 【组合式API重构】 up-collapse组件（uni-app-x）

## 4.2.41（2026-02-07）
refactor: 【组合式API重构】 优化up-action-sheet组件（uni-app-x）

## 4.2.40（2026-02-06）
refactor: 【组合式API重构】 修复up-cell组件（uni-app-x）

## 4.2.39（2026-02-06）
improvment: 优化mixin等

## 4.2.38（2026-02-05）
refactor: 【组合式API重构】 支持template中使用$u.addUnit $u.addStyle $u.timeFormat（uni-app-x）

## 4.2.37（2026-02-05）
refactor: 【组合式API重构】 新增up-title组件（uni-app-x）

## 4.2.36（2026-02-05）
refactor: 【组合式API重构】 up-card组件（uni-app-x）

## 4.2.35（2026-02-04）
refactor: 【组合式API重构】 up-cell组件（uni-app-x）

## 4.2.34（2026-02-03）
refactor: 【组合式API重构】 up-cell-group组件（uni-app-x）

## 4.2.33（2026-02-03）
refactor: 【组合式API重构】 up-box组件（uni-app-x）

## 4.2.32（2026-02-02）
refactor: 【组合式API重构】 优化up-avatar组件（uni-app-x）

## 4.2.31（2026-02-02）
refactor: 【组合式API重构】 优化up-col组件（uni-app-x）

## 4.2.30（2026-02-02）
refactor: 【组合式API重构】 修复up-number-box组件（uni-app-x）

## 4.2.29（2026-01-31）
refactor: 【组合式API重构】 修复up-col组件（uni-app-x）

## 4.2.28（2026-01-31）
refactor: 【组合式API重构】 steps示例优化warning（uni-app-x）

## 4.2.27（2026-01-30）
refactor: 【组合式API重构】 subsection示例优化warning（uni-app-x）

## 4.2.26（2026-01-30）
refactor: 【组合式API重构】 swiper示例优化warning（uni-app-x）

## 4.2.25（2026-01-30）
refactor: 【组合式API重构】 tabs示例优化warning（uni-app-x）

## 4.2.24（2026-01-29）
refactor: 【组合式API重构】 text示例优化warning（uni-app-x）

## 4.2.23（2026-01-29）
refactor: 【组合式API重构】 textarea示例优化warning（uni-app-x）

## 4.2.22（2026-01-29）
refactor: 【组合式API重构】 tooltip示例优化warning（uni-app-x）

## 4.2.21（2026-01-28）
refactor: 【组合式API重构】 up-count-downr优化（uni-app-x）

## 4.2.20（2026-01-28）
refactor: 【组合式API重构】 up- picker优化（uni-app-x）

## 4.2.19（2026-01-28）
refactor: 【组合式API重构】 up-item-steps优化（uni-app-x）

## 4.2.18（2026-01-28）
refactor: 【组合式API重构】 up-subsection优化（uni-app-x）

## 4.2.17（2026-01-28）
refactor: 【组合式API重构】 up-textarea优化（uni-app-x）

## 4.2.16（2026-01-28）
refactor: 【组合式API重构】 up-checkbox-group组件与up-collapse-item优化（uni-app-x）

## 4.2.15（2026-01-27）
fix: 修复refactor: 【组合式API重构】 up-badge组件（uni-app-x）

## 4.2.14（2026-01-27）
fix: 修复refactor: 【组合式API重构】 up-badge组件（uni-app-x）

## 4.2.13（2026-01-27）
fix: 修复refactor: 【组合式API重构】 up-code-input组件（uni-app-x）

## 4.2.12（2026-01-27）
fix: 修复refactor: 【组合式API重构】 up-col组件（uni-app-x）

## 4.2.11（2026-01-27）
fix: 修复refactor: 【组合式API重构】 up-row组件（uni-app-x）

## 4.2.10（2026-01-27）
refactor: 【组合式API重构】 up-upload组件优化（uni-app-x）

## 4.2.9（2026-01-27）
refactor: 【组合式API重构】 up-checkbox组件优化（uni-app-x）

## 4.2.8（2026-01-26）
refactor: 【组合式API重构】 up-table组件（uni-app-x）

## 4.2.7（2026-01-26）
refactor: 【组合式API重构】 up-td组件（uni-app-x）

## 4.2.6（2026-01-26）
refactor: 【组合式API重构】 up-th组件（uni-app-x）

## 4.2.5（2026-01-26）
refactor: 【组合式API重构】 up-tr组件（uni-app-x）

## 4.2.4（2026-01-26）
refactor: 【组合式API重构】 优化完善组件父子关系管理组合式函数（uni-app-x）

## 4.2.3（2026-01-25）
refactor: 【组合式API重构】 修复addUnit错误返回auto导致样式异常（uni-app-x）

## 4.2.2（2026-01-24）
refactor: 【组合式API重构】 up-code组件（uni-app-x）

## 4.2.1（2026-01-24）
fix: 修复upload类型报错

## 4.2.0（2026-01-24）
fix: 处理H5端编译大量warning

change: LICENSE协议变更

## 4.1.29（2026-01-24）
refactor: 【组合式API重构】 父子组件架构支持组合式函数hooks方式（uni-app-x）

refactor: 【组合式API重构】 up-checkbox组件（uni-app-x）

refactor: 【组合式API重构】 up-checkbox-group组件（uni-app-x）

## 4.1.28（2026-01-23）
refactor: 【组合式API重构】 back-top组件（uni-app-x）

## 4.1.27（2026-01-23）
fix: 修复index.uts

## 4.1.26（2026-01-23）
fix: 修复input组件warning

## 4.1.25（2026-01-23）
fix: 优化up-tabbar组件change事件（uni-app-x）

## 4.1.24（2026-01-23）
fix: 修复throttle方法及up-button点击事件不触发问题（uni-app-x）

## 4.1.23（2026-01-23）
fix: up-picker组件warning处理

## 4.1.22（2026-01-22）
fix: code-input组件warning处理

## 4.1.21（2026-01-22）
refactor: 【组合式API重构】 avatar-group组件（uni-app-x）

## 4.1.20（2026-01-22）
refactor: 【组合式API重构】avatar组件（uni-app-x）

## 4.1.19（2026-01-22）
fix: 完善up-code组件

## 4.1.18（2026-01-21）
improvment: 优化inedx.uts导出

## 4.1.17（2026-01-21）
refactor: 【组合式API重构】 up-alert组件（uni-app-x）

## 4.1.16（2026-01-21）
fix: 修复checkbox组件warning

## 4.1.15（2026-01-21）
fix: 修复action-sheet组件warning

## 4.1.14（2026-01-21）
fix: 修复calendar组件warning

## 4.1.13（2026-01-21）
fix: 修复datetimepicker组件warning

## 4.1.12（2026-01-21）
fix: 修复picker组件warning

## 4.1.11（2026-01-20）
fix: 修复scroll-list组件warning

## 4.1.10（2026-01-20）
fix: 修复avatar组件warning

## 4.1.9（2026-01-20）
add: 在template中无法使用addStyle所以新增内置$upAddStyle支持

## 4.1.8（2026-01-20）
add: 在template中无法使用addUnit所以新增内置$upAddUnit支持

## 4.1.7（2026-01-20）
fix: 修复完善up-collapse-item子组件

## 4.1.6（2026-01-20）
refactor: 【组合式API重构】 常用方法优化（uni-app-x）

## 4.1.5（2026-01-20）
fix: 修复up-count-to组件语法（uni-app-x）

## 4.1.4（2026-01-20）
fix: 修复touch.uts语法（uni-app-x）

## 4.1.3（2026-01-19）
refactor: 【组合式API重构】album组件和action-sheet组件（uni-app-x）

## 4.1.2（2026-01-19）
refactor: 【组合式API重构】album组件（uni-app-x）

## 4.1.1（2026-01-19）
refactor: 组合式API重构之全局mixin转为组合式API（uni-app-x）

## 4.1.0（2026-01-19）
refactor: 【组合式API重构】action-sheet组件（uni-app-x）

## 4.0.146（2026-01-17）
fix: 修复radio组件props类型转换

## 4.0.145（2026-01-16）
fix: 修复radio组件props报warning

## 4.0.144（2026-01-16）
fix: 修复count-to组件props报warning

## 4.0.143（2026-01-16）
​fix: 修复grid-item报wanning Object is possibly 'null'​

## 4.0.142（2026-01-15）
fix: 修复bem方法冗余语句

## 4.0.141（2026-01-15）
fix: 修复radio组件使用size参数warning

## 4.0.140（2026-01-15）
fix: 修复throttle方法Function类型

## 4.0.139（2026-01-15）
fix: 修复throttle方法Function类型

## 4.0.138（2026-01-15）
fix: warning: Identity equality for arguments of types 'Number' and 'Int' can be unstable because of implicit boxing

## 4.0.137（2026-01-15）
fix: 修复button和avatar-group语法

## 4.0.136（2026-01-15）
fix: 修复button组件warning: Type 'String' is not assignable to type 'string'

## 4.0.135（2026-01-15）
fix: 修复badge组件value参数warning

## 4.0.134（2026-01-15）
fix: 修复avatar-group组件warning

## 4.0.133（2026-01-15）
fix: 修复parse组件props缺少)（uni-app）

## 4.0.132（2026-01-15）
improvment: upGetRect方法从mixin迁移至function为组合式API适配（uni-app-x）

## 4.0.131（2026-01-15）
improvment: bem方法迁移至function工具中（uni-app-x）

## 4.0.130（2026-01-14）
fix：恢复code组件props类型

## 4.0.129（2026-01-14）
fix: 优化digit工具方法（uni-app-x)

## 4.0.128（2026-01-14）
fix: 修复tabs组建warning

## 4.0.127（2026-01-13）
fix: 修复list组件在支付宝小程序下scrolltolower无法触发（uni-app、uni-app-x） #422

## 4.0.126（2026-01-13）
fix: 修复throttle

## 4.0.125（2026-01-13）
fix: 修复upload组件类型转换问题

## 4.0.124（2026-01-13）
fix: 修复icon组件报错

## 4.0.123（2026-01-13）
fix: 修复icon组件warning

## 4.0.122（2026-01-12）
fix: 修复swiper-action组件warning

## 4.0.121（2026-01-12）
fix: 修复sticky组件warning

## 4.0.120（2026-01-12）
fix: 修复mixin语法问题（uin-app-x）

## 4.0.119（2026-01-10）
improvment: dropdown组建warning修复

## 4.0.118（2026-01-10）
improvment: 内置dayjs防止未安装依赖（uni-app）

## 4.0.117（2026-01-09）
fix: 修复tabs组件props使用相关warning

## 4.0.116（2026-01-09）
fix: 修复loading-icon组件toString使用warning

## 4.0.115（2026-01-09）
improvment: 优化getParent方法warning

## 4.0.114（2026-01-09）
improvment: 修复tag组件warning(uni-app-x)

## 4.0.113（2026-01-08）
fix: 修复code-input组件animation样式warning

## 4.0.112（2026-01-08）
fix:  修复count-down数值对比warning

## 4.0.111（2026-01-08）
fix: 修复loading-icon样式warning

## 4.0.110（2026-01-08）
fix: 修复qrcode组件在App不显示logo(uni-app)

improvment: qrcode逻辑优化封装(uni-app)

fix: nvue下采用webview支持二维码显示logo(因为gcanvas不支持图片渲染)(uni-app)

## 4.0.109（2026-01-08）
improvment: 使用官方已经支持的uni.setClipboardData代替三方插件

## 4.0.108（2026-01-07）
fix: 优化多个组件props增强鸿蒙兼容性

## 4.0.107（2026-01-07）
fix: 修复count-to组件warning

## 4.0.106（2026-01-07）
fix: 修复upload组件warning

## 4.0.105（2026-01-07）
fix: 临时去除qrcode引起报错

## 4.0.104（2026-01-07）
fix: 修复fles.scss样式兼容性warning

## 4.0.103（2026-01-06）
fix: 修复--uni-safe-area-inset缺少var

## 4.0.102（2026-01-06）
fix: 修复i18n的warning

## 4.0.101（2026-01-06）
fix: property value `inherit` is not supported for `line-height`

## 4.0.100（2026-01-06）
fix: 修复loading-icon组件颜色样式默认值

## 4.0.99（2026-01-06）
fix: 修复number-box样式warning

## 4.0.98（2026-01-05）
fix: 修复loading-page样式warning

## 4.0.97（2026-01-05）
fix: uni-app-x下安全区域使用--uni-safe-area-inset

## 4.0.96（2026-01-05）
fix: 修复digit工具方法

## 4.0.95（2026-01-05）
fix: 修复icon组件部分warning

## 4.0.94（2026-01-04）
improvment: 修复transition组件warning

## 4.0.93（2026-01-04）
improvment: 修复tabs组件css警告

## 4.0.92（2026-01-04）
fix: 修复演示首页图标不显示

fix: list-item等组件报错

## 4.0.91（2026-01-04）
更新Readme

## 4.0.90（2026-01-03）
fix: 修复box组件示例sass变量前缀

## 4.0.89（2025-12-31）
improvment: number-box等组件warning处理

## 4.0.8（2025-12-30）
fix: 修复 transition组件适配后warning

## 4.0.7（2025-12-29）
fix: 修复list-item组件warning

## 4.0.6（2025-12-29）
fix: transition动画warning修复

## 4.0.5（2025-12-29）
fix:  修复Readme标签内容

## 4.0.4（2025-12-29）
fix: colorGradient方法适配uts

## 4.0.3（2025-12-27）
fix: 增加uni_modules插件依赖

## 4.0.2（2025-12-26）
LICENSE更新

## 4.0.1（2025-12-26）
fix: 修复文档网址

## 4.0.0（2025-12-26）
初步发布uni-app-x版本
