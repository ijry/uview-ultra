<template>
    <view
        class="up-novel-reader"
        :class="[customClass, `theme-${settings.theme}`]"
        :style="[readerStyle, customStyle]"
    >
        <view v-if="controlsVisible" class="up-novel-reader__top">
            <up-status-bar v-if="safeAreaInsetTop"></up-status-bar>
            <reader-toolbar
                position="top"
                :title="chapterTitle"
                :show-back="showBack"
                :back-icon="backIcon"
                :is-bookmarked="isBookmarked"
                :progress="progressState"
                :current-chapter-index="currentChapterIndex"
                :chapter-count="chapters.length"
                :theme-tokens="themeTokens"
                @back="handleBack"
                @toggle-catalog="catalogVisible = true"
                @toggle-settings="settingsVisible = true"
                @toggle-bookmark="toggleBookmark"
                @toggle-controls="toggleControls"
            >
                <template #top>
                    <slot name="top"></slot>
                </template>
                <template #toolbar-extra>
                    <slot name="toolbar-extra"></slot>
                </template>
            </reader-toolbar>
        </view>

        <reader-content
            ref="contentRef"
            class="up-novel-reader__body"
            :mode="resolvedMode"
            :paragraphs="content.paragraphs"
            :pages="pages"
            :page-index="pageIndex"
            :scroll-top="progressState.scrollTop"
            :settings="settings"
            :theme-tokens="themeTokens"
            :loading="loading"
            :error="error"
            :page-animation="pageAnimation && settings.animation"
            @content-scroll="handleContentScroll"
            @page-change="handlePageChange"
            @tap-zone="handleTapZone"
            @retry="handleRetry"
        >
            <template #loading>
                <slot name="loading">
                    <text class="up-novel-reader__state-text">章节加载中</text>
                </slot>
            </template>
            <template #error="slotProps">
                <slot name="error" v-bind="slotProps">
                    <text class="up-novel-reader__state-text">{{ error && error.message || '章节加载失败' }}</text>
                    <view class="up-novel-reader__state-action" @tap.stop="handleRetry">重试</view>
                </slot>
            </template>
            <template #empty>
                <slot name="empty">
                    <text class="up-novel-reader__state-text">暂无正文</text>
                </slot>
            </template>
        </reader-content>

        <view v-if="controlsVisible" class="up-novel-reader__bottom">
            <reader-toolbar
                position="bottom"
                :progress="progressState"
                :page-count="pages.length"
                :current-chapter-index="currentChapterIndex"
                :chapter-count="chapters.length"
                :has-previous="hasPrevious"
                :has-next="hasNext"
                :theme-tokens="themeTokens"
                @previous="requestPrevious"
                @next="requestNext"
                @toggle-settings="settingsVisible = true"
                @toggle-controls="toggleControls"
            >
                <template #bottom>
                    <slot name="bottom"></slot>
                </template>
            </reader-toolbar>
            <up-safe-bottom v-if="safeAreaInsetBottom"></up-safe-bottom>
        </view>

        <up-popup
            v-model:show="catalogVisible"
            mode="left"
            :safe-area-inset-top="false"
            :safe-area-inset-bottom="false"
            @close="catalogVisible = false"
        >
            <reader-catalog
                :chapters="chapters"
                :current-chapter="activeChapter"
                :bookmarks="bookmarks"
                :progress="progressState"
                :theme-tokens="themeTokens"
                @chapter-select="handleChapterSelect"
                @bookmark-select="handleBookmarkSelect"
            >
                <slot name="catalog"></slot>
            </reader-catalog>
        </up-popup>

        <up-popup
            v-model:show="settingsVisible"
            mode="bottom"
            :safe-area-inset-top="false"
            :safe-area-inset-bottom="false"
            @close="settingsVisible = false"
        >
            <reader-settings
                :settings="settings"
                :theme-tokens="themeTokens"
                @update-settings="handleSettingsUpdate"
                @close="settingsVisible = false"
            >
                <slot name="settings"></slot>
            </reader-settings>
        </up-popup>
    </view>
