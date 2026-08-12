<template>
  <div>
    <el-tabs v-model="tabName">
      <el-tab-pane v-for="item in formList" :key="item.index" :name="'通道' + item.index" :label="'通道' + item.index">
        <el-form size="small">
          <el-form-item>
            <el-radio-group v-model="item.disabled">
              <el-radio :label="false">启用</el-radio>
              <el-radio :label="true">不启用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <el-form v-show="!item.disabled" size="small" label-width="190px" label-position="left">
          <el-form-item label="波特率">
            <el-select v-model="item.data.index_0" style="width:200px;">
              <el-option v-for="v in [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]" :key="v" :value="String(v)" :label="v + ' bps'" />
            </el-select>
          </el-form-item>
          <el-form-item label="数据位">
            <el-select v-model="item.data.index_1" style="width:200px;">
              <el-option :value="7" label="7位" />
              <el-option :value="8" label="8位" />
            </el-select>
          </el-form-item>
          <el-form-item label="停止位">
            <el-select v-model="item.data.index_2" style="width:200px;">
              <el-option :value="1" label="1位" />
              <el-option :value="2" label="2位" />
            </el-select>
          </el-form-item>
          <el-form-item label="校验位">
            <el-select v-model="item.data.index_3" style="width:200px;">
              <el-option :value="0" label="无校验" />
              <el-option :value="1" label="奇校验" />
              <el-option :value="2" label="偶校验" />
            </el-select>
          </el-form-item>
          <el-form-item label="引脚">
            <el-select v-model="item.data.index_4" style="width:200px;">
              <el-option v-for="i in 32" :key="i" :value="'pio' + i" :label="'PIO' + i" />
            </el-select>
          </el-form-item>
          <el-form-item label="分帧超时 (毫秒)">
            <el-input v-model="item.data.index_5" style="width:200px;" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
/**
 * 串口参数 (2通道)
 * config 结构: uconf = [ [1, "9600", 8, 2, 0, "pio24", "3000"], [2, ...] ]
 *              [通道号, 波特率, 数据位, 停止位, 校验, 引脚, 分帧超时]
 */
export default {
  name: 'PortConfig',
  props: {
    protNum: { type: Number, default: 2 },
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const uconf = this.config.uconf || []
    const formList = []
    for (let l = 0; l < this.protNum; l++) {
      const c = uconf[l] || []
      formList.push({
        index: l + 1,
        disabled: c.length === 0,
        data: {
          index_0: c[1] != null ? String(c[1]) : '9600',
          index_1: c[2] != null ? c[2] : 8,
          index_2: c[3] != null ? c[3] : 2,
          index_3: c[4] != null ? c[4] : 0,
          index_4: c[5] || 'pio24',
          index_5: c[6] != null ? String(c[6]) : '3000'
        }
      })
    }
    return { tabName: '通道1', formList }
  },
  methods: {
    getForm() {
      const t = []
      for (const a of this.formList) {
        const i = []
        if (!a.disabled) {
          i.push(a.index)
          for (let o = 0; o < 6; o++) i.push(a.data['index_' + o])
        }
        t.push(i)
      }
      return { uconf: t }
    }
  }
}
</script>
