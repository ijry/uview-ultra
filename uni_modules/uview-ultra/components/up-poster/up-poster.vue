<template>
	<view class="up-poster">
		<!-- canvas用于绘制海报 -->
		<canvas
			v-if="showCanvas"
			class="up-poster__hidden-canvas"
			:canvas-id="canvasId"
			:id="canvasId"
			:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
		</canvas>
		<!-- 隐藏的二维码组件，用于生成二维码图片 -->
		<up-qrcode
			ref="qrCode"
			:val="qrCodeValue"
			:size="qrCodeSize"
			:margin="0"
            :loadMake="false"
			background="#ffffff"
			foreground="#000000"
			:class="['up-poster__hidden-qrcode', qrCodeShow ? '' : 'up-poster__hidden-qrcode--hidden']"
		/>
	</view>
</template>

<script setup>
/**
 * Poster 海报组件
 * @description 用于生成海报的组件，支持文本、图片、二维码等元素
 * @tutorial https://uview-plus.jiangruyi.com/components/poster.html
 *
 * @property {Object} json 海报配置JSON数据
 * @property {Object} json.css 海报容器样式
 * @property {Array}  json.views 海报元素列表
 * @property {String} json.views.type 元素类型(text/image/qrcode/view)
 * @property {String} json.views.text 文本内容(仅text类型)
 * @property {String} json.views.src 图片地址(仅image/qrcode类型)
 * @property {Object} json.views.css 元素样式
 *
 * @example <up-poster :json="posterJson"></up-poster>
 */
import { getCurrentInstance, nextTick, ref } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI.js'
import { rpx2px } from '../../libs/function/index.js'

defineOptions({
	name: 'up-poster',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	...commonProps,
	json: {
		type: Object,
		default: () => ({})
	}
})

const instance = getCurrentInstance()
const proxy = instance?.proxy

const canvasId = ref('up-poster-canvas-' + Date.now())
const showCanvas = ref(false)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
// 二维码相关数据
const qrCodeValue = ref('')
const qrCodeSize = ref(200)
const qrCodeShow = ref(false)
// 存储多个二维码的数据
const qrCodeMap = new Map()
const qrCode = ref(null)

// 根据传入的css生成文本样式
function getTextStyle(css) {
	const style = {};
	if (css.color) style.color = css.color;
	if (css.fontSize) style.fontSize = css.fontSize;
	if (css.fontWeight) style.fontWeight = css.fontWeight;
	if (css.lineHeight) style.lineHeight = css.lineHeight;
	if (css.textAlign) style.textAlign = css.textAlign;
	return style;
}

/**
 * 导出海报图片
 * @description 根据json配置生成海报并导出为临时图片路径
 * @returns {Promise<Object>} 返回包含图片信息的对象
 * @author jry ijry@qq.com
 */
async function exportImage() {
	return new Promise(async (resolve, reject) => {
		try {
			// 获取海报尺寸信息
			const posterSize = props.json.css;
			// 将rpx转换为px
			const width = convertRpxToPx(posterSize.width || '750rpx');
			const height = convertRpxToPx(posterSize.height || '1114rpx');

			// 设置canvas尺寸
			canvasWidth.value = width;
			canvasHeight.value = height;
			showCanvas.value = true;

			// 等待DOM更新
			await nextTick();

			// 创建canvas上下文
			const ctx = uni.createCanvasContext(canvasId.value, proxy);
			// 画布实例拿不到时必须立刻失败：否则后续绘制全部抛在 try 之外，
			// 只能等 10s 超时才报错，问题现场也丢了。
			if (!ctx) {
				showCanvas.value = false;
				reject(new Error('无法初始化海报画布'));
				return;
			}

			// 绘制背景
			if (posterSize.background) {
				// 支持渐变背景色
				if (posterSize.background.includes('linear-gradient') || posterSize.background.includes('radial-gradient')) {
					drawGradientBackground(ctx, posterSize, 0, 0, width, height);
				} else {
					ctx.setFillStyle(posterSize.background);
					ctx.fillRect(0, 0, width, height);
				}
			}

			// 绘制所有元素
			for (const item of props.json.views) {
				await drawItem(ctx, item, width, height);
			}

			// 绘制到canvas
			ctx.draw(false, () => {
				// 等待绘制完成
				setTimeout(() => {
					// 导出图片
					uni.canvasToTempFilePath({
						canvasId: canvasId.value,
						success: (res) => {
							// 隐藏canvas
							showCanvas.value = false;
							// 返回图片路径
							resolve({
								width: width,
								height: height,
								path: res.tempFilePath,
								// H5下添加blob格式
								blob: dataURLToBlob(res.tempFilePath)
							});
						},
						fail: (err) => {
							// 隐藏canvas
							showCanvas.value = false;
							reject(new Error('导出图片失败: ' + JSON.stringify(err)));
						}
					}, proxy);
				}, 300);
			});

			// 超时处理
			setTimeout(() => {
				showCanvas.value = false;
				reject(new Error('导出图片超时'));
			}, 10000);
		} catch (error) {
			showCanvas.value = false;
			reject(error);
		}
	});
}

