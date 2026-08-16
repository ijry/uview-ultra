# uview-ultra Tabs Parity Design

## Goal

Bring `up-tabs` and a new `up-tabs-pro` in `uview-ultra` into behavioral parity with `ijry/uview-plus` 3.x while preserving the existing `up-` naming and UniApp X support.

The work has two user-visible outcomes:

1. `up-tabs` accepts the upstream `shapeMode` API and emits the original tap event as the third argument of `click`.
2. `up-tabs-pro` is available as the upstream-compatible tabs-and-content wrapper on both Vue and UniApp X targets.

## Compatibility Contract

### `up-tabs`

Existing consumers continue to use `list`, `current`, `v-model:current`, `change`, `click`, and `longPress` unchanged.

`click` is extended, not replaced:

```ts
click(item, index, event)
```

- `item` remains the existing item payload with `index` merged in.
- `index` remains the second argument.
- `event` is appended as the third argument and is the original tap/click event on platforms that provide one.
- `change` and `longPress` retain their current argument shapes.

The following `shapeMode` values match upstream behavior: `''`, `capsule`, `card`, `pill-arrow`, and `tag`.  The component keeps the existing underline in the default and card modes, and hides it in capsule, pill-arrow, and tag modes.

The component must keep geometry data used for underline placement in an internal normalized tab list rather than adding `rect` to the caller's prop objects.  It will remeasure when list items change, including dynamic additions, and retain the current scroll-centering behavior.

### `up-tabs-pro`

`up-tabs-pro` wraps `up-tabs` rather than reimplementing tab interaction.  Its public props match the upstream 3.x component:

- tab props: `list`, `keyName`, `current`, `lineColor`, `activeStyle`, `inactiveStyle`, `lineWidth`, `lineHeight`, `lineBgSize`, `itemStyle`, `scrollable`, `duration`, `iconStyle`, and `shapeMode`;
- content props: `showContent`, `contentClass`, `contentStyle`, `contentMode`, and `bindIndexRef`;
- common styling props: `customStyle` and `customClass`.

`contentMode` and `bindIndexRef` are retained as upstream-compatible metadata props.  The component does not impose an additional child-panel structure: callers own the default-slot rendering policy.

It maintains an internal current index that follows the upstream finite-number-and-bounds normalization rule.  A user click, a controlled `current` update, or a list shrink all converge on that normalized value; changes caused by list shrink emit `update:current`.

It forwards these events without changing their payloads:

```ts
update:current(index)
change(item, index)
click(item, index, event)
longPress(item, index)
```

Named `left`, `icon`, `content`/`tab`, and `right` slots pass through to `up-tabs`.  The default content slot receives `current`, `index`, `item`, `value`, and `list` so consumers can render the selected panel without duplicating lookup logic.

## Architecture

### Vue implementation

`up-tabs.vue` remains the base interactive component.  It gains the missing `shapeMode` prop/default, internal tab-list state for measurements, visual shape classes, and explicit `$event` forwarding from each tab item's `@tap` binding.

`up-tabs-pro.vue` composes `up-tabs`.  It owns only controlled-index normalization, prop forwarding, event forwarding, and the optional content container.  It does not add FastView-specific code or shared click state.

### UniApp X implementation

The same contract is implemented in `up-tabs.uvue` and a new `up-tabs-pro.uvue`.  The UTS source uses typed helpers in place of JavaScript-only patterns but exposes the same props, slots, normalized index rules, emitted events, and shape classes as Vue.

### Types and discovery

Type declarations describe the new `shapeMode` prop and three-argument `onClick` callback for `up-tabs`.  A new `TabsPro` declaration exposes its props and events and is registered in `types/comps.d.ts` as `up-tabs-pro`.

The existing `^up-(.*)` easycom rule discovers the new component by directory name; no application-specific registration is required.  The tabs demo adds a focused `up-tabs-pro` example so the component can be exercised in the repository's UniApp X demo.

## Error Handling and Edge Cases

- `list: null`, a non-array list, or an empty list render safely; no geometry query or invalid array access occurs.
- String, negative, out-of-range, and non-finite `current` values follow the upstream `up-tabs-pro` normalization rule before emitting or exposing a selected item.
- A disabled tab still emits `click` with the original event but does not update the selected index or emit `change`, matching `up-tabs` behavior.
- Explicit caller `itemStyle` takes precedence over per-shape default heights.
- Omitted `lineColor`, `activeStyle`, and `inactiveStyle` preserve the theme/default behavior instead of forcing wrapper-local values.

## Scope Boundaries

Included:

- Vue and UniApp X parity for `up-tabs` and `up-tabs-pro`.
- Public TypeScript declarations, demo coverage, and focused source-level verification.
- A changelog entry documenting the added component and compatible click-event extension.

Excluded:

- FastView/editor modifications; its existing `up-tabs-pro` adapter is not a dependency of this library change.
- A new tab-panel child component or automatic show/hide behavior for arbitrary default-slot children.
- Changes to unrelated tabbar, swiper, or legacy `up-tabs-item` components.

## Verification

A focused Node verification script will assert all of the following in both runtimes where applicable:

1. `up-tabs` template passes `$event` into the click handler and the emitted `click` appends it as argument three.
2. `shapeMode` is declared, defaulted, rendered through classes, and represented in types.
3. `up-tabs-pro` forwards all four public events, includes index normalization, exposes the documented slot scope, and forwards shape/text/style props.
4. `up-tabs-pro` is type-registered and its demo uses the component.

The verification script is exposed through `package.json`; it, the existing relevant tabs checks, `git diff --check`, and the available SFC/static checks run before handoff.
