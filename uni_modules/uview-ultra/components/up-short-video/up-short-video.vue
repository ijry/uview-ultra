<template>
	<view class="up-short-video">
		<!-- 顶部导航区域 -->
		<view class="up-short-video__header">
			<slot name="menu">
				<view class="up-short-video__header__menu">
					<up-icon name="grid" size="24"></up-icon>
				</view>
			</slot>

			<up-tabs
				:list="tabsList"
				:current="currentTab"
                lineColor="#ddd"
                :activeStyle="{
                    color: '#ddd',
                    fontWeight: 400,
                    transform: 'scale(1)'
                }"
                :inactiveStyle="{
                    color: '#bbb',
                    transform: 'scale(1)'
                }"
				@change="handleTabChange"
				class="up-short-video__header__tabs"
			></up-tabs>

			<slot name="search">
				<view class="up-short-video__header__search">
					<up-icon name="search" size="24"></up-icon>
				</view>
			</slot>
		</view>

		<!-- 视频内容区域 -->
		<swiper
			:vertical="true"
			:autoplay="false"
			@change="handleSwiperChange"
			:current="currentVideo"
			class="up-short-video__content"
		>
			<swiper-item v-for="(item, index) in videoList" :key="index">
				<view class="up-short-video__content__item">
					<!-- 视频播放区域 -->
					<view class="up-short-video__content__video">
						<video
							:id="'video-' + index"
							:src="item.videoUrl"
							:autoplay="index === currentVideo"
							:controls="false"
							:show-fullscreen-btn="false"
							:show-play-btn="false"
							:show-center-play-btn="false"
							:enable-progress-gesture="true"
							:loop="true"
							:playback-rate="item.playbackRate || 1.0"
							@play="onVideoPlay"
							@pause="onVideoPause"
							@ended="onVideoEnded"
							@timeupdate="onTimeUpdate"
							@loadedmetadata="onLoadedMetadata"
							style="width: 100%; height: 100%;"
						></video>

						<!-- 倍速设置按钮 -->
						<!-- <view class="up-short-video__content__video__speed" @click="showSpeedOptions(index)">
							<text class="speed-text">{{ item.playbackRate || 1.0 }}x</text>
							<up-icon name="arrow-down" size="12" color="#fff"></up-icon>
						</view> -->
					</view>

					<!-- 作者信息 -->
					<view class="up-short-video__content__author">
						<view class="up-short-video__content__author__avatar">
							<up-avatar :src="item.author.avatar" size="50px"></up-avatar>
						</view>
						<view class="up-short-video__content__author__info">
							<text class="up-short-video__content__author__name">{{ item.author.name }}</text>
							<text class="up-short-video__content__author__desc">{{ item.author.desc }}</text>
						</view>
						<view class="up-short-video__content__author__follow">
							<up-button type="primary" size="mini">关注</up-button>
						</view>
					</view>

					<!-- 右侧操作区域 -->
					<view class="up-short-video__content__actions">
						<slot name="actions" :item="item" :index="index">
							<view class="up-short-video__content__actions__item" @click="handleLike(item, index)">
								<up-icon color="#eee" :name="item.isLiked ? 'thumb-up-fill' : 'thumb-up'" size="32px"></up-icon>
								<text class="up-short-video__content__actions__text">{{ item.likeCount }}</text>
							</view>
							<view class="up-short-video__content__actions__item" @click="handleComment(item, index)">
								<up-icon color="#eee" name="chat" size="32px"></up-icon>
								<text class="up-short-video__content__actions__text">{{ item.commentCount }}</text>
							</view>
							<view class="up-short-video__content__actions__item" @click="handleShare(item, index)">
								<up-icon color="#eee" name="share" size="32px"></up-icon>
								<text class="up-short-video__content__actions__text">{{ item.shareCount }}</text>
							</view>
							<view class="up-short-video__content__actions__item" @click="handleCollect(item, index)">
								<up-icon color="#eee" :name="item.isCollected ? 'bookmark-fill' : 'bookmark'" size="32px"></up-icon>
								<text class="up-short-video__content__actions__text">{{ item.collectCount }}</text>
							</view>
						</slot>
					</view>
				</view>
			</swiper-item>
		</swiper>

		<!-- 倍速选择弹窗 -->
		<up-action-sheet
			:show="showSpeedSheet"
			:actions="speedOptions"
			title="播放速度"
			@close="showSpeedSheet = false"
			@select="selectSpeed"
		></up-action-sheet>

		<!-- 底部导航栏 -->
		<view class="up-short-video__footer">
			<!-- 进度条 -->
			<view class="up-short-video__progress" style="z-index: 999;">
				<up-slider
					:value="videoList[currentVideo]?.progress"
					:min="0"
					:max="100"
					:step="1"
					:show-value="false"
                    :innerStyle="{padding: 0}"
                    activeColor="rgba(255,255,255,0.32)"
					inactive-color="rgba(255,255,255,0.3)"
					block-size="6px"
                    block-color="rgba(255,255,255,0.5)"
					height="1px"
					@changing="onProgressChanging"
					@change="onProgressChange"
				></up-slider>
			</view>

			<slot name="tabbar">
				<up-tabbar
                    :fixed="true"
                    :placeholder="true"
                    :safeAreaInsetBottom="true"
                    borderColor="rgba(255,255,255,0.25) !important"
                    backgroundColor="rgba(255,255,255,0.05)"
                >
				<up-tabbar-item
					@click="goNext"
					text="首页"
					icon="home"
				>
				</up-tabbar-item>
				<up-tabbar-item
					text="放映厅"
					icon="photo"
				></up-tabbar-item>
				<up-tabbar-item
					text="直播"
					icon="play-right"
				></up-tabbar-item>
				<up-tabbar-item
					text="我的"
					icon="account"
				></up-tabbar-item>
			</up-tabbar>
			</slot>
		</view>
	</view>
