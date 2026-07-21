<template>
	<up-transition
	    mode="fade"
	    :show="show"
	>
		<view
		    class="up-alert"
		    :class="[`up-alert--${type}--${effect}`]"
		    @tap.stop="clickHandler"
		    :style="[addStyle(customStyle)]"
		>
			<view
			    class="up-alert__icon"
			    v-if="showIcon"
			>
				<up-icon
				    :name="iconName"
				    size="18"
				    :color="iconColor"
				></up-icon>
			</view>
			<view
			    class="up-alert__content"
			    :style="[{
					paddingRight: closable ? '20px' : 0
				}]"
			>
				<text
				    class="up-alert__content__title"
				    v-if="title"
					:style="[{
						fontSize: addUnit(fontSize),
						textAlign: center ? 'center' : 'left'
					}]"
				    :class="[effect === 'dark' ? 'up-alert__text--dark' : `up-alert__text--${type}--light`]"
				>{{ title }}</text>
				<text
				    class="up-alert__content__desc"
					v-if="description"
					:style="[{
						fontSize: addUnit(fontSize),
						textAlign: center ? 'center' : 'left'
					}]"
				    :class="[effect === 'dark' ? 'up-alert__text--dark' : `up-alert__text--${type}--light`]"
				>{{ description }}</text>
			</view>
			<view
			    class="up-alert__close"
			    v-if="closable"
			    @tap.stop="closeHandler"
			>
				<up-icon
				    name="close"
				    :color="iconColor"
				    size="15"
				></up-icon>
			</view>
		</view>
	</up-transition>
</template>

<script setup>
	import { computed, ref } from 'vue'
	import { props as alertProps } from './props.js'
	import { commonProps } from '../../libs/composable/useUltraUI.js'
	import { addUnit, addStyle } from '../../libs/function/index.js'

	defineOptions({
		name: 'up-alert',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...alertProps.props
	})
	const emit = defineEmits(['click'])
	const show = ref(true)

	const iconColor = computed(() => {
		return props.effect === 'light' ? props.type : '#fff'
	})

	// 不同主题对应不同的图标
	const iconName = computed(() => {
		switch (props.type) {
			case 'success':
				return 'checkmark-circle-fill'
			case 'error':
				return 'close-circle-fill'
			case 'warning':
				return 'error-circle-fill'
			case 'info':
				return 'info-circle-fill'
			case 'primary':
				return 'more-circle-fill'
			default:
				return 'error-circle-fill'
		}
	})

	// 点击内容
	function clickHandler() {
		emit('click')
	}

	// 点击关闭按钮
	function closeHandler() {
		show.value = false
	}
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-alert {
		position: relative;
		background-color: $up-primary;
		padding: 8px 10px;
		@include flex(row);
		align-items: center;
		border-top-left-radius: 4px;
		border-top-right-radius: 4px;
		border-bottom-left-radius: 4px;
		border-bottom-right-radius: 4px;

		&--primary--dark {
			background-color: $up-primary;
		}

		&--primary--light {
			background-color: #ecf5ff;
		}

		&--error--dark {
			background-color: $up-error;
		}

		&--error--light {
			background-color: #FEF0F0;
		}

		&--success--dark {
			background-color: $up-success;
		}

		&--success--light {
			background-color: #f5fff0;
		}

		&--warning--dark {
			background-color: $up-warning;
		}

		&--warning--light {
			background-color: #FDF6EC;
		}

		&--info--dark {
			background-color: $up-info;
		}

		&--info--light {
			background-color: #f4f4f5;
		}

		&__icon {
			margin-right: 5px;
		}

		&__content {
			@include flex(column);
			flex: 1;

			&__title {
				color: $up-main-color;
				font-size: 14px;
				font-weight: bold;
				color: #fff;
				margin-bottom: 2px;
			}

			&__desc {
				color: $up-main-color;
				font-size: 14px;
				flex-wrap: wrap;
				color: #fff;
			}
		}

		&__title--dark,
		&__desc--dark {
			color: #FFFFFF;
		}

		&__text--primary--light,
		&__text--primary--light {
			color: $up-primary;
		}

		&__text--success--light,
		&__text--success--light {
			color: $up-success;
		}

		&__text--warning--light,
		&__text--warning--light {
			color: $up-warning;
		}

		&__text--error--light,
		&__text--error--light {
			color: $up-error;
		}

		&__text--info--light,
		&__text--info--light {
			color: $up-info;
		}

		&__close {
			position: absolute;
			top: 11px;
			right: 10px;
		}
	}
</style>
