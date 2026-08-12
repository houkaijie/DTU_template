<template>
  <div class="page">
    <!-- 弹窗触发按钮 -->
    <div class="popup-trigger" @click="openPopup">
      流量查询-ERZ
    </div>
    <!-- 原有 iframe 容器 -->
    <div class="container">
      <iframe class="iframe" src="https://weixin.tibiot.com/cardQuery" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowSearch',
  methods: {
    // 真正的独立弹窗（不覆盖、不新标签）
    openPopup() {
      const popupWindow = window.open(
        'http://www.minyee.com/sim/index.html',
        'popupWindow',
        'width=800,height=600,top=100,left=200,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
      )
      // 让弹窗居中（可选优化）
      if (popupWindow) {
        popupWindow.moveTo(
          (screen.width - 800) / 2,
          (screen.height - 600) / 2
        )
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.popup-trigger {
  display: block;
  padding: 10px 15px;
  font-size: 16px;
  color: #409eff;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
}

.container {
  padding: 15px;

  .iframe {
    width: 100%;
    height: calc(100vh - 160px);
    border: none;
  }
}
</style>
