<template>
  <view class="up-tree">
    <view
      v-for="item in visibleNodes"
      :key="item.key"
      class="up-tree-node"
      :class="getNodeClass(item)"
    >
      <view
        class="up-tree-node__content"
        :style="getNodeContentStyle(item)"
        @tap="handleNodeClick(item)"
      >
        <view class="up-tree-node__switcher" @tap.stop="handleExpandClick(item)">
          <up-icon
            v-if="item.hasChildren"
            :name="item.expanded ? collapseIcon : expandIcon"
            :size="iconSize"
            :color="switcherColor"
          />
        </view>
        <up-checkbox
          v-if="showCheckbox"
          class="up-tree-node__checkbox"
          usedAlone
          :size="checkboxSize"
          :checked="item.checked"
          :disabled="item.disabled"
          @change="handleCheckboxChange(item, $event)"
        />
        <view class="up-tree-node__label">
          <!-- #ifndef MP-WEIXIN -->
          <slot
            :node="item.node"
            :data="item.node"
            :level="item.level + 1"
            :expanded="item.expanded"
            :checked="item.checked"
            :indeterminate="item.indeterminate"
            :disabled="item.disabled"
          >
            <text class="up-tree-node__text">{{ getNodeLabel(item.node) }}</text>
          </slot>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <text class="up-tree-node__text">{{ getNodeLabel(item.node) }}</text>
          <!-- #endif -->
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue'
import { commonProps } from '../../libs/composable/useUltraUI'
import { getThemeVar } from '../../libs/theme/runtime.js'

/**
 * Tree 树形控件
 */
defineOptions({
  name: 'up-tree',
  // #ifdef MP-WEIXIN
  options: {
    virtualHost: true
  }
  // #endif
})

const props = defineProps({
  ...commonProps,
  data: {
    type: Array,
    default: () => []
  },
  props: {
    type: Object,
    default: () => ({
      label: 'label',
      children: 'children',
      nodeKey: 'id',
      disabled: 'disabled'
    })
  },
  nodeKey: {
    type: String,
    default: ''
  },
  showCheckbox: {
    type: Boolean,
    default: false
  },
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  defaultExpandedKeys: {
    type: Array,
    default: () => []
  },
  defaultCheckedKeys: {
    type: Array,
    default: () => []
  },
  expandOnClickNode: {
    type: Boolean,
    default: true
  },
  checkOnClickNode: {
    type: Boolean,
    default: false
  },
  checkStrictly: {
    type: Boolean,
    default: false
  },
  accordion: {
    type: Boolean,
    default: false
  },
  highlightCurrent: {
    type: Boolean,
    default: false
  },
  currentNodeKey: {
    type: [String, Number],
    default: ''
  },
  indent: {
    type: [String, Number],
    default: 32
  },
  iconSize: {
    type: [String, Number],
    default: 14
  },
  checkboxSize: {
    type: [String, Number],
    default: 16
  },
  expandIcon: {
    type: String,
    default: 'play-right-fill'
  },
  collapseIcon: {
    type: String,
    default: 'arrow-down-fill'
  }
})

const emit = defineEmits([
  'node-click',
  'check-change',
  'check',
  'node-expand',
  'node-collapse',
  'current-change'
])

const instance = getCurrentInstance()
const treeData = ref([])
const currentKey = ref('')
const nodeMap = ref({})
const privateKeySeed = ref(0)

const treeProps = computed(() => Object.assign({
  label: 'label',
  children: 'children',
  nodeKey: 'id',
  disabled: 'disabled'
}, props.props || {}))

const labelKey = computed(() => treeProps.value.label)
const childrenKey = computed(() => treeProps.value.children)
const disabledKey = computed(() => treeProps.value.disabled)
const keyField = computed(() => props.nodeKey || treeProps.value.nodeKey || 'id')

const visibleNodes = computed(() => {
  const result = []
  collectVisibleNodes(treeData.value, 0, result)
  return result
})

const switcherColor = computed(() => {
  const proxy = instance?.proxy
  if (proxy && typeof proxy.upThemeVar === 'function') {
    return proxy.upThemeVar('--up-content-color', '#606266')
  }
  return getThemeVar('--up-content-color', '#606266')
})

watch(() => props.data, () => {
  initTree()
}, { deep: true, immediate: true })

watch(() => props.props, () => {
  initTree()
}, { deep: true })

watch(() => props.nodeKey, () => {
  initTree()
})

watch(() => props.defaultExpandAll, () => {
  initTree()
})

watch(() => props.defaultExpandedKeys, () => {
  initTree()
})

watch(() => props.defaultCheckedKeys, () => {
  initTree()
})

watch(() => props.checkStrictly, () => {
  initTree()
})

watch(() => props.currentNodeKey, (value) => {
  currentKey.value = value
}, { immediate: true })

