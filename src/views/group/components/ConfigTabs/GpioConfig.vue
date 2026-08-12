<template>
  <el-form ref="form" :model="pio" size="small" label-width="190px" label-position="left">
    <el-divider content-position="left">GPIO 引脚配置</el-divider>
    <el-form-item v-for="(item, index) in GpioConfig" :key="index" :label="item.label">
      <el-radio-group v-if="item.type === 'radio'" v-model="pio['index_' + index]">
        <el-radio v-for="o in item.list" :key="o.key" :label="o.key">{{ o.label }}</el-radio>
      </el-radio-group>
      <el-select v-if="item.type === 'select'" v-model="pio['index_' + index]" style="width:220px;">
        <el-option v-for="o in item.list" :key="o.key" :value="o.key" :label="o.label" />
      </el-select>
      <span v-if="item.desc" style="margin-left:10px;color:#909399;font-size:12px;">{{ item.desc }}</span>
    </el-form-item>
  </el-form>
</template>

<script>
/**
 * GPIO 引脚配置
 * config 结构: gpio = { index_0: 值, index_1: ... } (保存时按定义顺序转数组或保留对象)
 */
const GpioConfig = [
  { label: 'NETLED', type: 'radio', list: [{ key: 'pio24', label: 'PIO24' }, { key: 'pio25', label: 'PIO25' }, { key: 'pio26', label: 'PIO26' }], desc: '网络指示灯' },
  { label: 'NETRDY', type: 'radio', list: [{ key: 'pio24', label: 'PIO24' }, { key: 'pio25', label: 'PIO25' }, { key: 'pio26', label: 'PIO26' }], desc: '网络就绪' },
  { label: 'GPSLED', type: 'radio', list: [{ key: 'pio24', label: 'PIO24' }, { key: 'pio25', label: 'PIO25' }, { key: 'pio26', label: 'PIO26' }], desc: 'GPS指示灯' },
  { label: 'RSTCNF', type: 'radio', list: [{ key: 'pio4', label: 'PIO4' }, { key: 'pio5', label: 'PIO5' }, { key: 'pio6', label: 'PIO6' }], desc: '复位配置引脚' },
  { label: '充电状态检测', type: 'select', list: [{ key: '', label: '不检测' }, { key: 'pio1', label: 'PIO1' }, { key: 'pio2', label: 'PIO2' }] },
  { label: '开锁检测', type: 'select', list: [{ key: '', label: '不检测' }, { key: 'pio1', label: 'PIO1' }, { key: 'pio2', label: 'PIO2' }] }
]

export default {
  name: 'GpioConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const gpio = this.config.gpio || {}
    const pio = {}
    for (let i = 0; i < GpioConfig.length; i++) {
      pio['index_' + i] = gpio['index_' + i] != null ? gpio['index_' + i] : (GpioConfig[i].list[0] && GpioConfig[i].list[0].key != null ? GpioConfig[i].list[0].key : '')
    }
    return { GpioConfig, pio }
  },
  methods: {
    getForm() {
      return { gpio: { ...this.pio }}
    }
  }
}
</script>
