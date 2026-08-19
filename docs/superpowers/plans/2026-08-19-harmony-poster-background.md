# Harmony Poster Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the poster background and every layer that appears before an asynchronously loaded image on HarmonyOS.

**Architecture:** Preload all poster image resources after the Harmony canvas is ready but before issuing any drawing commands. Cache the resulting canvas images, then render the existing poster view list once in its original order so no drawing crosses an asynchronous image-loading boundary.

**Tech Stack:** uni-app x, UTS, HarmonyOS Canvas 2D, Node.js static verification.

## Global Constraints

- Do not change the public poster JSON format.
- Preserve view ordering and existing fallback rendering.
- Do not package or install the app; the user will deploy through HBuilderX.

---

### Task 1: Add the image preload regression check

**Files:**
- Create: `scripts/verify-harmony-poster-image-preload.mjs`
- Modify: `package.json`

- [ ] Assert poster images are preloaded before `drawPoster()` starts.
- [ ] Assert `drawImageBox()` only consumes cached images and does not call `uni.getImageInfo()`.
- [ ] Run `node scripts/verify-harmony-poster-image-preload.mjs` and confirm it fails before implementation.

### Task 2: Preload poster images before rendering

**Files:**
- Modify: `uni_modules/uview-ultra/components/up-poster/up-poster.uvue`

- [ ] Add a per-generation image cache.
- [ ] Load every image view after canvas initialization.
- [ ] Start ordered drawing only after preloading completes.
- [ ] Draw cached images synchronously and retain the existing placeholder fallback.

### Task 3: Verify the focused fix

**Files:**
- Test: `scripts/verify-harmony-poster-image-preload.mjs`
- Test: `scripts/verify-harmony-canvas-draw-state.mjs`

- [ ] Run the focused preload verifier.
- [ ] Run the existing Harmony canvas state verifier.
- [ ] Run `git diff --check` on the touched files.
- [ ] Ask the user to redeploy and provide a screenshot of the poster example.