function initTree() {
  privateKeySeed.value = 0
  nodeMap.value = {}
  treeData.value = cloneNodes(props.data || [], null, 0)
  if (!props.checkStrictly) {
    syncParentChecked(treeData.value)
  }
}

function cloneNodes(nodes, parent, level) {
  const list = []
  nodes.forEach((node, index) => {
    const clone = Object.assign({}, node)
    const key = resolveNodeKey(clone, parent, index)
    const children = Array.isArray(node[childrenKey.value]) ? node[childrenKey.value] : []
    const expanded = props.defaultExpandAll || includesKey(props.defaultExpandedKeys, key) || clone.expanded === true
    const checked = includesKey(props.defaultCheckedKeys, key) || clone.checked === true

    clone.__uTreeKey = key
    clone.expanded = expanded
    clone.checked = checked
    clone.indeterminate = false
    clone[childrenKey.value] = cloneNodes(children, clone, level + 1)
    if (checked && !props.checkStrictly) {
      setChildrenChecked(clone, true)
    }

    nodeMap.value[key] = {
      node: clone,
      parent,
      level
    }
    list.push(clone)
  })
  return list
}

function resolveNodeKey(node, parent, index) {
  const rawKey = node[keyField.value]
  if (rawKey !== undefined && rawKey !== null && rawKey !== '') {
    return rawKey
  }
  const parentKey = parent ? parent.__uTreeKey : 'root'
  privateKeySeed.value += 1
  return parentKey + '-' + index + '-' + privateKeySeed.value
}

function collectVisibleNodes(nodes, level, result) {
  nodes.forEach((node) => {
    const children = getChildren(node)
    const key = getNodeKey(node)
    result.push({
      key,
      node,
      level,
      hasChildren: children.length > 0,
      expanded: node.expanded === true,
      checked: node.checked === true,
      indeterminate: node.indeterminate === true,
      disabled: isNodeDisabled(node)
    })
    if (children.length > 0 && node.expanded === true) {
      collectVisibleNodes(children, level + 1, result)
    }
  })
}

function getChildren(node) {
  const children = node ? node[childrenKey.value] : []
  return Array.isArray(children) ? children : []
}

function getNodeKey(node) {
  return node ? node.__uTreeKey : ''
}

function getNodeLabel(node) {
  const label = node ? node[labelKey.value] : ''
  return label === undefined || label === null ? '' : label
}

function isNodeDisabled(node) {
  return !!(node && node[disabledKey.value])
}

function includesKey(keys, key) {
  return Array.isArray(keys) && keys.indexOf(key) !== -1
}

function getNodeClass(item) {
  const classes = []
  if (props.highlightCurrent && item.key === currentKey.value) {
    classes.push('up-tree-node--current')
  }
  if (item.disabled) {
    classes.push('up-tree-node--disabled')
  }
  return classes.join(' ')
}

function getNodeContentStyle(item) {
  return {
    paddingLeft: getIndentValue(item.level)
  }
}

function getIndentValue(level) {
  const indent = String(props.indent)
  const matched = indent.match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (!matched) {
    return indent
  }
  const unit = matched[2] || 'rpx'
  return (Number(matched[1]) * level) + unit
}

function handleNodeClick(item) {
  const node = item.node
  const oldCurrentNode = getCurrentNode()

  currentKey.value = item.key
  if (props.expandOnClickNode && item.hasChildren) {
    toggleExpand(item)
  }
  if (props.checkOnClickNode && props.showCheckbox && !item.disabled) {
    setNodeChecked(node, !node.checked, true)
    emitCheck(node)
  }

  emit('node-click', node)
  if (oldCurrentNode !== node) {
    emit('current-change', node, oldCurrentNode)
  }
}

function handleExpandClick(item) {
  if (!item.hasChildren) {
    return
  }
  toggleExpand(item)
}

function toggleExpand(item) {
  const node = item.node
  const nextExpanded = node.expanded !== true
  if (props.accordion && nextExpanded) {
    collapseSiblingNodes(node)
  }
  node.expanded = nextExpanded
  emit(nextExpanded ? 'node-expand' : 'node-collapse', node)
}

function collapseSiblingNodes(node) {
  const parent = getParentNode(node)
  const siblings = parent ? getChildren(parent) : treeData.value
  siblings.forEach((sibling) => {
    if (sibling !== node) {
      sibling.expanded = false
    }
  })
}

function handleCheckboxChange(item, checked) {
  if (item.disabled) {
    return
  }
  setNodeChecked(item.node, checked, true)
  emit('check-change', item.node, checked)
  emitCheck(item.node)
}

function setNodeChecked(node, checked, deep) {
  node.checked = checked
  node.indeterminate = false
  if (!props.checkStrictly && deep !== false) {
    setChildrenChecked(node, checked)
  }
  if (!props.checkStrictly) {
    updateParentChecked(node)
  }
}

