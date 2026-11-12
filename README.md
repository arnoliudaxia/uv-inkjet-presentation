# 从层高差异到单滴控制 · Slidev

9 页中文 UV 多材料打印动画演示（1 页目录 + 7 页教学 + 1 页 finish）。使用 Slidev、Vue、SVG 和原生 Canvas；浅色背景、深色正文，高饱和青/洋红/黄/蓝紫强调，无常驻 Slidev 工具栏。

## 启动

需要 Node.js 22.12+（推荐 24）和 npm。

```bash
npm ci
npm start
```

打开 http://127.0.0.1:3000 。已有后台服务时直接刷新，不要重复启动。`vite.config.ts` 将开发服务绑定到 `0.0.0.0:3000`，允许可信局域网手机通过电脑 LAN IP 访问；端口占用时退出，不自动改端口。Slidev 53.1 不支持 CLI `--host`，绑定通过 Vite config hook 生效。不应将开发服务暴露到公网。macOS/Linux 启动脚本设置 `NODE_ENV=development`；Windows 建议使用 WSL。

画布为 1440×810，按视口等比缩放，不拉伸或裁切。推荐横屏或投影。

## 内容与路由

| 页 | 内容 | 推进步骤 |
| --- | --- | --- |
| [01](/1) | 演示大纲 | 0 clicks；两列三行静态目录，可点击跳转 |
| [02](/2) | 不同颜色的单滴体积 → 落下合并为不同厚度的一层 | 1 步；再推进进入 /3 |
| [03](/3) | 原始高度与补偿比例 → 液体流动补缺 → 等效平均高度一致 | 2 步；再推进进入 /4 |
| [04](/4) | 随机混色与局部起伏 | 0 clicks；静态展示 |
| [05](/5) | 喷头结构：供墨 → 陶瓷 → 喷嘴 | 3 步；可点击已显示说明卡定位 |
| [06](/6) | 时间—电压函数 V(t) 与执行器电极 | 3 步 |
| [07](/7) | 波形与腔体、压力、断滴联动 | 自动循环；可暂停、选择阶段 |
| [08](/8) | 三维表面图、截面曲线与测量闭环 | 0 clicks；静态展示 |
| [09](/9) | finish | 自动三轮礼花，约 5 秒后停止 |

目录六项保持为：液滴体积与层高差异（/2）、抽点补偿与流动补缺（/3）、随机混色与局部起伏（/4）、喷头结构（/5）、驱动波形与液滴喷射（/6，涵盖 /6–/7）、表面形貌测量（/8）。目录无分步揭示或自动动画。原教学标题、字幕不变；旧数字链接正常顺延，不提供旧路由兼容映射。

### 教学状态

- **第 2 页**：每色悬空 3 滴，C:M:Y:支撑 S 单滴体积比为 0.5:1:1:2。显示半径为 `18 × V^0.65`（视觉夸张，不是真实球体比例）。同数量、同落点密度、同投影面积且体积保留的假设下，层厚比同为 0.5:1:1:2。一次推进落下合并，后退恢复。
- **第 3 页**：`/3` 初态为十层顺序出现的四色块，归一化高度 0.50/1.00/1.00/2.00，补偿比例 100%/50%/50%/25%。目标线 y=308 在堆叠后显示（delay 1.36s）。`/3?clicks=1` 为独立单色液体流动补缺，128 网格，宽 650、基底 y=342，截面积恒为 46800；约 5 秒流平后保持 1 秒并循环。`/3?clicks=2` 立即显示四个 0.50 等效平均高度的单块固体与确定性 32/16/16/8 点阵。离页、卸载或隐藏标签页停止 RAF；返回重播；reduced-motion 直接显示流平终态且不循环。
- **第 4 页**：固定种子的 16×6 墨水格与逐格同色的等轴连续表面，左侧等高、右侧有局部起伏。每图 96 个四边形、17×7 个共享顶点，无独立柱体或动画。高度场独立于颜色，不是由颜色预测材料高度。
- **第 5 页**：初始示意区无实际图元，三步依次装配供墨、陶瓷、喷嘴；各步 0.65s，喷嘴从下方 145px 拼合。后退移除对应组，再前进重播；reduced-motion 直接就位。
- **第 8 页**：截面、均值线及“测量 → 修正工艺 → 复测”始终可见，无分步揭示或动画。需求为约 1 μm 分辨率、至少 100 μm Z 量程、大约 1 cm 级视场，待设备验证。
- **第 9 页**：独立浅色画布，finish 居中，Canvas 礼花最多 480 粒、DPR 上限 2。只在自身页处于 slide 渲染上下文且可见时播放，不硬编码页码。离页/隐藏/卸载清理，重入重播；reduced-motion 不播放。

