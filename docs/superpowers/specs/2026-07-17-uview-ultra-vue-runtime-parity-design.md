# uview-ultra Vue Runtime Parity Design

## Goal

Bring the Vue-facing `uview-ultra` library runtime closer to `uview-plus` without touching demo/example pages. The work targets `uni_modules/uview-ultra` source, entrypoints, styles, root host, i18n, dark theme runtime, missing Vue components, and type declarations.

## Scope

In scope:

- Compare and modify only the library/runtime side of `uni_modules/uview-ultra`.
- Treat `D:\Repos\xyito\open\uview-plus\src\uni_modules\uview-plus` as the compatibility baseline.
- Preserve `uview-ultra` component prefix `up-*`.
- Keep `.uvue` demo pages out of scope.
- Root host support is mandatory and must be implemented for Vue usage.
- Maintain existing UTS/uni-app-x behavior unless a Vue parity change explicitly requires shared files.

Out of scope:

- Rebuilding `uview-ultra` example pages in Vue.
- Publishing a package version.
- Changing public component APIs unless required for compatibility with `uview-plus`.
- Broad refactors unrelated to Vue runtime parity.

## Current Gaps

Component coverage:

- `uview-ultra` is missing Vue equivalents for `calendar-strip`, `guide`, and `root-toast-host`.
- The `uview-plus` package wrapper component is not required for `uview-ultra` unless a compatibility need appears during implementation.

Runtime exports:

- `uview-plus` exports and mounts more Vue runtime utilities, including `calc`, `digit`, `i18n`, `t`, theme helpers, and root toast/notify helpers.
- `uview-ultra/index.js` currently exposes a smaller runtime surface.

I18n:

- Both packages declare `i18n: √`.
- `uview-ultra` has i18n files, but the Vue entry does not expose `i18n` and `t` consistently.
- `uview-ultra` UTS i18n currently hardcodes `zh-Hans`; Vue work should not regress that path.

Dark theme:

- Both packages declare `darkmode: x`.
- `uview-plus` has a real theme runtime and CSS variable bridge.
- `uview-ultra` lacks equivalent Vue theme runtime, CSS variable files, and component-level theme integration.

Root host:

- `uview-plus` has root host infrastructure for app-level Toast/Notify style rendering.
- `uview-ultra` does not currently have an equivalent Vue root host.
- `uview-ultra` must add a Vue root host path, including runtime registration and fallback behavior.

## Architecture

The implementation should be layered so each area can be verified independently.

1. Entry parity layer in `index.js` exposes missing Vue runtime helpers through named exports and `uni.$u`.
2. I18n layer reuses `libs/i18n/*.js` and makes `t()` available from both imports and `uni.$u`.
3. Theme layer ports the Vue JS theme runtime from `uview-plus`, adapted to `up-*` naming and current `uview-ultra` config files.
4. Root host layer adds a Vue host component plus runtime registration methods for global toast/notify rendering.
5. Component parity layer ports missing Vue components after runtime prerequisites are stable.
6. Type layer updates declarations after runtime/component APIs are finalized.

## Root Host Design

Root host is required.

The Vue root host should provide:

- A `up-root-toast-host` component that can be placed once in `App.vue`.
- Runtime registration methods on `uni.$u`, at minimum `setRootToastRef`, `rootToast`, `setRootNotifyRef`, and `rootNotify`.
- Graceful fallback to `uni.showToast` when no host ref is mounted.
- A documented Vue usage pattern for adding the host to an app-level template.
- Compatibility with existing `up-toast` and `up-notify` behavior where possible.

The implementation should start by porting the proven `uview-plus` root host design, then renaming and adapting paths to `uview-ultra`. If the `uview-plus` host assumes `u-*` names, `uview-ultra` should expose `up-*` names while avoiding breakage for existing `up-*` consumers.

## Development Phases

### Phase 1: Baseline Diff

Create a reproducible source comparison for:

- Components after normalizing `u-*` and `up-*` prefixes.
- Entry exports and `uni.$u` runtime shape.
- `libs` runtime folders.
- Type declarations.

Acceptance:

- A documented gap checklist exists before code changes begin.
- Demo pages are explicitly excluded from the checklist.

### Phase 2: Entry and Utility Parity

Update `uview-ultra/index.js` so Vue users can import and access missing runtime helpers that already exist or can be safely ported.

Acceptance:

- `uni.$u` exposes the selected parity helpers.
- Existing `up-*` component usage still works.
- H5/Vue compile succeeds.

### Phase 3: I18n Vue Integration

Expose `i18n` and `t` through the Vue entry and `uni.$u`.

Acceptance:

- `import { t } from '@/uni_modules/uview-ultra'` works in Vue code.
- `uni.$u.t` or an equivalent stable path works if adopted.
- Locale fallback remains `zh-Hans`.
- Existing locale files remain compatible.

### Phase 4: Dark Theme Runtime

Port/adapt the `uview-plus` Vue theme runtime.

Acceptance:

- `uni.$u.setTheme('dark')`, `setTheme('light')`, and `setThemePreference('system')` work.
- Runtime CSS variables are available under `--up-*`.
- Native UI sync remains opt-in.
- No UTS entry regression is introduced.

### Phase 5: Component Theme Adaptation

Adapt high-impact Vue components to the theme variables.

Priority components:

- `up-navbar`
- `up-notice-bar`
- `up-subsection`
- `up-switch`
- `up-tag`
- `up-table2`
- `up-gap`
- `up-skeleton`

Acceptance:

- Components render readable light and dark states.
- Existing explicit props still override theme defaults where they did before.

### Phase 6: Root Host

Add Vue root host support as a mandatory feature.

Acceptance:

- `up-root-toast-host` exists and can be placed in `App.vue`.
- Runtime APIs register host refs and render global toast/notify through host when mounted.
- Fallback `uni.showToast` behavior works without mounted host.
- Type declarations include the new component and runtime methods.

### Phase 7: Missing Vue Components

Port missing components by priority:

1. `calendar-strip`
2. `guide`

Acceptance:

- Components use `up-*` naming.
- Props/events follow `uview-plus` compatibility where practical.
- Types are added.

### Phase 8: Type Declarations

Update TypeScript declarations for all newly exposed APIs and components.

Acceptance:

- `types/index.d.ts` includes i18n, theme, root host, and helper APIs.
- `types/comps.d.ts` includes missing components.
- Component-specific type files exist where the package convention requires them.

### Phase 9: Verification

Run HBuilderX CLI verification after each meaningful batch.

Required final verification:

- H5/Vue compile check if available for this project.
- Android compile check using the repository's documented HBuilderX CLI command.
- Report any warnings and whether they affect this work.

## Risks

- Theme runtime copied too directly from `uview-plus` may carry `u-*` assumptions; it must be adapted to `up-*` while optionally supporting aliases.
- Root host can conflict with page-level `up-toast` or `up-notify` if registration lifecycle is not clear.
- UTS and Vue entrypoints share files in some places; Vue changes must avoid breaking `index.uts`.
- Component theme changes can alter visual output even when users set explicit colors; explicit props must keep precedence.

## Validation Strategy

- Use directory-level diff commands for coverage checks.
- Use import-level smoke pages or existing Vue component pages for compile validation.
- Validate root host with both mounted-host and no-host fallback cases.
- Validate i18n by switching `uni` locale where the platform supports it and by direct `t()` fallback checks.
- Validate theme by toggling light/dark/system and confirming CSS variables plus native UI sync behavior.
