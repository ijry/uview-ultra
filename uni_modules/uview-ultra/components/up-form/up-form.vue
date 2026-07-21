<template>
	<view class="up-form">
		<slot />
	</view>
</template>

<script setup>
	import { nextTick, provide, ref, toRefs, watch } from 'vue'
	import { props as formProps } from './props.js'
	import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'
	import Schema from '../../libs/util/async-validator.js'
	import { toast, getProperty, setProperty, deepClone, error } from '../../libs/function/index.js'
	import test from '../../libs/function/test.js'
	// 去除警告信息
	Schema.warning = function() {}
	/**
	 * Form 表单
	 * @description 此组件一般用于表单场景，可以配置Input输入框，Select弹出框，进行表单验证等。
	 * @tutorial https://ijry.github.io/uview-plus/components/form.html
	 * @property {Object}						model			当前form的需要验证字段的集合
	 * @property {Object | Function | Array}	rules			验证规则
	 * @property {String}						errorType		错误的提示方式，见上方说明 ( 默认 message )
	 * @property {Boolean}						borderBottom	是否显示表单域的下划线边框   ( 默认 true ）
	 * @property {String}						labelPosition	表单域提示文字的位置，left-左侧，top-上方 ( 默认 'left' ）
	 * @property {String | Number}				labelWidth		提示文字的宽度，单位px  ( 默认 45 ）
	 * @property {String}						labelAlign		lable字体的对齐方式   ( 默认 ‘left' ）
	 * @property {Object}						labelStyle		lable的样式，对象形式
	 * @example <up-formlabelPosition="left" :model="model1" :rules="rules" ref="form1"></up-form>
	 */
	defineOptions({
		name: 'up-form',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		}
		// #endif
	})

	const props = defineProps({
		...commonProps,
		...formProps.props
	})
	const { children } = useUltraUI(props)
	const {
		model,
		rules,
		errorType,
		borderBottom,
		labelPosition,
		labelWidth,
		labelAlign,
		labelStyle
	} = toRefs(props)
	const formRules = ref({})
	// 规则校验器
	const validator = ref({})
	// 原始的model快照，用于resetFields方法重置表单时使用
	const originalModel = ref(null)

	function getProps() {
		return {
			errorType: props.errorType,
			borderBottom: props.borderBottom,
			labelPosition: props.labelPosition,
			labelWidth: props.labelWidth,
			labelAlign: props.labelAlign,
			labelStyle: props.labelStyle
		}
	}

	function updateChildData() {
		if (children.value?.length) {
			children.value.map((child) => {
				// 判断子组件(up-form-item)如果有updateParentData方法的话，就执行
				typeof child.updateParentData == 'function' && child.updateParentData()
			})
		}
	}

	// 手动设置校验的规则，如果规则中有函数的话，微信小程序中会过滤掉，所以只能手动调用设置规则
	function setRules(nextRules) {
		// 判断是否有规则
		if (Object.keys(nextRules).length === 0) return
		if (process.env.NODE_ENV === 'development' && Object.keys(props.model).length === 0) {
			error('设置rules，model必须设置！如果已经设置，请刷新页面。')
			return
		}
		formRules.value = nextRules
		// 重新将规则赋予Validator
		validator.value = new Schema(nextRules)
	}

	// 清空所有up-form-item组件的内容，本质上是调用了up-form-item组件中的resetField()方法
	function resetFields() {
		resetModel()
	}

	// 重置model为初始值的快照
	function resetModel(obj) {
		// 历遍所有up-form-item，根据其prop属性，还原model的原始快照
		children.value.map((child) => {
			const prop = child?.prop
			const value = getProperty(originalModel.value, prop)
			setProperty(props.model, prop, value)
		})
	}

	// 清空校验结果
	function clearValidate(validateProps) {
		validateProps = [].concat(validateProps)
		children.value.map((child) => {
			// 如果up-form-item的prop在props数组中，则清除对应的校验结果信息
			if (validateProps[0] === undefined || validateProps.includes(child.prop)) {
				child.message = null
			}
		})
	}

	// 对部分表单字段进行校验
	async function validateField(value, callback, event = null) {
		// nextTick是必须的，否则model的变更，可能会延后于此方法的执行
		nextTick(() => {
			// 校验错误信息，返回给回调方法，用于存放所有form-item的错误信息
			const errorsRes = []
			// 如果为字符串，转为数组
			value = [].concat(value)
			// 历遍children所有子form-item
			const promises = children.value.map(child => {
				return new Promise((resolve, reject) => {
					// 用于存放form-item的错误信息
					const childErrors = []
					if (value.includes(child.prop)) {
						// 获取对应的属性，通过类似'a.b.c'的形式
						const propertyVal = getProperty(
							props.model,
							child.prop
						)
						// 属性链数组
						const propertyChain = child.prop.split('.')
						const propertyName =
							propertyChain[propertyChain.length - 1]

						let rule = []
						if (child.itemRules && child.itemRules.length > 0) {
							rule = child.itemRules
						} else {
							rule = formRules.value[child.prop]
						}
						// 如果不存在对应的规则，直接返回，否则校验器会报错
						if (!rule) {
							resolve()
							return
						}
						// rule规则可为数组形式，也可为对象形式，此处拼接成为数组
						const rules = [].concat(rule)

						// 对rules数组进行校验
						if (!rules.length) {
							resolve()
						}
						for (let i = 0; i < rules.length; i++) {
							const ruleItem = rules[i]
							// 将up-form-item的触发器转为数组形式
							const trigger = [].concat(ruleItem?.trigger)
							// 如果是有传入触发事件，但是此form-item却没有配置此触发器的话，不执行校验操作
							if (event && !trigger.includes(event)) {
								resolve()
								continue
							}
							// 实例化校验对象，传入构造规则
							const fieldValidator = new Schema({
								[propertyName]: ruleItem,
							})
							fieldValidator.validate({
								[propertyName]: propertyVal,
							},
								(errors, fields) => {
									if (test.array(errors)) {
										errors.forEach(element => {
											element.prop = child.prop
										})
										errorsRes.push(...errors)
										childErrors.push(...errors)
									}
									child.message =
										childErrors[0]?.message ? childErrors[0].message : null

									if (i == (rules.length - 1)) {
										resolve(errorsRes)
									}
								}
							)
						}
					} else {
						resolve({})
					}
				})
			})

			// 使用Promise.all来等待所有Promise完成
			Promise.all(promises)
				.then(results => {
					// 执行回调函数
					typeof callback === 'function' && callback(errorsRes)
				})
				.catch(error => {
					console.error('An error occurred:', error)
				})
		})
	}

	// 校验全部数据
	function validate(callback) {
		// 开发环境才提示，生产环境不会提示
		if (process.env.NODE_ENV === 'development' && Object.keys(formRules.value).length === 0) {
			error('未设置rules，请看文档说明！如果已经设置，请刷新页面。')
			return
		}
		return new Promise((resolve, reject) => {
			// nextTick是必须的，否则model的变更，可能会延后于validate方法
			nextTick(() => {
				// 获取所有form-item的prop，交给validateField方法进行校验
				const formItemProps = children.value.map(
					(item) => item.prop
				)
				validateField(formItemProps, (errors) => {
					if (errors.length) {
						// 如果错误提示方式为toast，则进行提示
						props.errorType === 'toast' && toast(errors[0].message)
						reject(errors)
					} else {
						resolve(true)
					}
				})
			})
		})
	}

	provide('upForm', {
		children,
		model,
		rules,
		validate,
		validateField,
		resetFields,
		clearValidate
	})

	// 监听规则的变化
	watch(() => props.rules, (n) => {
		setRules(n)
	}, { immediate: true })

	// 监听属性的变化，通知子组件up-form-item重新获取信息
	watch(() => [
		props.errorType,
		props.borderBottom,
		props.labelPosition,
		props.labelWidth,
		props.labelAlign,
		props.labelStyle
	], () => {
		updateChildData()
	})

	// 监听model的初始值作为重置表单的快照
	watch(() => props.model, (n) => {
		if (!originalModel.value) {
			originalModel.value = deepClone(n)
		}
	}, { immediate: true })

	defineExpose({
		children,
		model,
		rules,
		errorType,
		borderBottom,
		labelPosition,
		labelWidth,
		labelAlign,
		labelStyle,
		formRules,
		validator,
		originalModel,
		getProps,
		setRules,
		resetFields,
		resetModel,
		clearValidate,
		validateField,
		validate
	})
</script>

<style lang="scss" scoped>
</style>
