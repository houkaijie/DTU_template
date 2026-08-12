<template>
  <el-form ref="form" :model="form" size="small" label-width="190px" label-position="left">
    <el-divider content-position="left">APN 接入点配置</el-divider>
    <el-form-item label="APN">
      <el-input v-model="form.apn" style="width:220px;" placeholder="如 cmnet / 3gnet" />
      <span style="margin-left:10px;color:#909399;font-size:12px;">运营商接入点名称</span>
    </el-form-item>
    <el-form-item label="接入点用户名">
      <el-input v-model="form.user" style="width:220px;" placeholder="通常为空" />
    </el-form-item>
    <el-form-item label="接入点密码">
      <el-input v-model="form.pass" style="width:220px;" placeholder="通常为空" />
    </el-form-item>
    <el-form-item label="PIN码">
      <el-input v-model="form.pin" style="width:220px;" placeholder="SIM卡PIN码, 可选" />
    </el-form-item>
  </el-form>
</template>

<script>
/**
 * APN 接入点配置
 * config 结构: apn = { apn, user, pass, pin }
 */
export default {
  name: 'ApnConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const m = this.config.apn || {}
    return {
      form: {
        apn: m.apn || 'cmnet',
        user: m.user || '',
        pass: m.pass || '',
        pin: m.pin || ''
      }
    }
  },
  methods: {
    getForm() {
      return { apn: { ...this.form }}
    }
  }
}
</script>
