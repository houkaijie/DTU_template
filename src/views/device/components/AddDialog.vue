<template>
  <el-dialog :close-on-click-modal="false" title="新增设备" :visible.sync="open" width="50%">
    <div style="display:flex;flex-direction:column;">
      <el-input
        v-model="imeis"
        type="textarea"
        :rows="10"
        placeholder="请输入设备IMEI,多个设备请用【换行】分割"
      />
      <p v-if="!isAdmin" style="color:#E6A23C;font-size:13px;margin-top:8px;">
        普通用户每次最多只能添加20只设备，多时请联系厂家！
      </p>
      <div style="margin-top:15px;">
        <el-form label-width="100px">
          <el-form-item label="转移手机号码">
            <el-input v-model="phone" style="width:300px;" placeholder="请输入转移手机号码" />
            <p>不填,默认设备导入到自己账户下面。输入手机号码,设备默认转移到手机号码账户下</p>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="open = false">取 消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { updateDeviceList } from '@/api/device'

export default {
  name: 'AddDialog',
  props: {
    visible: { type: Boolean, required: true },
    isAdmin: { type: Boolean, default: false }
  },
  data() {
    return {
      imeis: '',
      phone: undefined,
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
      if (this.phone && !/^1\d{10}$/.test(this.phone)) {
        return this.$message.error('转移手机号码格式不正确')
      }
      if (!this.imeis.trim()) return this.$message.error('请输入要添加的设备的IMEI')
      const list = this.imeis.split('\n').filter(s => s.trim())
      const uniq = [...new Set(list)]
      if (!this.isAdmin && uniq.length > 20) {
        return this.$message.error('每次最多只能添加20只设备')
      }
      // 本地先校验 IMEI 格式 (8-18位数字), 提前拦截
      const invalid = uniq.filter(i => !/^\d{8,18}$/.test(i))
      if (invalid.length) {
        return this.$message.error(`IMEI格式不正确(需8-18位数字): ${invalid.join('、')}`)
      }
      this.loading = true
      updateDeviceList({ list: uniq.join('\n'), phone: this.phone }).then(res => {
        const { added, exists } = res.data || {}
        let msg = `添加成功 ${added} 台`
        if (exists && exists.length) msg += `；已存在: ${exists.join('、')}`
        if (added > 0) {
          this.$message.success(msg)
        } else {
          this.$message.warning(msg)
        }
        this.$emit('success')
        this.open = false
        this.imeis = ''
        this.phone = undefined
      }).finally(() => { this.loading = false })
    }
  }
}
</script>
