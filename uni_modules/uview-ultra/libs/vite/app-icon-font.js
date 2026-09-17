import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'

import { detectProjectRoot, isAppPlatform, normalizePath, toCleanId } from './utils.js'

const featurePath = normalizePath(dirname(fileURLToPath(import.meta.url)))
export const appStaticIconFontRelativePath = 'static/app-plus/uview-ultra/upicon.ttf'
// 源码默认 App 端优先本地字体，只有在显式关闭本地字体时才切回 config.iconUrl
// 不带分号，兼容有/无分号两种代码风格
const appStaticIconFontFlag = 'const useAppStaticIconFont = true'
const appStaticIconFontDisabledFlag = 'const useAppStaticIconFont = false'
const appRemoteIconFontCondition = /\/\*\s*#ifdef\s+APP\s+\|\|\s+(MP-QQ\s+\|\|\s+MP-TOUTIAO\s+\|\|\s+MP-BAIDU\s+\|\|\s+MP-KUAISHOU\s+\|\|\s+MP-XHS)\s*\*\//
const appCompiledRemoteIconFontFace = /[ \t]*(?:\/\/[^\n]*\n[ \t]*)?@font-face\s*\{[^{}]*font-family:\s*['"]?upicon-iconfont['"]?;?[^{}]*at\.alicdn\.com\/t\/font_2225171[^{}]*\}\s*/
const appCompiledRemoteIconFontFaceGlobal = /[ \t]*(?:\/\/[^\n]*\n[ \t]*)?@font-face\s*\{[^{}]*font-family:\s*['"]?upicon-iconfont['"]?;?[^{}]*at\.alicdn\.com\/t\/font_2225171[^{}]*\}\s*/g

/**
 * App 本地图标字体能力（UpVite 的一个 feature）。
 *
 * up-icon 的 Vue 运行时不通过 `?url` 发射字体资源 —— 那条路径在 iOS App 端不生效
 * （App 本地字体路径必须落在 uni-app 约定的 static 目录下）。因此由构建插件把包内
 * upicon.ttf 复制到应用 static/app-plus/uview-ultra/，运行时再按 _www 路径加载。
 *
 * uvue / uni-app-x 路径不受影响，它继续使用 index.uts 里的 /static/iconfont/iconfont.ttf。
 */
export function createAppIconFontFeature(options = {}) {
  const enabled = options.enabled !== false
  const projectInfo = detectProjectRoot()
  const rootPath = normalizePath(projectInfo.rootPath)
  const iconFontSourcePath = normalizePath(resolve(featurePath, '../../components/up-icon/upicon.ttf'))
  const appStaticIconFontPath = normalizePath(resolve(rootPath, appStaticIconFontRelativePath))
  const uIconUtilPath = normalizePath(resolve(rootPath, 'uni_modules/uview-ultra/components/up-icon/util.js'))
  const uIconVuePath = normalizePath(resolve(rootPath, 'uni_modules/uview-ultra/components/up-icon/up-icon.vue'))

  const shouldCopyFile = (sourcePath, targetPath) => {
    if (!existsSync(targetPath)) return true
    if (statSync(sourcePath).size !== statSync(targetPath).size) return true
    return !readFileSync(sourcePath).equals(readFileSync(targetPath))
  }

  const removeAppCompiledRemoteIconFontFace = (code) => code.replace(appCompiledRemoteIconFontFaceGlobal, '')

  const ensure = () => {
    if (!enabled) return
    if (!isAppPlatform()) return
    if (!existsSync(iconFontSourcePath)) {
      throw new Error(`uview-ultra built-in icon font is missing: ${iconFontSourcePath}`)
    }

    mkdirSync(dirname(appStaticIconFontPath), { recursive: true })
    if (shouldCopyFile(iconFontSourcePath, appStaticIconFontPath)) {
      copyFileSync(iconFontSourcePath, appStaticIconFontPath)
    }
  }

  const transform = (code, id) => {
    if (!isAppPlatform()) return null
    const cleanId = toCleanId(id)
    if (!enabled) {
      if (cleanId === uIconUtilPath && code.includes(appStaticIconFontFlag)) {
        return code.replace(appStaticIconFontFlag, appStaticIconFontDisabledFlag)
      }
      return null
    }
    if (cleanId === uIconVuePath && appRemoteIconFontCondition.test(code)) {
      return code.replace(appRemoteIconFontCondition, '/* #ifdef $1 */')
    }
    if (cleanId === uIconVuePath && appCompiledRemoteIconFontFace.test(code)) {
      return removeAppCompiledRemoteIconFontFace(code)
    }
    return null
  }

  const generateBundle = (bundle) => {
    if (!enabled) return
    if (!isAppPlatform()) return
    Object.values(bundle).forEach((asset) => {
      if (asset.type !== 'asset') return
      if (!asset.fileName.endsWith('.css')) return
      if (typeof asset.source !== 'string') return
      if (!appCompiledRemoteIconFontFace.test(asset.source)) return
      asset.source = removeAppCompiledRemoteIconFontFace(asset.source)
    })
  }

  return {
    name: 'app-icon-font',
    enabled,
    rootPath,
    appStaticIconFontPath,
    ensure,
    transform,
    generateBundle,
  }
}
