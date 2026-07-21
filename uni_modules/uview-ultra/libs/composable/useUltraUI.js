import { getCurrentInstance, onBeforeUnmount, ref } from 'vue'
import { deepMerge, $parent, sleep } from '../function/index.js'
import test from '../function/test.js'
import route from '../util/route.js'

// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom')
// #endif

export const commonProps = {
    customStyle: {
        type: [Object, String],
        default: () => ({})
    },
    customClass: {
        type: String,
        default: ''
    },
    url: {
        type: String,
        default: ''
    },
    linkType: {
        type: String,
        default: 'navigateTo'
    }
}

function getSlimUniU() {
    if (typeof uni === 'undefined' || !uni.$u) return {}
    // #ifndef APP-NVUE
    return deepMerge(uni.$u, {
        props: undefined,
        http: undefined,
        mixin: undefined
    })
    // #endif
    // #ifdef APP-NVUE
    return uni.$u
    // #endif
}

export function useUltraUI(props = {}, parentData = null) {
    const instance = getCurrentInstance()
    const proxy = instance?.proxy || null
    const parent = ref(null)
    const children = ref([])
    const $u = getSlimUniU()

    function bem(name, fixed, change) {
        const prefix = `up-${name}--`
        const classes = {}
        if (fixed) {
            fixed.forEach((item) => {
                classes[prefix + props[item]] = true
            })
        }
        if (change) {
            change.forEach((item) => {
                if (props[item]) {
                    classes[prefix + item] = props[item]
                } else {
                    delete classes[prefix + item]
                }
            })
        }
        return Object.keys(classes)
            // #ifdef MP-ALIPAY || MP-TOUTIAO || MP-LARK
            .join(' ')
            // #endif
    }

    function openPage(urlKey = 'url') {
        const url = props[urlKey]
        if (url) {
            route({ type: props.linkType, url })
        }
    }

    function navTo(url = '', linkType = 'navigateTo') {
        route({ type: linkType, url })
    }

    function $uGetRect(selector, all) {
        return new Promise((resolve) => {
            // #ifndef APP-NVUE
            uni.createSelectorQuery()
                .in(proxy)[all ? 'selectAll' : 'select'](selector)
                .boundingClientRect((rect) => {
                    if (all && Array.isArray(rect) && rect.length) {
                        resolve(rect)
                    }
                    if (!all && rect) {
                        resolve(rect)
                    }
                })
                .exec()
            // #endif

            // #ifdef APP-NVUE
            sleep(30).then(() => {
                const selectorNvue = selector.substring(1)
                const selectorRef = proxy?.$refs?.[selectorNvue]
                if (!selectorRef) {
                    resolve({
                        with: 0,
                        height: 0,
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    })
                    return
                }
                dom.getComponentRect(selectorRef, res => {
                    resolve(res.size)
                })
            })
            // #endif
        })
    }

    if (typeof uni !== 'undefined' && uni.$u) {
        uni.$u.getRect = $uGetRect
    }

    function getParentData(parentName = '') {
        if (!proxy) return null
        parent.value = $parent.call(proxy, parentName)
        const parentChildren = parent.value?.children
        if (Array.isArray(parentChildren) && parentChildren.indexOf(proxy) === -1) {
            parentChildren.push(proxy)
        }
        if (parent.value && parentData) {
            const parentProps = typeof parent.value.getProps === 'function'
                ? parent.value.getProps()
                : parent.value
            Object.keys(parentData).forEach((key) => {
                parentData[key] = parentProps[key]
            })
        }
        return parent.value
    }

    function preventEvent(e) {
        e && typeof e.stopPropagation === 'function' && e.stopPropagation()
    }

    function noop(e) {
        preventEvent(e)
    }

    onBeforeUnmount(() => {
        if (parent.value && test.array(parent.value.children)) {
            const childrenList = parent.value.children
            childrenList.forEach((child, index) => {
                if (child === proxy) {
                    childrenList.splice(index, 1)
                }
            })
        }
    })

    return {
        $u,
        parent,
        children,
        bem,
        openPage,
        navTo,
        $uGetRect,
        getParentData,
        preventEvent,
        noop
    }
}
