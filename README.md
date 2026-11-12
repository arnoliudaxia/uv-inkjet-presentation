# UV 打印喷头课堂 · Slidev

三页中文压电喷墨原理演示，使用 Slidev、Vue 与 SVG。沿用旧版的暗色青金配色、单通道连通墨路及八秒慢动作教学模型，不使用网络字体、CDN 脚本或外部图片。

## 安装与启动

需要 **Node.js 22.12+**（推荐 Node.js 24）和 npm。

```bash
npm ci
npm start
```

打开 **http://127.0.0.1:3000**。整个浏览器页面用于演示，没有顶部品牌、帮助/全屏按钮、底部页码导航；鼠标悬停和竖屏也不显示 Slidev 导航工具栏。仅保留部件选择、阶段定位、播放/暂停等教学控件。

- 画布为 **1440 × 810 / 16:9**，由 Slidev 按视口等比缩放；非 16:9 屏幕会留暗色边，不拉伸、不裁切。手机竖屏文字会较小，建议横屏或投屏。
- **CLI 参数说明**：已验证 Slidev 53.1 的 `--help`，当前版本不支持 `--host`，直接传入会报未知选项。因此启动脚本使用 `slidev slides.md --port 3000`，由 `vite.config.ts` 的配置钩子强制绑定 **127.0.0.1**，并启用 `strictPort`。不使用 `--remote`，也不会监听局域网。
- 启动脚本显式设置 `NODE_ENV=development`，避免从生产环境继承变量导致 Slidev 开发模式失效。该环境变量写法适用于 macOS / Linux / WSL；Windows 可在 WSL 中使用。
- **如果 3000 正运行旧版，请先由服务管理者切换。** 新启动会因端口占用而退出，不会终止旧进程或悄悄换端口。停止当前前台服务使用 `Ctrl+C`。
- 不占用 3000 的开发验证：`NODE_ENV=development npx slidev slides.md --port 3101`。

## 三页内容

1. **喷头结构**：初始保留低亮度结构轮廓，按前进键依次揭示供应管道、压电陶瓷、喷嘴；三步后再前进进入第二页。SVG 使用单一封闭路径连通「供应管道 → 墨腔 → 喷嘴」，另标注墨腔、可变形腔壁。点击图中部件或说明卡片可直接定位到对应揭示步骤，后退可逐步收起。步骤由 Slidev `useSlideContext` 管理。
2. **喷墨循环**：补墨与扩容 → 压缩与压力波 → 喷出与断滴 → 恢复与回填。可以暂停；点击阶段按钮会暂停并定位该阶段中段，便于观察腔壁、压力扰动、液柱和墨滴。
3. **概念波形**：波形游标、阶段名称和喷头机械响应共用同一个循环时钟；与第二页切换保持播放状态和进度。支持暂停和「下一阶段」。

页面不可见或停留第一页时不推进循环。遵循系统 `prefers-reduced-motion`：默认暂停、关闭流线装饰与过渡；仍可选择阶段或主动播放。该偏好切换为「减少动态效果」时会自动暂停。

## 快捷键

| 操作 | 快捷键 / 控件 |
| --- | --- |
| 下一步 / 下一页 | `→`、`Space`、`PageDown` |
| 上一步 / 上一页 | `←`、`Shift+Space`、`PageUp` |
| 跳过揭示直接翻页 | `↓` / `↑` 或 `Shift+→` / `Shift+←` |
| 直接访问某页 | `/1`、`/2`、`/3`；如 `/1?clicks=2` 定位第二步 |
| 操作教学按钮 / SVG 部件 | `Tab` 聚焦，`Enter` 或 `Space` 激活 |

按钮聚焦时空格保留激活语义，不重复翻页。这里不另写全局翻页事件，继续使用 Slidev 的键盘导航。没有常驻全屏按钮；需要时可使用浏览器全屏功能（Slidev 原生 `F` 也保留）。

## 构建与检查

```bash
npm run build  # 静态输出 dist/
npm run check  # 旧版/新共享 JS 的语法检查 + Slidev 生产构建

# 预览静态构建（测试端口不与旧服务冲突）
npx vite preview --host 127.0.0.1 --port 3102
```