</template>

<script setup>
import {
    computed,
    getCurrentInstance,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch
} from 'vue'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
import readerProps from './props.js'
import ReaderContent from './reader-content.vue'
import ReaderToolbar from './reader-toolbar.vue'
import ReaderCatalog from './reader-catalog.vue'
import ReaderSettings from './reader-settings.vue'
import {
    consumeReadingTime as consumeActiveReadingTime,
    createBookmark,
    mergeReaderSettings,
    normalizeMode,
    pauseReading as pauseActiveReading,
    startReading
} from './reader-core.js'
import { normalizeContent, normalizeProgress } from './content-normalizer.js'
import { createMeasureText, measureContainer } from './measure-adapter.js'
import { paginateParagraphs, resolveAnchor } from './layout-engine.js'
import {
    createStorageKey,
    readPersistedState,
    writePersistedState
} from './persistence.js'

defineOptions({
    name: 'up-novel-reader',
    components: {
        ReaderContent,
        ReaderToolbar,
        ReaderCatalog,
        ReaderSettings
    }
})

const props = defineProps({
    ...commonProps,
    ...readerProps.props
})

const emit = defineEmits([
    'chapter-request',
    'chapter-prefetch',
    'progress-change',
    'settings-change',
    'bookmark-change',
    'reading-time-change',
    'back',
    'mode-change',
    'toolbar-change',
    'layout-ready',
    'retry'
])

useUltraUI(props)

const instance = getCurrentInstance()
const contentRef = ref(null)
const currentChapterInner = ref(props.currentChapter)
const settings = ref(mergeReaderSettings(props.defaultSettings, props.settings))
const progressState = ref({})
const bookmarks = ref([])
const content = ref(normalizeContent(currentChapterInner.value && currentChapterInner.value.content))
const pages = ref([])
const pageIndex = ref(0)
const resolvedMode = ref(normalizeMode(props.mode))
const controlsVisible = ref(true)
const catalogVisible = ref(false)
const settingsVisible = ref(false)
const layoutReady = ref(false)
const layout = ref({ width: 320, height: 500 })
const readingState = ref({
    active: false,
    lastActiveAt: 0,
    readingTime: 0
})

const storageKey = createStorageKey({
    storageKey: props.storageKey,
    bookId: props.bookId
})
let persistedState = null
let persistTimer = null
let controlsTimer = null
let readingTimer = null
let resizeHandler = null
const pendingBookmark = ref(null)
const prefetchedTarget = ref('')

