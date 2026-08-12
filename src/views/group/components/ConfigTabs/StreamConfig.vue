<template>
  <div>
    <el-tabs v-model="tabName">
      <el-tab-pane v-for="(item, index) in formList" :key="item.index" :label="'串口' + item.index" :name="'串口' + item.index">
        <el-form size="small">
          <el-form-item>
            <el-radio-group v-model="formList[index].disabled">
              <el-radio :label="false">启用</el-radio>
              <el-radio :label="true">不启用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <el-form v-show="!formList[index].disabled" size="small" label-width="190px" label-position="left">
          <el-form-item label="发送数据流模板">
            <el-input v-model="formList[index].upprot" type="textarea" :rows="5" style="width:400px;" placeholder="如 {imei}:{data}\r\n" />
          </el-form-item>
          <el-form-item label="接收数据流模板">
            <el-input v-model="formList[index].dwprot" type="textarea" :rows="5" style="width:400px;" placeholder="解析规则模板" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
/**
 * 数据流模板 (每通道 发送/接收)
 * config 结构: upprot = ["模板1", "模板2"], dwprot = ["模板1", "模板2"]
 */
export default {
  name: 'StreamConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const up = this.config.upprot || []
    const dw = this.config.dwprot || []
    return {
      tabName: '串口1',
      formList: [
        { index: 1, disabled: !(up[0] && dw[0]), upprot: up[0] || '', dwprot: dw[0] || '' },
        { index: 2, disabled: !(up[1] && dw[1]), upprot: up[1] || '', dwprot: dw[1] || '' }
      ]
    }
  },
  methods: {
    getForm() {
      const up = []
      const dw = []
      for (const a of this.formList) {
        if (a.disabled) {
          up.push('')
          dw.push('')
        } else {
          up.push(a.upprot || '')
          dw.push(a.dwprot || '')
        }
      }
      return { upprot: up, dwprot: dw }
    }
  }
}
</script>
