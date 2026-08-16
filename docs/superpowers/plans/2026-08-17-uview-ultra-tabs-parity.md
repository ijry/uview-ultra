# uview-ultra Tabs Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring up-tabs and a new up-tabs-pro in uview-ultra into behavioral parity with ijry/uview-plus 3.x on Vue and UniApp X.

**Architecture:** up-tabs remains the single interactive base and gains shape modes, internal measurement state, and a backward-compatible third click argument containing the original event. up-tabs-pro composes that base, normalizes its controlled index, forwards all props/events/slots, and optionally renders a scoped content slot. Vue and UTS implementations expose the same contract; source-level verification guards both.

**Tech Stack:** Vue 3 script setup, UniApp X UTS/Vue, SCSS, TypeScript declaration files, Node.js assertion scripts, npm scripts.

## Global Constraints

- Existing consumers continue to use list, current, v-model:current, change, click, and longPress unchanged.
- click is extended, not replaced: click(item, index, event); change and longPress retain their current argument shapes.
- event is appended as the third argument and is the original tap/click event on platforms that provide one.
- up-tabs-pro wraps up-tabs rather than reimplementing tab interaction.
- The following shapeMode values match upstream behavior: '', capsule, card, pill-arrow, and tag.
- Geometry metadata stays in an internal normalized tab list rather than being written onto caller-owned prop objects.
- contentMode and bindIndexRef remain upstream-compatible metadata props; no new automatic child-panel structure is introduced.
- FastView/editor files, generated output, node_modules, and unrelated components remain unchanged.
- Vue and UniApp X implementations expose the same props, slots, normalized index rules, and emitted events.

---

## File Map

- Create scripts/verify-tabs-parity.mjs: deterministic source and contract checks for both runtimes, types, demo, and registration.
- Modify package.json: expose verify:tabs-parity.
- Modify uni_modules/uview-ultra/components/up-tabs/props.js: add the Vue shapeMode prop and preserve item-style presence semantics.
- Modify uni_modules/uview-ultra/components/up-tabs/tabs.uts: add the UTS shapeMode default.
- Modify uni_modules/uview-ultra/components/up-tabs/up-tabs.vue and up-tabs.uvue: implement event forwarding, shape rendering, and internal measurement state.
- Create uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.vue and up-tabs-pro.uvue: upstream-compatible Vue and UTS composition wrappers.
- Create uni_modules/uview-ultra/types/comps/tabsPro.d.ts: TabsProProps and component constructor type.
- Modify uni_modules/uview-ultra/types/comps/tabs.d.ts and comps.d.ts: document the new base API and register up-tabs-pro.
- Modify pages/componentsC/tabs/tabs.uvue and uni_modules/uview-ultra/changelog.md: demo and release-note coverage.

## Task 1: Add the failing parity verifier

**Files:**
- Create: scripts/verify-tabs-parity.mjs
- Modify: package.json

**Interfaces:**
- Produces npm command verify:tabs-parity.
- The script reads repository-relative files and exits non-zero when any required contract is absent.

- [ ] **Step 1: Write the verifier before implementation**

Create the script with Node built-in assertions. It must check both up-tabs sources, defaults, wrapper sources, declarations, registration, demo, and package script:

~~~js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = file => readFileSync(resolve(root, file), 'utf8')
const vueTabs = read('uni_modules/uview-ultra/components/up-tabs/up-tabs.vue')
const uvueTabs = read('uni_modules/uview-ultra/components/up-tabs/up-tabs.uvue')
const vuePro = read('uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.vue')
const uvuePro = read('uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.uvue')
const tabsProps = read('uni_modules/uview-ultra/components/up-tabs/props.js')
const tabsDefaults = read('uni_modules/uview-ultra/components/up-tabs/tabs.uts')
const tabsTypes = read('uni_modules/uview-ultra/types/comps/tabs.d.ts')
const proTypes = read('uni_modules/uview-ultra/types/comps/tabsPro.d.ts')
const componentsTypes = read('uni_modules/uview-ultra/types/comps.d.ts')
const demo = read('pages/componentsC/tabs/tabs.uvue')
const packageJson = JSON.parse(read('package.json'))

