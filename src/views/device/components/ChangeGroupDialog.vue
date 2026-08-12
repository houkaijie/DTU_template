<template>
  <el-dialog :close-on-click-modal="false" title="修改分组" :visible.sync="open" width="50%">
    <div class="container">
      <div class="search-box" style="display:flex;justify-content:space-between;">
        <el-form label-width="100px" size="small" inline>
          <el-form-item label="分组名称">
            <el-input v-model="form.groupName" style="width:200px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="searchParams = Object.assign({}, form)">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>
      <v-table ref="table" :request="fetchGroupList" :params="tableParams" :pagination="false" :fix-height="false">
        <el-table-column label="序号" prop="id" width="100px" />
        <el-table-column label="分组名称" prop="group_name" />
        <el-table-column label="设备数量" prop="devices_count" width="150px" />
        <el-table-column label="创建时间" prop="created_at" width="250px" />
        <el-table-column label="操作" fixed="right" width="250px">
          <template slot-scope="{ row }">
            <el-button size="small" type="primary" :loading="row.loading" @click="onSelect(row)">选择分组</el-button>
          </template>
        </el-table-column>
      </v-table>
    </div>
  </el-dialog>
</template>

<script>
import VTable from '@/components/VTable'
import { groupList } from '@/api/group' // eslint-disable-line no-unused-vars
import { changeDeviceGroup } from '@/api/device'

export default {
  name: 'ChangeGroupDialog',
  components: { VTable },
  props: {
    visible: { type: Boolean, required: true },
    device: { type: Object, default: null }
  },
  data() {
    return {
      form: { groupName: undefined },
      searchParams: {},
      loading: false
    }
  },
  computed: {
    open: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    tableParams() {
      return { ...this.searchParams }
    }
  },
  methods: {
    // 模板不能直接引用 import 的函数 (vue-loader 15.11 + Vue2.6 会编译成 _vm.xxx 导致 undefined), 用方法包装
    fetchGroupList(params) {
      return groupList(params)
    },
    onSelect(group) {
      if (!this.device || !this.device.id) return this.$message.error('设备信息缺失')
      this.loading = true
      changeDeviceGroup({ deviceId: this.device.id, groupId: group.id }).then(() => {
        this.$message.success('修改成功')
        this.open = false
        this.$emit('success')
      }).finally(() => { this.loading = false })
    }
  }
}
</script>
