# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Deployed

- **生产部署 74ac00f6（合并部署）**:
  - 目标：东京主力机 `beszel-hub` 容器，镜像 `beszel:schale`。自 `e796873b`（上一版）升级至 `2c1986faf117`（`74ac00f6`）。
  - 包含两批改动：`873ea7f8` 负载按逻辑 CPU 归一化与探针分级统一，以及 `74ac00f6` 四列氛围布局与对齐告警栏。
  - 前端为 `//go:embed` 打包进 Hub 二进制，因此必须重建镜像而非替换 `dist`：本机构建 dist → 上传源码与 dist 归档 → 服务器解包到 `/opt/beszel/repo-new` → `docker build` → 临时容器 `127.0.0.1:18090` 验证 → 打回滚标签 → `docker compose up -d --no-deps beszel-hub`。
  - 验证通过：`/api/health` 本地与公网均 200；线上首页引用 `assets/index-BexMqUUj.js`；线上 bundle 含 `threads||t.cores||1` 与 `172800`；Gzip 生效（`content-encoding: gzip`）；容器 `healthy`、重启次数 0。
  - 回滚点：镜像 `beszel:schale-backup-74ac00f6-20261020-041349`（对应 `e796873b`）+ 源码树归档 `backup-repo-before-74ac00f6-20261020-041123.tar.gz`。
  - 收尾已清理临时容器、`beszel:schale-new` 标签、上传归档与上上代备份；东京机未重启宿主机、其他容器或任何 systemd 服务。

### Added

- **Hunan Multi-ISP Return-Path Monitoring (湖南三网回程监测)**:
  - 新增本机 Agent 节点「Hunan-Zhuzhou (湖南株洲联通)」：以 WebSocket 主动外连 `wss://beszel.tannerlab.xyz/api/beszel/agent-connect` 接入 Hub，无需公网端口映射，适配 NAT 后的家庭宽带环境。
  - 湖南电信 / 移动 / 联通三网探针：三网公共 DNS 的 ICMP 均被限速或屏蔽，改用 `tcp/53` 探针实测可达，从湖南本地视角给出真实回程延迟与丢包。
  - 东京主力机补充大陆骨干回程探针（阿里 DNS `223.5.5.5`、腾讯 DNS `119.29.29.29`、百度 DNS `180.76.76.76`、CNNIC `1.2.4.8`）与杭州/华为云 Tailnet 探针，形成大陆 ↔ 日本双向对照。
  - 实测记录：湖南本地 → 三网 DNS 约 2–7 ms、湖南 → 东京公网约 161–165 ms（0% 丢包）、东京 → 大陆骨干约 51–88 ms。
  - 本机 Agent 通过用户级启动文件夹（`BeszelAgent.vbs`）实现登录自启，无需管理员权限；指纹预置保证重连后仍绑定同一系统记录。
- **Network Loss Alerting & Tailnet Loss Triage**:
  - 为东京主力机与湖南本机分别启用 `NetworkMonitorLoss` 告警（阈值 20%，基于 1 小时丢包率），生产环境此前无任何告警配置。
  - 东京 → 阿里云 Tailnet（`100.101.2.4`）与阿里杭州公网（`8.148.11.79`）探针采样间隔由 60 s 收紧至 20 s，以便在样本量足够时快速判定持续丢包。
  - 实测复核：该 Tailnet 链路 57 次采样失败 6 次（10.5%），同期百度 DNS 8.3%、阿里杭州公网 5.9%，确认为东京 ↔ 大陆链路的间歇性丢包而非单次瞬断；延迟稳定在 81–82 ms。
  - 澄清 Tailnet 直连问题：东京侧 `tailscaled` 正常监听 `41641`、`ts-input` 放行该端口、无 ufw 拦截，公网映射为锥形 NAT；直连失败源于**本机** `netcheck` 报告 `UDP: false`，与东京端口无关。

### Fixed

