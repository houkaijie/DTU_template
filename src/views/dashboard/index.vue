<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="15">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.deviceTotal || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card online">
          <div class="stat-value">{{ stats.onlineTotal || 0 }}</div>
          <div class="stat-label">在线设备</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card offline">
          <div class="stat-value">{{ stats.offlineTotal || 0 }}</div>
          <div class="stat-label">离线设备</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.groupTotal || 0 }}</div>
          <div class="stat-label">分组数量</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.todayHeartbeat || 0 }}</div>
          <div class="stat-label">今日心跳数</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="15" style="margin-top:15px;">
      <!-- 最近7天心跳趋势 -->
      <el-col :span="14">
        <el-card shadow="never">
          <div slot="header">最近7天设备心跳趋势</div>
          <div class="trend-chart">
            <div v-for="(item, i) in trendData" :key="i" class="trend-bar-wrap">
              <div class="trend-bar" :style="{ height: barHeight(item.cnt) }" :title="item.day + ': ' + item.cnt + '次'">
                <span class="trend-count">{{ item.cnt }}</span>
              </div>
              <div class="trend-label">{{ item.day.slice(5) }}</div>
            </div>
            <el-empty v-if="trendData.length === 0" description="暂无心跳数据, 等待设备接入" />
          </div>
        </el-card>
      </el-col>
      <!-- 最近上线设备 -->
      <el-col :span="10">
        <el-card shadow="never">
          <div slot="header">最近上线设备</div>
          <el-table :data="stats.recent || []" size="small" height="280">
            <el-table-column label="IMEI" prop="imei" min-width="140px" />
            <el-table-column label="信号" prop="csq" width="70px" />
            <el-table-column label="分组" width="100px">
              <template slot-scope="{ row }">
                <span>{{ row.group_name || '未分组' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最近上线" prop="online_time" width="160px">
              <template slot-scope="{ row }">{{ row.online_time || '--' }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card shadow="never" style="margin-top:15px;">
      <div slot="header">快捷操作</div>
      <div>
        <el-button type="primary" @click="$router.push('/device/list')">设备管理</el-button>
        <el-button @click="$router.push('/group/list')">分组管理</el-button>
        <el-button @click="$router.push('/flowSearch')">流量查询</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { dashboardStats } from '@/api/user'

export default {
  name: 'Dashboard',
  data() {
    return {
      stats: {},
      trendData: []
    }
  },
  created() {
    this.loadStats()
  },
  methods: {
    loadStats() {
      dashboardStats().then(res => {
        this.stats = res.data
        // 补齐最近7天 (无数据的填0)
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 3600 * 1000)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          days.push(key)
        }
        const map = {}
        ;(res.data.trend || []).forEach(t => { map[t.day] = t.cnt })
        this.trendData = days.map(day => ({ day, cnt: map[day] || 0 }))
      })
    },
    barHeight(cnt) {
      const max = Math.max(...this.trendData.map(d => d.cnt), 1)
      return Math.max(4, Math.round(cnt / max * 220)) + 'px'
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 15px;

  .stat-card {
    text-align: center;

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #409eff;
    }

    .stat-label {
      color: #909399;
      margin-top: 8px;
      font-size: 13px;
    }

    &.online .stat-value { color: #67c23a; }
    &.offline .stat-value { color: #f56c6c; }
  }

  .trend-chart {
    display: flex;
    align-items: flex-end;
    height: 260px;
    padding: 10px 0;
    gap: 12px;

    .trend-bar-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;

      .trend-bar {
        width: 100%;
        max-width: 46px;
        background: linear-gradient(180deg, #409eff, #66b1ff);
        border-radius: 4px 4px 0 0;
        position: relative;
        min-height: 4px;
        transition: height 0.3s;
      }

      .trend-count {
        position: absolute;
        top: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: #606266;
      }

      .trend-label {
        margin-top: 6px;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
