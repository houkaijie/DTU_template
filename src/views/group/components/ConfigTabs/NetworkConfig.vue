<template>
  <div>
    <el-tabs v-model="tabName">
      <el-tab-pane v-for="item in tabList" :key="item.index" :label="'通道' + item.index" :name="'通道' + item.index">
        <el-form size="small">
          <el-form-item>
            <el-radio-group v-model="item.disabled">
              <el-radio :label="false">启用</el-radio>
              <el-radio :label="true">不启用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template v-if="!item.disabled">
          <el-form size="small" label-width="190px" label-position="left">
            <el-form-item label="通道类型">
              <el-select v-model="item.type" style="width:220px;" @change="onTypeChange(item)">
                <el-option v-for="t in typeList" :key="t.value" :value="t.value" :label="t.label" />
              </el-select>
            </el-form-item>
          </el-form>
          <!-- 平台参数: 按类型渲染字段 -->
          <el-form ref="ch" size="small" label-width="190px" label-position="left">
            <el-form-item v-for="f in currentFields(item)" :key="f.key" :label="f.label">
              <el-input v-if="f.type === 'text' || f.type === 'number'" v-model="item.data[f.key]" :style="f.textarea ? 'width:360px;' : 'width:220px;'" :type="f.type" :placeholder="f.placeholder" />
              <el-input v-if="f.type === 'textarea'" v-model="item.data[f.key]" type="textarea" :rows="4" style="width:360px;" :placeholder="f.placeholder" />
              <el-select v-if="f.type === 'select'" v-model="item.data[f.key]" style="width:220px;">
                <el-option v-for="o in f.options" :key="o.value" :value="o.value" :label="o.label" />
              </el-select>
              <el-radio-group v-if="f.type === 'radio'" v-model="item.data[f.key]">
                <el-radio v-for="o in f.options" :key="o.value" :label="o.value">{{ o.label }}</el-radio>
              </el-radio-group>
              <span v-if="f.desc" style="margin-left:10px;color:#909399;font-size:12px;">{{ f.desc }}</span>
            </el-form-item>
          </el-form>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
/**
 * 网络参数 (6通道)
 * 支持平台: HTTP / SOCKET(TCP·UDP) / MQTT / ONENET(New) / 阿里云 / 百度天工 / 腾讯云 / 腾讯云(New)
 * config 结构: conf = [ 通道1数组, 通道2数组, ..., 通道6数组 ]
 *   禁用通道: []
 *   socket通道: ["tcp"/"udp", 地址, 端口, 绑定串口ID, ...]
 *   其他通道:  [类型, 参数1, 参数2, ...]
 */

