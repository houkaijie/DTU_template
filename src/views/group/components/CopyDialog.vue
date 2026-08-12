<template>
  <el-dialog :close-on-click-modal="false" title="复制分组" :visible.sync="open" width="40%">
    <el-form ref="form" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="复制分组">
        <el-input :value="group.group_name" readonly />
      </el-form-item>
      <el-form-item label="分组名称" prop="groupName">
        <el-input v-model="form.groupName" placeholder="请输入新分组名称" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="open = false">取 消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { copyGroup } from '@/api/group'

export default {
  name: 'CopyDialog',
  props: {
    visible: { type: Boolean, required: true },
    group: { type: Object, required: true }
  },
  data() {
    return {
      loading: false,
      form: { groupName: undefined },
      rules: { groupName: [{ required: true, message: '分组名称不能为空' }] }
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
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.loading = true
        copyGroup(this.group.id, { groupName: this.form.groupName }).then(() => {
          this.$message.success('复制成功')
          this.open = false
          this.$emit('success')
          this.form.groupName = undefined
        }).finally(() => { this.loading = false })
      })
    }
  }
}
</script>