/**
 * 绘制单个元素
 * @description 根据元素类型绘制文本、图片、矩形或二维码到canvas
 * @param {Object} ctx canvas上下文
 * @param {Object} item 元素配置信息
 * @param {Number} canvasWidth canvas宽度
 * @param {Number} canvasHeight canvas高度
 * @returns {Promise} 绘制完成的Promise
 * @author jry ijry@qq.com
 */
async function drawItem(ctx, item, canvasW, canvasH) {
	const css = item.css || {};
	const left = convertRpxToPx(css.left || '0rpx');
	const top = convertRpxToPx(css.top || '0rpx');
	const width = convertRpxToPx(css.width || '0rpx');
	const height = convertRpxToPx(css.height || '0rpx');

	switch (item.type) {
		case 'view':
			// 绘制矩形背景
			if (css.background) {
				// 支持渐变背景色
				if (css.background.includes('linear-gradient') || css.background.includes('radial-gradient')) {
					drawGradientBackground(ctx, css, left, top, width, height);
				} else {
					ctx.setFillStyle(css.background);
					// 处理圆角
					if (css.radius) {
						const radius = convertRpxToPx(css.radius);
						drawRoundRect(ctx, left, top, width, height, radius, css.background);
					} else {
						ctx.fillRect(left, top, width, height);
					}
				}
			}
			break;

		case 'text':
			// 设置文本样式
			if (css.color) ctx.setFillStyle(css.color);
			if (css.fontSize) {
				const fontSize = convertRpxToPx(css.fontSize);
				ctx.setFontSize(fontSize);
			}
			if (css.fontWeight) {
				ctx.setLineWidth(css.fontWeight === 'bold' ? 2 : 1);
			}

			// 处理文本换行
			if (css.lineClamp) {
				drawTextWithLineClamp(ctx, item.text, left, top, width, css);
			} else {
				// 修复：文本垂直居中对齐问题
				const textBaseLine = css.fontSize ? convertRpxToPx(css.fontSize) / 2 : 10;
				ctx.fillText(item.text, left, top + textBaseLine);
			}
			break;

		case 'image':
			// 绘制图片
			return new Promise((resolve) => {
				uni.getImageInfo({
					src: item.src,
					success: (res) => {
						// console.log('图片加载成功: ' + item.src, res);
						// 处理圆角
						if (css.radius) {
							const radius = convertRpxToPx(css.radius);
							clipRoundRect(ctx, left, top, width, height, radius);
						}
						// 不能用item.src，要用res.path。
						ctx.drawImage(res.path, left, top, width, height);
						// 恢复剪切区域
						ctx.restore();
						resolve();
					},
					fail: (e) => {
						ctx.setFillStyle('#f5f5f5');
						ctx.fillRect(left, top, width, height);
						console.log('图片加载失败: ' + item.src, e);
						resolve();
					}
				});
			});

		case 'qrcode':
			// 绘制二维码
			if (item.text) {
				// 使用u-qrcode生成二维码图片
				const qrCodeImageUrl = await generateQRCode(item.text, width, height);
				return new Promise((resolve) => {
					uni.getImageInfo({
						src: qrCodeImageUrl,
						success: (res) => {
							ctx.drawImage(res.path, left, top, width, height);
							resolve();
						},
						fail: () => {
							ctx.setFillStyle('#f5f5f5');
							ctx.fillRect(left, top, width, height);
							ctx.setFillStyle('#999');
							ctx.setFontSize(12);
							ctx.setTextAlign('center');
							ctx.fillText('QR', left + width / 2, top + height / 2);
							ctx.setTextAlign('left');
							resolve();
						}
					});
				});
			} else {
				ctx.setFillStyle('#f5f5f5');
				ctx.fillRect(left, top, width, height);
				ctx.setFillStyle('#999');
				ctx.setFontSize(12);
				ctx.setTextAlign('center');
				ctx.fillText('QR', left + width / 2, top + height / 2);
				ctx.setTextAlign('left');
			}
			break;
	}
}

/**
 * 绘制圆角矩形
 */
function drawRoundRect(ctx, x, y, width, height, radius, fillColor) {
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (fillColor) {
		ctx.setFillStyle(fillColor);
		ctx.fill();
	}
	ctx.restore();
}

