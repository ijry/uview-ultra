import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const base = 'uni_modules/uview-ultra/components/up-navbar/'

// Execute the actual computed style with only the platform APIs substituted.
function rightStyle(source, platform, enabled, rect, width) {
    const match = source.match(/const navbarRightStyle = computed\([\s\S]*?\n\s*\}\)/)
    if (!match) return {} // Existing implementation has no inline right offset.
    const lines = match[0].split('\n')
    let include = true
    const code = lines.filter(line => {
        if (line.includes('// #ifdef MP-WEIXIN')) { include = platform === 'MP-WEIXIN'; return false }
        if (line.includes('// #ifndef MP-WEIXIN')) { include = platform !== 'MP-WEIXIN'; return false }
        if (line.includes('// #endif')) { include = true; return false }
        return include
    }).join('\n').replace(/\(\): UTSJSONObject/g, '()').replace(/ as UTSJSONObject/g, '')
    const uni = {
        getMenuButtonBoundingClientRect() {
            assert.equal(platform, 'MP-WEIXIN', 'other platforms must not read the capsule')
            assert.equal(enabled, true, 'disabled avoidance must not read the capsule')
            return rect
        },
        getWindowInfo: () => ({ windowWidth: width })
    }
    return new Function('computed', 'props', 'uni', 'getWindowInfo', code + '; return navbarRightStyle')(
        fn => fn(), { avoidCapsule: enabled }, uni, uni.getWindowInfo
    )
}

for (const ext of ['vue', 'uvue']) {
    const source = read(base + 'up-navbar.' + ext)
    test(ext + ': moves right content to the capsule left edge', () => {
        assert.deepEqual(rightStyle(source, 'MP-WEIXIN', true, { left: 280 }, 375), { right: '95px' })
        assert.match(source, /class="up-navbar__content__right"\s+:style="(?:\[)?navbarRightStyle(?:\])?"/)
    })
    test(ext + ': disabled, unavailable or invalid capsule preserves layout', () => {
        for (const [enabled, rect, width] of [
            [false, { left: 280 }, 375], [true, null, 375], [true, { left: 0 }, 375],
            [true, { left: 280 }, 0], [true, { left: -1 }, 375], [true, { left: 400 }, 375]
        ]) assert.deepEqual(rightStyle(source, 'MP-WEIXIN', enabled, rect, width), {})
    })
    test(ext + ': non-WeChat builds keep their original layout', () => {
        for (const platform of ['APP-ANDROID', 'H5', 'MP-ALIPAY']) {
            assert.deepEqual(rightStyle(source, platform, true, null, 375), {})
        }
    })
}

test('capsule avoidance is exposed by both prop systems and defaults to enabled', () => {
    for (const ext of ['js', 'uts']) {
        const defaults = read(base + 'navbar.' + ext).replace(/import[^\n]*\n/g, '').replace('export default', 'return').replace(/ as UTSJSONObject/g, '')
        const def = new Function('color', defaults)({ mainColor: '#303133' })
        assert.equal(def.navbar.avoidCapsule, true)
        const propsCode = read(base + 'props.' + ext).replace(/import[^\n]*\n/g, '').replace(/ as UTSJSONObject/g, '').replace('export const', 'const')
        const name = ext === 'js' ? 'props' : 'propsNavbar'
        const mixin = new Function('defineMixin', 'defProps', propsCode + '; return ' + name)(value => value, def)
        assert.equal(mixin.props.avoidCapsule.type, Boolean)
        const value = mixin.props.avoidCapsule.default
        assert.equal(typeof value === 'function' ? value() : value, true)
    }
    assert.match(read(base + 'up-navbar.uvue'), /avoidCapsule:\s*\{[\s\S]*?default: defProps\.getBoolean\('navbar.avoidCapsule'\)/)
    assert.match(read('uni_modules/uview-ultra/types/comps/navbar.d.ts'), /avoidCapsule\?: boolean/)
})