const chapters = computed(() => Array.isArray(props.chapters) ? props.chapters : [])
const activeChapter = computed(() => currentChapterInner.value || props.currentChapter || null)
const chapterTitle = computed(() => (
    activeChapter.value && activeChapter.value.title
        ? String(activeChapter.value.title)
        : '小说阅读'
))
const currentChapterIndex = computed(() => {
    const value = Number(activeChapter.value && activeChapter.value.index)
    if (Number.isFinite(value)) return value
    const progressIndex = Number(progressState.value.chapterIndex)
    return Number.isFinite(progressIndex) ? progressIndex : -1
})
const hasPrevious = computed(() => currentChapterIndex.value > 0)
const hasNext = computed(() => (
    currentChapterIndex.value >= 0 &&
    currentChapterIndex.value < chapters.value.length - 1
))
const currentBookmarkId = computed(() => {
    if (!activeChapter.value) return ''
    return createBookmark({
        chapterId: activeChapter.value.id,
        chapterIndex: currentChapterIndex.value,
        charOffset: progressState.value.charOffset
    }).id
})
const isBookmarked = computed(() => bookmarks.value.some(item => item && item.id === currentBookmarkId.value))
const themeTokens = computed(() => {
    const themes = {
        day: {
            background: '#f7f8fa',
            text: '#303133',
            muted: '#909399',
            toolbar: '#ffffff',
            border: 'rgba(48, 49, 51, 0.12)',
            active: '#2979ff',
            disabled: '#c8c9cc'
        },
        paper: {
            background: '#f3ead7',
            text: '#51483d',
            muted: '#8f806d',
            toolbar: '#f7efdf',
            border: 'rgba(81, 72, 61, 0.16)',
            active: '#9b7653',
            disabled: '#c7b9a3'
        },
        green: {
            background: '#e7f1e4',
            text: '#3f5140',
            muted: '#708371',
            toolbar: '#eef6eb',
            border: 'rgba(63, 81, 64, 0.16)',
            active: '#4d8b55',
            disabled: '#b6c7b4'
        },
        night: {
            background: '#202124',
            text: '#d6d7da',
            muted: '#9ca0a8',
            toolbar: '#292b30',
            border: 'rgba(214, 215, 218, 0.16)',
            active: '#7da7ff',
            disabled: '#62656d'
        },
        dark: {
            background: '#111214',
            text: '#e5e7eb',
            muted: '#9ca3af',
            toolbar: '#1b1d21',
            border: 'rgba(229, 231, 235, 0.16)',
            active: '#8ab4ff',
            disabled: '#5f6368'
        }
    }
    return themes[settings.value.theme] || themes.day
})
const readerStyle = computed(() => ({
    backgroundColor: themeTokens.value.background,
    color: themeTokens.value.text
}))

function getWindowMetrics() {
    try {
        if (typeof uni !== 'undefined' && typeof uni.getWindowInfo === 'function') {
            const info = uni.getWindowInfo()
            return {
                width: Number(info.windowWidth) || 375,
                height: Number(info.windowHeight) || 667
            }
        }
    } catch (error) {
        return { width: 375, height: 667 }
    }
    return { width: 375, height: 667 }
}

function getArticleWidth(width) {
    const value = settings.value.contentWidth
    if (typeof value === 'number') {
        return Math.max(1, width * Math.min(100, Math.max(1, value)) / 100)
    }
    const source = String(value || '92%').trim()
    if (source.endsWith('%')) {
        const percent = Number.parseFloat(source)
        return Number.isFinite(percent)
            ? Math.max(1, width * Math.min(100, Math.max(1, percent)) / 100)
            : width * 0.92
    }
    const pixels = Number.parseFloat(source)
    return Number.isFinite(pixels) ? Math.max(1, Math.min(width, pixels)) : width * 0.92
}

function emitProgress() {
    const normalized = normalizeProgress({
        ...progressState.value,
        pageIndex: pageIndex.value,
        pageCount: pages.value.length
    }, activeChapter.value)
    progressState.value = normalized
    emit('progress-change', normalized)
    queuePersist()
}

function refreshContent() {
    content.value = normalizeContent(activeChapter.value && activeChapter.value.content)
    prefetchedTarget.value = ''
    const restored = normalizeProgress(progressState.value, activeChapter.value)
    progressState.value = restored
    pageIndex.value = 0
    if (pendingBookmark.value && activeChapter.value &&
        pendingBookmark.value.chapterId === activeChapter.value.id) {
        progressState.value = normalizeProgress({
            ...progressState.value,
            charOffset: pendingBookmark.value.charOffset,
            pageIndex: pendingBookmark.value.pageIndex,
            scrollTop: pendingBookmark.value.scrollTop
        }, activeChapter.value)
        pendingBookmark.value = null
    }
    nextTick(refreshLayout)
}

