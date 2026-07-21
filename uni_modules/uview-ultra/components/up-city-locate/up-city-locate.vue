<template>
	<view class="up-city-locate">
		<up-index-list :indexList="indexList">
			<template #header>
				<view class="up-current-city-wrap">
					<view class="up-current-city-title">{{ t("up.cityLocate.locateCity") }}</view>
					<view class="up-current-city-item" @tap="location">
						<view class="up-location-city">{{locationCity}}</view>
					</view>
				</view>
			</template>
			<template :key="index" v-for="(item, index) in cityList">
				<!-- #ifdef APP-NVUE -->
				<up-index-anchor :text="indexList[index]"></up-index-anchor>
				<!-- #endif -->
				<up-index-item>
					<!-- #ifndef APP-NVUE -->
					<up-index-anchor :text="indexList[index]"></up-index-anchor>
					<!-- #endif -->
					<view class="hot-city-list" v-if="index == 0">
						<view class="" v-for="(item1, index1) in item" @tap="selectedCity(item1)">
							<view class="hot-city-item">{{ item1[nameKey] }}</view>
						</view>
					</view>
					<view v-else class="item-list" v-for="(item1, index1) in item" :key="index1">
						<view class="list__item" @tap="selectedCity(item1)">
							<text class="list__item__city-name">{{item1[nameKey]}}</text>
						</view>
						<up-line></up-line>
					</view>
				</up-index-item>
			</template>
			<template #footer>
				<view class="up-safe-area-inset--bottom">
					<text class="list__footer"></text>
				</view>
			</template>
		</up-index-list>
	</view>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { t } from '../../libs/i18n'

defineOptions({
	name: 'up-city-locate',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	indexList: {
		type: Array,
		default: ['🔥']
	},
	cityList: {
		type: Array,
		default: () => {
			return [
				[{
					name: '北京',
					value: 'beijing'
				},
				{
					name: '上海',
					value: 'shanghai'
				},
				{
					name: '广州',
					value: 'guangzhou'
				},
				{
					name: '深圳',
					value: 'shenzhen'
				},
				{
					name: '杭州',
					value: 'hangzhou'
				}]
			]
		}
	},
	locationType: {
		type: String,
		default: 'wgs84'
	},
	currentCity: {
		type: String,
		default: ''
	},
	nameKey: {
		type: String,
		default: 'name'
	}
})
const emit = defineEmits(['location-success', 'select-city'])

const locationCity = ref(t("up.cityLocate.locating") + '....')

watch(() => props.currentCity, (val) => {
	locationCity.value = val
})

function selectedCity(city) {
	locationCity.value = city[props.nameKey]
	emit('select-city', {
		locationCity: locationCity.value
	})
}

function location() {
	uni.getLocation({
		type: props.locationType,
		geocode: true,
		success(res) {
			console.log(res)
			locationCity.value = res.address && res.address.city
			emit('location-success', {
				...res,
				locationCity: locationCity.value
			})
		},
		fail() {
			locationCity.value = t("up.cityLocate.fail")
		}
	})
}

onMounted(() => {
	location()
})
</script>


<style lang="scss">
	.list__item {
		padding: 8px 1px;
	}
	.up-current-city-title {
		color: grey;
		margin-bottom: 5px;
	}
	.up-current-city-item {
		height: 30px;
	}
	.hot-city-list {
		display: flex !important;
		flex-direction: row !important;
		padding: 12px 0;
		.hot-city-item {
			padding: 6px 12px;
			margin: 5px;
			border: 1px solid #ededed;
		}
	}
</style>
