<template>
  <el-dialog :close-on-click-modal="false" title="转移所属" :visible.sync="open" width="40%">
    <el-form>
      <el-form-item label="手机号">
        <el-input v-model="phone" placeholder="请输入手机号码" />
      </el-form-item>
      <el-form-item v-if="!device" label="设备IMEI">
        <el-input
          v-model="imeis"
          type="textarea"
          :rows="10"
          placeholder="请输入设备IMEI,多个设备请用【换行】分割"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="open = false">取 消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { transferDevice } from '@/api/device'

export default {
  name: 'TransferDialog',
  props: {
    visible: { type: Boolean, required: true },
    device: { type: Object, default: null }
  },
  data() {
    return {
      phone: undefined,
      imeis: undefined,
      loading: false
    }
  },
  computed: {
    open: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    }
  },
  methods: {
    onSubmit() {
      if (!this.phone) return this.$message.error('请输入手机号码')
      if (!/^1\d{10}$/.test(this.phone)) return this.$message.error('手机号码不正确')
      if (!this.device && (!this.imeis || !this.imeis.trim())) {
        return this.$message.error('设备IMEI不能为空')
      }
      this.loading = true
      transferDevice(this.phone, this.device ? this.device.imei : this.imeis.trim())
        .then(() => {
          this.$message.success('转移成功')
          this.open = false
          this.$emit('success')
        })
        .finally(() => { this.loading = false })
    }
  }
}
</script>
