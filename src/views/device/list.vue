<template>
  <div class="page">
    <div class="container">
      <div class="search-box" style="display:flex;justify-content:space-between;">
        <el-form label-width="90px" size="small" inline>
          <el-form-item label="设备IMEI">
            <el-input v-model="searchFrom.imei" style="width:180px;" clearable />
          </el-form-item>
          <el-form-item v-if="isAdmin" label="手机号">
            <el-input v-model="searchFrom.mobile" style="width:180px;" clearable />
          </el-form-item>
          <el-form-item label="ICCID">
            <el-input v-model="searchFrom.iccid" style="width:180px;" clearable />
          </el-form-item>
          <el-form-item label="硬件版本">
            <el-input v-model="searchFrom.hadr" style="width:150px;" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" icon="el-icon-search" @click="onSearch">搜索</el-button>
          </el-form-item>
        </el-form>
        <div>
          <el-button type="primary" size="small" :disabled="selectIds.length === 0" @click="onBatchTransfer">
            批量转移归属
          </el-button>
          <el-button type="primary" size="small" @click="openAdd = true">添加设备</el-button>
          <el-button type="primary" size="small" :loading="exportLoading" @click="onExport">导出设备</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="onRefresh">刷新</el-button>
        </div>
      </div>

      <v-table ref="table" :request="fetchDeviceList" :params="params" fix-height @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="序号" prop="id" width="80px" />
        <el-table-column label="设备IMEI" prop="imei" min-width="170px" />
        <el-table-column v-if="isAdmin" label="所属账号" min-width="120px">
          <template slot-scope="{ row }">{{ (row.user && row.user.mobile) || '--' }}</template>
        </el-table-column>
        <el-table-column label="分组" width="130px">
          <template slot-scope="{ row }">
            <el-tag v-if="row.group" size="mini">{{ row.group.group_name }}</el-tag>
            <span v-else style="color:#909399;">未分组</span>
          </template>
        </el-table-column>
        <el-table-column label="最近上线" prop="online_time" width="170px" />
        <el-table-column label="iccid" min-width="170px">
          <template slot-scope="{ row }">
            <div
              v-if="row.iccid"
              style="cursor:pointer;color:dodgerblue;"
              @click="onShowIccid(row.iccid)"
            >{{ row.iccid }}</div>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="hadr" prop="hadr" min-width="120px" />
        <el-table-column label="csq" prop="csq" width="70px" />
        <el-table-column label="ver" prop="ver" min-width="120px" />
        <el-table-column label="创建时间" prop="created_at" width="170px" />
        <el-table-column label="操作" fixed="right" width="260px">
          <template slot-scope="{ row }">
            <el-button size="small" type="primary" @click="onChangeGroup(row)">修改分组</el-button>
            <el-button size="small" type="danger" :loading="row.loading" @click="onDel(row)">删除</el-button>
            <el-button size="small" type="primary" @click="onTransfer(row)">转移设备</el-button>
          </template>
        </el-table-column>
      </v-table>
    </div>

    <add-dialog :visible.sync="openAdd" :is-admin="isAdmin" @success="onRefresh" />
    <transfer-dialog
      :visible.sync="openTransfer"
      :device="transferDevice"
      @success="onRefresh"
    />
    <change-group-dialog
      :visible.sync="openChangeGroup"
      :device="groupDevice"
      @success="onRefresh"
    />

    <!-- 卡状态: 查看物联网卡诊断信息 -->
    <el-dialog title="卡状态" :visible.sync="showIccid" width="70%">
      <iframe
        v-if="showIccid"
        :src="cardUrl"
        width="100%"
        height="600"
        style="border:none;"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import VTable from '@/components/VTable'
import { deviceList, removeDevice, exportDeviceList } from '@/api/device' // eslint-disable-line no-unused-vars
import AddDialog from './components/AddDialog'
import TransferDialog from './components/TransferDialog'
import ChangeGroupDialog from './components/ChangeGroupDialog'

export default {
  name: 'DeviceList',
  components: { VTable, AddDialog, TransferDialog, ChangeGroupDialog },
  data() {
    return {
      showIccid: false,
      iccid: undefined,
      transferDevice: null,
      groupDevice: null,
      openTransfer: false,
      openChangeGroup: false,
      openAdd: false,
      selectIds: [],
      exportLoading: false,
      searchFrom: { imei: undefined, mobile: undefined, iccid: undefined, hadr: undefined },
      params: {}
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    isAdmin() {
      return Number(this.userInfo.role) === 1
    },
    cardUrl() {
      return 'http://weixin.tibiot.com:8081/cardDiagnosis?token=B5CB01AE4CE9FC4E4155413E8DD29B2D&iccid=' + this.iccid
    }
  },
  methods: {
    // 模板不能直接引用 import 的函数 (vue-loader 15.11 + Vue2.6 会编译成 _vm.xxx 导致 undefined), 用方法包装
    fetchDeviceList(params) {
      return deviceList(params)
    },
    onShowIccid(iccid) {
      this.iccid = iccid
      this.showIccid = true
    },
    onExport() {
      this.$confirm('确定导出当前设备?').then(() => {
        this.exportLoading = true
        exportDeviceList(this.params).then(res => {
          const a = document.createElement('a')
          a.href = res.data.file
          a.setAttribute('download', res.data.filename)
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }).finally(() => { this.exportLoading = false })
      }).catch(() => {})
    },
    onSearch() {
      this.params = { ...this.searchFrom }
    },
    onBatchTransfer() {
      this.transferDevice = null
      this.openTransfer = true
    },
    onChangeGroup(row) {
      this.groupDevice = row
      this.openChangeGroup = true
    },
    onTransfer(row) {
      this.transferDevice = row
      this.openTransfer = true
    },
    handleSelectionChange(rows) {
      this.selectIds = rows.map(r => r.id)
    },
    onRefresh() {
      this.$refs.table.refresh()
    },
    onDel(row) {
      this.$confirm('确定删除此设备').then(() => {
        this.$set(row, 'loading', true)
        removeDevice(row.id).then(() => {
          this.$message.success('删除成功')
          this.onRefresh()
        }).finally(() => {
          this.$set(row, 'loading', false)
        })
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
