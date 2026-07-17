# uview-ultra Vue Runtime Gap Checklist

## Scope

- Baseline: `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus`
- Target: `D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity\uni_modules\uview-ultra`
- Demo and example pages are excluded.
- Vue root host is required.

## Component Gaps

- Missing in `uview-ultra`: `calendar-strip`, `guide`, `root-toast-host`.
- `uview-plus` package wrapper component is not required unless a compatibility failure appears.
- Normalized component counts at baseline: `uview-plus=140`, `uview-ultra=136`.
- `uview-ultra` has no Vue component that is absent from `uview-plus` after normalizing `u-*` and `up-*` prefixes.

## Runtime Gaps

- `uview-ultra/index.js` must expose Vue i18n helpers, theme helpers, and root host methods through named exports and `uni.$u`.
- `uview-ultra` lacks Vue theme runtime files under `libs/theme`.
- `uview-ultra` lacks root host files under `libs/root` and an easycom-facing `up-root-toast-host`.
- `uview-plus` has Vue theme runtime files: `libs/theme/theme.js` and `libs/theme/runtime.js`.
- `uview-plus` has root support files under `libs/root`, including `root-toast-host.vue` and `runtime.js`.

## Type Gaps

- `types/index.d.ts` must include i18n, theme, root host methods, and missing refs.
- `types/comps.d.ts` must include `up-root-toast-host`, `up-calendar-strip`, and `up-guide`.
- Component-specific declaration files must be added under `types/comps`.

## Baseline Verification

- Command: `& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true`
- Result: baseline compile is not clean before implementation.
- Existing error: `pages/componentsC/navbar/navbar.uvue:26` uses selector `page`, which `uni:app-uvue-css` reports as unsupported for uvue.
- Existing warning: `uni_modules/uview-ultra/components/up-swipe-action-item/up-swipe-action-item.uvue:29` uses non-standard `touch-action`.
- Impact: these are pre-existing issues outside this Vue runtime parity scope. Later verification must distinguish new library-scope errors from this baseline.

## Verification Matrix

- H5/Vue compile after entry, i18n, theme, and root host batches when available.
- Android compile after final batch using HBuilderX CLI.
- Every compile result must report whether any error is newly introduced by this work or matches the baseline issue above.

## Final Verification

- Android compile command: `& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true`
- Android result: command exited with code `0`, but the build log still reports the pre-existing `pages/componentsC/navbar/navbar.uvue:26` unsupported `page` selector error. No new error-level failures were reported from the `uni_modules/uview-ultra` Vue runtime, theme, root host, or newly ported Vue components.
- Android lastBuild command: `& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --mode lastBuild`
- Android lastBuild result: log is available and matches the final compile result.
- Web command: `& "C:\ProgramData\HBuilderX\cli.exe" publish web --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --platform Web --webTitle "uview-plus4"`
- Web result: timeout. The command did not finish after the initial 180s tool timeout plus an additional 240s wait. The active child process was `uni build -p h5`, no Web/H5 output directory was produced under `unpackage`, and the hung CLI/Node processes were stopped.
- Warnings: the pre-existing `uni_modules/uview-ultra/components/up-swipe-action-item/up-swipe-action-item.uvue:29` non-standard `touch-action` warning remains. It does not affect the Vue runtime parity changes in this plan.

## Vue Component Parity Verification

- Scope: Vue-only `up-calendar` and `up-icon` component parity; no `.uvue`, `.uts`, `index.uts`, demo, or `pages/**` files changed.
- Android compile command: `& "C:\ProgramData\HBuilderX\cli.exe" launch app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --compile true --continue-on-error true`
- Android result: command exited with code `0`. Build output still reports the pre-existing `pages/componentsC/navbar/navbar.uvue:26` unsupported `page` selector error and `uni_modules/uview-ultra/components/up-swipe-action-item/up-swipe-action-item.uvue:29` non-standard `touch-action` warning. No new `uni_modules/uview-ultra` Vue component error was introduced by the calendar/icon parity batch.
- lastBuild command: `& "C:\ProgramData\HBuilderX\cli.exe" logcat app-android --project "D:\Repos\xyito\open\uview-plus4\.worktrees\uview-ultra-vue-runtime-parity" --deviceId "emulator-5554" --mode lastBuild`
- lastBuild result: log is available and matches the final compile output.
- Warnings: remaining warning is the known `up-swipe-action-item.uvue:29` `touch-action` warning. It is outside this Vue-only component parity scope.