// 各平台字段定义 (key 对应数组下标-1, 保存时转换为数组)
const FIELD_DEFS = {
  http: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'http://', desc: '上报/查询的HTTP接口地址' },
    { key: 'method', label: '请求方式', type: 'radio', options: [{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }] },
    { key: 'headers', label: '请求头', type: 'textarea', placeholder: 'JSON格式, 如 {"Authorization":"token"}' },
    { key: 'template', label: '发送数据流模板', type: 'textarea', placeholder: '支持占位符 {imei} {csq} {ver}' },
    { key: 'timeout', label: '超时时间 (毫秒)', type: 'number', desc: '默认5000' },
    { key: 'serialId', label: 'HTTP绑定串口ID', type: 'select', options: [{ value: 1, label: '串口1' }, { value: 2, label: '串口2' }, { value: 3, label: '串口3' }] }
  ],
  socket: [
    { key: 'proto', label: '协议', type: 'radio', options: [{ value: 'tcp', label: 'TCP协议' }, { value: 'udp', label: 'UDP协议' }] },
    { key: 'addr', label: 'socket的地址或域名', type: 'text' },
    { key: 'port', label: 'socket服务器的端口号', type: 'number', desc: '范围 1~65536' },
    { key: 'serialId', label: 'TCP通道捆绑的串口ID', type: 'select', options: [{ value: 1, label: '串口1' }, { value: 2, label: '串口2' }, { value: 3, label: '串口3' }] },
    { key: 'heartbeat', label: '心跳包', type: 'text', placeholder: '16进制, 如 AA5501FF' },
    { key: 'template', label: '发送数据流模板', type: 'textarea' }
  ],
  mqtt: [
    { key: 'addr', label: 'MQTT的地址或域名', type: 'text' },
    { key: 'port', label: 'MQTT服务器的端口号', type: 'number', desc: '范围 1~65536', default: 1883 },
    { key: 'username', label: 'MQTT的登陆账号', type: 'text' },
    { key: 'password', label: 'MQTT的登陆密码', type: 'text' },
    { key: 'keepalive', label: 'MQTT心跳包的间隔', type: 'text', desc: '单位秒, 默认300', default: '300' },
    { key: 'qos', label: 'MQTT的QOS级别', type: 'select', options: [{ value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }] },
    { key: 'retain', label: 'MQTT的publish参数retain', type: 'select', options: [{ value: 0, label: '0' }, { value: 1, label: '1' }] },
    { key: 'session', label: 'MQTT保存会话标志位', type: 'select', options: [{ value: 1, label: '持久会话' }, { value: 0, label: '离线自动销毁' }] },
    { key: 'clientId', label: '客户端ID', type: 'text', desc: '不填系统用IMEI做客户端ID' },
    { key: 'subTopic', label: '订阅消息主题', type: 'text' },
    { key: 'pubTopic', label: '发布消息主题', type: 'text' },
    { key: 'addImei', label: '主题添加IMEI', type: 'select', options: [{ value: '', label: '是' }, { value: '1', label: '否' }] },
    { key: 'will', label: 'MQTT的遗嘱', type: 'text' },
    { key: 'willTopic', label: 'MQTT的遗嘱主题', type: 'text' },
    { key: 'transport', label: 'transport', type: 'select', options: [{ value: 'tcp', label: 'tcp' }, { value: 'tcp_ssl', label: 'tcp_ssl' }] }
  ],
  onenetnew: [
    { key: 'addr', label: 'onenet的地址或域名', type: 'text', default: '183.230.40.40' },
    { key: 'port', label: 'onenet服务器的端口号', type: 'number', default: 1811, desc: '范围 1~65536' },
    { key: 'productId', label: '产品ID', type: 'text' },
    { key: 'productSecret', label: 'ProductSecret', type: 'text' },
    { key: 'deviceName', label: 'DeviceName', type: 'text' },
    { key: 'subTopic', label: '订阅主题', type: 'text' },
    { key: 'pubTopic', label: '发布主题', type: 'text' },
    { key: 'qos', label: 'MQTT的QOS级别', type: 'select', options: [{ value: 0, label: '0' }, { value: 1, label: '1' }] },
    { key: 'serialId', label: '串口通道', type: 'select', options: [{ value: 1, label: '串口1' }, { value: 2, label: '串口2' }, { value: 3, label: '串口3' }] }
  ],
  aliyun: [
    { key: 'productKey', label: 'ProductKey', type: 'text' },
    { key: 'deviceName', label: 'DeviceName', type: 'text' },
    { key: 'deviceSecret', label: 'DeviceSecret', type: 'text' },
    { key: 'endpoint', label: 'Endpoint', type: 'text', placeholder: '如 iot-as-mqtt.cn-shanghai.aliyuncs.com' },
    { key: 'region', label: '地域代码(RegionID)', type: 'text', default: 'cn-shanghai' },
    { key: 'pubTopic', label: '发布主题', type: 'text', desc: '不填使用默认 /sys/{pk}/{dn}/thing/event/property/post' }
  ],
  bdiot: [
    { key: 'productId', label: '产品ID', type: 'text' },
    { key: 'apiKey', label: 'Master-APIkey', type: 'text' },
    { key: 'pubTopic', label: '发布主题', type: 'text' }
  ],
  txiot: [
    { key: 'secretId', label: 'SecretID', type: 'text' },
    { key: 'secretKey', label: 'SecretKey', type: 'text' },
    { key: 'productId', label: '产品ID', type: 'text' },
    { key: 'pubTopic', label: '发布主题', type: 'text' }
  ],
  newtxiot: [
    { key: 'productId', label: '产品ID', type: 'text' },
    { key: 'productSecret', label: 'ProductSecret', type: 'text' },
    { key: 'deviceName', label: 'DeviceName', type: 'text' },
    { key: 'pubTopic', label: '发布主题', type: 'text' }
  ]
}

const TYPE_LIST = [
  { value: 'http', label: 'HTTP' },
  { value: 'socket', label: 'SOCKET' },
  { value: 'mqtt', label: 'MQTT' },
  { value: 'onenetnew', label: 'ONENET(New)' },
  { value: 'aliyun', label: '阿里云' },
  { value: 'bdiot', label: '百度云' },
  { value: 'txiot', label: '腾讯云' },
  { value: 'newtxiot', label: '腾讯云(New)' }
]

export default {
  name: 'NetworkConfig',
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    const conf = this.config.conf || []
    const tabList = []
    for (let l = 0; l < 6; l++) {
      const a = conf[l] || []
      const isSocket = ['tcp', 'udp'].includes(a[0])
      const type = a.length === 0 ? 'http' : (isSocket ? 'socket' : a[0])
      tabList.push({
        index: l + 1,
        disabled: a.length === 0,
        type,
        // socket 通道: 第一个元素是协议, 其余是参数; 其他通道: 第一个元素是类型
        data: this.buildData(type, isSocket ? a : a.slice(1))
      })
    }
    return { tabName: '通道1', tabList, typeList: TYPE_LIST }
  },
  methods: {
    buildData(type, arr) {
      const defs = FIELD_DEFS[type] || []
      const data = {}
      for (let i = 0; i < defs.length; i++) {
        const f = defs[i]
        data[f.key] = arr[i] != null ? arr[i] : (f.default != null ? f.default : '')
      }
      return data
    },
    currentFields(item) {
      const defs = FIELD_DEFS[item.type] || []
      // socket 的协议字段单独放类型选择上
      if (item.type === 'socket') {
        return defs.filter(f => f.key !== 'proto')
      }
      return defs
    },
    onTypeChange(item) {
      // 切换类型时清空参数
      item.data = this.buildData(item.type, [])
    },
    getForm() {
      const t = []
      for (const a of this.tabList) {
        if (a.disabled) {
          t.push([])
          continue
        }
        const defs = FIELD_DEFS[a.type] || []
        if (a.type === 'socket') {
          const proto = a.data.proto || 'tcp'
          t.push([proto, a.data.addr || '', a.data.port != null ? a.data.port : '', a.data.serialId != null ? a.data.serialId : 1, a.data.heartbeat || '', a.data.template || ''])
        } else {
          const arr = defs.map(f => a.data[f.key] != null && a.data[f.key] !== '' ? a.data[f.key] : '')
          t.push([a.type, ...arr])
        }
      }
      return { conf: t }
    }
  }
}
</script>