- **Dashboard Metric Algorithm Audit (负载与指标口径校正)**:
  - 负载率归一化改用逻辑 CPU 数（`threads`），与 `top` / `htop` 及系统表格一致。此前按物理核数计算，2 核 4 线程的机器会把 39% 的真实利用率显示成 78%，并把 `Optimal` 误判为 `Normal`。
  - 负载等级阈值改用系统表格同源的 65% / 90%，替代原先与表格不一致的 0.7 / 1.0 倍核数判定。
  - 规格徽章改为显示逻辑核数（`4C`），与主机商标注口径一致；此前显示物理核数，导致 4C 机器显示为 `2C`。
  - 抽取共享探测质量模块 `probe-quality.ts`：延迟阈值表此前在监控表格与仪表盘卡片各存一份，存在漂移风险；现统一为单一来源，并导出 `latencyQualityFor` / `lossQuality`。
  - 修复 `secondsToUptimeString` 的小时/天分界笔误：原值 `360000` 秒（100 小时）使 4 天内的运行时长全部显示为「小时」，改为标准的 2 天（172800 秒）。
  - 移除 `system-card-stats` 中对已废弃字段 `info.c` 的读取——Agent 自 0.19 起不再发送该字段，核心数已迁移至 `system_details`，保留该回退只会掩盖数据缺失。
  - 复核后确认无需改动的算法：CPU 占用（按 `/proc/stat` 时间差计算、排除 guest、iowait 计入非 busy）、内存（`UsedPercent` + htop/legacy 两种口径）、磁盘（`UsedPercent` 按根分区）、带宽（真实累计计数差 ÷ 实际经过毫秒数，含 10 GB/s 异常重置保护）、uptime（`/proc/uptime` 带 gopsutil 回退）、GPU（多设备取最高使用率并正确区分「无 GPU」与「0%」）、内存与流量容量单位（统一 GiB 基）均符合主流实现。

- **Dashboard Card Correctness & Render-Cost Pass**:
  - 修复经典仪表盘卡片在 `stats.g` 为空对象时显示 `-Infinity%` GPU 仪表的问题（`Math.max()` 对空数组返回 `-Infinity`，且该值会绕过 `??` 回退链）。
  - 修复在线服务器当前秒无流量时网络仪表回退到 60 秒旧快照的问题：`stats.b` 在双向速率均为 0 时会被后端省略，现在按「有实时载荷即为 0 B/s」处理，不再伪造 ≥15% 的占用环。
  - 修复 uptime 为 0 时被当作「未上报」而显示 `Active` 的问题。
  - 修复 `getServerLocation` 的子串误匹配：`node-1`、`code-server` 被识别为德国，`business-db` 被识别为新加坡，`relaxed-proxy` 被识别为洛杉矶；改为按词元（token）整词匹配。
  - 修复 `system-kpi-cards` 在 `publicIp` 为空字符串时用 `??` 无法回退、导致「Public & Mesh IP」显示空白的问题。
  - 修复实时指标订阅把类型参数传给非泛型 `RealtimeSubscription.subscribe` 导致的 `TS2558`。
  - 修复 `useSystemDetails` 的失败/新增系统不重试问题（新增详情行或网络抖动后会永久停留在 `— Cores`），并新增登出时的缓存清理，避免同标签页切换账号后复用上一账号的详情。
  - 修复实时订阅在 Hub 重启/瞬时失败后整场会话静默失效的问题，改为 5 秒后重试。
  - 修复切到表格视图或标签页隐藏后，离线/已删除系统仍保留陈旧实时数据、卡片继续显示绿色「Live telemetry」的问题。
  - 修复状态排序比较器只返回 `-1/1`、从不返回 `0` 导致的非一致比较。
  - 修复 `localStorage` 中非法视图模式值会让三个切换按钮全部失效、且表格视图仍在后台维持实时订阅的问题，改为校验后回退到 `dense`。
- **Performance**:
  - 新增 `system-card-stats` 共享派生模块，消除两张卡片各自复制一份的 CPU/内存/磁盘/GPU/uptime/网络回退链——重复实现正是 `-Infinity` 只出现在其中一份的根因。
  - 实时指标改为每帧（`requestAnimationFrame`）合并一次状态更新，避免 N 台在线服务器每秒触发 N 次整页重渲染。
  - 网络探针改由首页一次性按系统分组并截取前 3 个，替代每张卡片各自 `filter` 全量列表；表格视图下不再订阅 `network_monitors`。
  - 分段 LED 条复用模块级索引数组与单次颜色类计算，取代每次渲染 10 次 `cn()` 调用与数组分配；`transition-all` 收窄为 `transition-colors`。
  - 移除卡片根节点无动画收益的常驻 `will-change: transform`（保留 `translateZ(0)`），并删除无效果的 `backdrop-blur-none` 死代码。
  - 卡片改为语义化 `<a href>` 并支持键盘与 Ctrl/Cmd+点击新标签页打开，同时消除 a11y 交互告警。
  - 网络速率与累计流量改为遵循用户的 `unitNet`（Bytes/Bits）偏好，与系统表格一致。
  - 延迟质量条改用监控表格同源的丢包阈值常量（>20% 红、>0% 黄），修正 CHANGELOG 此前「与表格判定一致」的表述。

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
