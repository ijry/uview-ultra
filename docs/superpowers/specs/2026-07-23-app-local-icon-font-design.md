# App Local Icon Font Design

## Goal

Port the App-side local built-in icon font mechanism from `uview-plus` issue #1044 into `uview-ultra`, so App / App-nvue no longer fetch the default icon font from the network, and users do not need manual copy/config steps.

## Scope

In scope:

- `uni_modules/uview-ultra` Vue runtime for `up-icon`
- Align behavior with `uview-plus` `3.8.82` App local font loading
- Keep non-App platforms working with current remote / conditional strategies
- Optional light uvue hardening only if it preserves local loading without forcing users to edit `App.uvue`

Out of scope:

- Changes to the sibling `uview-plus` repository
- Vite plugin / postinstall font copy mechanism
- Redesign of custom icon hosting (`customIcon`)
- Publishing a package version in this design phase
- Broad icon system refactor or font-family rename across uvue

## Problem

Current `uview-ultra` Vue path still depends on remote alicdn:

- `components/up-icon/util.js` always uses `config.iconUrl`
- `components/up-icon/up-icon.vue` hardcodes remote font for App-nvue and non-nvue `@font-face`
- App weak network can delay or break built-in icons

`uview-plus` already fixed this by shipping package-local `upicon.ttf` and loading it via `ttf?url` + `uni.loadFontFace` / weex `addRule`.

uni-app-x in this repo already has local `/static/iconfont/iconfont.ttf` and `loadFont()` in `index.uts`, but that path is separate from the Vue App runtime.

## Recommended Approach

Use Approach A: package-local `upicon.ttf?url`, matching `uview-plus`.

Rejected alternatives:

- Copy font into business `/static` during install/build: still path-sensitive and more user-visible
- CSS-only local `@font-face`: unstable across App targets; nvue still needs weex rules

## Architecture

### Vue / App-vue / App-nvue

1. Add font asset:
   - `uni_modules/uview-ultra/components/up-icon/upicon.ttf`
   - Source of truth: `uview-plus/src/uni_modules/uview-plus/components/u-icon/upicon.ttf`

2. Rewrite `components/up-icon/util.js` to mirror plus:

```js
// #ifdef APP || APP-NVUE
import iconFontUrl from './upicon.ttf?url'
// #endif

const iconFontFamily = 'upicon-iconfont'

const getIconUrl = () => {
  // #ifdef APP || APP-NVUE
  return iconFontUrl
  // #endif
  return config.iconUrl
}

const markFontLoaded = () => {
  // #ifdef APP || APP-NVUE
  params.loaded = true
  return
  // #endif
  if (config.loadFontOnce) {
    params.loaded = true
  }
}
```

3. Loading rules in `loadFont()`:

- App-nvue: `weex.requireModule('dom').addRule('fontFace', ...)`
- App / H5 / MP-WEIXIN / MP-ALIPAY: `uni.loadFontFace({ global: true, family, source })`
- Always load built-in family first, then optional `config.customIcon`
- Keep fail callbacks silent

4. Update `up-icon.vue`:

- Remove App-nvue remote hardcoded `fontUrl`
- Keep automatic call: if `!fontUtil.params.loaded` then `fontUtil.loadFont()`
- Change `@font-face` condition to match plus intent:
  - Do not use remote CSS `@font-face` on App
  - Keep remote `@font-face` only for platforms that still need CSS fallback (same family of mini programs used by plus: QQ / Toutiao / Baidu / Kuaishou / XHS)
- Keep `font-family: upicon-iconfont` for built-in icons

5. Export surface:

- `index.js` should export `fontUtil` so advanced users can call `fontUtil.loadFont()` manually if needed
- Existing `config.iconUrl`, `customIcon`, `loadFontOnce` remain valid for non-App / custom cases

### uvue / uni-app-x

Keep local static path strategy:

- `index.uts` continues loading `/static/iconfont/iconfont.ttf`
- Do not force `ttf?url` into UTS unless proven supported
- Prefer automatic local load where safe; do not require business apps to edit `App.uvue` for built-in icons if component-side or install-side auto load can cover it
- Do not rename uvue `font-family: iconfont` in this change, to avoid style breakage

## Data Flow

1. First `up-icon` render (or explicit `fontUtil.loadFont()`)
2. Resolve icon URL by platform
3. Register font with platform API
4. Optionally register custom icon font
5. Mark loaded according to App-once / `loadFontOnce` rules
6. Icon text renders with configured font-family

## Error Handling

- Built-in font load failure: silent, no toast, no throw
- Custom font load failure: silent, must not block built-in font path
- Missing `uni.loadFontFace`: no-op guard
- Non-App remote failure: same as current behavior; no new fallback CDN

## Compatibility

Compatible:

- Existing `config.iconUrl` for non-App
- Existing `customIcon` / `customIcons`
- Existing `loadFontOnce` for non-App
- Existing `up-icon` props / class names

Intentional behavior change:

- App / App-nvue built-in font no longer uses alicdn network request
- App built-in font always loads once per runtime, regardless of `loadFontOnce`

## Testing / Verification

1. Android App compile/run via HBuilderX CLI per `AGEMTS.md`
2. Offline or blocked network: built-in icons still render on App
3. Multi-icon page: no repeated expensive App font registration
4. H5 / WeChat mini program smoke: icons still render
5. Custom icon config still loads when family/url provided
6. Confirm no App request to `at.alicdn.com` for default icon font

## Implementation Notes

- Prefer byte-identical copy of `upicon.ttf` from `uview-plus`
- Keep code shape close to plus `util.js` to reduce drift
- Update plugin changelog and `uview-plus-doc4` changelog when implementing user-visible change
- Do not add vite-plugin font copy in this work

## Success Criteria

- App / App-nvue default icon font is package-local
- Users need no manual static copy and no mandatory App entry wiring for built-in icons
- Behavior aligns with `uview-plus` #1044 / `3.8.82`
- Non-App platforms do not regress