async function refreshLayout() {
    const fallback = getWindowMetrics()
    let rect = null
    try {
        rect = await measureContainer('.up-novel-reader__content', instance && instance.proxy)
    } catch (error) {
        rect = null
    }
    const width = Math.max(1, Number(rect && rect.width) || fallback.width)
    const height = Math.max(1, Number(rect && rect.height) || fallback.height)
    const articleWidth = getArticleWidth(width)
    layout.value = { width: articleWidth, height }
    const measureText = createMeasureText({ style: settings.value })
    const nextLayout = paginateParagraphs(content.value.paragraphs, {
        width: articleWidth,
        height,
        fontSize: settings.value.fontSize,
        lineHeight: settings.value.lineHeight,
        paragraphSpacing: settings.value.paragraphSpacing,
        measureText
    })
    pages.value = nextLayout.pages
    const anchor = resolveAnchor(pages.value, progressState.value.charOffset)
    pageIndex.value = anchor.pageIndex
    progressState.value = normalizeProgress({
        ...progressState.value,
        pageIndex: pageIndex.value,
        pageCount: nextLayout.pageCount
    }, activeChapter.value)
    layoutReady.value = true
    emit('layout-ready', {
        width,
        height,
        pageCount: nextLayout.pageCount,
        mode: resolvedMode.value
    })
    emitProgress()
}

function scheduleControlsAutoHide() {
    if (controlsTimer) clearTimeout(controlsTimer)
    if (props.controlsAutoHide > 0 && controlsVisible.value) {
        controlsTimer = setTimeout(() => {
            controlsVisible.value = false
        }, props.controlsAutoHide)
    }
}

function toggleControls() {
    controlsVisible.value = !controlsVisible.value
    if (controlsVisible.value) scheduleControlsAutoHide()
}

function updateProgress(patch) {
    progressState.value = normalizeProgress({
        ...progressState.value,
        ...patch,
        pageIndex: patch && patch.pageIndex !== undefined ? patch.pageIndex : pageIndex.value,
        pageCount: pages.value.length
    }, activeChapter.value)
    emit('progress-change', progressState.value)
    queuePersist()
}

function handleContentScroll(event) {
    const detail = event && event.detail ? event.detail : {}
    const scrollTop = Math.max(0, Number(detail.scrollTop) || 0)
    const scrollHeight = Number(detail.scrollHeight) || 0
    const viewportHeight = Number(detail.height) || layout.value.height
    const maxScrollTop = Math.max(0, scrollHeight - viewportHeight)
    const ratio = maxScrollTop > 0 ? Math.min(1, scrollTop / maxScrollTop) : 0
    updateProgress({
        scrollTop,
        charOffset: content.value.length * ratio,
        chapterProgress: ratio
    })
    if (
        hasNext.value &&
        scrollHeight > 0 &&
        scrollTop + viewportHeight >= scrollHeight - Math.max(80, props.preloadThreshold * 160)
    ) {
        requestPrefetch()
    }
    scheduleControlsAutoHide()
}

function handlePageChange(payload) {
    const nextPageIndex = Math.max(
        0,
        Math.min(pages.value.length ? pages.value.length - 1 : 0, Number(payload && payload.pageIndex) || 0)
    )
    pageIndex.value = nextPageIndex
    const page = pages.value[nextPageIndex]
    updateProgress({
        pageIndex: nextPageIndex,
        charOffset: page ? page.startOffset : 0,
        chapterProgress: content.value.length && page
            ? Math.min(1, Math.max(0, page.startOffset / content.value.length))
            : 0
    })
    if (hasNext.value && pages.value.length - nextPageIndex <= Math.max(1, props.preloadThreshold)) {
        requestPrefetch()
    }
    scheduleControlsAutoHide()
}

function handleTapZone(zone) {
    if (zone === 'center') {
        toggleControls()
        return
    }
    if (resolvedMode.value === 'page') {
        if (zone === 'left') requestPrevious()
        if (zone === 'right') requestNext()
        return
    }
    toggleControls()
}

