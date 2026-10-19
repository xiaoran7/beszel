# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added & Refined

- **Server Card Data Density Expansion (Reference-Aligned Layout)**:
  - 资源区重排为 2×2 网格：CPU、内存、磁盘、负载各自独立展示百分比、绝对值与分段 LED 条；CPU 显示核心数与型号，内存/磁盘显示真实「已用 / 总量」，负载显示 1m/5m/15m 三值与相对核心数的使用率条。
  - 卡片标题行新增规格徽章（如 `2C · 3.8G`），直接呈现几核几 G。
  - 网络区拆分为「实时上下行速率」与「自启动以来的累计出站 / 入站流量」两组，全部来自 Agent 真实计数器，不再按比例拆分推算。
  - 延迟矩阵升级为「延迟 + 质量」双条：每个探针显示延迟值与丢包率，并按协议阈值（ICMP / TCP / HTTP / DNS）以绿 / 黄 / 红分段条呈现质量等级，与监控表格的判定标准保持一致。
  - 协议徽章精简为 `V4` / `V6` 风格，与位置徽章并列。
  - 明确边界：Beszel 后端没有流量配额与到期时间字段，本次未虚构这两项；待后端补数据后再接入。
- **Per-Second Realtime Dashboard Telemetry (`rt_metrics`)**:
  - 首页看板接入 Hub 的 `rt_metrics` 每秒实时推送流（`useRealtimeSystems`），彻底解决卡片指标长期停留在 60 秒落库快照、看着"不动"的问题。
  - 高密度矩阵卡片与经典仪表盘卡片均优先渲染每秒实时 `stats` / `info`：CPU、内存、磁盘、GPU 使用率、负载均值、运行时间与上下行速率全部实时跳动。
  - 双向带宽改为消费 Agent 上报的真实 `stats.b = [发送字节/秒, 接收字节/秒]`，不再按固定 35/65 比例推算；累积流量优先累加各网卡真实累计计数（`stats.ni`）。
  - 网络延迟矩阵直接消费实时 `Monitors` 探针结果（微秒级 `res_avg` 与实时丢包率），无探针时如实展示实时流连接状态，不再显示虚构的 `< 2ms RTT`。
  - 新增 `useSystemDetails`：现代 Agent 不再把核心数、线程数、CPU 型号写入 `systems.info`，卡片改从 `system_details` 集合读取并本地缓存，保证核心数、CPU 品牌与操作系统标签准确。
  - 订阅按需管理：仅对在线且 Agent 版本支持 1 秒窗口的系统建立订阅；切换到表格视图或浏览器标签页隐藏时自动释放全部订阅，避免 Hub 空转与流量浪费。
- **Aozora High-Density Matrix Card & Tri-Mode Layout Switcher (`DenseServerCard`)**:
  - 新增高密度矩阵仪表盘卡片（`DenseServerCard`），融合 Nezha / ServerStatus 等经典探针丰富的指标密度，同时严格秉持 Aozora UI（70% 现代产品设计 + 20% 轻二次元世界观 + 10% 几何微装饰）设计准则与 60 FPS 性能铁律。
  - 顶部融合 Kivotos 城市天际线二次元画风横幅，采用平滑向下透明渐变遮罩（`mask-image: linear-gradient(to bottom, black 30%, transparent 100%)`）与夜间微光滤镜（`dark:opacity-35 dark:brightness-[0.55]`），使艺术立绘自然消融于卡片底色中，无论日夜均保持通透与舒适。
  - 核心资源采用分段方块矩阵条（Segmented LED Block Bars）：为 CPU（含核心数与型号）、内存、Root FS 磁盘、GPU 硬件加速提供离散 10 段 LED 状态条，动态色彩阶梯（<60% 青空绿、60%-85% 暖黄、>=85% 预警红），深色模式下附带柔和霓虹微光阴影。
  - 深度集成系统负载微型 HUD（Load Average 1m / 5m / 15m）与自适应负载状态徽章（Optimal / Normal / Heavy）。
  - 双向实时上下行带宽速率（Out ↑ / In ↓）与吞吐矩阵（Throughput），精确度量网络吞吐。
  - 多线路 / 节点网络延迟与质量矩阵（Network Latency Matrix）：联动 PocketBase `network_monitors` 数据源，实时展示各探测目标延迟（ms）与丢包率（Loss %）。
  - 卡片顶部支持国旗与地理位置徽章（如 `🇯🇵 JP · Tokyo`）、网络协议标签（Tailnet / IPv4 / IPv6）、在线状态及快捷告警与操作菜单；卡片底部展示连续运行时间（Uptime）与架构微标签。
  - 首页工具栏引入三模式自由切换器（3-Mode Layout Switcher）：支持高密度矩阵视图（Dense Matrix）、经典仪表盘视图（Classic Gauges）与精炼表格视图（Compact Table），并持久化记忆用户偏好至 `localStorage`。
