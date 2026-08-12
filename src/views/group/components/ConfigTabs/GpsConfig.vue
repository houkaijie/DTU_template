<template>
  <div>
    <el-form size="small">
      <el-form-item>
        <el-radio-group v-model="disabled">
          <el-radio :label="false">启用</el-radio>
          <el-radio :label="true">不启用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <el-form v-if="!disabled" size="small" label-width="190px" label-position="left">
      <el-divider content-position="left">GPS 引脚配置</el-divider>
      <el-form-item v-for="(item, index) in GpsConfig" :key="index" :label="item.label">
        <el-radio-group v-if="item.type === 'radio'" v-model="pio['index_' + index]">
          <el-radio v-for="o in item.list" :key="o.key" :label="o.key">{{ o.label }}</el-radio>
        </el-radio-group>
        <el-select v-if="item.type === 'select'" v-model="pio['index_' + index]" style="width:220px;">
          <el-option v-for="o in item.list" :key="o.key" :value="o.key" :label="o.label" />
        </el-select>
      </el-form-item>
      <el-form-item label="GPS上报间隔 (秒)">
        <el-input-number v-model="interval" :min="1" :max="86400" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
/**
 * GPS 引脚配置
 * config 结构: gps = { disabled, index_0..., interval }
 */
const GpsConfig = [
  { label: 'GPS_TX', type: 'select', list: [{ key: 'pio10', label: 'PIO10' }, { key: 'pio11', label: 'PIO11' }] },
  { label: 'GPS_RX', type: 'select', list: [{ key: 'pio10', label: 'PIO10' }, { key: 'pio11', label: 'PIO11' }] },
  { label: 'GPS_PWR', type: 'radio', list: [{ key: 'pio12', label: 'PIO12' }, { key: 'pio13', label: 'PIO13' }] }
]

export default {
  name: 'GpsConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const gps = this.config.gps || {}
    const pio = {}
    for (let i = 0; i < GpsConfig.length; i++) {
      pio['index_' + i] = gps['index_' + i] != null ? gps['index_' + i] : GpsConfig[i].list[0].key
    }
    return {
      GpsConfig,
      pio,
      disabled: !!gps.disabled,
      interval: gps.interval != null ? gps.interval : 60
    }
  },
  methods: {
    getForm() {
      if (this.disabled) return { gps: { disabled: true }}
      return { gps: { ...this.pio, interval: this.interval, disabled: false }}
    }
  }
}
</script>