assert.equal(packageJson.scripts['verify:tabs-parity'], 'node scripts/verify-tabs-parity.mjs')
for (const [name, source] of [['up-tabs.vue', vueTabs], ['up-tabs.uvue', uvueTabs]]) {
  assert.match(source, /clickHandler\(item, index, \$event\)/, name + ': click must receive $event')
  assert.match(source, /shapeMode/, name + ': shapeMode must be rendered')
  assert.match(source, /(?:emit|\$emit)\(['"]click['"][\s\S]*event/, name + ': click must emit the event')
}
assert.match(tabsProps, /shapeMode/)
assert.match(tabsDefaults, /shapeMode:/)
assert.match(tabsTypes, /shapeMode\?/)
assert.match(tabsTypes, /index: number, event: any/)
for (const [name, source] of [['up-tabs-pro.vue', vuePro], ['up-tabs-pro.uvue', uvuePro]]) {
  assert.match(source, /up-tabs/)
  assert.match(source, /showContent/)
  assert.match(source, /update:current/)
  assert.match(source, /click[\s\S]*event|event[\s\S]*click/, name + ': click event must be forwarded')
  assert.match(source, /longPress|long-press/)
  assert.match(source, /content|tab/)
}
assert.match(proTypes, /TabsProProps/)
assert.match(componentsTypes, /\['up-tabs-pro'\]/)
assert.match(demo, /<up-tabs-pro[\s\S]*showContent/)
console.log('tabs parity assertions passed')
~~~

- [ ] **Step 2: Register the npm command**

Add this property to package.json without changing existing scripts:

~~~json
"verify:tabs-parity": "node scripts/verify-tabs-parity.mjs"
~~~

- [ ] **Step 3: Run the verifier and record the expected failure**

Run:

~~~powershell
node scripts/verify-tabs-parity.mjs
~~~

Expected: failure because up-tabs-pro does not yet exist and up-tabs does not yet forward $event or declare shapeMode.

- [ ] **Step 4: Commit the test harness**

~~~powershell
git add scripts/verify-tabs-parity.mjs package.json
git commit -m "test: add tabs parity verifier"
~~~

## Task 2: Update the Vue up-tabs contract and shape rendering

**Files:**
- Modify: uni_modules/uview-ultra/components/up-tabs/props.js
- Modify: uni_modules/uview-ultra/components/up-tabs/up-tabs.vue

**Interfaces:**
- Consumes existing list, current, style, and badge props.
- Produces click(itemWithIndex, index, event) and shapeMode values '', capsule, card, pill-arrow, and tag.

- [ ] **Step 1: Extend the Vue prop definition**

Add shapeMode to props.js with a string type and default from defProps.tabs.shapeMode. Make item-style computation distinguish an omitted style from an explicitly supplied style so shape defaults do not override caller styles; preserve the documented 44px default when no shape is selected.

- [ ] **Step 2: Run the failing assertion**

~~~powershell
npm run verify:tabs-parity
~~~

Expected: FAIL at the Vue clickHandler/shapeMode assertions. Do not weaken the assertions.

- [ ] **Step 3: Forward the original tap event**

Change the tab item binding and handler emission while leaving disabled and current-tab branches unchanged:

~~~vue
@tap="clickHandler(item, index, $event)"
~~~

~~~js
function clickHandler(item, index, event) {
  emit('click', { ...item, index }, index, event)
  if (item.disabled) return
  // existing selection/change behavior remains here
}
~~~

- [ ] **Step 4: Add shape classes and line visibility**

Apply shapeMode to the root class (up-tabs--shape-<mode>) and item class (up-tabs__wrapper__nav__item--<mode>). Add the active card corner and pill-arrow marker nodes. Add the upstream capsule/card/pill-arrow/tag SCSS blocks. Hide the underline in capsule, pill-arrow, and tag; retain it in empty and card modes. Use computed item style so shape default heights 30px, 34px, 32px, and 28px apply only when itemStyle is omitted.

- [ ] **Step 5: Keep measurement data internal**

Introduce a local tab-list copy watched deeply from props.list; render and measure that copy, attach rect only to the copy, and use it in setLineLeft, setScrollLeft, getAllItemRect, and resize. Empty or non-array lists return before any query. Preserve window-resize cleanup.

- [ ] **Step 6: Run the Vue-focused verifier**

~~~powershell
node scripts/verify-tabs-parity.mjs
~~~

Expected: Vue up-tabs assertions pass; UTS/wrapper assertions remain.

- [ ] **Step 7: Commit the Vue base component**

~~~powershell
git add uni_modules/uview-ultra/components/up-tabs/props.js uni_modules/uview-ultra/components/up-tabs/up-tabs.vue
git commit -m "fix: align Vue tabs props and click event"
~~~

## Task 3: Mirror the base contract in UniApp X up-tabs

**Files:**
- Modify: uni_modules/uview-ultra/components/up-tabs/tabs.uts
- Modify: uni_modules/uview-ultra/components/up-tabs/up-tabs.uvue

**Interfaces:**
- Consumes the same public props as the Vue base.
- Produces the same click(itemWithIndex, index, event), change, longPress, and update:current event shapes and shape classes.

- [ ] **Step 1: Add the UTS default**

Add shapeMode: '' to the tabs default object in tabs.uts.

- [ ] **Step 2: Add typed UTS props and safe internal list state**

Declare shapeMode in defineProps, create a computed safe list and an internal deep-cloned measurement list, and update template, text style, geometry helpers, and watchers to use safe/internal lists. Keep UTS casts explicit (Array<UTSJSONObject>, NodeInfo) and avoid JavaScript-only Object.keys patterns that break Android compilation.

- [ ] **Step 3: Forward the UTS tap event**

Change the item binding:

~~~vue
@tap="clickHandler(item, index, $event)"
~~~

Emit the third argument from a typed handler:

~~~ts
const clickHandler = (item: UTSJSONObject, index: number, event: any): void => {
  emit('click', { ...item, index }, index, event)
  // retain disabled/current/change behavior
}
~~~

- [ ] **Step 4: Port shape classes, markers, line visibility, and custom style binding**

Mirror Vue class names and SCSS, use _addStyle/computed UTS objects for shape-specific defaults, and bind customStyle on the root while retaining customClass. UTS line style sets display from the same mode predicate as Vue.

- [ ] **Step 5: Run UTS assertions and existing checks**

~~~powershell
node scripts/verify-tabs-parity.mjs
npm run verify:slider-decimal-step
~~~

Expected: both up-tabs runtimes pass their assertions; wrapper files are the remaining failures; slider verifier remains green.

- [ ] **Step 6: Commit the UTS base component**

~~~powershell
git add uni_modules/uview-ultra/components/up-tabs/tabs.uts uni_modules/uview-ultra/components/up-tabs/up-tabs.uvue
git commit -m "fix: align UTS tabs props and click event"
~~~

## Task 4: Add the Vue up-tabs-pro wrapper and declarations

**Files:**
- Create: uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.vue
- Create: uni_modules/uview-ultra/types/comps/tabsPro.d.ts
- Modify: uni_modules/uview-ultra/types/comps/tabs.d.ts
- Modify: uni_modules/uview-ultra/types/comps.d.ts

**Interfaces:**
- Consumes all base tab props plus showContent, contentClass, contentStyle, contentMode, and bindIndexRef.
- Produces update:current(index), change(item, index), click(item, index, event), and longPress(item, index).

- [ ] **Step 1: Create the Vue wrapper**

Render an up-tabs child with the forwarded props and this root/content structure:

~~~vue
<view class="up-tabs-pro" :class="customClass" :style="customStyle">
  <up-tabs
    :list="safeList"
    :keyName="keyName"
    :current="innerCurrent"
    :lineColor="resolvedLineColor"
    :activeStyle="activeStyle"
    :inactiveStyle="inactiveStyle"
    :lineWidth="lineWidth"
    :lineHeight="lineHeight"
    :lineBgSize="lineBgSize"
    :itemStyle="itemStyle"
    :scrollable="scrollable"
    :duration="Number(duration)"
    :iconStyle="iconStyle"
    :shapeMode="shapeMode"
    @update:current="updateCurrent"
    @click="clickHandler"
    @longPress="longPressHandler"
    @change="changeHandler"
  >
    <!-- forward left, icon, tab/content, and right slots -->
  </up-tabs>
  <view v-if="showContent" class="up-tabs-pro__content" :class="contentClass" :style="contentStyle">
    <slot :current="innerCurrent" :index="innerCurrent" :item="currentItem" :value="currentValue" :list="safeList" />
  </view>
</view>
~~~

Use tab as the preferred alias and content as fallback, preserving item, keyName, and index scope for each tab slot.

- [ ] **Step 2: Implement controlled-index normalization**

Use this exact upstream behavior:

~~~js
function normalizeCurrent(value) {
  const parsed = Number(value)
  const nextValue = Number.isFinite(parsed) ? parsed : 0
  const maxIndex = Math.max(safeList.value.length - 1, 0)
  return Math.min(Math.max(nextValue, 0), maxIndex)
}
~~~

Watch current immediately, watch list deeply, and emit update:current when a list shrink changes the normalized internal index. updateCurrent and changeHandler update the internal index before forwarding events.

- [ ] **Step 3: Forward all event arguments**

~~~js
const clickHandler = (item, index, event) => emit('click', item, index, event)
const longPressHandler = (item, index) => emit('longPress', item, index)
const changeHandler = (item, index) => {
  updateCurrent(index)
  emit('change', item, index)
}
~~~

- [ ] **Step 4: Add declarations and global registration**

Add shapeMode and event: any to TabsProps.onClick. Create TabsProProps with every prop from the spec and callback declarations onUpdateCurrent, onChange, onClick, and onLongPress. Add this line to the navigation section of comps.d.ts:

~~~ts
['up-tabs-pro']: typeof import('./comps/tabsPro')['TabsPro']
~~~

- [ ] **Step 5: Run the verifier**

~~~powershell
node scripts/verify-tabs-parity.mjs
~~~

Expected: Vue wrapper and all declaration assertions pass; UTS wrapper assertions remain.

- [ ] **Step 6: Commit the Vue wrapper and declarations**

~~~powershell
git add uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.vue uni_modules/uview-ultra/types/comps/tabsPro.d.ts uni_modules/uview-ultra/types/comps/tabs.d.ts uni_modules/uview-ultra/types/comps.d.ts
git commit -m "feat: add Vue tabs-pro wrapper"
~~~

## Task 5: Add the UniApp X up-tabs-pro wrapper

**Files:**
- Create: uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.uvue

**Interfaces:**
- Consumes the same props and slot scopes as the Vue wrapper.
- Produces the same four event signatures, with event forwarded as the third click argument.

- [ ] **Step 1: Declare typed UTS props and emits**

Use PropType<Array<UTSJSONObject>> for list, [String, Object, Array] for style props, and defineEmits(['update:current', 'change', 'click', 'longPress']). Include customStyle and customClass for the wrapper root.

- [ ] **Step 2: Implement safe list/current computed values**

Create safeList, currentItem, currentValue, and resolvedLineColor computed values. Implement the same numeric normalization and deep list watcher as the Vue wrapper with UTS-compatible casts.

- [ ] **Step 3: Compose up-tabs and forward slots/events**

Render the same forwarded props and named slots as Task 4. Use typed handlers:

~~~ts
const handleClick = (item: UTSJSONObject, index: number, event: any): void => {
  emit('click', item, index, event)
}
const handleChange = (item: UTSJSONObject, index: number): void => {
  updateCurrent(index)
  emit('change', item, index)
}
~~~

The default content slot exposes current, index, item, value, and list.

- [ ] **Step 4: Run UTS-oriented verification**

~~~powershell
node scripts/verify-tabs-parity.mjs
~~~

Expected: PASS for the complete source/type/demo contract. If a full UniApp X compiler is available, compile the tabs demo in addition to the static verifier.

- [ ] **Step 5: Commit the UTS wrapper**

~~~powershell
git add uni_modules/uview-ultra/components/up-tabs-pro/up-tabs-pro.uvue
git commit -m "feat: add UTS tabs-pro wrapper"
~~~

## Task 6: Add demo and changelog coverage

**Files:**
- Modify: pages/componentsC/tabs/tabs.uvue
- Modify: uni_modules/uview-ultra/changelog.md

**Interfaces:**
- The demo exercises shapeMode, scoped content, v-model:current, and click forwarding without altering existing examples.

- [ ] **Step 1: Add a focused demo block**

Add an up-tabs-pro example with three items, a ref-backed current index, shapeMode="capsule", and a default slot rendering the selected item/value. Keep it inside the existing tabs page and use existing up-text/up-button primitives only.

- [ ] **Step 2: Add the unreleased changelog entry**

Insert an ## Unreleased section at the top of changelog.md documenting:
- up-tabs click appends the original event as argument three while preserving the first two arguments;
- up-tabs supports upstream shape modes;
- up-tabs-pro is available in Vue and UniApp X with scoped content and transparent event forwarding.

- [ ] **Step 3: Run demo/source assertions**

~~~powershell
node scripts/verify-tabs-parity.mjs
git diff --check
~~~

Expected: both commands pass.

- [ ] **Step 4: Commit documentation/demo changes**

~~~powershell
git add pages/componentsC/tabs/tabs.uvue uni_modules/uview-ultra/changelog.md
git commit -m "docs: document tabs-pro and tabs shape modes"
~~~

## Task 7: Full verification and handoff

**Files:**
- No new files; verify all files from Tasks 1–6.

**Interfaces:**
- Confirms the repository exposes the documented component contract without regressions in existing targeted checks.

- [ ] **Step 1: Run the focused parity test**

~~~powershell
npm run verify:tabs-parity
~~~

Expected: tabs parity assertions passed.

- [ ] **Step 2: Run existing relevant regression scripts**

~~~powershell
npm run verify:swiper-vertical
npm run verify:tabbar-mid-button-top-border
npm run verify:novel-reader-ui
~~~

Expected: all existing scripts pass; no unrelated source changes are introduced.

- [ ] **Step 3: Inspect the final diff and status**

~~~powershell
git diff --check
git status --short
git log --oneline -8
~~~

Expected: no whitespace errors, only planned tabs files are changed, and each implementation task has a local commit.

- [ ] **Step 4: Report the handoff**

Report final commits, exact verification results, Vue/UTS component paths, and any platform compiler check that could not run locally.
