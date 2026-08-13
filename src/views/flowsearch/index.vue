<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-card shadow="never">
      <div class="search-bar">
        <el-input
          v-model="cardNo"
          placeholder="请输入 SIM 卡号 / ICCID (8~20位数字)"
          clearable
          maxlength="20"
          style="width: 340px"
          @keyup.enter.native="handleSearch"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
      </div>
      <p class="tip">数据由本平台流量查询接口提供；公司云平台接入后自动切换为实时数据。</p>
    </el-card>

    <!-- 查询结果 -->
    <el-card v-if="result" shadow="never" class="result-card">
      <div slot="header" class="result-header">
        <span>卡号 {{ result.cardNo }}</span>
        <el-tag :type="result.status === '正常' ? 'success' : 'danger'" size="mini">
          {{ result.status }}
        </el-tag>
        <el-tag v-if="result.source === 'mock'" size="mini" type="info">模拟数据</el-tag>
      </div>

      <el-table :data="overviewRows" size="small" border style="width: 100%">
        <el-table-column prop="label" label="项目" width="140" />
        <el-table-column prop="value" label="内容" />
      </el-table>

      <div class="usage-block">
        <div class="usage-title">
          已用 {{ result.usedMB }} MB / 总量 {{ result.totalMB }} MB（剩余 {{ result.remainMB }} MB）
        </div>
        <el-progress :percentage="usagePercent" :stroke-width="14" />
      </div>

      <div class="usage-block">
        <div class="usage-title">近7天用量 (MB)</div>
        <el-table :data="result.days" size="small" border style="width: 100%">
          <el-table-column prop="day" label="日期" width="140" />
          <el-table-column prop="usedMB" label="当日用量 (MB)" />
        </el-table>
      </div>
    </el-card>

    <el-card v-else shadow="never" class="result-card empty">
      输入 SIM 卡号或 ICCID 后点击查询
    </el-card>
  </div>
</template>

<script>
import { searchFlow } from '@/api/flow'

export default {
  name: 'FlowSearch',
  data() {
    return {
      cardNo: '',
      loading: false,
      result: undefined
    }
  },
  computed: {
    usagePercent() {
      if (!this.result || !this.result.totalMB) return 0
      return Math.min(100, Math.round((this.result.usedMB / this.result.totalMB) * 100))
    },
    overviewRows() {
      if (!this.result) return []
      return [
        { label: '运营商', value: this.result.operator },
        { label: '套餐', value: this.result.package },
        { label: '已用流量', value: this.result.usedMB + ' MB' },
        { label: '剩余流量', value: this.result.remainMB + ' MB' },
        { label: '到期时间', value: this.result.expireDate }
      ]
    }
  },
  methods: {
    handleSearch() {
      const cardNo = this.cardNo.trim()
      if (!/^\d{8,20}$/.test(cardNo)) {
        this.$message.warning('请输入正确的卡号/ICCID (8~20位数字)')
        return
      }
      this.loading = true
      searchFlow({ cardNo })
        .then(res => {
          this.result = res.data
        })
        .catch(() => {
          this.result = undefined
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  display: flex;
  align-items: center;

  .el-button {
    margin-left: 10px;
  }
}

.tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: #909399;
}

.result-card {
  margin-top: 15px;

  &.empty {
    color: #909399;
    text-align: center;
    padding: 40px 0;
  }

  .result-header {
    display: flex;
    align-items: center;

    .el-tag {
      margin-left: 10px;
    }
  }

  .usage-block {
    margin-top: 20px;

    .usage-title {
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