</template>

<script setup>
import { getCurrentInstance, nextTick, ref } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-short-video',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	// tabs标签列表
	tabsList: {
		type: Array,
		default: () => [
			{ name: '推荐' },
			{ name: '关注' },
			{ name: '朋友' },
			{ name: '本地' }
		]
	},
	// 视频列表数据
	videoList: {
		type: Array,
		default: () => []
	},
	// 当前选中的tab索引
	currentTab: {
		type: Number,
		default: 0
	},
	// 当前播放的视频索引
	currentVideo: {
		type: Number,
		default: 0
	}
})
const emit = defineEmits([
	'tabChange',
	'videoChange',
	'like',
	'comment',
	'share',
	'collect',
	'progressChanging',
	'progressChange',
	'videoPlay',
	'videoPause',
	'videoEnded',
	'timeUpdate',
	'loadedMetadata'
])
const instance = getCurrentInstance()
const proxy = instance?.proxy

const progressValue = ref(0)
const showSpeedSheet = ref(false)
const currentSpeedVideoIndex = ref(0)
const speedOptions = ref([
	{ name: '0.5x', value: 0.5 },
	{ name: '0.75x', value: 0.75 },
	{ name: '1.0x', value: 1.0 },
	{ name: '1.25x', value: 1.25 },
	{ name: '1.5x', value: 1.5 },
	{ name: '2.0x', value: 2.0 }
])

function handleTabChange(index) {
	emit('tabChange', index)
}

function playVideo(index) {
	const videoContext = uni.createVideoContext('video-' + index, proxy)
	videoContext.play()
}

function pauseCurrentVideo() {
	const videoContext = uni.createVideoContext('video-' + props.currentVideo, proxy)
	videoContext.pause()
}

function handleSwiperChange(e) {
	const currentIndex = e.detail.current
	pauseCurrentVideo()
	nextTick(() => {
		playVideo(currentIndex)
	})
	emit('videoChange', currentIndex)
}

function handleLike(item, index) {
	emit('like', { item, index })
}

function handleComment(item, index) {
	emit('comment', { item, index })
}

function handleShare(item, index) {
	emit('share', { item, index })
}

