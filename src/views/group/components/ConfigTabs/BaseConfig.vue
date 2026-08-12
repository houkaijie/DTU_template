<template>
  <el-form ref="form" :model="form" size="small" label-width="180px">
    <el-divider content-position="left">基本参数</el-divider>
    <el-form-item label="模式">
      <el-radio-group v-model="form.passon">
        <el-radio :label="0">MCU控制</el-radio>
        <el-radio :label="1">透传</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="数据前后缀">
      <el-radio-group v-model="form.plate">
        <el-radio :label="0">不加</el-radio>
        <el-radio :label="1">加IMEI</el-radio>
        <el-radio :label="2">加自定义前缀</el-radio>
        <el-radio :label="3">加自定义后缀</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="报文转换">
      <el-radio-group v-model="form.convert">
        <el-radio :label="0">不换</el-radio>
        <el-radio :label="1">换</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="登录发注册包">
      <el-select v-model="form.reg" style="width:200px;">
        <el-option :value="0" label="不发" />
        <el-option :value="1" label="发" />
        <el-option :value="2" label="AT+REG=IMEI" />
        <el-option :value="3" label="自定义" />
      </el-select>
      <el-input v-if="form.reg === 3" v-model="regValue" style="width:200px;margin-left:10px;" placeholder="自定义注册包内容" />
    </el-form-item>
    <el-form-item label="参数版本号">
      <el-input-number v-model="form.param_ver" :min="0" />
      <span style="margin-left:10px;color:#909399;font-size:12px;">保存配置时自动+1</span>
    </el-form-item>
    <el-form-item label="心跳间隔时间 (秒)">
      <el-input-number v-model="form.CycleTim" :min="1" :max="86400" />
    </el-form-item>
    <el-form-item label="串口分帧超时 (毫秒)">
      <el-input-number v-model="form.UartTim" :min="0" />
    </el-form-item>
    <el-form-item label="服务器连接超时 (毫秒)">
      <el-input-number v-model="form.ServerTim" :min="0" />
    </el-form-item>
    <el-form-item label="串口无数据重启时间">
      <el-input-number v-model="form.uartReadTime" :min="0" />
      <span style="margin-left:10px;color:#909399;font-size:12px;">0=不重启</span>
    </el-form-item>
    <el-form-item label="网络无数据重启时间">
      <el-input-number v-model="form.netReadTime" :min="0" />
      <span style="margin-left:10px;color:#909399;font-size:12px;">0=不重启</span>
    </el-form-item>
    <el-form-item label="工作模式">
      <el-select v-model="form.pwrmod" style="width:200px;">
        <el-option value="normal" label="正常模式" />
        <el-option value="lowpower" label="低功耗模式" />
        <el-option value="sleep" label="休眠模式" />
      </el-select>
    </el-form-item>
    <el-form-item label="FOTA升级">
      <el-radio-group v-model="form.fota">
        <el-radio :label="0">不启用</el-radio>
        <el-radio :label="1">启用</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="报文缓存">
      <el-radio-group v-model="form.flow">
        <el-radio :label="0">不缓存</el-radio>
        <el-radio :label="1">缓存</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="日志">
      <el-radio-group v-model="form.nolog">
        <el-radio :label="0">记录</el-radio>
        <el-radio :label="1">不记录</el-radio>
      </el-radio-group>
    </el-form-item>
  </el-form>
</template>

<script>
/**
 * 基本参数
 * config 结构:
 * {
 *   passon, plate, convert, reg, param_ver, CycleTim, UartTim, ServerTim,
 *   uartReadTime, netReadTime, pwrmod, fota, flow, nolog
 * }
 */
export default {
  name: 'BaseConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const m = this.config
    return {
      regValue: undefined,
      form: {
        passon: m.passon != null ? m.passon : 1,
        plate: m.plate != null ? m.plate : 0,
        convert: m.convert != null ? m.convert : 0,
        reg: [0, 1, 2].includes(m.reg) ? m.reg : 1,
        param_ver: m.param_ver != null ? m.param_ver : 25,
        CycleTim: m.CycleTim != null ? m.CycleTim : 1400,
        UartTim: m.UartTim != null ? m.UartTim : 12000,
        ServerTim: m.ServerTim != null ? m.ServerTim : 6600,
        uartReadTime: m.uartReadTime != null ? m.uartReadTime : 25,
        netReadTime: m.netReadTime != null ? m.netReadTime : 0,
        pwrmod: m.pwrmod || 'normal',
        fota: m.fota != null ? m.fota : 1,
        flow: m.flow != null ? m.flow : 0,
        nolog: m.nolog != null ? m.nolog : 0,
        webProtect: '1',
        source: 'web'
      }
    }
  },
  methods: {
    getForm() {
      const f = { ...this.form }
      if (f.reg === 3 && this.regValue) f.regValue = this.regValue
      return f
    }
  }
}
</script>
