import { getCurrentInstance, onBeforeUnmount, ref } from 'vue'
import { deepMerge, $parent, sleep, isCompUnmounted } from '../function/index.js'
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
        // 卸载后不得再把组件交给原生查询，否则 APP 端会拿失效 nodeId 去查已删除的视图节点
        if (isCompUnmounted(proxy)) {
            return Promise.resolve(all ? [] : {
                width: 0,
                height: 0,
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            })
        }
        return new Promise((resolve) => {
            // #ifndef APP-NVUE
            uni.createSelectorQuery()
                .in(proxy)[all ? 'selectAll' : 'select'](selector)
                .boundingClientRect((rect) => {
                    // 页面被 tabbar 切走隐藏时节点查询会回调 null，
                    // 此处必须兜底 resolve，否则 await 永不返回，调用方会被永久挂起
                    if (all) {
                        resolve(Array.isArray(rect) ? rect : [])
                        return
                    }
                    resolve(rect || {
                        width: 0,
                        height: 0,
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    })
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
        // 本 hook 在 setup 期间最早注册，因此先于组件自身的 onBeforeUnmount 执行，
        // 也早于 Vue 内部在 post-render 队列里异步置位的 isUnmounted，
        // 异步回调据此拦截节点查询与交叉观察器
        if (proxy) {
            proxy.__upUnmounted = true
        }
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