/**
 * 裁剪圆角矩形区域
 */
function clipRoundRect(ctx, x, y, width, height, radius) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
	ctx.lineTo(x + width - radius, y);
	ctx.arc(x + width - radius, y + radius, radius, Math.PI * 1.5, Math.PI * 2);
	ctx.lineTo(x + width, y + height - radius);
	ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI * 0.5);
	ctx.lineTo(x + radius, y + height);
	ctx.arc(x + radius, y + height - radius, radius, Math.PI * 0.5, Math.PI);
	ctx.closePath();
	ctx.clip();
}

/**
 * 估算文本宽度（测量不可用时的兜底）
 * 鸿蒙 CanvasContext.measureText 的同步返回值恒为 0，真实宽度只通过 callback
 * 经 evalJSAsync 异步回传；其他平台上下文未就绪时也可能返回 0。
 */
function estimateTextWidth(text, fontSize) {
	const size = Number(fontSize) || 12;
	// 全角字符（CJK、日文假名、全角标点）约占一个字号宽。
	// 注意不能用常见的 length * fontSize * 0.6：汉字会被短算约 40%，中文依旧不换行。
	const FULL_WIDTH = /[ᄀ-ᅟ⺀-〾぀-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/;
	return Array.from(String(text)).reduce((width, char) => {
		if (FULL_WIDTH.test(char)) return width + size;
		if (/\s/.test(char)) return width + size * 0.28;
		return width + size * 0.56;
	}, 0);
}

/**
 * 测量文本宽度，测量失效时改用估算
 * 绝不能把 0 当作真实宽度：换行判断会认为"这一行还放得下"，
 * 于是整段文本挤成一行，横穿并压到其他元素上。
 */
function measureTextWidth(ctx, text, fontSize) {
	if (ctx && typeof ctx.measureText === 'function') {
		const metrics = ctx.measureText(String(text));
		const width = Number(metrics && metrics.width);
		if (width > 0) return width;
	}
	return estimateTextWidth(text, fontSize);
}

/**
 * 绘制带行数限制的文本
 */
function drawTextWithLineClamp(ctx, text, x, y, maxWidth, css) {
	const lineClamp = parseInt(css.lineClamp) || 1;
	const lineHeight = css.lineHeight ? convertRpxToPx(css.lineHeight) : 20;
	const fontSize = css.fontSize ? convertRpxToPx(css.fontSize) : 20;
	const lines = [];
	let currentLine = '';
	const ellipsis = '...';
	const appendEllipsis = (line) => {
		let fitLine = line;
		while (measureTextWidth(ctx, fitLine + ellipsis, fontSize) > maxWidth && fitLine.length > 0) {
			fitLine = fitLine.substring(0, fitLine.length - 1);
		}
		return fitLine + ellipsis;
	};

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const testLine = currentLine + char;
		const measuredWidth = measureTextWidth(ctx, testLine, fontSize);

		if (measuredWidth > maxWidth && currentLine !== '') {
			lines.push(currentLine);

			// 如果已达最大行数，添加省略号并结束
			if (lines.length === lineClamp) {
				lines[lines.length - 1] = appendEllipsis(currentLine);
				break;
			}

			currentLine = char;
		} else {
			currentLine = testLine;
		}

		// 处理最后一行
		if (i === text.length - 1 && lines.length < lineClamp) {
			lines.push(currentLine);
		}
	}

	// 绘制每一行
	for (let i = 0; i < lines.length; i++) {
		// 修复：正确计算文本垂直位置
		const textBaseLine = css.fontSize ? convertRpxToPx(css.fontSize) / 2 : 10;
		ctx.fillText(lines[i], x, y + (i * lineHeight) + textBaseLine);
	}
}

/**
 * 生成二维码图片
 */
function generateQRCode(text, width, height) {
	return new Promise((resolve) => {
		// 为每个二维码生成唯一标识
		const qrCodeKey = `${text}_${width}_${height}`;

		// 检查是否已经生成过该二维码
		if (qrCodeMap.has(qrCodeKey)) {
			resolve(qrCodeMap.get(qrCodeKey));
			return;
		}

		// 使用 u-qrcode 组件生成二维码
		try {
			// 设置二维码参数
			qrCodeValue.value = text;
			qrCodeSize.value = Math.max(width, height);
			qrCodeShow.value = true;

			// 等待DOM更新
			nextTick(() => {
				// 获取二维码组件实例并导出图片
				if (qrCode.value) {
					// 延迟一点时间确保二维码渲染完成
					setTimeout(() => {
						// 调用 u-qrcode 的 toTempFilePath 方法导出图片
						qrCode.value.toTempFilePath({
							success: (res) => {
								// 缓存二维码图片路径
								qrCodeMap.set(qrCodeKey, res.tempFilePath);
								qrCodeShow.value = false;
								resolve(res.tempFilePath);
							},
							fail: (err) => {
								console.error('二维码生成失败:', err);
								qrCodeShow.value = false;
							}
						});
					}, 300);
				} else {
					qrCodeShow.value = false;
				}
			});
		} catch (error) {
			console.error('生成二维码出错:', error);
			qrCodeShow.value = false;
		}
	});
}

