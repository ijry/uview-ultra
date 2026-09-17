import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import UpVite from '../uni_modules/uview-ultra/libs/vite/index.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(resolve(repoRoot, path), 'utf8')
const appStaticIconFontPath = 'static/app-plus/uview-ultra/upicon.ttf'
const appRuntimeIconFontUrl = '_www/static/app-plus/uview-ultra/upicon.ttf'
const miniProgramFontFaceCondition = /#ifdef\s+MP-QQ\s+\|\|\s+MP-TOUTIAO\s+\|\|\s+MP-BAIDU\s+\|\|\s+MP-KUAISHOU\s+\|\|\s+MP-XHS/
// App 端不应再注入远程 CSS 字体，只保留小程序
const appInFontFaceCondition = /#ifdef\s+[^\n]*\bAPP\b[^\n]*MP-QQ/
const compiledRemoteFontFace = /@font-face\s*\{[\s\S]*?font-family:\s*['"]?upicon-iconfont['"]?[\s\S]*?at\.alicdn\.com\/t\/font_2225171[\s\S]*?\}/

const upIconVue = read('uni_modules/uview-ultra/components/up-icon/up-icon.vue')
const util = read('uni_modules/uview-ultra/components/up-icon/util.js')
const fontPath = resolve(repoRoot, 'uni_modules/uview-ultra/components/up-icon/upicon.ttf')

if (!existsSync(fontPath)) {
  throw new Error('built-in icon font asset upicon.ttf is missing')
}

if (statSync(fontPath).size <= 0) {
  throw new Error('built-in icon font asset upicon.ttf is empty')
}

if (appInFontFaceCondition.test(upIconVue)) {
  throw new Error('up-icon.vue should not inject the App remote @font-face')
}

if (!miniProgramFontFaceCondition.test(upIconVue)) {
  throw new Error('up-icon.vue should keep the mini-program @font-face condition')
}

if (/\?url/.test(util)) {
  throw new Error('util.js should not rely on emitted asset URLs for the App built-in font')
}

if (!/const\s+useAppStaticIconFont\s*=\s*true/.test(util)) {
  throw new Error('util.js should prefer the local static font on App by default')
}

if (!/if\s*\(\s*!useAppStaticIconFont\s*\)\s*{\s*return config\.iconUrl;?\s*}/.test(util)) {
  throw new Error('util.js should fall back to config.iconUrl when the local static font is disabled')
}

if (!util.includes(appRuntimeIconFontUrl)) {
  throw new Error(`util.js should load the App built-in font from ${appRuntimeIconFontUrl}`)
}

if (!/plus\.io\.convertLocalFileSystemURL/.test(util)) {
  throw new Error('util.js should convert the App built-in font URL to a platform absolute path')
}

if (!/const\s+appVueLoadedPages\s*=\s*new\s+WeakSet\(\)/.test(util)) {
  throw new Error('util.js should track loaded icon fonts per App Vue page')
}

if (!/const\s+appVueLoadingPages\s*=\s*new\s+WeakSet\(\)/.test(util)) {
  throw new Error('util.js should deduplicate in-flight icon font loads per App Vue page')
}

if (!/const\s+appVueFallbackPages\s*=\s*new\s+WeakSet\(\)/.test(util)) {
  throw new Error('util.js should track the remote font fallback per App Vue page')
}

if (!/const\s+isLoaded\s*=\s*\(\)\s*=>[\s\S]*appVueLoadedPages\.has\(/.test(util)) {
  throw new Error('util.js should expose page-aware App Vue font loaded state')
}

if (!/fail\(\)\s*{[\s\S]*iconUrl\s*!==\s*config\.iconUrl[\s\S]*registerAppVueFontFace\(config\.iconUrl/.test(util)) {
  throw new Error('util.js should retry with config.iconUrl after the local App Vue font fails')
}

if (!/fail\(\)\s*{[\s\S]*appVueFallbackPages\.has\(/.test(util)) {
  throw new Error('util.js should fall back to the remote font only once per App Vue page')
}

if (!/registerNvueFontFace[\s\S]*plus\.io\.resolveLocalFileSystemURL/.test(util)) {
  throw new Error('util.js should probe the local font file before registering it in nvue')
}

if (!/resolveLocalFileSystemURL[\s\S]*addFontFace\(config\.iconUrl\)/.test(util)) {
  throw new Error('util.js should fall back to config.iconUrl when nvue has no local font file')
}

if (!/export default\s*{[\s\S]*isLoaded[\s\S]*loadFont/.test(util)) {
  throw new Error('util.js should export isLoaded for components to guard font loading')
}

// App Vue 的字体注册必须在页面挂载后执行，否则取不到 getCurrentPages
if (!/onMounted\(\(\)\s*=>\s*{[\s\S]*fontUtil\.isLoaded\(\)[\s\S]*fontUtil\.loadFont\(\)/.test(upIconVue)) {
  throw new Error('up-icon.vue should register the App Vue font after the page mounts')
}

if (!/import\s*{\s*onMounted\s*}\s*from\s*'vue'/.test(upIconVue)) {
  throw new Error('up-icon.vue should import onMounted for the App Vue font registration')
}

const withTempUniProject = async (platform, callback) => {
  const rootPath = mkdtempSync(resolve(tmpdir(), 'uview-ultra-app-font-'))
  const oldUniPlatform = process.env.UNI_PLATFORM
  const oldUniInputDir = process.env.UNI_INPUT_DIR

  try {
    writeFileSync(resolve(rootPath, 'pages.json'), '{"pages":[]}', 'utf8')
    process.env.UNI_PLATFORM = platform
    process.env.UNI_INPUT_DIR = rootPath
    await callback(rootPath)
  } finally {
    if (oldUniPlatform === undefined) {
      delete process.env.UNI_PLATFORM
    } else {
      process.env.UNI_PLATFORM = oldUniPlatform
    }

    if (oldUniInputDir === undefined) {
      delete process.env.UNI_INPUT_DIR
    } else {
      process.env.UNI_INPUT_DIR = oldUniInputDir
    }

    rmSync(rootPath, { recursive: true, force: true })
  }
}

await withTempUniProject('app', async (rootPath) => {
  const plugin = UpVite()
  plugin.buildStart()

  const copiedFontPath = resolve(rootPath, appStaticIconFontPath)
  if (!existsSync(copiedFontPath)) {
    throw new Error(`UpVite should copy the App built-in font to ${appStaticIconFontPath}`)
  }

  if (readFileSync(copiedFontPath).compare(readFileSync(fontPath)) !== 0) {
    throw new Error('UpVite should copy the App built-in font without changing its contents')
  }

  const utilPath = resolve(rootPath, 'uni_modules/uview-ultra/components/up-icon/util.js')
  const transformedUtil = await plugin.transform(util, utilPath)
  if (!/const\s+useAppStaticIconFont\s*=\s*true/.test(transformedUtil?.code || util)) {
    throw new Error('UpVite should keep util.js on static App icon fonts')
  }

  // 老版本源码里 App 条件仍会展开成远程 @font-face，插件要能兜底移除
  const compiledStyle = `
	@font-face {
		font-family: 'upicon-iconfont';
		src: url('https://at.alicdn.com/t/font_2225171_8kdcwk4po24.ttf') format('truetype');
	}
`
  const upIconVuePath = resolve(rootPath, 'uni_modules/uview-ultra/components/up-icon/up-icon.vue')
  const transformedStyle = await plugin.transform(compiledStyle, `${upIconVuePath}?vue&type=style&index=0&lang.scss`)
  if (!transformedStyle || compiledRemoteFontFace.test(transformedStyle.code)) {
    throw new Error('UpVite should remove the compiled App remote @font-face from up-icon.vue style blocks')
  }

  const bundle = {
    'app.css': {
      type: 'asset',
      fileName: 'app.css',
      source: `body{margin:0}${compiledStyle}`
    },
    'app-service.js': {
      type: 'chunk',
      fileName: 'app-service.js',
      code: `const url = "https://at.alicdn.com/t/font_2225171_8kdcwk4po24.ttf";`
    }
  }
  plugin.generateBundle?.({}, bundle)
  if (compiledRemoteFontFace.test(String(bundle['app.css'].source))) {
    throw new Error('UpVite should remove the App remote @font-face from generated CSS assets')
  }
  if (!String(bundle['app-service.js'].code).includes('font_2225171')) {
    throw new Error('UpVite should only strip CSS @font-face assets')
  }
})

await withTempUniProject('h5', async (rootPath) => {
  const plugin = UpVite()
  plugin.buildStart()

  if (existsSync(resolve(rootPath, appStaticIconFontPath))) {
    throw new Error('UpVite should not copy the App built-in font while UNI_PLATFORM is h5')
  }

  const upIconVuePath = resolve(rootPath, 'uni_modules/uview-ultra/components/up-icon/up-icon.vue')
  if (await plugin.transform(upIconVue, upIconVuePath)) {
    throw new Error('UpVite should not transform icon fonts while UNI_PLATFORM is h5')
  }
})

// 显式关闭本地字体时，回退到远程字体且不复制字体文件
await withTempUniProject('app', async (rootPath) => {
  const plugin = UpVite({ appStaticIconFont: false })
  plugin.buildStart()

  if (existsSync(resolve(rootPath, appStaticIconFontPath))) {
    throw new Error('UpVite should not copy the App built-in font when appStaticIconFont is disabled')
  }

  const utilPath = resolve(rootPath, 'uni_modules/uview-ultra/components/up-icon/util.js')
  const transformedUtil = await plugin.transform(util, utilPath)
  if (!transformedUtil || !/const\s+useAppStaticIconFont\s*=\s*false/.test(transformedUtil.code)) {
    throw new Error('UpVite should switch util.js back to config.iconUrl when appStaticIconFont is disabled')
  }
})

console.log('app local icon font checks passed')
