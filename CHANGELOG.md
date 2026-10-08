# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added & Refined

- **System Detail View (`/system/:id`)**:
  - 补全多分类标签页导航（Overview 全景、Core 核心指标、Containers 容器负载、Network 网络、Storage 存储与磁盘、GPU 加速器、Services 服务管理）与布局宽度切换（Grid 多列 / Full 单列）。
  - 补全容器历史多时序图表：新增 `ContainerCpuChart`、`ContainerMemoryChart`、`ContainerNetworkChart` 容器 CPU/内存/网络时序图表及完整交互式 `ContainersTable` 容器管理。
  - 补全硬件传感器（CPU/主板温度、风扇转速、电池电量）、Swap 交换内存、GPU 加速器（使用率、显存、温度、功耗）、额外挂载分区（Extra FS）、ZFS 存储池及 S.M.A.R.T. 硬盘健康诊断数据展示。
  - 顶部 Hero Header 集成即时告警配置按钮（AlertButton）、服务器管理菜单（ActionsButton，支持编辑、暂停/恢复、删除、复制安装命令）及通信协议标识。
  - 丰富并对称排布系统硬件信息概览卡片（System Information）：补全核心与线程配比（Cores / Threads）、连接协议（Connection Protocol）、系统服务状态（Systemd Units Total/Failed）。
- **Global Alert Management (`GlobalAlertsSheet`)**:
  - 消除首台服务器硬编码限制，增加服务器切换选择器，支持实时显示各节点在线状态与触发告警计数，可自由切换查看与配置各节点告警。
- **Dashboard & Server Grid Cards (`/`)**:
  - 服务器网格卡片集成即时告警按钮（AlertButton）并支持 GPU 动态第 5 仪表盘，补充 GPU、Systemd 标签展示。
  - 首页顶部集成活跃告警实时横幅（ActiveAlerts）。
- **Workload & Monitoring Subpages (`/containers`, `/smart`, `/monitors`, `/settings`)**:
  - 补全统一规范内边距与布局容器（`p-4 md:p-6 lg:p-7 pb-16`），消除表格顶边贴边问题。
  - 新增青空风格 Hero 页面头部横幅与业务说明。
  - Topbar 顶部全局导航栏补全多页面真实面包屑导航链路（Dashboard → Containers / S.M.A.R.T. / Network Monitors / Settings）。
