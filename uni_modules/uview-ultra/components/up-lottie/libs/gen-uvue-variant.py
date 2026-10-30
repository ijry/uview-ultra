# -*- coding: utf-8 -*-
"""生成 uvue 专用的 lottie-miniprogram 副本。

lottie-miniprogram 在**模块加载期**就会执行 `var b = wx.getSystemInfoSync()`，
而 uni-app x 没有 wx 全局，直接 import 会在启动时抛 ReferenceError。
这里在文件最前面补一个模块作用域的 wx 桩，后续压缩代码里的 `wx` 引用
会解析到这个局部变量（比挂 globalThis 更可靠，不依赖运行时全局对象）。

只补 getSystemInfoSync / request 两项：
- getSystemInfoSync：lottie 只用来取 pixelRatio（dpr 我们显式传 1）
- request：仅在按 path 加载远程 JSON 时使用，本组件只用 animationData

原始文件保持不动，供 .vue 侧（微信小程序/鸿蒙，有真实 wx）使用。
"""
import io

SRC = 'lottie-miniprogram.min.js'
DST = 'lottie-miniprogram.uvue.js'

SHIM = """/* ------------------------------------------------------------------
 * uni-app x 适配层（本文件由 lottie-miniprogram.min.js 自动生成）
 * lottie-miniprogram 在模块加载期即调用 wx.getSystemInfoSync()，
 * 而 uni-app x 没有 wx 全局，故在此补一个模块作用域的 wx 桩。
 * 下方代码与 lottie-miniprogram.min.js 完全一致，未做任何修改。
 * ------------------------------------------------------------------ */
var wx = {
    getSystemInfoSync: function () {
        try {
            var info = (typeof uni !== 'undefined' && uni.getSystemInfoSync) ? (uni.getSystemInfoSync() || {}) : {}
            return { pixelRatio: info.pixelRatio || 1, platform: info.platform || '' }
        } catch (e) {
            return { pixelRatio: 1, platform: '' }
        }
    },
    request: function () {}
};

"""

with io.open(SRC, 'rb') as f:
    body = f.read()

with io.open(DST, 'wb') as f:
    f.write(SHIM.encode('utf-8'))
    f.write(body)

print('generated %s, size=%d' % (DST, len(SHIM.encode('utf-8')) + len(body)))
