import { AllowedComponentProps, VNodeProps } from './_common'

export interface NovelReaderChapter {
  id?: string | number
  index?: number
  title?: string
  content?: string | string[]
  isLocked?: boolean
  [key: string]: any
}

export interface NovelReaderProgress {
  chapterId?: string | number
  chapterIndex?: number
  pageIndex?: number
  pageCount?: number
  charOffset?: number
  chapterProgress?: number
  totalProgress?: number
  scrollTop?: number
  updatedAt?: number
}

export interface NovelReaderBookmark {
  id?: string
  chapterId?: string | number
  chapterIndex?: number
  charOffset?: number
  pageIndex?: number
  scrollTop?: number
  excerpt?: string
  createdAt?: number
}

export interface NovelReaderSettings {
  theme?: 'day' | 'paper' | 'green' | 'night' | 'dark' | string
  fontSize?: number
  lineHeight?: number
  paragraphSpacing?: number
  contentWidth?: string | number
  fontFamily?: string
  fontWeight?: 400 | 600 | number
  animation?: boolean
}

declare interface NovelReaderProps {
  chapters?: NovelReaderChapter[]
  currentChapter?: NovelReaderChapter | null
  loading?: boolean
  error?: Record<string, any> | null
  bookId?: string | number
  storageKey?: string
  persist?: boolean
  initialProgress?: NovelReaderProgress | null
  progress?: NovelReaderProgress | null
  initialBookmarks?: NovelReaderBookmark[]
  bookmarks?: NovelReaderBookmark[] | null
  defaultSettings?: NovelReaderSettings
  settings?: NovelReaderSettings | null
  mode?: 'scroll' | 'page'
  showBack?: boolean
  autoBack?: boolean
  backIcon?: string
  safeAreaInsetTop?: boolean
  safeAreaInsetBottom?: boolean
  preloadThreshold?: number
  pageAnimation?: boolean
  controlsAutoHide?: number
  onChapterRequest?: (payload: Record<string, any>) => any
  onChapterPrefetch?: (payload: Record<string, any>) => any
  onProgressChange?: (progress: NovelReaderProgress) => any
  onSettingsChange?: (settings: NovelReaderSettings) => any
  onBookmarkChange?: (payload: Record<string, any>) => any
  onReadingTimeChange?: (payload: Record<string, any>) => any
  onModeChange?: (mode: 'scroll' | 'page') => any
  onToolbarChange?: (payload: Record<string, any>) => any
  onLayoutReady?: (payload: Record<string, any>) => any
  onRetry?: (payload: Record<string, any>) => any
  onBack?: () => any
}

declare interface NovelReaderSlots {
  ['default']?: () => any
  ['top']?: () => any
  ['toolbar-extra']?: () => any
  ['bottom']?: () => any
  ['catalog']?: () => any
  ['settings']?: () => any
  ['loading']?: () => any
  ['error']?: (props: { error: any; retry: () => void }) => any
  ['empty']?: () => any
}

declare interface _NovelReader {
  new (): {
    $props: AllowedComponentProps &
      VNodeProps &
      NovelReaderProps
    $slots: NovelReaderSlots
  }
}

export declare const NovelReader: _NovelReader
