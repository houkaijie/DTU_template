<template>
  <el-dialog :close-on-click-modal="false" title="添加分组" :visible.sync="open" width="500px">
    <el-form ref="form" :model="form" :rules="rules" label-position="left" label-width="120px" size="small">
      <el-form-item label="分组名称" prop="groupName">
        <el-input v-model="form.groupName" placeholder="请输入分组名称" />
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="open = false">取 消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { saveGroup } from '@/api/group'

export default {
  name: 'GroupForm',
  props: {
    visible: { type: Boolean, required: true }
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
        saveGroup(this.form).then(() => {
          this.$message.success('保存成功')
          this.$emit('success')
          this.open = false
          this.form.groupName = undefined
        }).finally(() => { this.loading = false })
      })
    }
  }
}
</script>
