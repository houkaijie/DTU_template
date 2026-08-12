<template>
  <div class="v-table">
    <el-table
      ref="table"
      v-loading="loading"
      :data="items"
      :height="fixHeight ? tableHeight : undefined"
      :row-key="rowKey"
      border
      stripe
      @selection-change="onSelectionChange"
    >
      <slot />
    </el-table>
    <div v-if="pagination" class="v-table-pagination">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :current-page="page"
        :page-size="size"
        :page-sizes="pageSizes"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>

<script>
/**
 * 通用表格组件: 自动请求数据 + 分页 + 高度自适应
 * props:
 *   request  - 请求函数 (params) => Promise<{data:{total, items}}>
 *   params   - 额外查询参数 (响应式)
 *   fix-height - 是否固定高度自适应
 *   pagination - 是否显示分页 (默认 true)
 * methods:
 *   refresh() - 重新加载
 *   reload()  - 保留页码重新加载
 */
export default {
  name: 'VTable',
  props: {
    request: { type: Function, required: true },
    params: { type: Object, default: () => ({}) },
    fixHeight: { type: Boolean, default: false },
    pagination: { type: Boolean, default: true },
    rowKey: { type: String, default: 'id' },
    immediate: { type: Boolean, default: true },
    // 与线上一致: 每页条数选项, 默认 15
    pageSizes: { type: Array, default: () => [15, 30, 60, 100, 200] }
  },
  data() {
    return {
      items: [],
      total: 0,
      page: 1,
      size: 15,
      loading: false,
      tableHeight: 500
    }
  },
  watch: {
    params: {
      handler() {
        this.refresh()
      },
      deep: true
    }
  },
  created() {
    if (this.immediate) this.refresh()
  },
  mounted() {
    if (this.fixHeight) {
      this.calcHeight()
      window.addEventListener('resize', this.calcHeight)
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calcHeight)
  },
  methods: {
    calcHeight() {
      const el = this.$el
      if (!el) return
      const top = el.getBoundingClientRect().top
      this.tableHeight = Math.max(300, window.innerHeight - top - (this.pagination ? 70 : 20))
    },
    async refresh() {
      this.loading = true
      try {
        const query = {
          page: this.page,
          size: this.size,
          ...this.params
        }
        const res = await this.request(query)
        this.items = res.data.items || []
        this.total = res.data.total || 0
      } catch (e) {
        console.error('v-table 请求失败', e)
      } finally {
        this.loading = false
      }
    },
    reload() {
      this.refresh()
    },
    onPageChange(p) {
      this.page = p
      this.refresh()
    },
    onSizeChange(s) {
      this.size = s
      this.page = 1
      this.refresh()
    },
    onSelectionChange(rows) {
      this.$emit('selection-change', rows)
    },
    clearSelection() {
      if (this.$refs.table) this.$refs.table.clearSelection()
    }
  }
}
</script>

<style lang="scss" scoped>
.v-table {
  .v-table-pagination {
    margin-top: 15px;
    text-align: right;
  }
}
</style>
