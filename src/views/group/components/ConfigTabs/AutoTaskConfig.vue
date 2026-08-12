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
          <el-form-item label="采集间隔 (秒)">
            <el-input-number v-model="formList[index].time" :min="1" :max="86400" />
            <span style="margin-left:10px;color:#909399;font-size:12px;">定时向串口发送下列指令</span>
          </el-form-item>
          <el-form-item label="执行指令">
            <div v-for="(task, i) in formList[index].task" :key="i" style="margin-bottom:8px;">
              <el-input v-model="task.value" style="width:320px;" placeholder="AT指令, 如 AT+CSQ" />
              <el-button type="danger" size="mini" icon="el-icon-delete" style="margin-left:8px;" @click="onRemove(index, i)" />
            </div>
            <el-button type="primary" size="small" @click="onAdd(index)">添加指令</el-button>
            <span style="margin-left:10px;color:#909399;font-size:12px;">最多24条</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
/**
 * 自动采集任务 (2通道)
 * config 结构: cmds = [ [时间, 指令1, 指令2, ...], [时间, ...] ]  (空数组=禁用)
 */
export default {
  name: 'AutoTaskConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const cmds = this.config.cmds || []
    return {
      tabName: '串口1',
      formList: [
        {
          index: 1,
          disabled: !(cmds[0] || []).length,
          time: (cmds[0] || [])[0] || 300,
          task: (cmds[0] || []).slice(1).map(value => ({ value }))
        },
        {
          index: 2,
          disabled: !(cmds[1] || []).length,
          time: (cmds[1] || [])[0] || 300,
          task: (cmds[1] || []).slice(1).map(value => ({ value }))
        }
      ]
    }
  },
  methods: {
    onAdd(index) {
      if (this.formList[index].task.length >= 24) {
        return this.$message.error('最多只能添加24条执行指令')
      }
      this.formList[index].task.push({ value: '' })
    },
    onRemove(index, i) {
      this.formList[index].task.splice(i, 1)
    },
    getForm() {
      const t = []
      for (const a of this.formList) {
        const i = []
        if (!a.disabled) {
          i.push(a.time)
          for (const r of a.task) i.push(r.value)
        }
        t.push(i)
      }
      return { cmds: t }
    }
  }
}
</script>
