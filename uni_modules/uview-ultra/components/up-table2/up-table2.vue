<template>
    <view class="up-table2" :class="{ 'up-table-border': border }">
        <scroll-view scroll-x scroll-y class="up-table2-content"
            :style="{ height: height ? addUnit(height) : 'auto' }"
            @scroll="onScroll">
            <!-- 表头 -->
            <view v-if="showHeader" class="up-table-header"
                :class="{ 'up-table-sticky': fixedHeader }"
                :style="{minWidth: scrollWidth}">
                <view class="up-table-row">
                    <view v-for="(col, colIndex) in columns" :key="col.key" class="up-table-cell"
                        :class="[col.headerAlign ? 'up-text-' + col.headerAlign : (col.align ? 'up-text-' + col.align : '') ,
                            headerCellClassName ? headerCellClassName(col) : '',
                            getFixedClass(col)
                        ]" :style="headerColStyle(col)" @click="handleHeaderClick(col)">
                        <slot name="header" :column="col" :columnIndex="colIndex" :level="1">
                        </slot>
                        <text v-if="!$slots['header']">{{ col.title }}</text>
                        <template v-if="col.sortable">
                            <slot name="headerSort" :sortStatus="getSortValue(col.key)" :column="col"
                                :columnIndex="colIndex" :level="1">
                            </slot>
                            <view v-if="!$slots['headerSort']">
                                {{ getSortIcon(col.key) }}
                            </view>
                        </template>
                    </view>
                </view>
            </view>

            <!-- 表体 -->
            <view class="up-table-body" :style="{ minWidth: scrollWidth, maxHeight: maxHeight ? maxHeight + 'px' : 'none' }">
                <template v-if="data && data.length > 0">
                    <!-- #ifdef MP-WEIXIN -->
                    <template v-for="(item, flatIndex) in flattenedSortedData" :key="item.row[rowKey] || flatIndex">
                        <view class="up-table-row up-table-row-child" :class="[highlightCurrentRow && currentRow === item.row ? 'up-table-row-highlight' : '',
                            rowClassName ? rowClassName(item.row, item.rowIndex) : '',
                            stripe && flatIndex % 2 === 1 ? 'up-table-row-zebra' : ''
                        ]" :style="{ height: rowHeight }" @click="handleRowClick(item.row)">
                            <view v-for="(col, colIndex) in columns" :key="col.key" class="up-table-cell"
                                :class="[col.align ? 'up-text-' + col.align : '',
                                    cellClassName ? cellClassName(item.row, col) : '',
                                    getFixedClass(col),
                                    getCellSpanClass(item.row, col, item.rowIndex, colIndex)
                                ]"
                                :style="[cellStyleInner({ row: item.row, column: col, rowIndex: item.rowIndex, columnIndex: colIndex, level: item.level }), getCellSpanStyle(item.row, col, item.rowIndex, colIndex)]">
                                <view v-if="col.type === 'selection'">
                                    <checkbox :checked="isSelected(item.row)" @click.stop="toggleSelect(item.row)" />
                                </view>
                                <template v-else>
                                    <view v-if="col.key === computedMainCol && hasTree" @click.stop="toggleExpand(item.row)"
                                        :style="{ width: expandWidth }">
                                        <view v-if="item.row[treeProps.children] && item.row[treeProps.children].length > 0">
                                            {{ isExpanded(item.row) ? '▼' : '▶' }}
                                        </view>
                                    </view>
                                    <slot name="cell" :row="item.row" :column="col" :prow="item.parentRow"
                                        :rowIndex="item.rowIndex" :columnIndex="colIndex" :level="item.level">
                                        <view class="up-table-cell__content">
                                            {{ item.row[col.key] }}
                                        </view>
                                    </slot>
                                </template>
                            </view>
                        </view>
                    </template>
                    <!-- #endif -->
                    <!-- #ifndef MP-WEIXIN -->
                    <table-row
                        v-for="(row, rowIndex) in sortedData"
                        :key="row[rowKey] || rowIndex"
                        :row="row"
                        :rowIndex="rowIndex"
                        :parent-row="null"
                        :columns="columns"
                        :tree-props="treeProps"
                        :row-key="rowKey"
                        :expanded-keys="expandedKeys"
                        :cell-style-inner="cellStyleInner"
                        :is-expanded="isExpanded"
                        :row-class-name="rowClassName"
                        :stripe="stripe"
                        :cell-class-name="cellClassName"
                        :get-fixed-class="getFixedClass"
                        :highlight-current-row="highlightCurrentRow"
                        :current-row="currentRow"
                        :handle-row-click="handleRowClick"
                        :toggle-expand="toggleExpand"
                        :level="1"
                        :rowHeight="rowHeight"
                        :hasTree="hasTree"
                        :selectedRows="selectedRows"
                        :expandWidth="expandWidth"
                        :computedMainCol="computedMainCol"
                        :span-method="spanMethod"
                        @toggle-select="toggleSelect"
                        @row-click="handleRowClick"
                        @toggle-expand="toggleExpand"
                    >
                        <template v-slot:cellChild="scope">
                            <slot name="cell" :row="scope.row" :column="scope.column" :prow="scope.prow"
                                :rowIndex="scope.rowIndex" :columnIndex="scope.columnIndex" :level="scope.level">
                            </slot>
                        </template>
                    </table-row>
                    <!-- #endif -->
                </template>
                <template v-else>
                    <slot name="empty">
                    </slot>
                    <view v-if="!$slots['empty']" class="up-table-empty">{{ emptyText }}</view>
                </template>
            </view>
        </scroll-view>

        <!-- 固定列浮动视图 -->
        <view v-if="showFixedColumnShadow" class="up-table-fixed-shadow" :style="{ height: tableHeight }">
            <!-- 表头 -->
            <view v-if="showHeader" class="up-table-header" :class="{ 'up-table-sticky': fixedHeader }" :style="{minWidth: scrollWidth}">
                <view class="up-table-row" :style="{height: headerHeight}">
                    <view v-for="(col, colIndex) in visibleFixedLeftColumns" :key="col.key" class="up-table-cell"
                        :style="headerColStyle(col)"
                        :class="[col.align ? 'up-text-' + col.align : '',
                            headerCellClassName ? headerCellClassName(col) : '',
                            getFixedClass(col)
                        ]" @click="handleHeaderClick(col)">
                        <slot name="header" :column="col" :columnIndex="colIndex" :level="1">
                        </slot>
                        <text v-if="!$slots['header']">{{ col.title }}</text>
                        <template v-if="col.sortable">
                            <slot name="headerSort" :sortStatus="getSortValue(col.key)" :column="col"
                                :columnIndex="colIndex" :level="1">
                            </slot>
                            <view v-if="!$slots['headerSort']">
                                {{ getSortIcon(col.key) }}
                            </view>
                        </template>
                    </view>
                </view>
            </view>

            <!-- 表体 -->
            <view class="up-table-body" :style="{ minWidth: scrollWidth, maxHeight: maxHeight ? maxHeight + 'px' : 'none' }">
                <template v-if="data && data.length > 0">
                    <!-- #ifdef MP-WEIXIN -->
                    <template v-for="(item, flatIndex) in flattenedSortedData" :key="item.row[rowKey] || flatIndex">
                        <view class="up-table-row up-table-row-child" :class="[highlightCurrentRow && currentRow === item.row ? 'up-table-row-highlight' : '',
                            rowClassName ? rowClassName(item.row, item.rowIndex) : '',
                            stripe && flatIndex % 2 === 1 ? 'up-table-row-zebra' : ''
                        ]" :style="{ height: rowHeight }" @click="handleRowClick(item.row)">
                            <view v-for="(col, colIndex) in visibleFixedLeftColumns" :key="col.key" class="up-table-cell"
                                :class="[col.align ? 'up-text-' + col.align : '',
                                    cellClassName ? cellClassName(item.row, col) : '',
                                    getFixedClass(col),
                                    getCellSpanClass(item.row, col, item.rowIndex, colIndex)
                                ]"
                                :style="[cellStyleInner({ row: item.row, column: col, rowIndex: item.rowIndex, columnIndex: colIndex, level: item.level }), getCellSpanStyle(item.row, col, item.rowIndex, colIndex)]">
                                <view v-if="col.type === 'selection'">
                                    <checkbox :checked="isSelected(item.row)" @click.stop="toggleSelect(item.row)" />
                                </view>
                                <template v-else>
                                    <view v-if="col.key === computedMainCol && hasTree" @click.stop="toggleExpand(item.row)"
                                        :style="{ width: expandWidth }">
                                        <view v-if="item.row[treeProps.children] && item.row[treeProps.children].length > 0">
                                            {{ isExpanded(item.row) ? '▼' : '▶' }}
                                        </view>
                                    </view>
                                    <!-- 固定列浮动视图直接内联渲染，避免与主表体 slot name="cell" 重名（微信小程序不允许同组件多个同名 slot） -->
                                    <view class="up-table-cell__content">
                                        {{ item.row[col.key] }}
                                    </view>
                                </template>
                            </view>
                        </view>
                    </template>
                    <!-- #endif -->
                    <!-- #ifndef MP-WEIXIN -->
                    <template v-for="(row, rowIndex) in sortedData" :key="row[rowKey] || rowIndex">
                        <!-- 子级渲染 (递归组件) -->
                        <table-row
                            :row="row"
                            :rowIndex="rowIndex"
                            :parent-row="null"
                            :columns="visibleFixedLeftColumns"
                            :tree-props="treeProps"
                            :row-key="rowKey"
                            :expanded-keys="expandedKeys"
                            :cell-style-inner="cellStyleInner"
                            :is-expanded="isExpanded"
                            :row-class-name="rowClassName"
                            :stripe="stripe"
                            :cell-class-name="cellClassName"
                            :get-fixed-class="getFixedClass"
                            :highlight-current-row="highlightCurrentRow"
                            :current-row="currentRow"
                            :handle-row-click="handleRowClick"
                            :toggle-expand="toggleExpand"
                            :level="1"
                            :rowHeight="rowHeight"
                            :hasTree="hasTree"
                            :selectedRows="selectedRows"
                            :expandWidth="expandWidth"
                            :computedMainCol="computedMainCol"
                            :span-method="spanMethod"
                            @toggle-select="toggleSelect"
                            @row-click="handleRowClick"
                            @toggle-expand="toggleExpand"
                        >
                            <template v-slot:cellChild="scope">
                                <slot name="cell" :row="scope.row" :column="scope.column" :prow="scope.prow"
                                    :rowIndex="scope.rowIndex" :columnIndex="scope.columnIndex" :level="scope.level">
                                </slot>
                            </template>
                        </table-row>
                    </template>
                    <!-- #endif -->
                </template>
            </view>
        </view>
    </view>