function setChildrenChecked(node, checked) {
  getChildren(node).forEach((child) => {
    if (!isNodeDisabled(child)) {
      child.checked = checked
      child.indeterminate = false
      setChildrenChecked(child, checked)
    }
  })
}

function updateParentChecked(node) {
  const parent = getParentNode(node)
  if (!parent) {
    return
  }
  const children = getChildren(parent).filter((child) => !isNodeDisabled(child))
  const allChecked = children.length > 0 && children.every((child) => child.checked === true)
  const someChecked = children.some((child) => child.checked === true || child.indeterminate === true)
  parent.checked = allChecked
  parent.indeterminate = !allChecked && someChecked
  updateParentChecked(parent)
}

function syncParentChecked(nodes) {
  nodes.forEach((node) => {
    const children = getChildren(node)
    if (children.length > 0) {
      syncParentChecked(children)
      const enabledChildren = children.filter((child) => !isNodeDisabled(child))
      const allChecked = enabledChildren.length > 0 && enabledChildren.every((child) => child.checked === true)
      const someChecked = enabledChildren.some((child) => child.checked === true || child.indeterminate === true)
      node.checked = allChecked
      node.indeterminate = !allChecked && someChecked
    }
  })
}

function getParentNode(node) {
  const mapItem = nodeMap.value[getNodeKey(node)]
  return mapItem ? mapItem.parent : null
}

function walkNodes(nodes, callback) {
  nodes.forEach((node) => {
    callback(node)
    walkNodes(getChildren(node), callback)
  })
}

function getNodeByKey(key) {
  const mapItem = nodeMap.value[key]
  return mapItem ? mapItem.node : null
}

function getCheckedNodes(leafOnly) {
  const result = []
  walkNodes(treeData.value, (node) => {
    const isLeaf = getChildren(node).length === 0
    if (node.checked === true && (!leafOnly || isLeaf)) {
      result.push(node)
    }
  })
  return result
}

function getCheckedKeys(leafOnly) {
  return getCheckedNodes(leafOnly).map((node) => getNodeKey(node))
}

function getHalfCheckedNodes() {
  const result = []
  walkNodes(treeData.value, (node) => {
    if (node.indeterminate === true) {
      result.push(node)
    }
  })
  return result
}

function getHalfCheckedKeys() {
  return getHalfCheckedNodes().map((node) => getNodeKey(node))
}

function setCheckedKeys(keys, leafOnly) {
  const checkedKeys = Array.isArray(keys) ? keys : []
  walkNodes(treeData.value, (node) => {
    node.checked = false
    node.indeterminate = false
  })
  checkedKeys.forEach((key) => {
    const node = getNodeByKey(key)
    if (node) {
      const isLeaf = getChildren(node).length === 0
      if (!leafOnly || isLeaf) {
        setNodeChecked(node, true, !props.checkStrictly)
      }
    }
  })
  if (!props.checkStrictly) {
    syncParentChecked(treeData.value)
  }
}

function setChecked(key, checked, deep) {
  const node = typeof key === 'object' ? key : getNodeByKey(key)
  if (node) {
    setNodeChecked(node, checked, deep)
  }
}

function setCurrentKey(key) {
  currentKey.value = key
}

function getCurrentKey() {
  return currentKey.value
}

function getCurrentNode() {
  return getNodeByKey(currentKey.value)
}

function emitCheck(node) {
  emit('check', node, {
    checkedNodes: getCheckedNodes(false),
    checkedKeys: getCheckedKeys(false),
    halfCheckedNodes: getHalfCheckedNodes(),
    halfCheckedKeys: getHalfCheckedKeys()
  })
}

defineExpose({
  getCheckedNodes,
  getCheckedKeys,
  getHalfCheckedNodes,
  getHalfCheckedKeys,
  setCheckedKeys,
  setChecked,
  setCurrentKey,
  getCurrentKey,
  getCurrentNode,
  getNodeByKey
})
</script>


<style lang="scss" scoped>
.up-tree {
  font-size: 28rpx;
  color: var(--up-main-color, #303133);
}

.up-tree-node__content {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 72rpx;
  box-sizing: border-box;
  border-radius: 8rpx;
}

.up-tree-node--current .up-tree-node__content {
  background-color: var(--up-primary-light, #ecf5ff);
}

.up-tree-node--disabled {
  opacity: 0.55;
}

.up-tree-node__switcher {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.up-tree-node__checkbox {
  margin-left: 8rpx;
  margin-right: 8rpx;
}

.up-tree-node__label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.up-tree-node__text {
  color: var(--up-main-color, #303133);
  font-size: 28rpx;
  line-height: 40rpx;
}
</style>
