<template>
  <el-dialog :close-on-click-modal="false" :title="'管理设备 - ' + (group ? group.group_name : '')" :visible.sync="open" width="70%" top="5vh">
    <div class="container">
      <div class="search-box" style="display:flex;justify-content:space-between;">
        <el-form label-width="100px" size="small" inline>
          <el-form-item label="设备IMEI">
            <el-input v-model="form.imei" style="width:180px;" clearable />
          </el-form-item>
          <el-form-item label="版本">
            <el-input v-model="form.ver" style="width:150px;" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="searchParams = Object.assign({}, form)">搜索</el-button>
          </el-form-item>
        </el-form>
        <div>
          <el-button type="primary" size="small" :loading="updateLoading" @click="onUpdate">升级设备</el-button>
          <el-button type="primary" size="small" @click="openAdd = true">分配设备</el-button>
        </div>
      </div>

      <v-table ref="table" :request="fetchDeviceList" :params="tableParams" fix-height @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="序号" prop="id" width="80px" />
        <el-table-column label="设备IMEI" prop="imei" />
        <el-table-column label="ICCID" prop="iccid" />
        <el-table-column label="版本" prop="ver" />
        <el-table-column label="信号" prop="csq" width="70px" />
        <el-table-column label="最近在线" prop="online_time" width="170px" />
        <el-table-column label="状态" prop="update_status" width="100px" />
        <el-table-column label="操作" fixed="right" width="100px">
          <template slot-scope="{ row }">
            <el-button size="small" type="danger" :loading="row.loading" @click="onDel(row)">删除</el-button>
          </template>
        </el-table-column>
      </v-table>
    </div>

    <select-device-dialog :visible.sync="openAdd" :group-id="group.id" @success="onRefresh" />
  </el-dialog>
</template>

<script>
import VTable from '@/components/VTable'
import { deviceList, removeDevice, updateDeviceSys } from '@/api/device' // eslint-disable-line no-unused-vars
import SelectDeviceDialog from './SelectDeviceDialog'

export default {
  name: 'DeviceDialog',
  components: { VTable, SelectDeviceDialog },
  props: {
    visible: { type: Boolean, required: true },
    group: { type: Object, required: true }
  },
  data() {
    return {
      form: { imei: undefined, ver: undefined },
      searchParams: {},
      openAdd: false,
      selectIds: [],
      updateLoading: false
    }
  },
  computed: {
    open: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    tableParams() {
      return { ...this.searchParams, groupId: this.group.id }
    }
  },
  methods: {
    onRefresh() {
      this.$refs.table.refresh()
    },
    // 模板不能直接引用 import 的函数 (vue-loader 15.11 + Vue2.6 会编译成 _vm.xxx 导致 undefined), 用方法包装
    fetchDeviceList(params) {
      return deviceList(params)
    },
    handleSelectionChange(rows) {
      this.selectIds = rows.map(r => r.id)
    },
    onUpdate() {
      if (this.selectIds.length === 0) return this.$message.warning('请先勾选要升级的设备')
      this.$confirm(`确定升级选中的 ${this.selectIds.length} 台设备?`).then(() => {
        this.updateLoading = true
        updateDeviceSys({ deviceIds: this.selectIds, version: 'latest' }).then(() => {
          this.$message.success('升级任务已下发')
          this.onRefresh()
        }).finally(() => { this.updateLoading = false })
      }).catch(() => {})
    },
    onDel(row) {
      this.$confirm('确定删除此设备').then(() => {
        this.$set(row, 'loading', true)
        removeDevice(row.id).then(() => {
          this.$message.success('删除成功')
          this.onRefresh()
        }).finally(() => { this.$set(row, 'loading', false) })
      }).catch(() => {})
    }
  }
}
</script>