</template>

<script setup>
import { addUnit, sleep } from '../../libs/function/index';
import tableRow from './tableRow.vue'; // 引入递归组件

import { computed, getCurrentInstance, nextTick, ref, watch, onMounted } from 'vue'
import { commonProps, useUltraUI } from '../../libs/composable/useUltraUI.js'

defineOptions({
	name: 'up-table2',
	components: {
		tableRow
	},
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
            required: true,
            default: () => {
                return []
            }
        },
        columns: {
            type: Array,
            required: true,
            default: () => {
                return []
            },
            validator: cols =>
                cols.every(col =>
                    ['default', 'selection', 'expand'].includes(col.type || 'default')
                )
        },
        stripe: {
            type: Boolean,
            default: false
        },
        border: {
            type: Boolean,
            default: false
        },
        height: {
            type: [String, Number],
            default: null
        },
        maxHeight: {
            type: [String, Number],
            default: null
        },
        showHeader: {
            type: Boolean,
            default: true
        },
        highlightCurrentRow: {
            type: Boolean,
            default: false
        },
        rowKey: {
            type: String,
            default: 'id'
        },
        currentRowKey: {
            type: [String, Number],
            default: null
        },
        rowStyle: {
            type: Object,
            default: () => ({})
        },
        cellClassName: {
            type: Function,
            default: null
        },
		cellStyle: {
		    type: Function,
		    default: null
		},
        headerCellClassName: {
            type: Function,
            default: null
        },
        rowClassName: {
            type: Function,
            default: null
        },
        context: {
            type: Object,
            default: null
        },
        showOverflowTooltip: {
            type: Boolean,
            default: false
        },
        lazy: {
            type: Boolean,
            default: false
        },
        load: {
            type: Function,
            default: null
        },
        treeProps: {
            type: Object,
            default: () => ({
                children: 'children',
                hasChildren: 'hasChildren'
            })
        },
        defaultExpandAll: {
            type: Boolean,
            default: false
        },
        expandRowKeys: {
            type: Array,
            default: () => []
        },
        sortOrders: {
            type: Array,
            default: () => ['ascending', 'descending']
        },
        sortable: {
            type: [Boolean, String],
            default: false
        },
        multiSort: {
            type: Boolean,
            default: false
        },
        sortBy: {
            type: String,
            default: null
        },
        sortMethod: {
            type: Function,
            default: null
        },
        filters: {
            type: Object,
            default: () => ({})
        },
        fixedHeader: {
            type: Boolean,
            default: true
        },
        emptyText: {
            type: String,
            default: '暂无数据'
        },
        // 添加mainCol属性，用于指定树形结构展开控制图标所在的列
        mainCol: {
            type: String,
            default: ''
        },
        expandWidth: {
            type: String,
            default: '25px'
        },
        rowHeight: {
            type: String,
            default: '36px'
        },
        // 添加spanMethod属性，用于合并单元格
        spanMethod: {
            type: Function,
            default: null
        }
})