部署 `dist/`，不要部署项目源码。默认使用 history 路由，静态服务器需要将未知路径回退到 `index.html`（构建附带 `404.html` 和 `_redirects`）；不能直接双击 HTML 用 `file://` 打开。子目录部署使用 `npm run build -- --base /demo/`，也可按 Slidev 官方方式选择 hash 路由。安装、构建需要依赖下载；完成后静态演示不需要互联网。

### 浏览器回归检查

```bash
npm ci --include=dev
# 先在另一个终端启动 3101 开发服务或 3102 静态预览
npm run test:browser
TEST_URL=http://127.0.0.1:3102 npm run test:browser
```

测试使用 `playwright-core` 和本机 Chrome，默认路径为 macOS 的 Google Chrome。其他系统通过 `CHROME_PATH=/实际/浏览器路径` 指定。测试不启动/停止任何服务，验证三步揭示、键盘前进/后退、按钮空格不翻页、暂停、阶段定位、断滴、跨页时钟与波形同步、悬停/竖屏工具栏隐藏和减少动态效果；截图写入 `/tmp/uv-slidev-browser.png`。

## 旧版备用（完整保留）

`index.html`、`app.js`、`styles.css`、`server.mjs` 原样保留，仍是零外部依赖的原生 HTML/CSS/JS 演示：

```bash
npm run legacy                  # 默认 127.0.0.1:3000
PORT=3100 npm run legacy         # 与 Slidev 并行运行
```

旧服务仍只允许访问三个前端文件，不公开源码、README 或依赖目录。Slidev 开发服务器用于受信任的本机编辑，不具有旧服务的文件白名单安全边界。

**兼容隔离**：Slidev 会自动读取根目录 `index.html` 和 `styles.css`。为不改动旧文件，`vite.config.ts` 在开发 HTML 响应和构建 HTML 中排除旧版 body/资源引用，并在 Vite 加载时排除旧样式。升级 Slidev/Vite 后应重新运行开发与静态两组浏览器检查，确认这一兼容层仍有效。

## 文件

- `slides.md`：三页内容、16:9 画布和 Slidev 配置，第一页声明三个 click 步骤。
- `components/LessonSlide.vue`：统一页标题和内容框架。
- `components/PrintheadDiagram.vue`：复用 SVG 剖面与响应式形变，独立渐变 ID。
- `components/AnatomyBoard.vue`：结构逐步揭示与可点击说明。
- `components/InkCycle.vue`、`WaveformSync.vue`、`PlaybackControls.vue`：阶段教学、波形与播放控制。
- `composables/motion.js`、`useInkCycle.js`：共享教学模型、循环时钟、可见性与减少动态效果策略。
- `style.css`：Slidev 专用配色、排版和隐藏导航规则，不影响旧版样式。
- `vite.config.ts`：回环绑定、端口保护与旧版资源隔离。
- `package-lock.json`：npm 锁定依赖；`.gitignore` 排除生成物。

## 技术边界与已知限制

- 这是一种**简化的压电按需喷墨原理**，不指向品牌或型号；实际弯曲、剪切驱动以及供墨/回流结构可能不同。
- 尺寸、厚度、位移、液滴形状和八秒动画都不是真实比例。金色表示压电执行器，青色表示墨水，不代表材料实际颜色。UV 固化、喷头阵列、过滤、脱气和完整供墨系统不在图中。
- 波形只是概念节奏，没有可用于硬件的电压、微秒时序、极性或调机数值。**电压高不等于必然喷墨**，形变方向取决于结构、安装约束和驱动极性。
- 压力图形不是流体仿真；真实喷射受声学匹配、压力传播/反射、液面、黏度、表面张力、温度、背压等共同影响。四阶段实际可能交叠。
- 静态浏览器演示是交付目标，没有加入 PDF/视频导出流程；静态导出也不能保留动画。
- 当前依赖 `npm audit` 报告 **8 项问题（3 low、4 high、1 critical）**，来自 Slidev 的 Monaco/DOMPurify 和 PPTX/image-size 依赖链。已执行非破坏性的 `npm audit fix`，上游仍未解决；未强制降级或覆盖依赖。已关闭编辑器、浏览器导出、录制和演讲者功能；只应播放可信本地课件，不应把开发服务开放到公网或导入不可信内容。关闭功能不等同于已修复依赖漏洞，后续应跟进上游更新。