## 操作与手机模式

- `→` / `Space` / `PageDown`：下一步，完成当前页步骤后翻页。
- `←` / `Shift+Space` / `PageUp`：后退。
- `↓` / `↑` 或 `Shift+→` / `Shift+←`：跳过步骤翻页。
- 直接访问 `/1` 至 `/9`；例如 [`/5?clicks=2`](/5?clicks=2) 定位结构页第二步。
- 目录及教学按钮支持点击、Tab、Enter、Space；聚焦按钮后空格用于激活，不额外翻页。
- 使用浏览器全屏或 Slidev 原生 `F`，没有常驻全屏按钮。

触屏/粗指针且短边不超过 600 CSS px 时启用手机模式：竖屏将内容顺时针旋转 90°模拟横屏，真实横屏恢复正常方向；桌面窄窗口不强制旋转。不调用系统 orientation lock。内部仍由 Slidev 自身等比缩放。

两侧独立导航轨提供 44px 上一步/下一步按钮，先推进 clicks 再翻页；目录页禁止后退，finish 页禁止继续前进，总页数使用 Slidev 导航状态而非硬编码。隔离手机物理坐标 swipe，避免误翻页；目录和原教学控件仍可触摸。适配 resize、orientationchange、visualViewport、安全区及 dvh/fallback。

已通过 Chromium 390×844 / 844×390 触屏模拟；尚未验证真机 iOS Safari 的地址栏收放、安全区及触控表现。浏览器不能保证强制系统横屏，小字仍受手机物理尺寸限制。减少动态效果偏好沿用各组件行为，喷射默认暂停，仍可手动定位或主动播放。

## 构建与测试

```bash
npm run check       # 纯函数模型测试、JS 语法检查、生产构建
npm run build       # 静态输出 dist/
npx vite preview --host 127.0.0.1 --port 3102
TEST_URL=http://127.0.0.1:3000 npm run test:browser
TEST_URL=http://127.0.0.1:3000 npm run test:mobile
npm run test:sidebar
npm run test:production
```

浏览器测试使用 `playwright-core` 与本机 Chrome，默认路径为 macOS Google Chrome，其他环境通过 `CHROME_PATH` 指定。browser 默认目标为 3101，mobile/sidebar 为 3000；测试不负责启动/关闭开发服务。

- `tests/browser.mjs`：前 8 页（含目录）亮色、文字、布局与导航回归；目录六项跳转和返回首页；液滴体积/落下/回退；层高几何、点阵及流平守恒/生命周期；结构揭示；第 7 页波形同步；第 8 页静态测量；reduced-motion。截图 `/tmp/uv-slidev-page-{1..8}.png`，另有 droplets、blocks、random、anatomy、metrology 专项截图。
- `tests/finish.mjs`：browser 调用，独立检查 /8 → /9、居中、实际 Canvas 像素、三轮停止、离页清理、重入重播、隐藏与 reduced-motion。截图 `/tmp/uv-slidev-finish-{confetti,still}.png`。
- `tests/mobile.mjs`：1–9 页全部 clicks、双方向布局、导航轨/边界、目录触摸跳转与返回、旋转保留状态、finish 禁止前进、减少动态效果及桌面回归。截图 `/tmp/uv-mobile-{portrait,landscape}-{1,2,4,7,9}.png`。
- `tests/sidebar.mjs`：独立浏览器上下文检查第 2–8 页右栏及祖先可见性、文本与 bbox，第 6 页含 clicks=3 电极说明，第 1 页目录和第 9 页 finish 无右栏。截图 `/tmp/uv-sidebar/page-{1..9}.png`，可用 `SCREENSHOT_DIR` 指定。
- `tests/production.mjs`：使用 `/uv-inkjet-presentation/` base 构建及临时静态服务，模拟 Pages 深链接 404 回退，运行 sidebar/browser；自动关闭自己的服务，不影响 3000。
- `tests/isoInkSurface.mjs`、`tests/liquidFlow.mjs`：纳入 check，检查连续网格、投影边界、局部流动、体积守恒及非负/最大值原理。

## 部署

仓库：https://github.com/arnoliudaxia/uv-inkjet-presentation

在线课件：https://arnoliudaxia.github.io/uv-inkjet-presentation/

新结束页：https://arnoliudaxia.github.io/uv-inkjet-presentation/9 （需部署本次更改后生效）

`.github/workflows/pages.yml` 在推送 main 时部署，也支持手动触发；使用 Node.js 24、`npm ci`、带 base 的构建，仅上传 dist。Pages 来源设置为 GitHub Actions。本次本地修改不会自动发布。

