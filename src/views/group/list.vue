<template>
  <div class="page">
    <div class="container">
      <div class="search-box" style="display:flex;justify-content:space-between;">
        <el-form label-width="100px" size="small" inline>
          <el-form-item label="分组名称">
            <el-input v-model="keyword" style="width:200px;" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" icon="el-icon-search" @click="onSearch">搜索</el-button>
          </el-form-item>
        </el-form>
        <div>
          <el-button type="primary" size="small" @click="openAdd = true">添加分组</el-button>
        </div>
      </div>

      <v-table ref="table" :request="fetchGroupList" :params="params" fix-height>
        <el-table-column label="序号" prop="id" width="80px" />
        <el-table-column label="分组名称">
          <template slot-scope="{ row }">
            <span>{{ row.group_name }}</span>
            <el-tag v-if="row.is_default === 1" size="mini" type="info" style="margin-left:8px;">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备数量" prop="devices_count" width="120px" />
        <el-table-column label="创建时间" prop="created_at" width="180px" />
        <el-table-column label="操作" fixed="right" width="440px">
          <template slot-scope="{ row }">
            <el-button size="small" type="primary" @click="onConfig(row)">参数配置</el-button>
            <el-button size="small" @click="onDevice(row)">管理设备</el-button>
            <el-button
              v-if="row.is_default === 0"
              size="small"
              type="danger"
              :loading="row.loading"
              @click="onDel(row)"
            >删除</el-button>
            <el-button size="small" @click="onCopy(row)">复制</el-button>
            <el-button size="small" @click="onExportConfig(row)">导出配置</el-button>
            <el-button
              v-if="row.is_default === 0"
              size="small"
              @click="onChangeName(row)"
            >修改名称</el-button>
          </template>
        </el-table-column>
      </v-table>
    </div>

    <config-dialog :visible.sync="showConfig" :group-id="configGroupId" @success="onRefresh" />
    <group-form :visible.sync="openAdd" @success="onRefresh" />
    <copy-dialog :visible.sync="openCopy" :group="copyGroup" @success="onRefresh" />
    <change-name-dialog :visible.sync="openChangeName" :group="renameGroup" @success="onRefresh" />
    <device-dialog :visible.sync="openDevice" :group="deviceGroup" @success="onRefresh" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import VTable from '@/components/VTable'
import { groupList, delGroup, groupInfo } from '@/api/group' // eslint-disable-line no-unused-vars
import ConfigDialog from './components/ConfigDialog'
import GroupForm from './components/GroupForm'
import CopyDialog from './components/CopyDialog'
import ChangeNameDialog from './components/ChangeNameDialog'
import DeviceDialog from './components/DeviceDialog'

export default {
  name: 'GroupList',
  components: { VTable, ConfigDialog, GroupForm, CopyDialog, ChangeNameDialog, DeviceDialog },
  data() {
    return {
      openDevice: false,
      openChangeName: false,
      openCopy: false,
      openAdd: false,
      showConfig: false,
      configGroupId: undefined,
      copyGroup: {},
      renameGroup: {},
      deviceGroup: {},
      keyword: undefined,
      params: { groupName: undefined }
    }
  },
  computed: {
    ...mapGetters(['userInfo'])
  },
  methods: {
    onRefresh() {
      this.$refs.table.refresh()
    },
    // 模板不能直接引用 import 的函数 (vue-loader 15.11 + Vue2.6 会编译成 _vm.xxx 导致 undefined), 用方法包装
    fetchGroupList(params) {
      return groupList(params)
    },
    onSearch() {
      this.params = { groupName: this.keyword }
    },
    onConfig(row) {
      this.configGroupId = row.id
      this.showConfig = true
    },
    onDevice(row) {
      this.deviceGroup = row
      this.openDevice = true
    },
    onCopy(row) {
      this.copyGroup = row
      this.openCopy = true
    },
    onChangeName(row) {
      this.renameGroup = row
      this.openChangeName = true
    },
    onDel(row) {
      this.$confirm('确定删除此分组? 组内设备将移入默认分组').then(() => {
        this.$set(row, 'loading', true)
        delGroup(row.id).then(() => {
          this.$message.success('删除成功')
          this.onRefresh()
        }).finally(() => { this.$set(row, 'loading', false) })
      }).catch(() => {})
    },
    onExportConfig(row) {
      // 导出分组配置为 JSON 文件
      groupInfo(row.id).then(detail => {
        const blob = new Blob([JSON.stringify(JSON.parse(detail.data.config), null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `分组配置_${row.group_name}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 15px;

  .container {
    background: #fff;
    padding: 15px;
    border-radius: 4px;
  }
}
</style>