- **Dark Mode Visual Harmony & Illustration Dual-Adaptation**:
  - 全面解决深色模式（Dark Mode）下插画白底穿透、生硬直角接缝与侧边栏发灰方块的视觉断层问题。
  - 针对首页看板娘背景层（`AronaCompanionPanel`）：引入 `dark:` 响应式双向渐变蒙版（`mask-image: linear-gradient(...)`），彻底消除左上角及下侧生硬矩形硬切边，让背景平滑消融进深邃黑蓝底色中；结合深度微调的夜间微光滤镜（压暗亮度、提升微对比、微调色相），使阿罗娜在暗夜模式下呈现出静谧、柔和的“终端屏幕微光”守候氛围，夜晚看监控绝不刺眼。
  - 针对左侧导航栏底部（`Sidebar`）：深色模式下彻底隐藏带白底的 `sidebar_footer.png` 位图叠加，替换为纯净深邃的 S.C.H.A.L.E. 夜空微光光晕，彻底消除灰白脏斑色块。
  - 针对系统详情页（`SystemHeroHeader`、`CitySkylineCard`）：同步补齐深色模式下的渐隐平滑遮罩与暗色滤镜适配，确保全站主题切换体验丝滑统一。
  - 本地开发环境配置：在 `vite.config.ts` 中配置代理支持直通 PocketBase 后端与生产调试。
- **AOCI & Local Tooling Zero-Footprint Governance (`.gitignore`)**:
  - 严格贯彻 AOCI 纯本地隐形化（Zero-Footprint）铁律，将 `aoci.*` 全量认知文件、`.aoci/` 本地状态库、`AGENT.md` 垫片及临时运行态全部加入 `.gitignore`。
  - 主动执行 `git rm --cached` 解除 Git 历史中对 `aoci.*`、`.aoci/`、`AGENT.md` 的版本追踪，实现本地工具加速无损、远程仓库彻底干净零污染。
- **Tokens & Fingerprints Management (`/settings/tokens-fingerprints`)**:
  - 全面补全系统专属「令牌与指纹」前端入口与全生命周期管理，彻底解决未配置凭据时表头下方空白且无任何入口的问题。
  - 新增「添加系统令牌」弹窗（`AddTokenDialog`）：支持针对受控系统分配独立令牌，支持一键生成 UUID 令牌、手动输入/修改令牌、预置或留空 Agent 硬件指纹，并支持系统缺失时直通新建受控系统。
  - 新增「编辑系统凭据」弹窗（`EditTokenDialog`）：支持随时编辑或轮换令牌、手动录入/校准硬件特征指纹、一键清空指纹以支持 Agent 重注册。
  - 新增 Aozora 风格通透空状态（Empty State）白卡引导：当无系统令牌记录时，展示友好引导说明并提供「添加系统令牌」与「添加受控系统」快捷按钮。
  - 增强表格操作与交互体验：Token 与 Fingerprint 单元格支持点击即复制与 Toast 反馈，未绑定指纹时直观显示「等待首次连接自动绑定」状态徽章；新增未配置专属令牌节点的快速检测横幅提示与实时搜索过滤。
  - 完善行操作菜单能力：支持复制 YAML 配置、复制环境变量、复制令牌、复制指纹、编辑凭据、轮换令牌、重置指纹以及彻底删除令牌记录（Delete Record）。
  - 同步完成 100% 简体中文（zh-CN）全量本地化提取与翻译编译。
- **Performance & 60 FPS Optimization**:
  - 全面排查并落实 CLAUDE.md 60 FPS 性能铁律，确保全站无 `background-attachment: fixed` 强制全屏重绘，滚动容器内无大面积堆叠 `backdrop-filter: blur(...)`。
  - 为 `AronaCompanionPanel` 全景氛围层与 `SystemHeroHeader` 头部插画容器赋予独立 GPU 合成加速层（`will-change: transform; transform: translateZ(0);`），杜绝滚动时 GPU 掉帧。
- **AOCI Integration**:
  - 初始化 AOCI-CODE 认知基线与 MCP 服务集成配置（`aoci init --locale zh-CN --agent claude --hooks`）。
  - 配置 PreToolUse Hook（`Edit|Write|MultiEdit` 变更拦截守护），自动纳管 445 个代码与配置资产。
  - 严密隔离宿主机配置（`.mcp.json`、`.claude/settings.json` 加入 `.gitignore` 严防泄密与跨机损坏）。
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