/**
 * 将rpx单位转换为px
 */
function convertRpxToPx(rpxValue) {
	if (typeof rpxValue === 'number') return rpxValue;

	// 使用rpx2px方法
	if (typeof rpxValue === 'string' && rpxValue.endsWith('rpx')) {
		const value = parseFloat(rpxValue);
		return rpx2px(value);
	}

	return parseFloat(rpxValue) || 0;
}

/**
 * 绘制渐变背景
 */
function drawGradientBackground(ctx, css, left, top, width, height) {
	const background = css.background;
	let gradient = null;

	// 处理线性渐变
	if (background.includes('linear-gradient')) {
		// 解析线性渐变角度和颜色
		const angleMatch = background.match(/linear-gradient\((\d+)deg/);
		const angle = angleMatch ? parseInt(angleMatch[1]) : 135;

		// 根据角度计算渐变起点和终点
		let startX = left, startY = top, endX = left + width, endY = top + height;

		// 简化的角度处理（支持常见角度）
		if (angle === 0) {
			startX = left;
			startY = top + height;
			endX = left;
			endY = top;
		} else if (angle === 90) {
			startX = left;
			startY = top;
			endX = left + width;
			endY = top;
		} else if (angle === 180) {
			startX = left;
			startY = top;
			endX = left;
			endY = top + height;
		} else if (angle === 270) {
			startX = left + width;
			startY = top;
			endX = left;
			endY = top;
		}

		gradient = ctx.createLinearGradient(startX, startY, endX, endY);

		// 解析颜色值
		const colorMatches = background.match(/#[0-9a-fA-F]+|rgba?\([^)]+\)/g);
		if (colorMatches && colorMatches.length >= 2) {
			// 添加渐变色点
			colorMatches.forEach((color, index) => {
				const stop = index / (colorMatches.length - 1);
				gradient.addColorStop(stop, color);
			});
		}
	}
	// 处理径向渐变
	else if (background.includes('radial-gradient')) {
		// 径向渐变从中心开始
		const centerX = left + width / 2;
		const centerY = top + height / 2;
		const radius = Math.min(width, height) / 2;

		gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

		// 解析颜色值
		const colorMatches = background.match(/#[0-9a-fA-F]+|rgba?\([^)]+\)/g);
		if (colorMatches && colorMatches.length >= 2) {
			// 添加渐变色点
			colorMatches.forEach((color, index) => {
				const stop = index / (colorMatches.length - 1);
				gradient.addColorStop(stop, color);
			});
		}
	}

	if (gradient) {
		ctx.setFillStyle(gradient);
		// 处理圆角
		if (css.radius) {
			const radius = convertRpxToPx(css.radius);
			drawRoundRect(ctx, left, top, width, height, radius, gradient);
		} else {
			ctx.fillRect(left, top, width, height);
		}
	}
}

/**
 * 将dataURL转换为Blob
 */
function dataURLToBlob(dataURL) {
	// 检查是否为H5环境且是base64数据
	// #ifdef H5
	if (dataURL && dataURL.startsWith('data:image')) {
		const parts = dataURL.split(';base64,');
		const contentType = parts[0].split(':')[1];
		const raw = window.atob(parts[1]);
		const rawLength = raw.length;
		const uInt8Array = new Uint8Array(rawLength);

		for (let i = 0; i < rawLength; ++i) {
			uInt8Array[i] = raw.charCodeAt(i);
		}

		return new Blob([uInt8Array], { type: contentType });
	}
	// #endif

	return null;
}

defineExpose({
	exportImage
})
</script>


<style lang="scss" scoped>
.up-poster {
	position: relative;

	&__canvas {
		position: relative;
		overflow: hidden;
	}

	&__hidden-canvas {
		position: fixed;
		top: -10000px;
		left: -10000px;
		z-index: -1;
	}

	&__hidden-qrcode {
		position: fixed;
		top: -10000px;
		left: -10000px;
		z-index: -1;

		&--hidden {
			display: none;
		}
	}
}
</style>

