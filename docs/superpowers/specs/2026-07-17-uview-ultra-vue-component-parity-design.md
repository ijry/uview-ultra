# uview-ultra Vue Component Parity Design

## Goal

Bring the Vue-only `uview-ultra` component APIs closer to `uview-plus` without touching uni-app-x/UVue runtime files.

## Scope

- Baseline: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus`
- Target: `D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity\uni_modules\uview-ultra`
- First batch components: `up-calendar` and `up-icon`.
- Modify only Vue-facing files: `*.vue`, `props.js`, Vue component helper `*.js`, and `types/**`.
- Do not modify `*.uvue`, `*.uts`, `index.uts`, demo pages, examples, or `pages/**`.
- Preserve the `up-*` public prefix.
- Preserve existing dark theme behavior and only reuse already available CSS variables where needed.

## Current Gaps

`up-calendar` already includes much of the newer time-selection logic in its Vue SFC, but its Vue props and template wiring still lag behind `uview-plus` for inline calendar and date display features:

- `pageInline`
- `weekText`
- `forbidDays`
- `forbidDaysToast`
- `monthFormat`

This is user-visible because the newly ported `up-calendar-strip` renders an embedded full calendar through `up-calendar` and expects `pageInline` support.

`up-icon` has matching props but its Vue logic is behind `uview-plus` for custom icon fonts:

- `customPrefix !== 'upicon'` currently returns an empty string instead of resolving `config.customIcons[name] || name`.
- Custom icon font family is not applied to `iconStyle`.
- The Vue component does not use a font loading helper equivalent for the built-in/custom font families.

## Approach

Use a conservative Vue-only port from `uview-plus`:

- Add missing `up-calendar` Vue props in `components/up-calendar/props.js`.
- Wire `pageInline` to `up-popup` so inline calendars do not behave like closable bottom popups.
- Pass `weekText` into `header.vue`.
- Pass `forbidDays`, `forbidDaysToast`, and `monthFormat` into `month.vue`.
- Add the matching Vue-only handling in `header.vue` and `month.vue` if the target files do not already contain it.
- Update `types/comps/calendar.d.ts` for the new props.
- For `up-icon`, restore custom icon resolution and custom font-family behavior in `up-icon.vue`.
- Add a Vue-only `components/up-icon/util.js` helper if needed for `uni.loadFontFace`; do not copy or enable nvue-specific branches.
- Update icon-related config/type declarations only if the runtime fields already exist or the Vue helper needs them.

## Non-Goals

- Do not align UVue/UTS files in this batch.
- Do not copy `uview-plus` nvue/wxs slider helpers.
- Do not do a broad component API parity pass yet.
- Do not change dark theme tokens beyond necessary existing CSS variable usage.
- Do not change examples or add Vue demo pages.

## Verification

Each implementation batch must run:

```powershell
& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true
```

Expected known baseline issues may remain:

- `pages/componentsC/navbar/navbar.uvue:26` unsupported `page` selector.
- `uni_modules/uview-ultra/components/up-swipe-action-item/up-swipe-action-item.uvue:29` non-standard `touch-action` warning.

Any new error under `uni_modules/uview-ultra` is considered a regression and must be fixed before committing.

## Follow-Up Batches

After the first batch, continue Vue-only parity in these groups:

- `up-picker`, `up-popup`, `up-tooltip`
- `up-action-sheet`, `up-alert`, `up-collapse-item`, `up-datetime-picker`
- `up-tabbar`, `up-tabbar-item`, `up-tabs`, `up-tag`, `up-slider`, `up-subsection`, `up-switch`, `up-parse`

These subsequent batches must keep the same Vue-only constraint unless the user explicitly reopens UVue/UTS scope.