function requestPrefetch() {
    const target = chapters.value[currentChapterIndex.value + 1]
    if (!target) return
    const targetKey = String(target.id != null ? target.id : target.index)
    if (prefetchedTarget.value === targetKey) return
    prefetchedTarget.value = targetKey
    emit('chapter-prefetch', {
        direction: 'next',
        targetIndex: Number(target.index),
        targetId: target.id,
        chapter: target,
        currentChapter: activeChapter.value
    })
}

function requestChapter(direction, targetIndex, targetId) {
    const target = chapters.value.find(chapter => (
        (targetId != null && chapter && chapter.id === targetId) ||
        (targetId == null && Number(chapter && chapter.index) === Number(targetIndex))
    ))
    if (!target || target.isLocked) return
    emit('chapter-request', {
        direction,
        targetIndex: Number(target.index),
        targetId: target.id,
        chapter: target,
        currentChapter: activeChapter.value
    })
}

function requestPrevious() {
    if (hasPrevious.value) {
        requestChapter('previous', currentChapterIndex.value - 1)
    }
}

function requestNext() {
    if (hasNext.value) {
        requestChapter('next', currentChapterIndex.value + 1)
    }
}

function handleChapterSelect(chapter) {
    catalogVisible.value = false
    if (chapter && chapter.id === (activeChapter.value && activeChapter.value.id)) return
    requestChapter('select', chapter && chapter.index, chapter && chapter.id)
}

function handleBookmarkSelect(bookmark) {
    catalogVisible.value = false
    if (!bookmark) return
    if (bookmark.chapterId !== (activeChapter.value && activeChapter.value.id)) {
        pendingBookmark.value = bookmark
        requestChapter('bookmark', bookmark.chapterIndex, bookmark.chapterId)
        return
    }
    updateProgress({
        charOffset: bookmark.charOffset,
        pageIndex: bookmark.pageIndex,
        scrollTop: bookmark.scrollTop
    })
    nextTick(refreshLayout)
}

function toggleBookmark() {
    if (!activeChapter.value) return
    const bookmark = createBookmark({
        chapterId: activeChapter.value.id,
        chapterIndex: currentChapterIndex.value,
        charOffset: progressState.value.charOffset,
        pageIndex: pageIndex.value,
        scrollTop: progressState.value.scrollTop,
        excerpt: content.value.text.slice(
            Math.max(0, Number(progressState.value.charOffset) || 0),
            Math.max(0, Number(progressState.value.charOffset) || 0) + 56
        )
    })
    const existingIndex = bookmarks.value.findIndex(item => item && item.id === bookmark.id)
    const nextBookmarks = existingIndex === -1
        ? [...bookmarks.value, bookmark]
        : bookmarks.value.filter((_, index) => index !== existingIndex)
    bookmarks.value = nextBookmarks
    emit('bookmark-change', {
        bookmarks: nextBookmarks,
        bookmark,
        active: existingIndex === -1
    })
    queuePersist()
}

function handleSettingsUpdate(nextSettings) {
    settings.value = mergeReaderSettings(settings.value, nextSettings)
    emit('settings-change', settings.value)
    queuePersist()
    nextTick(refreshLayout)
}

function handleBack() {
    emit('back')
    if (props.autoBack && typeof uni !== 'undefined' && typeof uni.navigateBack === 'function') {
        uni.navigateBack()
    }
}

function handleRetry() {
    emit('retry', {
        chapter: activeChapter.value,
        chapterId: activeChapter.value && activeChapter.value.id
    })
}

function queuePersist() {
    if (!props.persist || !storageKey) return
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(flushPersistence, 300)
}

function flushPersistence() {
    if (!props.persist || !storageKey) return
    if (persistTimer) {
        clearTimeout(persistTimer)
        persistTimer = null
    }
    const state = consumeActiveReadingTime(readingState.value, Date.now())
    readingState.value = state
    writePersistedState(storageKey, {
        progress: progressState.value,
        settings: settings.value,
        bookmarks: bookmarks.value,
        readingTime: state.readingTime
    })
}

