# DTU配置平台

基于 Vue Admin Template 改造的 DTU（数据传输单元）物联网设备管理平台，功能对标 `http://dtu.minyee.com`。

## 功能

- **设备管理** — 批量添加（IMEI）、搜索（IMEI/手机号/ICCID/硬件版本）、修改分组、转移归属、删除、导出CSV、物联网卡状态查询
- **分组管理** — 分组增删改查、复制、设备参数配置（9个Tab: 基本参数/串口/网络/自动采集任务/数据流/GPIO/GPS/APN/任务）、组内设备管理与固件升级
- **流量查询** — 设备心跳/在线状态查询
- **用户角色** — 超级管理员/普通用户两级权限，用户管理
- **系统概览** — 设备统计、在线趋势、最近上线
- **IoT 接入** — DTU 设备注册/心跳/数据上报/配置拉取接口，MQTT 云平台桥接（阿里云/ONENET/百度云/腾讯云）

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 2.6 + Element UI 2.13 + Vuex + Vue Router (hash模式) |
| 后端 | Node.js + Express |
| 数据库 | SQLite (Node 内置 node:sqlite, 生产可切 MySQL) |
| 鉴权 | JWT + 图形验证码 (svg-captcha) |

## 快速启动

```bash
# 1. 启动后端 (端口 3001)
cd server
npm install
node app.js

# 2. 启动前端 (端口 9528)
npm install
npm run dev
```

访问 `http://localhost:9528`

**默认管理员账号**: 手机号 `13800000000` / 密码 `admin123`
（新用户可通过登录页"立即注册"注册普通账号）

## 数据存储设计

详见 [server/docs/数据存储方案.md](server/docs/数据存储方案.md)

## 后端 API

| 模块 | 前缀 | 说明 |
|------|------|------|
| 管理接口 | `/api/*` | 认证/设备/分组/用户/仪表盘 (JWT鉴权) |
| IoT设备接口 | `/iot/api/*` | 设备注册/心跳/上报/配置拉取 (设备固件调用) |

后端冒烟测试: `cd server && node test-smoke.js`
