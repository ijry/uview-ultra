# uview-ultra i18n 语言包按需加载设计

## 背景

GitHub issue [#908](https://github.com/ijry/uview-plus/issues/908) 反馈：i18n 相关代码约 30KB，主包体积紧张，希望可屏蔽或裁剪。

`uview-plus` 已落地按需方案：默认仅内置 `zh-Hans`，其他语言通过 `registerLocale` 注册，包入口导出可选语言模块。

当前 `uview-ultra` 仍是全量静态加载：

- `uni_modules/uview-ultra/libs/i18n/index.js` 顶部静态 import `zh-Hans` / `zh-Hant` / `en` / `es` / `fr` / `de` / `ko` / `ja` / `ru`
- `libs/i18n/index.uts` 同样全量 import 对应 `.uts` 语言包
- 主入口 `index.js` 直接 `import i18n, { t }`
- 大量组件默认文案依赖 `t()`（calendar、empty、upload、pagination 等）

结果：只要引入使用 `t()` 的组件，整包语言资源都会进入依赖图。

本次将 ultra 对齐 plus 的按需注册能力，并覆盖 **JS + UTS 完整路径**。

## 目标

1. 默认只内置 `zh-Hans`，显著降低主包 i18n 体积
2. 其他语言通过显式 `registerLocale` 按需注册
3. 语言包继续使用 JS / UTS 模块，并从包入口统一导出，业务侧无需手写 locales 深层路径
4. JS（Vue/H5/小程序）与 UTS（uni-app-x / uvue）双端 API 对齐
5. 兼容全平台：不依赖动态 `import()`
6. 文档与 changelog 明确标注重大变更与迁移方式

## 非目标

- 不引入 `vue-i18n` 作为内置依赖
- 不做运行时网络拉取语言包
- 不改组件文案 key 调用方式（组件继续 `t('up.common.xxx')`）
- 不把 ultra 的下划线 key 改回 plus 点分 key
- 不保证未注册语言时仍显示对应外语（未注册回退中文）

## 与 uview-plus 的差异保留

| 项 | uview-plus | uview-ultra（保持） |
| --- | --- | --- |
| 语言包 key | `up.common.cancel` | `up_common_cancel` |
| `t()` | 直接用点分 key | 先 `value.replaceAll('.', '_')` 再查表 |
| 语言包文件 | 仅 `.js` | `.js` + `.uts` 双份 |
| 运行时入口 | `index.js` | `index.js` + `index.uts` |

## 方案选择

| 方案 | 说明 | 结论 |
| --- | --- | --- |
| A 显式 `registerLocale` + 默认仅 `zh-Hans` | 静态依赖，全平台稳，体积收益最大 | **采用** |
| B 切换语言时动态 `import` | H5 友好，小程序/UTS 异步 chunk 不稳定 | 否 |
| C 默认全量 + 可选裁剪入口 | 兼容最好，但 #908 主包问题仍在 | 否 |

默认语言策略：仅 `zh-Hans`。

语言包暴露：从包入口命名导出，避免业务写深层路径。

## 架构

### 文件结构

```text
libs/i18n/
  index.js              # t / registerLocale / getLocale / setLocale / hasLocale；默认仅 zh-Hans
  index.uts             # 同上（UTS 类型）
  locale-packs.js       # 可选语言命名导出（en/ja/.../all）
  locale-packs.uts      # UTS 侧命名导出
  locales/
    zh-Hans.js / zh-Hans.uts
    zh-Hant.js / zh-Hant.uts
    en.js / en.uts
    es.js / es.uts
    fr.js / fr.uts
    de.js / de.uts
    ko.js / ko.uts
    ja.js / ja.uts
    ru.js / ru.uts
    th.js / th.uts
    all.js / all.uts    # 聚合全部语言，便于一键恢复旧行为
```

已有 `locales/*.js` 与 `locales/*.uts` 保留内容与 key；新增 `all.*` 与 `locale-packs.*`。

### 依赖边界（关键）

- 组件继续：
  - Vue：`import { t } from '../../libs/i18n'` 或 `.../index.js`
  - UVue：`import { t } from '../../libs/i18n/index.uts'` 等既有路径
- `libs/i18n/index.js` / `index.uts` **不得** 静态 import 非中文语言包，也不得 re-export `en/ja/...`
- 可选语言只允许出现在：
  - `locale-packs.js` / `locale-packs.uts`
  - 业务侧显式 import 后 `registerLocale`
  - 主入口对 `locale-packs` 的 re-export

原因：组件广泛依赖 `t`。若可选语言与 `t` 同文件静态耦合，打包仍会把全语言打进主包，#908 目标落空。

## API

### `t(value, params = {})`

保持 ultra 语义：

1. 读 `settings.lang`（JS：初始 `uni.getLocale()`，并监听 `uni.onLocaleChange`；UTS：可用 `getLocale` 初值，`onLocaleChange` 若平台可用则监听，否则依赖 `setLocale`）
2. key 先 `replaceAll('.', '_')`（保留 ultra 兼容）
3. 若当前语言未注册，回退 `zh-Hans`
4. 取 `settings.locales[lang][value]`，不存在则返回原 `value`
5. 支持 `{name}` 参数替换（JS 必须；UTS 在类型允许范围内实现，至少保证无参 `t(key)` 正确）

### `registerLocale(locale, messages?)`

两种调用：

```js
registerLocale('en', enMessages)
registerLocale({
  en: enMessages,
  ja: jaMessages,
  'zh-Hant': zhHantMessages
})
```

行为：

- 合并/覆盖到 `settings.locales`
- 同步、纯对象写入，无异步
- 非法参数 no-op，不阻断启动

### `hasLocale(locale)` / `getLocale()` / `setLocale(locale)`

与 plus 对齐：查询是否注册、读取内部 lang、更新内部 lang 并尽量同步 `uni.setLocale`。

仅 `setLocale` / `uni.setLocale` 不会自动加载语言包；目标语言必须先 `registerLocale`。

### 默认内置

```js
settings.locales = {
  'zh-Hans': zhHans
}
```

`th` 纳入 `locale-packs` / `all`，默认不内置。

## 主入口导出

`index.js` / `index.uts` 导出：

- API：`t` / `i18n` / `registerLocale` / `hasLocale` / `getLocale` / `setLocale`
- 语言包：`en` / `es` / `fr` / `de` / `ko` / `ja` / `ru` / `th` / `zhHans` / `zhHant` / `allLocales`

业务：

```js
import { registerLocale, en, ja, allLocales } from '@/uni_modules/uview-ultra'
registerLocale('en', en)
// 或
registerLocale(allLocales)
```

## 兼容与迁移

| 场景 | 结果 |
| --- | --- |
| 纯中文项目 | 零改动，主包自动变小 |
| 已 `uni.setLocale('en')` 但未注册 `en` | 组件文案回退 `zh-Hans`（**行为变化**） |
| 需要英文等 | 启动时 `registerLocale('en', en)` |
| 需要完整旧行为 | `registerLocale(allLocales)` |
| 组件内 `t('up.xxx')` | 无需修改（仍走 `.`→`_`） |
| 业务自建 vue-i18n | 不受影响 |

这是 **重大变更（breaking change）**。

## 文档与 Changelog

- 更新 `uview-plus-doc4/docs/guide/i18n.md`：重大变更 + ultra 按需示例
- 插件 `changelog.md` 版本 **4.5.9**，`feat!` + #908
- 同步 `uview-plus-doc4/docs/components/changelog.md`
- 增加 `scripts/verify-i18n-on-demand.mjs`（静态约束 + JS 行为；UTS 源码静态检查）
- `types/index.d.ts` 补充 API 类型

## 验证

### 静态

- `index.js` / `index.uts` 不静态 import 非 `zh-Hans`
- 存在 `locale-packs.*` 与 `locales/all.*`
- 主入口导出 `registerLocale` / `en` / `allLocales`
- changelog 含 breaking / #908

### 行为（JS）

- 默认 `t('up.common.cancel')` 中文正确
- 未注册 `en` 时回退中文
- `registerLocale('en', en)` 后英文生效
- 批量注册与 `allLocales` 生效

## 风险

1. 已上线多语言项目未改代码会回退中文 → 文档 warning + `allLocales`
2. 主入口 re-export 语言包：仅业务显式 import 才打入；`t` 路径不耦合
3. UTS 类型更严 → `UTSJSONObject` 明确写入；插值尽量实现
4. UTS 历史未监听 `onLocaleChange` → 优先恢复，受限则以 `setLocale` 为准

## 决策记录

- 默认语言：仅 `zh-Hans`
- 接入方式：显式 `registerLocale`
- 范围：JS + UTS 完整对齐
- 语言包 key：保持 ultra underscore 形态
- 暴露方式：包入口导出语言模块
- 全平台：禁止动态 import
- 版本：实现后发布 **4.5.9**
