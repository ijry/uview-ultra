<template>
    <view class="up-novel-reader__settings" :style="settingsStyle">
        <view class="up-novel-reader__settings-header">
            <text class="up-novel-reader__settings-title">阅读设置</text>
            <view class="up-novel-reader__settings-close" @tap="close">
                <up-icon name="close" size="20" :color="themeTokens.text"></up-icon>
            </view>
        </view>
        <scroll-view scroll-y class="up-novel-reader__settings-scroll">
            <view class="up-novel-reader__settings-section">
                <text class="up-novel-reader__settings-label">主题</text>
                <view class="up-novel-reader__theme-list">
                    <view
                        v-for="theme in themes"
                        :key="theme.name"
                        class="up-novel-reader__theme-option"
                        :class="{ 'is-active': draft.theme === theme.name }"
                        :style="{ backgroundColor: theme.background, color: theme.text }"
                        @tap="update({ theme: theme.name })"
                    >
                        <text>{{ theme.label }}</text>
                    </view>
                </view>
            </view>
            <view class="up-novel-reader__settings-section">
                <view class="up-novel-reader__settings-row">
                    <text class="up-novel-reader__settings-label">字号</text>
                    <text class="up-novel-reader__settings-value">{{ draft.fontSize }}</text>
                </view>
                <up-slider
                    :model-value="Number(draft.fontSize)"
                    :min="12"
                    :max="30"
                    :step="1"
                    active-color="#2979ff"
                    @update:model-value="update({ fontSize: $event })"
                ></up-slider>
            </view>
            <view class="up-novel-reader__settings-section">
                <view class="up-novel-reader__settings-row">
                    <text class="up-novel-reader__settings-label">行距</text>
                    <text class="up-novel-reader__settings-value">{{ Number(draft.lineHeight).toFixed(1) }}</text>
                </view>
                <up-slider
                    :model-value="Number(draft.lineHeight) * 10"
                    :min="10"
                    :max="30"
                    :step="1"
                    active-color="#2979ff"
                    @update:model-value="update({ lineHeight: Number($event) / 10 })"
                ></up-slider>
            </view>
            <view class="up-novel-reader__settings-section">
                <view class="up-novel-reader__settings-row">
                    <text class="up-novel-reader__settings-label">段距</text>
                    <text class="up-novel-reader__settings-value">{{ draft.paragraphSpacing }}</text>
                </view>
                <up-slider
                    :model-value="Number(draft.paragraphSpacing)"
                    :min="0"
                    :max="40"
                    :step="2"
                    active-color="#2979ff"
                    @update:model-value="update({ paragraphSpacing: $event })"
                ></up-slider>
            </view>
            <view class="up-novel-reader__settings-section">
                <view class="up-novel-reader__settings-row">
                    <text class="up-novel-reader__settings-label">粗体正文</text>
                    <up-switch
                        :model-value="Number(draft.fontWeight) >= 600"
                        @change="update({ fontWeight: $event ? 600 : 400 })"
                    ></up-switch>
                </view>
                <view class="up-novel-reader__settings-row">
                    <text class="up-novel-reader__settings-label">翻页动画</text>
                    <up-switch
                        :model-value="draft.animation !== false"
                        @change="update({ animation: $event })"
                    ></up-switch>
                </view>
            </view>
            <slot></slot>
        </scroll-view>
    </view>
</template>

<script>
export default {
    name: 'NovelReaderSettings',
    props: {
        settings: {
            type: Object,
            default: () => ({})
        },
        themeTokens: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['update-settings', 'close'],
    data() {
        return {
            draft: { ...this.settings },
            themes: [
                { name: 'day', label: '日间', background: '#f7f8fa', text: '#303133' },
                { name: 'paper', label: '羊皮纸', background: '#f3ead7', text: '#51483d' },
                { name: 'green', label: '护眼绿', background: '#e7f1e4', text: '#3f5140' },
                { name: 'night', label: '夜间', background: '#202124', text: '#d6d7da' },
                { name: 'dark', label: '深色', background: '#111214', text: '#e5e7eb' }
            ]
        }
    },
    computed: {
        settingsStyle() {
            return {
                backgroundColor: this.themeTokens.background || '#f7f8fa',
                color: this.themeTokens.text || '#303133'
            }
        }
    },
    watch: {
        settings: {
            handler(value) {
                this.draft = { ...value }
            },
            deep: true
        }
    },
    methods: {
        update(patch) {
            this.draft = { ...this.draft, ...patch }
            this.$emit('update-settings', { ...this.draft })
        },
        close() {
            this.$emit('close')
        }
    }
}
</script>

<style lang="scss" scoped>
.up-novel-reader__settings {
    width: 100%;
    max-height: 78vh;
}

.up-novel-reader__settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 12px;
}

.up-novel-reader__settings-title {
    font-size: 18px;
    font-weight: 600;
}

.up-novel-reader__settings-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
}

.up-novel-reader__settings-scroll {
    max-height: calc(78vh - 64px);
    padding: 0 20px 24px;
    box-sizing: border-box;
}

.up-novel-reader__settings-section {
    padding: 14px 0;
}

.up-novel-reader__settings-label {
    font-size: 14px;
}

.up-novel-reader__settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 34px;
}

.up-novel-reader__settings-value {
    color: var(--up-novel-reader-muted, #909399);
    font-size: 13px;
}

.up-novel-reader__theme-list {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.up-novel-reader__theme-option {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 42px;
    border: 1px solid transparent;
    border-radius: 8px;
    font-size: 12px;
}

.up-novel-reader__theme-option.is-active {
    border-color: var(--up-novel-reader-active, #2979ff);
    box-shadow: 0 0 0 2px rgba(41, 121, 255, 0.18);
}
</style>