function pauseReading() {
    readingState.value = pauseActiveReading(readingState.value, Date.now())
    emit('reading-time-change', {
        readingTime: readingState.value.readingTime,
        active: false
    })
}

function initializeReaderState() {
    persistedState = props.persist ? readPersistedState(storageKey) : null
    settings.value = mergeReaderSettings(
        props.defaultSettings,
        persistedState && persistedState.settings,
        props.settings
    )
    bookmarks.value = Array.isArray(props.bookmarks)
        ? props.bookmarks.slice()
        : persistedState && Array.isArray(persistedState.bookmarks)
            ? persistedState.bookmarks.slice()
            : Array.isArray(props.initialBookmarks)
                ? props.initialBookmarks.slice()
                : []
    progressState.value = normalizeProgress(
        props.progress || props.initialProgress || (persistedState && persistedState.progress),
        activeChapter.value
    )
    readingState.value = startReading({
        active: false,
        lastActiveAt: 0,
        readingTime: persistedState && Number(persistedState.readingTime) || 0
    })
    refreshContent()
    emit('reading-time-change', {
        readingTime: readingState.value.readingTime,
        active: true
    })
    scheduleControlsAutoHide()
}

watch(() => props.currentChapter, value => {
    currentChapterInner.value = value
    refreshContent()
}, { deep: true })

watch(() => props.mode, value => {
    const nextMode = normalizeMode(value)
    if (nextMode === resolvedMode.value) return
    resolvedMode.value = nextMode
    emit('mode-change', nextMode)
    nextTick(refreshLayout)
})

watch(() => props.settings, value => {
    if (value) {
        settings.value = mergeReaderSettings(settings.value, value)
        nextTick(refreshLayout)
    }
}, { deep: true })

watch(() => props.progress, value => {
    if (value) {
        progressState.value = normalizeProgress(value, activeChapter.value)
        nextTick(refreshLayout)
    }
}, { deep: true })

watch(() => props.bookmarks, value => {
    if (Array.isArray(value)) bookmarks.value = value.slice()
}, { deep: true })

watch(controlsVisible, value => {
    emit('toolbar-change', { visible: value })
})

onMounted(() => {
    initializeReaderState()
    resizeHandler = () => nextTick(refreshLayout)
    if (typeof uni !== 'undefined' && typeof uni.onWindowResize === 'function') {
        uni.onWindowResize(resizeHandler)
    }
    readingTimer = setInterval(() => {
        if (!readingState.value.active) return
        readingState.value = consumeActiveReadingTime(readingState.value, Date.now())
        emit('reading-time-change', {
            readingTime: readingState.value.readingTime,
            active: true
        })
    }, 10000)
})

onBeforeUnmount(() => {
    if (controlsTimer) clearTimeout(controlsTimer)
    if (readingTimer) clearInterval(readingTimer)
    if (typeof uni !== 'undefined' && typeof uni.offWindowResize === 'function' && resizeHandler) {
        uni.offWindowResize(resizeHandler)
    }
    pauseReading()
    flushPersistence()
})
</script>

<style lang="scss" scoped>
@import './theme-vars.scss';

.up-novel-reader {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    overflow: hidden;
    background-color: var(--up-novel-reader-background, #f7f8fa);
    color: var(--up-novel-reader-text, #303133);
    transition: background-color 160ms ease, color 160ms ease;
}

.up-novel-reader__top,
.up-novel-reader__bottom {
    flex-shrink: 0;
    background-color: var(--up-novel-reader-toolbar, #fff);
}

.up-novel-reader__body {
    flex: 1;
    min-height: 0;
}

.up-novel-reader__state-text {
    color: var(--up-novel-reader-muted, #909399);
    font-size: 14px;
}

.up-novel-reader__state-action {
    padding: 8px 18px;
    color: var(--up-novel-reader-active, #2979ff);
    font-size: 14px;
}
</style>