function handleCollect(item, index) {
	emit('collect', { item, index })
}

function onProgressChanging(value) {
	if (props.videoList[props.currentVideo]) {
		props.videoList[props.currentVideo]['progressValue'] = value.detail.value
	}
	emit('progressChanging', {
		progress: value.detail.value,
		index: props.currentVideo
	})
}

function onProgressChange(value) {
	if (props.videoList[props.currentVideo]) {
		props.videoList[props.currentVideo]['progressValue'] = value.detail.value
	}
	emit('progressChange', {
		progress: value.detail.value,
		index: props.currentVideo
	})
}

function showSpeedOptions(index) {
	currentSpeedVideoIndex.value = index
	showSpeedSheet.value = true
}

function selectSpeed(action) {
	const videoContext = uni.createVideoContext('video-' + currentSpeedVideoIndex.value, proxy)
	videoContext.playbackRate(action.value)

	if (props.videoList[currentSpeedVideoIndex.value]) {
		props.videoList[currentSpeedVideoIndex.value]['playbackRate'] = action.value
	}
	showSpeedSheet.value = false
}

function onVideoPlay(e) {
	emit('videoPlay', { index: props.currentVideo, event: e })
}

function onVideoPause(e) {
	emit('videoPause', { index: props.currentVideo, event: e })
}

function onVideoEnded(e) {
	emit('videoEnded', { index: props.currentVideo, event: e })
}

function onTimeUpdate(e) {
	const progress = (e.detail.currentTime / e.detail.duration) * 100
	if (props.videoList[props.currentVideo]) {
		props.videoList[props.currentVideo]['progress'] = progress
	}
	emit('timeUpdate', { index: props.currentVideo, event: e })
}

function onLoadedMetadata(e) {
	emit('loadedMetadata', { index: props.currentVideo, event: e })
}

defineExpose({
	playVideo,
	pauseCurrentVideo
})
</script>


<style lang="scss" scoped>
	.up-short-video {
		width: 100%;
		height: 100vh;
		position: relative;

		&__header {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			z-index: 10;
			display: flex;
            flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: 10px 15px;
			background-color: rgba(255, 255, 255, 0.05);
            opacity: 1;

			&__menu, &__search {
				width: 40px;
				height: 40px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: #fff;
			}

			&__tabs {
				flex: 1;
				margin: 0 10px;
			}
		}

		&__content {
			width: 100%;
			height: 100%;

			&__item {
				width: 100%;
				height: 100%;
				position: relative;
			}

			&__video {
				width: 100%;
				height: 100%;
				position: relative;

				&__speed {
					position: absolute;
					top: 15px;
					right: 15px;
					z-index: 10;
					background-color: rgba(0, 0, 0, 0.3);
					border-radius: 20px;
					padding: 5px 10px;
					display: flex;
					align-items: center;

					.speed-text {
						color: #fff;
						font-size: 12px;
						margin-right: 4px;
					}
				}
			}

			&__author {
				position: absolute;
				left: 15px;
				bottom: 100px;
				display: flex;
                flex-direction: row;
				align-items: center;
				z-index: 10;

				&__info {
					margin-left: 10px;
					display: flex;
					flex-direction: column;
					justify-content: center;
				}

                &__name {
						color: #eee;
						font-size: 16px;
						font-weight: bold;
						margin-bottom: 5px;
					}

					&__desc {
						color: rgba(255, 255, 255, 0.8);
						font-size: 14px;
					}

				&__follow {
					margin-left: 15px;
				}
			}

			&__actions {
				position: absolute;
				right: 15px;
				bottom: 100px;
				display: flex;
				flex-direction: column;
				align-items: center;
				z-index: 10;

				&__item {
					display: flex;
					flex-direction: column;
					align-items: center;
					margin-bottom: 20px;
					color: #fff;
				}

				&__text {
					color: #fff;
					font-size: 12px;
					margin-top: 5px;
				}
			}
		}

		&__footer {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 10;
		}

		&__progress {
		}
	}
</style>
