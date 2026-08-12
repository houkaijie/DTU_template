<template>
  <el-dialog :close-on-click-modal="false" title="修改名称" :visible.sync="open" width="40%">
    <el-form ref="form" :model="form" :rules="rules" label-width="100px">
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
import { updateGroup } from '@/api/group'

export default {
  name: 'ChangeNameDialog',
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
  watch: {
    visible(v) {
      if (v && this.group) {
        this.form.groupName = this.group.group_name
      }
    }
  },
  methods: {
    onSubmit() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.loading = true
        updateGroup(this.group.id, { groupName: this.form.groupName }).then(() => {
          this.$message.success('修改成功')
          this.open = false
          this.$emit('success')
        }).finally(() => { this.loading = false })
      })
    }
  }
}
</script>
