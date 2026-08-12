<template>
  <div class="page">
    <div class="container">
      <div class="search-box" style="display:flex;justify-content:space-between;">
        <el-form label-width="100px" size="small" inline>
          <el-form-item label="手机号">
            <el-input v-model="searchFrom.mobile" style="width:200px;" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" icon="el-icon-search" @click="onSearch">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <v-table ref="table" :request="fetchUserList" :params="params" fix-height>
        <el-table-column label="序号" prop="id" width="80px" />
        <el-table-column label="用户名" prop="username" min-width="120px" />
        <el-table-column label="手机号" prop="mobile" min-width="130px" />
        <el-table-column label="角色" width="120px">
          <template slot-scope="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : 'info'" size="mini">
              {{ row.role === 1 ? '超级管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备数量" prop="deviceCount" width="100px" />
        <el-table-column label="创建时间" prop="created_at" width="180px" />
        <el-table-column label="操作" fixed="right" width="300px">
          <template slot-scope="{ row }">
            <el-button size="small" type="primary" @click="onChangePwd(row)">修改密码</el-button>
            <el-button
              v-if="row.id !== userId"
              size="small"
              @click="onChangeRole(row)"
            >{{ row.role === 1 ? '降为普通用户' : '设为超级管理员' }}</el-button>
          </template>
        </el-table-column>
      </v-table>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import VTable from '@/components/VTable'
import { getUserList, changeUserRole, changePwd } from '@/api/user' // eslint-disable-line no-unused-vars

export default {
  name: 'UserList',
  components: { VTable },
  data() {
    return {
      searchFrom: { mobile: undefined },
      params: {}
    }
  },
  computed: {
    ...mapGetters(['userId'])
  },
  methods: {
    // 模板不能直接引用 import 的函数 (vue-loader 15.11 + Vue2.6 会编译成 _vm.xxx 导致 undefined), 用方法包装
    fetchUserList(params) {
      return getUserList(params)
    },
    onSearch() {
      this.params = { ...this.searchFrom }
    },
    // 修改用户密码 (与线上一致: 弹窗输入新密码)
    onChangePwd(row) {
      this.$prompt('请输入新密码', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'password'
      }).then(({ value }) => {
        changePwd({ id: row.id, password: value }).then(() => {
          this.$message.success('修改成功')
        })
      }).catch(() => {})
    },
    onChangeRole(row) {
      const action = row.role === 1 ? '降为普通用户' : '设为超级管理员'
      this.$confirm(`确定将用户 ${row.mobile} ${action}?`).then(() => {
        changeUserRole({ uId: row.id, role: row.role === 1 ? 0 : 1 }).then(() => {
          this.$message.success('角色修改成功')
          this.$refs.table.refresh()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 15px;

  .container {
    background: #fff;
    padding: 15px;
    border-radius: 4px;
  }
}
</style>
