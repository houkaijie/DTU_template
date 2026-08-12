<template>
  <el-dialog :close-on-click-modal="false" title="设备参数配置" :visible.sync="open" width="760px" top="5vh">
    <el-tabs v-model="tabName" type="border-card">
      <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key">
        <component
          :is="tab.component"
          :ref="tab.key"
          :config="config || {}"
        />
      </el-tab-pane>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <el-button @click="open = false">取 消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">保存配置</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { groupInfo, updateGroup } from '@/api/group'
import BaseConfig from './ConfigTabs/BaseConfig'
import PortConfig from './ConfigTabs/PortConfig'
import NetworkConfig from './ConfigTabs/NetworkConfig'
import AutoTaskConfig from './ConfigTabs/AutoTaskConfig'
import StreamConfig from './ConfigTabs/StreamConfig'
import GpioConfig from './ConfigTabs/GpioConfig'
import GpsConfig from './ConfigTabs/GpsConfig'
import ApnConfig from './ConfigTabs/ApnConfig'
import TaskConfig from './ConfigTabs/TaskConfig'

export default {
  name: 'ConfigDialog',
  components: { BaseConfig, PortConfig, NetworkConfig, AutoTaskConfig, StreamConfig, GpioConfig, GpsConfig, ApnConfig, TaskConfig },
  props: {
    visible: { type: Boolean, required: true },
    groupId: { type: [String, Number], required: true }
  },
  data() {
    return {
      loading: false,
      form: {},
      group: null,
      tabName: 'BaseConfig',
      tabs: [
        { label: '基本参数', key: 'BaseConfig', component: 'BaseConfig' },
        { label: '串口参数', key: 'PortConfig', component: 'PortConfig' },
        { label: '网络参数', key: 'NetworkConfig', component: 'NetworkConfig' },
        { label: '自动采集任务', key: 'AutoTaskConfig', component: 'AutoTaskConfig' },
        { label: '数据流', key: 'StreamConfig', component: 'StreamConfig' },
        { label: 'GPIO', key: 'GpioConfig', component: 'GpioConfig' },
        { label: 'GPS', key: 'GpsConfig', component: 'GpsConfig' },
        { label: 'APN', key: 'ApnConfig', component: 'ApnConfig' },
        { label: '任务', key: 'TaskConfig', component: 'TaskConfig' }
      ]
    }
  },
  computed: {
    open: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    config() {
      if (!this.group) return undefined
      try {
        return JSON.parse(this.group.config || '{}')
      } catch (e) {
        return {}
      }
    }
  },
  watch: {
    visible(v) {
      if (v) this.loadGroup()
    }
  },
  methods: {
    loadGroup() {
      groupInfo(this.groupId).then(res => {
        this.group = res.data
      }).catch(() => {
        this.open = false
      })
    },
    onSubmit() {
      if (!this.group) return
      this.loading = true
      const merged = {}
      for (const tab of this.tabs) {
        const refs = this.$refs[tab.key]
        if (refs && refs[0] && typeof refs[0].getForm === 'function') {
          const form = refs[0].getForm()
          Object.assign(merged, form)
        }
      }
      // 参数版本号自动+1
      if (merged.param_ver != null && !isNaN(Number(merged.param_ver))) {
        merged.param_ver = Number(merged.param_ver) + 1
      }
      updateGroup(this.group.id, { config: JSON.stringify(merged) }).then(() => {
        this.$message.success('配置更新成功, 参数版本号已递增')
        this.open = false
        this.$emit('success')
      }).finally(() => { this.loading = false })
    }
  }
}
</script>

<style lang="scss" scoped>
.el-tabs {
  min-height: 420px;
}
</style>