history 路由需要将未知路径回退到 index.html；构建含 `404.html` 和 `_redirects`。Pages 的 `/uv-inkjet-presentation/2`、`/uv-inkjet-presentation/9` 等深链接回退仍返回 HTTP 404，但可正常加载。上述 `/1` 至 `/9` 均相对于部署根目录；子路径部署须保留前缀，可用 `npm run build -- --base /demo/`。不能通过 file:// 双击打开。

## 主要文件

- `slides.md`：9 页编排、原教学标题/字幕与 clicks。
- `components/OutlineSlide.vue`：沿用 LessonSlide 的静态六项目录，调用 Slidev 导航，兼容部署 base。
- `components/LessonSlide.vue`、`PlaybackControls.vue`：公共排版、播放控件。
- `components/DropletLayer.vue`：液滴体积与单层厚度的可逆过渡。
- `components/LayerProblem.vue`、`FlowLeveling.vue`、`CompensationDemo.vue`：补偿与局部流平。
- `components/IsoInkSurface.vue`、`composables/isoInkSurface.js`：连续等轴网格、确定性布局及投影。
- `components/AnatomyBoard.vue`、`AnatomyAssembly.vue`：三步装配；`PrintheadDiagram.vue` 保留完整动态墨路供波形页使用。
- `components/WaveformConcept.vue`、`WaveformSync.vue`：概念与同步演示。
- `components/SurfaceMetrology.vue`、`FinishSlide.vue`：静态测量与结束礼花。
- `components/DropControl.vue`、`WaveformParameters.vue`：备用，不编入当前页序。
- `global-top.vue`：手机旋转、触屏导航、安全区与监听清理；无需修改总页数。
- `composables/motion.js`、`useInkCycle.js`：教学响应与可见性时钟。
- `style.css`、`styles/`：布局与浅色主题；墨水 C `#00a6df`、M `#e6007e`、Y `#ffd500`、S `#4054dc`。C/Y 标签另用深色保证可读性，不使用反色滤镜。
- `vite.config.ts`：局域网绑定、端口保护及旧资源隔离。

## 旧版备用

原 `index.html`、`app.js`、`styles.css`、`server.mjs` 保留三页零依赖版本：

```bash
PORT=3100 npm run legacy
```

Slidev 默认读取根目录旧 HTML/CSS，Vite 配置负责排除旧资源。升级 Slidev/Vite 后应复测开发与静态构建。备用版本不包含新目录。

## 模型与技术边界

`composables/liquidFlow.js` 为二阶非线性局部流平近似 `∂t h = ∂x(D(h) ∂x h)`，不是含四阶毛细曲率压力的完整薄膜方程。`D = 800 × (0.12 + min(h_face / 72, 3)²)` 只依赖相邻两格平均高度。每步从高格向低格转移等量质量，两端零通量；初态均值仅配置总墨量，不驱动演化。

时间步满足 `dt ≤ 0.45 dx² / D_max`，另限至 1/1200 秒，非负凸组合更新，不裁剪负值或全局归一化补偿误差。RAF 累积固定子步，每帧最多追赶 50ms；128 点中心连线及两端半网格重建保存显示面积。初态四个 cos² 墨丘，0.35 高极薄前驱膜体积从墨丘扣除。终态仍有微小起伏。未模拟真实接触角、毛细脊、四阶效应、惯性、固化或三维流动；时间、扩散系数不是材料参数。

所有数值、表面图、墨滴和波形均为教学示意，不是实验数据或硬件参数：

- 不能仅由颜色推断滴量与固化层高，黏度、表面张力、温度、背压、润湿、合滴及固化收缩均有影响。
- 抽点控制区域平均沉积量，块体一致不保证随机混色局部平整；不否定经空间建模和实测验证的抽点策略。
- 波形改善喷射一致性并不足以保证固化表面平整，还应检查滴量、速度、卫星滴、稳定性及固化形貌。
- 喷头为简化压电按需喷墨通道，不对应型号；位移夸张，压力图不是流体仿真。
- 拉—保持—推—恢复采用上升沿扩容的示例极性，实际依结构、安装和极性而定。四段等时、八秒循环仅方便观察，不提供实际电压/微秒时序，不预测滴量单调关系。
- AFM 并非默认满足全部测量规格；共聚焦、白光干涉、色散共焦也需按样品和设备验证。
- 未加入 PDF/视频导出；静态 PDF 无法保留交互动画。
- 上次依赖审计报告 8 项问题（3 low、4 high、1 critical），涉及 Slidev 上游链，尚未通过破坏性升级解决，本轮未重新审计。编辑、导出、录制已关闭，但不等于修复漏洞；只播放可信课件，不开放到公网，升级后重新审计。
