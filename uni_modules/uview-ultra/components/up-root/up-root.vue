<template>
	<view class="up-root" :style="[rootVars, backgroundStyle, customStyle]">
		<slot></slot>
		<RootToastHost v-if="toastHost"></RootToastHost>
	</view>
</template>

<script setup>
	/**
	 * up-root 页面级根组件（uni-app Vue3 侧）。
	 *
	 * Vue3 侧的主题变量由 index.js 安装的全局属性 helpers 提供
	 * （upThemeVars / upThemePageStyle），行为与 .uvue 版对齐。
	 */
	defineOptions({
		name: 'up-root',
		styleIsolation: 'app-and-page'
	})

	import { computed, getCurrentInstance } from 'vue'
	import { propsRoot } from './props.js'
	import RootToastHost from '../up-root-toast-host/up-root-toast-host.vue'

	const props = defineProps(propsRoot)
	const { proxy } = getCurrentInstance() || {}

	const rootVars = computed(() => proxy?.upThemeVars || {})
	const backgroundStyle = computed(() => (props.background ? (proxy?.upThemePageStyle || {}) : {}))
</script>

<style scoped>
	.up-root {
		min-height: 100vh;
	}
</style>
