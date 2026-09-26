import { defineMixin } from '../../libs/vue.js'
import defProps from '../../libs/config/props.js'

export const propsFlex = defineMixin({
    props: {
        direction: { type: String, default: () => defProps.flex.direction },
        justify: { type: String, default: () => defProps.flex.justify },
        align: { type: String, default: () => defProps.flex.align },
        wrap: { type: Boolean, default: () => defProps.flex.wrap },
        gap: { type: [String, Number], default: () => defProps.flex.gap }
    }
})
