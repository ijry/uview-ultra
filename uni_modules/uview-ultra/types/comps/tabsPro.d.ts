import { AllowedComponentProps, VNodeProps } from './_common'

declare interface TabsProProps {
  /** 标签数组，元素为对象 */
  list?: any[]
  /** 从 list 元素对象中读取的键名 @default "name" */
  keyName?: string
  /** 当前选中标签的索引 @default 0 */
  current?: string | number
  /** 内容模式元数据 @default "static" */
  contentMode?: string
  /** 滑块颜色 */
  lineColor?: string
  /** 激活标签样式 */
  activeStyle?: string | Record<string, any>
  /** 非激活标签样式 */
  inactiveStyle?: string | Record<string, any>
  /** 滑块长度 @default 20 */
  lineWidth?: string | number
  /** 滑块高度 @default 3 */
  lineHeight?: string | number
  /** 滑块背景显示大小 @default "cover" */
  lineBgSize?: string
  /** 菜单项样式 */
  itemStyle?: string | Record<string, any>
  /** 菜单是否可滚动 @default true */
  scrollable?: boolean
  /** 滑块移动时间（ms） @default 300 */
  duration?: string | number
  /** 左侧图标样式 */
  iconStyle?: string | Record<string, any>
  /** 标签形态模式 */
  shapeMode?: '' | 'capsule' | 'card' | 'pill-arrow' | 'tag'
  /** 是否显示默认内容插槽 @default true */
  showContent?: boolean
  /** 内容容器 class */
  contentClass?: string
  /** 内容容器样式 */
  contentStyle?: string | Record<string, any> | any[]
  /** 内容索引绑定变量元数据 */
  bindIndexRef?: string
  /** 根节点自定义样式 */
  customStyle?: string | Record<string, any>
  /** 根节点自定义 class */
  customClass?: string
  /** 当前索引更新时触发 */
  ['onUpdate:current']?: (index: number) => any
  /** 标签切换时触发 */
  onChange?: (item: any, index: number) => any
  /** 标签点击时触发 */
  onClick?: (item: any, index: number, event: any) => any
  /** 标签长按时触发 */
  onLongPress?: (item: any, index: number) => any
}

declare interface _TabsPro {
  new (): {
    $props: AllowedComponentProps &
      VNodeProps &
      TabsProProps
  }
}

export declare const TabsPro: _TabsPro