const emit = defineEmits(['select', 'select-all', 'selection-change', 'cell-click', 'row-click', 'row-dblclick', 'header-click', 'sort-change', 'filter-change', 'current-change', 'expand-change'])
const { $uGetRect } = useUltraUI(props)
const instance = getCurrentInstance()
const proxy = instance?.proxy

const scrollWidth = ref('auto')
const expandedKeys = ref([...props.expandRowKeys])
const selectedRows = ref([])
const sortConditions = ref([])
const currentRow = ref(null)
const scrollLeft = ref(0)
const showFixedColumnShadow = ref(false)
const fixedLeftColumns = ref([])
const tableHeight = ref('auto')
const headerHeight = ref('auto')
const hasTree = ref(false) // 新增属性，用于判断是否存在树形结构

const filteredData = computed(() => {
            return props.data.filter(row => {
                return Object.keys(props.filters).every(key => {
                    const filter = props.filters[key];
                    if (!filter) return true;
                    return row[key]?.toString().includes(filter.toString());
                });
            });
        })
const sortedData = computed(() => {
            if (!sortConditions.value.length) return filteredData.value;

            const data = [...filteredData.value];

            return data.sort((a, b) => {
                for (const condition of sortConditions.value) {
                    const { field, order } = condition;
                    let valA = a[field];
                    let valB = b[field];

                    if (props.sortMethod) {
                        const result = props.sortMethod(a, b, field);
                        if (result !== 0) return result * (order === 'ascending' ? 1 : -1);
                    }

                    if (valA < valB) return order === 'ascending' ? -1 : 1;
                    if (valA > valB) return order === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        })
const flattenedSortedData = computed(() => {
            const result = [];
            const childrenKey = props.treeProps.children;

            const walk = (rows, parentRow = null, level = 1) => {
                if (!Array.isArray(rows) || rows.length === 0) return;
                rows.forEach((row, rowIndex) => {
                    result.push({ row, parentRow, level, rowIndex });
                    const children = row && row[childrenKey];
                    if (children && children.length > 0 && isExpanded(row)) {
                        walk(children, row, level + 1);
                    }
                });
            };

            walk(sortedData.value);
            return result;
        })
const visibleFixedLeftColumns = computed(() => {
            if (scrollLeft.value <= 0) {
                return [];
            }

            let totalWidth = 0;
            let fixedWidth = 0;
            const visibleColumns = [];

            // 遍历所有列，不仅仅是固定列
            for (let i = 0; i < props.columns.length; i++) {
                const col = props.columns[i];
                const colWidth = col.width ? parseInt(col.width) : 100; // 默认宽度100px

                // 如果是固定列且滚动位置足够显示该列
                if (col.fixed === 'left' && scrollLeft.value > totalWidth - fixedWidth) {
                    visibleColumns.push(col);
                    fixedWidth += colWidth;
                }

                totalWidth += colWidth;
            }

            return visibleColumns;
        })
const computedMainCol = computed(() => {
            if (props.mainCol) {
                return props.mainCol;
            }
            // 修改为排除有type值的列
            const validColumns = props.columns.filter(col => !col.type);
            let mainCol = validColumns && validColumns.length > 0 ? validColumns[0].key : '';
            // console.log('mainCol', mainCol)
            return mainCol;
        })

function isSelected(row) {
            return selectedRows.value.some(r => r[props.rowKey] === row[props.rowKey]);
        }

function getCellSpan(row, column, rowIndex, columnIndex) {
            if (typeof props.spanMethod !== 'function') {
                return { rowspan: 1, colspan: 1 };
            }

            const result = props.spanMethod({
                row,
                column,
                rowIndex,
                columnIndex
            });

            if (Array.isArray(result)) {
                const [rowspan, colspan] = result;
                return { rowspan: rowspan != null ? rowspan : 1, colspan: colspan != null ? colspan : 1 };
            }

            if (result && typeof result === 'object') {
                const { rowspan, colspan } = result;
                return { rowspan: rowspan != null ? rowspan : 1, colspan: colspan != null ? colspan : 1 };
            }

            return { rowspan: 1, colspan: 1 };
        }

function getCellSpanClass(row, column, rowIndex, columnIndex) {
            const span = getCellSpan(row, column, rowIndex, columnIndex);
            if (span.rowspan === 0 || span.colspan === 0) {
                return 'up-table-cell-hidden';
            }
            if (span.rowspan > 1 || span.colspan > 1) {
                return 'up-table-cell-merged';
            }
            return '';
        }

function getCellSpanStyle(row, column, rowIndex, columnIndex) {
            const span = getCellSpan(row, column, rowIndex, columnIndex);
            const style = {};

            if (span.rowspan > 1) {
                const currentHeight = parseInt(props.rowHeight);
                if (!isNaN(currentHeight)) {
                    style.height = `${span.rowspan * currentHeight}px`;
                }
            }

            if (span.colspan > 1) {
                style.flex = span.colspan;
            }

            if (span.rowspan === 0 || span.colspan === 0) {
                style.display = 'none';
            }

            return style;
        }

function onScroll(e) {
            scrollLeft.value = e.detail.scrollLeft;
            // 获取所有左侧固定列
            fixedLeftColumns.value = props.columns.filter(col => col.fixed === 'left');
            // 计算是否需要显示固定列阴影
            if (fixedLeftColumns.value.length > 0) {
                showFixedColumnShadow.value = scrollLeft.value > 0;
            }
        }

function getFixedShadowStyle(col, index) {
            let style = {
                width: col.width ? addUnit(col.width) : 'auto',
            };

            if (col?.style) {
                style = {...style, ...col?.style};
            }

            return style;
        }

function getFixedClass(col) {
            return ''; // 不再使用原来的固定列样式类
        }

function headerColStyle(col) {
            let style = {
                width: col.width ? addUnit(col.width) : 'auto',
                flex: col.width ? 'none' : 1
            };
            if (col?.style) {
                style = {...style, ...col?.style};
            }
            return style;
        }

function setCellStyle(e) {
			props.cellStyle = e
		}

function cellStyleInner(scope) {
			let style = {
				width: scope.column?.width ? addUnit(scope.column.width) : 'auto',
				flex: scope.column?.width ? 'none' : 1
			};
            // 只有展开列设置padding
            if (scope.column.key == computedMainCol.value) {
                style.paddingLeft = (16 * (scope.level -1 )) + 2 + 'px'
            }
			if (props.cellStyle != null) {
				let styleCalc = props.cellStyle(scope)
				if (styleCalc != null) {
					style = {...style, ...styleCalc}
				}
			}
			return style;
		}

async function getComponentWidth() {
			// 延时一定时间，以获取dom尺寸
			await sleep(30)
			$uGetRect('.up-table-row').then(size => {
				scrollWidth.value = size.width + 'px'
			})

            // 获取表头高度并设置
            $uGetRect('.up-table-header').then(size => {
                if (size.height) {
                    headerHeight.value = size.height + 'px';
                }
            })

            // 遍历数据列表第一层判断是否存在树形结构
            hasTree.value = sortedData.value.some(item => {
                return item[props.treeProps.children] && item[props.treeProps.children].length > 0;
            });
		}

function handleRowClick(row) {
            if (props.highlightCurrentRow) {
                const oldRow = currentRow.value;
                currentRow.value = row;
                emit('current-change', row, oldRow);
            }
            emit('row-click', row);
        }

function handleHeaderClick(column) {
            if (!column.sortable) return;

            const index = sortConditions.value.findIndex(c => c.field === column.key);
            let newOrder = 'ascending';

            if (index >= 0) {
                if (sortConditions.value[index].order === 'ascending') {
                    newOrder = 'descending';
                } else {
                    sortConditions.value.splice(index, 1);
                    emit('sort-change', sortConditions.value);
                    return;
                }
            }

            if (!props.multiSort) {
                sortConditions.value = [{ field: column.key, order: newOrder }];
            } else {
                if (index >= 0) {
                    sortConditions.value[index].order = newOrder;
                } else {
                    sortConditions.value.push({ field: column.key, order: newOrder });
                }
            }

            emit('sort-change', sortConditions.value);
        }

function getSortIcon(field) {
            const cond = sortConditions.value.find(c => c.field === field);
            if (!cond) return '';
            return cond.order === 'ascending' ? '↑' : '↓';
        }

function getSortValue(field) {
            const cond = sortConditions.value.find(c => c.field === field);
            if (!cond) return '';
            return cond.order === 'ascending';
        }

function toggleSelect(row) {
            const index = selectedRows.value.findIndex(r => r[props.rowKey] === row[props.rowKey]);
            if (index >= 0) {
                // 取消选中当前行及其所有子节点
                selectedRows.value.splice(index, 1);
                // 递归取消所有子节点
                unselectChildren(row);
            } else {
                // 选中当前行及其所有子节点
                selectedRows.value.push(row);
                // 递归选中所有子节点
                selectChildren(row);
            }
            console.log(selectedRows.value)
            emit('selection-change', selectedRows.value);
            emit('select', row);
        }

function toggleExpand(row) {
            // console.log(row)
            const key = row[props.rowKey];
            const index = expandedKeys.value.indexOf(key);
            if (index === -1) {
                expandedKeys.value.push(key);
            } else {
                expandedKeys.value.splice(index, 1);
            }
            emit('expand-change', expandedKeys.value);
        }

function isExpanded(row) {
            if (!row) {
                return false;
            }
            return expandedKeys.value.includes(row[props.rowKey]);
        }

function selectChildren(row) {
            const children = row[props.treeProps.children];
            if (children && children.length > 0) {
                children.forEach(child => {
                    // 检查是否已选中，避免重复添加
                    const childIndex = selectedRows.value.findIndex(r => r[props.rowKey] === child[props.rowKey]);
                    if (childIndex === -1) {
                        selectedRows.value.push(child);
                    }
                    // 递归处理子节点的子节点
                    selectChildren(child);
                });
            }
        }

function unselectChildren(row) {
            const children = row[props.treeProps.children];
            if (children && children.length > 0) {
                children.forEach(child => {
                    const childIndex = selectedRows.value.findIndex(r => r[props.rowKey] === child[props.rowKey]);
                    if (childIndex >= 0) {
                        selectedRows.value.splice(childIndex, 1);
                    }
                    // 递归处理子节点的子节点
                    unselectChildren(child);
                });
            }
        }

watch(() => props.expandRowKeys, (newVal) => {
	expandedKeys.value = [...(newVal || [])]
}, { immediate: true })
watch(() => props.currentRowKey, (newVal) => {
	const found = props.data.find(item => item[props.rowKey] === newVal)
	if (found) {
		currentRow.value = found
	}
}, { immediate: true })
watch(() => props.columns, () => {
	// fixedLeftColumns is refreshed on scroll / mount
}, { deep: true })

onMounted(() => {
        getComponentWidth()
        // 处理currentRowKey初始化
        if (props.currentRowKey !== null) {
            const found = props.data.find(item => item[props.rowKey] === props.currentRowKey);
            if (found) {
                currentRow.value = found;
            }
        }
        // 获取固定列
        fixedLeftColumns.value = props.columns.filter(col => col.fixed === 'left');
    })

</script>


<style lang="scss" scoped>
.up-table2 {
    width: auto;
    overflow: auto;
    white-space: nowrap;
    position: relative;

    .up-table-header {
        min-width: 100% !important;
        width: fit-content;
        background-color: var(--up-table2-header-bg-color, #f5f7fa);
    }

    .up-table-body {
        min-width: 100% !important;
        width: fit-content;
        position: relative;
    }

    .up-table-sticky {
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .up-table-row {
        display: flex;
        flex-direction: row;
        overflow: hidden;
        position: relative;
        // min-height: 40px;
    }

    // 添加border样式支持
    &.up-table-border {
        border-top: 1px solid var(--up-border-color, #ebeef5);
        border-left: 1px solid var(--up-border-color, #ebeef5);
        border-right: 1px solid var(--up-border-color, #ebeef5);
        .up-table-cell {
            border-right: 1px solid var(--up-border-color, #ebeef5);
        }

        .up-table-cell:last-child {
            border-right: none;
        }
    }

    .up-table-cell {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 10px 1px;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.1;
        border-bottom: 1px solid var(--up-border-color, #ebeef5);
        &.up-text-left {
            justify-content: flex-start;
            text-align: left;
        }
        &.up-text-center {
            justify-content: center;
            text-align: center;
        }
        &.up-text-right {
            justify-content: flex-end;
            text-align: right;
        }
    }

    .up-table-row-zebra {
        background-color: var(--up-table2-zebra-bg-color, #fafafa);
    }

    .up-table-row-highlight {
        background-color: var(--up-table2-highlight-bg-color, #f5f7fa);
    }

    .up-table-empty {
        text-align: center;
        padding: 20px;
        color: var(--up-tips-color, #999);
    }

    .up-table-cell-hidden {
        opacity: 0;
    }

    .up-table-cell-merged {
        z-index: 1;
    }
}

// 固定列浮动视图
.up-table-fixed-shadow {
    position: absolute;
    top: 0;
    left: 0;
    width: auto;
    z-index: 20;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    background-color: var(--up-card-bg-color, #ffffff);
}

// .up-table-fixed-row {
//     display: flex;
//     flex-direction: row;
//     align-items: center;
//     border-bottom: 1rpx solid #ebeef5;
//     position: relative;
// }

// 为固定列也添加border样式支持
.up-table-fixed-shadow .up-table-border {
    .up-table-cell {
        border-right: 1rpx solid var(--up-border-color, #ebeef5);
    }

    .up-table-cell:last-child {
        border-right: none;
    }
}
</style>
