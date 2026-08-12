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
      <el-form-item label="任务列表">
        <div v-for="(task, i) in tasks" :key="i" style="margin-bottom:8px;display:flex;align-items:center;">
          <el-input v-model="task.time" style="width:140px;" placeholder="执行时间 HH:mm" />
          <el-input v-model="task.cmd" style="width:320px;margin-left:8px;" placeholder="执行指令, 如 AT+CSQ" />
          <el-button type="danger" size="mini" icon="el-icon-delete" style="margin-left:8px;" @click="tasks.splice(i, 1)" />
        </div>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="tasks.push({ time: '00:00', cmd: '' })">添加任务</el-button>
      </el-form-item>
      <el-form-item label="定时重启">
        <el-radio-group v-model="rebootEnabled">
          <el-radio :label="false">不启用</el-radio>
          <el-radio :label="true">启用</el-radio>
        </el-radio-group>
        <el-time-select
          v-if="rebootEnabled"
          v-model="rebootTime"
          style="width:140px;margin-left:10px;"
          start="00:00"
          step="00:30"
          end="23:59"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
/**
 * 任务配置 (定时任务/定时重启)
 * config 结构: tasks = { disabled, list: [{time, cmd}], reboot: {enabled, time} }
 */
export default {
  name: 'TaskConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const m = this.config.tasks || {}
    return {
      disabled: !!m.disabled,
      tasks: (m.list || []).map(t => ({ time: t.time || '00:00', cmd: t.cmd || '' })),
      rebootEnabled: !!(m.reboot && m.reboot.enabled),
      rebootTime: (m.reboot && m.reboot.time) || '02:00'
    }
  },
  methods: {
    getForm() {
      if (this.disabled) return { tasks: { disabled: true }}
      return {
        tasks: {
          disabled: false,
          list: this.tasks.filter(t => t.time && t.cmd),
          reboot: { enabled: this.rebootEnabled, time: this.rebootTime }
        }
      }
    }
  }
}
</script>
