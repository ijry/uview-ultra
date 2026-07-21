<template>
  <view class="up-tree-node" :style="{ paddingLeft: depth * 20 + 'px' }">
    <view class="up-tree-node-content" @click="toggle">
      <!-- <text v-if="hasChildren" class="up-tree-node-toggle">
        {{ node.expanded ? '▼' : '▶' }}
      </text> -->
      <up-icon v-if="hasChildren" class="up-tree-node-toggle"
       :name="node.expanded ? 'arrow-down-fill' : 'play-right-fill'" size="12" />
      <up-checkbox
        v-if="showCheckbox"
        usedAlone
        :size="12"
        :checked="node.checked"
        @change="toggleCheck"
        style="margin-right: 10px;"
      />
      <slot :nodeData="node" :level="depth + 1">
        {{ node[props.label] }}
      </slot>
    </view>
    <view v-if="hasChildren && (node.expanded === undefined ? true : node.expanded)"
      class="up-tree-node-children"
      :style="{ paddingLeft: (depth + 1) * 20 + 'px' }">
      <tree-node
        v-for="child in node[props.children]"
        :key="child[props.nodeKey]"
        :node="child"
        :props="props"
        :show-checkbox="showCheckbox"
        :check-strictly="checkStrictly"
        :expand-on-click-node="expandOnClickNode"
        :depth="depth + 1"
        @node-click="$emit('node-click', $event)"
        @check-change="$emit('check-change', $event)">
        <template #default="{ nodeData, level }">
            <slot name="default" :nodeData="nodeData" :level="level"></slot>
        </template>
      </tree-node>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

defineOptions({
	name: 'tree-node',
	// #ifdef MP-WEIXIN
	options: {
		virtualHost: true
	}
	// #endif
})

const props = defineProps({
	node: {
		type: Object,
		required: true
	},
	props: {
		type: Object,
		required: true
	},
	showCheckbox: {
		type: Boolean,
		default: false
	},
	checkStrictly: {
		type: Boolean,
		default: false
	},
	expandOnClickNode: {
		type: Boolean,
		default: true
	},
	depth: {
		type: Number,
		default: 0
	}
})
const emit = defineEmits(['node-click', 'check-change'])
const instance = getCurrentInstance()

const hasChildren = computed(() => {
	return props.node[props.props.children] && props.node[props.props.children].length > 0
})
const isExpanded = computed(() => {
	return props.node.expanded === undefined ? false : props.node.expanded
})

function toggle() {
	if (props.expandOnClickNode && hasChildren.value) {
		props.node.expanded = !props.node.expanded
	}
	emit('node-click', props.node)
}

function toggleCheck(checked) {
	props.node.checked = checked
	if (!props.checkStrictly) {
		updateChildCheckStatus(props.node, checked)
		updateParentCheckStatus(props.node)
	}
	emit('check-change', props.node)
}

function updateChildCheckStatus(node, checked) {
	if (node[props.props.children]) {
		node[props.props.children].forEach(child => {
			child.checked = checked
			updateChildCheckStatus(child, checked)
		})
	}
}

function updateParentCheckStatus(node) {
	let parentVm = instance?.parent
	while (parentVm) {
		const parentProxy = parentVm.proxy
		if (!parentProxy || !parentProxy.node) break
		const allChecked = parentProxy.node[props.props.children].every(
			child => child.checked
		)
		parentProxy.node.checked = allChecked
		parentVm = parentVm.parent
	}
}
</script>


<style scoped>
.up-tree-node-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 20px;
}
.up-tree-node-toggle {
  margin-right: 5px;
}
</style>
