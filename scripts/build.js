'use strict'
/**
 * 构建入口 (npm run build:prod 实际调用的脚本)
 *
 * 项目为 vue-cli 3 + webpack 4, 在 Node 18+ 下构建会报
 * "No module factory available for dependency type: CssDependency"。
 * 本脚本自动检测 Node 版本: <=16 直接构建; 高版本通过 npx node@16 降级构建,
 * 保证任意 Node 环境下 `npm run build:prod` 都能工作。
 * (CI 已固定 Node 16, 直接走本地构建分支, 不需要下载 npx 包)
 */
const { spawnSync } = require('child_process')
const path = require('path')

const major = Number(process.versions.node.split('.')[0])
const cliPath = path.join(__dirname, '..', 'node_modules', '@vue', 'cli-service', 'bin', 'vue-cli-service.js')
const args = process.argv.slice(2)
const opts = { stdio: 'inherit', shell: process.platform === 'win32' }

let result
if (major <= 16) {
  result = spawnSync(process.execPath, [cliPath, ...args], opts)
} else {
  console.log(`[build] 检测到 Node ${process.versions.node} (webpack 4 仅支持 Node 14/16), 自动降级到 Node 16 构建...`)
  result = spawnSync('npx', ['-y', 'node@16', cliPath, ...args], opts)
}

process.exit(result.status === null ? 1 : result.status)
