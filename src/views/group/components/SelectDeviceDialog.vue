<template>
  <el-dialog :close-on-click-modal="false" title="分配设备" :visible.sync="open" width="50%" append-to-body>
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="列表选择添加" name="single">
        <div>
          <div class="search-box" style="display:flex;justify-content:space-between;">
            <el-form label-width="80px" size="small" inline>
              <el-form-item label="IMEI">
                <el-input v-model="form.imei" style="width:180px;" clearable />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" @click="searchParams = Object.assign({}, form)">搜索</el-button>
              </el-form-item>
            </el-form>
          </div>
          <v-table ref="table" :request="fetchDeviceList" :params="tableParams" fix-height @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="序号" prop="id" width="80px" />
            <el-table-column label="设备IMEI" prop="imei" />
            <el-table-column label="ICCID" prop="iccid" />
            <el-table-column label="分组" width="120px">
              <template slot-scope="{ row }">
                <el-tag v-if="row.group" size="mini">{{ row.group.group_name }}</el-tag>
                <span v-else style="color:#909399;">未分组</span>
              </template>
            </el-table-column>
          </v-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    <div slot="footer" class="dialog-footer">
      <el-button @click="open = false">取 消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import VTable from '@/components/VTable'
import { deviceList } from '@/api/device' // eslint-disable-line no-unused-vars
import { setDeviceList } from '@/api/group'

export default {
  name: 'SelectDeviceDialog',
  components: { VTable },
  props: {
    visible: { type: Boolean, required: true },
    groupId: { type: [String, Number], required: true }
  },
  data() {
    return {
      activeName: 'single',
      form: { imei: undefined },
      searchParams: {},
      selectIds: [],
      loading: false
    }
  },
  computed: {
    open: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    tableParams() {
      return { ...this.searchParams, size: 100 }
    }
  },
  methods: {
    // 模板不能直接引用 import 的函数 (vue-loader 15.11 + Vue2.6 会编译成 _vm.xxx 导致 undefined), 用方法包装
    fetchDeviceList(params) {
      return deviceList(params)
    },
    handleSelectionChange(rows) {
      this.selectIds = rows.map(r => r.id)
    },
    onSubmit() {
      if (this.selectIds.length === 0) return this.$message.warning('请先勾选要分配的设备')
      this.loading = true
      setDeviceList({ groupId: this.groupId, deviceIds: this.selectIds }).then(() => {
        this.$message.success('分配成功')
        this.open = false
        this.$emit('success')
      }).finally(() => { this.loading = false })
    }
  }
}
</script>
