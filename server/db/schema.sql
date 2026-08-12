-- ============================================================
-- DTU配置平台 数据存储设计 (SQLite 方言，兼容 MySQL 迁移)
--
-- 存储分层方案:
--   关系数据 (用户/设备/分组/配置) → SQLite(dev)/MySQL(prod)
--   时序数据 (心跳/流量)          → device_heartbeats 表(dev) → InfluxDB(prod)
--   缓存/会话 (验证码/在线状态)    → captcha_sessions 表(dev) → Redis(prod)
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   VARCHAR(50)  NOT NULL DEFAULT '',
  mobile     VARCHAR(11)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,                -- bcrypt/md5 哈希
  role       TINYINT      NOT NULL DEFAULT 0,      -- 0:普通用户 1:超级管理员
  avatar     VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 分组表 (config 字段存储设备参数配置 JSON, 下发到 DTU 设备)
CREATE TABLE IF NOT EXISTS groups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  group_name VARCHAR(100) NOT NULL,
  config     TEXT         NOT NULL DEFAULT '{}',   -- 设备参数配置 JSON (9个Tab)
  is_default TINYINT      NOT NULL DEFAULT 0,      -- 1:默认分组(不可删/改名)
  user_id    INTEGER,                              -- 创建者, NULL=系统
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 设备表
CREATE TABLE IF NOT EXISTS devices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  imei          VARCHAR(30) NOT NULL UNIQUE,       -- 设备唯一标识
  iccid         VARCHAR(30) NOT NULL DEFAULT '',   -- 物联网卡号
  hadr          VARCHAR(50) NOT NULL DEFAULT '',   -- 硬件版本
  ver           VARCHAR(50) NOT NULL DEFAULT '',   -- 固件版本
  csq           VARCHAR(10) NOT NULL DEFAULT '0',  -- 信号强度
  pwrmod        VARCHAR(20) NOT NULL DEFAULT 'normal',
  online_time   DATETIME,                          -- 最近心跳时间
  update_status VARCHAR(20) NOT NULL DEFAULT '',   -- 固件升级状态
  group_id      INTEGER,                           -- 所属分组 (NULL=未分组)
  user_id       INTEGER,                           -- 所属用户
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_devices_imei    ON devices(imei);
CREATE INDEX IF NOT EXISTS idx_devices_user    ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_group   ON devices(group_id);

-- 设备心跳/流量时序表 (流量查询数据源; 生产迁移 InfluxDB)
CREATE TABLE IF NOT EXISTS device_heartbeats (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id  INTEGER NOT NULL,
  imei       VARCHAR(30) NOT NULL,
  csq        VARCHAR(10) NOT NULL DEFAULT '',
  hadr       VARCHAR(50) NOT NULL DEFAULT '',
  iccid      VARCHAR(30) NOT NULL DEFAULT '',
  ver        VARCHAR(50) NOT NULL DEFAULT '',
  flow_used  BIGINT NOT NULL DEFAULT 0,            -- 累计流量(bytes)
  ip         VARCHAR(45) NOT NULL DEFAULT '',
  raw_data   TEXT,                                 -- 原始上报报文
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_heartbeats_imei   ON device_heartbeats(imei);
CREATE INDEX IF NOT EXISTS idx_heartbeats_created ON device_heartbeats(created_at);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER,
  action      VARCHAR(100) NOT NULL,               -- device.create / group.config.update ...
  target_type VARCHAR(50)  NOT NULL DEFAULT '',
  target_id   INTEGER,
  detail      TEXT,                                -- JSON 详情
  ip          VARCHAR(45) NOT NULL DEFAULT '',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 图形验证码会话表 (生产迁移 Redis)
CREATE TABLE IF NOT EXISTS captcha_sessions (
  uuid       VARCHAR(64) PRIMARY KEY,
  code       VARCHAR(10) NOT NULL,
  expired_at DATETIME NOT NULL
);
