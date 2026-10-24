/*
 * @Author       : jry
 * @Description  : uview-ultra up-root component's props mixin file（uni-app Vue3 侧）
 * @version      : 4.0
 */
import { defineMixin } from '../../libs/vue.js'
import defProps from './root.js'
let root = defProps['root']

export const propsRoot = defineMixin({
    props: {
        // 是否为根节点附加页面底色（--up-page-bg-color）
        background: {
            type: Boolean,
            default: root['background']
        },
        // 是否内嵌全局 toast/notify 宿主
        toastHost: {
            type: Boolean,
            default: root['toastHost']
        },
        // 自定义根节点样式（与主题变量合并，优先级更高）
        customStyle: {
            type: Object,
            default: () => root['customStyle']
        }
    }
})
