# 从层高差异到单滴控制 · Slidev

8 页中文 UV 多材料打印动画演示（7 页教学 + 1 页 finish 结束页），使用 Slidev、Vue、SVG 和原生 Canvas。白/浅灰背景、深蓝灰正文，高饱和蓝青/洋红/亮黄/蓝紫墨水配色、无常驻导航栏，键盘推进叙事，图示不依赖外部图片、字体或 CDN。

## 启动

需要 Node.js 22.12+（推荐 24）和 npm。

```bash
npm ci
npm start
```

打开 http://127.0.0.1:3000 。已有后台服务时直接刷新，不要重复启动。开发服务仅绑定本机回环地址，端口占用时退出，不自动改端口。Slidev 53.1 不支持 CLI `--host`，绑定由 `vite.config.ts` 控制。macOS/Linux 启动脚本显式设置 `NODE_ENV=development`；Windows 建议使用 WSL。

画布 1440×810，按视口等比缩放。非 16:9 视口会留浅色边，避免拉伸/裁切；推荐横屏或投屏。隐藏 Slidev 工具栏、品牌、页码与帮助按钮，仅保留播放、阶段定位等教学控件。

## 手机模式（先本地调试）

触屏/粗指针设备且视口短边不超过 600 CSS px 时启用手机模式：竖屏将**页面内容顺时针旋转 90°**模拟横屏，真实横屏恢复正常方向；桌面窄窗口不会强制旋转。这不是系统 orientation lock，不调用屏幕方向锁定 API。1440×810 画布仍由 Slidev 自身等比缩放，所有教学内容和动画不变。

两侧独立留白中提供 44px 圆形上一/下一步按钮，随画布一起旋转；先推进当前页 clicks，再翻页，finish 禁止继续前进。使用箭头翻页，不提供滑动翻页（手机模式隔离 Slidev 默认物理坐标 swipe，避免误触）；原教学按钮和 SVG 指针交互保留。底部工具栏仍隐藏。适配 resize、orientationchange、visualViewport 和安全区，动态高度有 dvh/fallback，减少动态效果偏好沿用原组件行为。

当前服务继续使用 http://127.0.0.1:3000 ，可在本机 Chrome 设备模拟中测试 390×844 / 844×390。服务只监听回环地址，手机直接输入电脑局域网 IP **不能访问**；真机需另行配置可信本地转发，本次未修改网络绑定或线上部署。已验证 Chromium 触屏模拟，**尚未验证真机 iOS Safari** 的地址栏收放、安全区和触控表现；浏览器不能保证强制系统横屏，小字仍受手机物理尺寸限制。

## 内容与讲解步骤

| 页 | 内容 | 推进步骤 |
| --- | --- | --- |
| [01](/1) | 不同颜色的单滴体积 → 落下合并为不同厚度的一层 | 1 步；再推进进入 /2 |
| [02](/2) | 原始高度与补偿比例 → 独立单色液体流动补缺 → 最低 C 0.50 等效平均高度一致 | 2 步；再推进进入 /3 |
| [03](/3) | 二维墨水分布与对应等轴表面：平整 vs 局部起伏 | 0 clicks；静态完整展示，再推进直接进入 /4 |
| [04](/4) | 初始空白 → 供墨从左进入 → 陶瓷从上装配 → 喷嘴从下拼装 | 3 步；可点已显示说明卡定位 |
| [05](/5) | 时间—电压函数 V(t) 与执行器电极 | 3 步 |
| [06](/6) | 拉—保持—推—恢复与腔体、压力、断滴联动 | 自动循环；可暂停和选择阶段 |
| [07](/7) | 三维表面图、截面曲线与测量闭环 | 0 clicks；静态完整展示，再推进进入 /8 |
| [08](/8) | finish 结束庆祝 | 自动三轮彩纸礼花，约 5 秒后停止；无新增文字或按钮 |

第一页每色悬空 3 滴，C:M:Y:支撑 S 的单滴体积比为 0.5:1:1:2；显示半径按 `18 × V^0.65` 非线性夸张（非真实球体比例），使大小差异更容易辨认；数字体积和沉积层厚不受夸张影响。一次推进后液滴落下、渐隐并合成四个相邻颜色层区；同数量、同落点密度、同投影面积且体积保留的假设下，层厚比同为 0.5:1:1:2。可后退恢复，减少动态效果偏好下直接切换终态，右侧仅一块动态说明。

第二页色块仅示意用户图中的相对高度关系，C:M:Y:支撑 S ≈ 1:2:2:4；以 M/Y 为 1.00，初始归一化高度为 0.50、1.00、1.00、2.00，补偿基准为最低 C 0.50。所有数值、表面图、墨滴和波形均为**教学示意，不是实验数据或硬件参数**，不代表固定的材料性能排序。第二页为 2 clicks（仍为同一物理页，全套共 8 页）：`/2`（click 0，内部 step 2）直接显示原始高度轮廓和补偿比例：C 100%、M 50%、Y 50%、S 25%；不加补偿目标或参考目标文字。10 层依次瞬间出现，每层内部无缩放动画；y=308 的目标线在初始堆叠完成后才出现（delay 1.36s），侧栏仅显示“通过测量高度，计算补偿比例。”。`/2?clicks=1`（内部 step 3）主标题与顶部 panel label 均为“液体流动补缺”：在 blocks SVG 内使用独立单色分支，不与前后四色块衔接。仅一块鲜青 `#00a6df` 液体，`retain=.5`；128 个有限体积网格，初态为四个 cos² 圆润墨丘与明显缺口，基底覆盖 0.35 高的极薄前驱膜，其体积从墨丘扣除。`FlowLeveling` 参数化宽度 650、基底 y=342，横向居中（x=105），不缩放文字或描边；任意帧截面积均为 650×72=46800，而非淡入替换或缩放增量。约 5 秒内墨丘向邻近低处铺展、融合并逐渐流平，无箭头。不会按全局平均高度驱动各位置，也不强制终态为平面。不显示 C/M/Y/S 名称、数值、目标线、四色补偿比例或点阵。唯一侧栏标题“液体流动补缺”，正文“未固化墨水横向流动，逐渐填补空缺。”；不增加 UI。通过 `useSlideContext` 监听 clicks、当前页及渲染上下文，仅进入本页 click 1 播放；每轮约 5 秒流平后保持终态 1 秒，再重置初态无限循环，保持期间 `data-running=true`。后退再进入重播；离页、卸载、隐藏标签页取消 RAF，reduced-motion 直接显示终态且不循环（`data-running=false`）。`data-progress`、`data-running`、`data-heights`、`data-initial-heights` 和初始/当前/最终面积代理用于测试。`/2?clicks=2`（内部 step 4）立即显示等效平均高度全部为 0.50：每色仅单个 `rect.solid-block`，x=0、y=308、width=106、height=72，不再有 10 层分隔；虚框 y=307、高 72，目标线立即可见。再推进才进入 `/3`，主标题保持用户文字“补偿后等效平均高度一致”（无标点）。下方固定示意点阵每色基准 32 点，仅一组：C 保持 32 点，M/Y 各抽点后保留 16 点（50%），S 保留 8 点（25%），无 C 额外喷射点组。唯一右侧卡片保留终态标题“等效平均高度一致”，正文为“C 不变，M/Y 抽点后保留 50%，S 保留 25%。”，不增加底部说明或额外 UI。旧的读高度、计算比例和固定掩模展示不再作为单独推进步骤。这是高度与沉积次数成比例的区域平均沉积量教学模型，非真实表面仿真。随机混色局限留在第三页。所有阶段可后退恢复。原单层截面及独立标定组件旧模式保留备用。

第三页 `/3` 为 **0 clicks 的静态完整状态**，无自动动画、分步抽点、旧逐列柱图或均值标定。保留原页标题、副标题及单右侧说明，主视图区为 2×2：上方各 16×6 格，左侧每四列为连续 C/M/Y/S 色块，右侧使用固定种子洗牌；下方分别是逐格同色的 2.5D 等轴表面。两图各有 96 个四边形、17×7 个共享顶点；左侧所有顶点等高，右侧用独立于墨水颜色的平滑正弦/余弦高度场表达局部形貌。相邻格共享边界，只有可见外缘侧面与基底，没有独立柱体；按远到近绘制，保持高饱和顶面和浅深侧面阴影。形貌只是教学示意，不是由颜色推算的材料高度或真实仿真。`→` 直接进入喷头结构页 Anatomy `/4`，`←` 从 `/4` 回到完整 `/3`，再后退回 `/2?clicks=2`。

第四页 `/4` 初始示意区完全空白（仅保留面板标题），未揭示侧卡隐藏但保留布局空位。三步依次为：供墨管道与墨腔从左进入；压电陶瓷连同连接层、可变形腔壁从上进入墨腔顶面；喷嘴从下方 145px 拼合，引线与文字同步出现。三个部件共用 0.65s 装配动画，第一、二步没有喷嘴，第三步青色墨路重叠连接避免渲染缝。侧栏喷嘴 brief 卡保留，下方 detail-box 详细说明不恢复。未揭示组不挂载，无完整背景结构、灰占位、流动箭头或底部图例。后退移除对应组，再前进重播对应装配；reduced-motion 直接就位，无循环或额外步骤。专用 `AnatomyAssembly.vue` 不影响波形页的 `PrintheadDiagram.vue`。浏览器测试覆盖空白实际图元数、各步装配组数量/动画/变换终值、喷嘴及标签第三步同步进入、回退清空与重播、连接位置和 reduced-motion，并保存 `/tmp/uv-anatomy-click-{0,1,2,3}.png`。

第七页 `/7` 为 **0 clicks 的静态页**：进入即显示两幅高度图、截面与均值参考线，以及底部“测量 → 修正工艺 → 复测”流程，无动画、隐藏揭示、步骤计数或点击提示。右侧解释固定为“平均值 ≠ 局部起伏”和“平均层厚需相对共同基底求取；截面的局部起伏用于观察不均匀，不能只用平均值代替。”；测量规格与候选方法保留。浏览器测试直接访问 `/7` 并检查从 `/6` 进入后无需推进、截面可见、文案固定与无动画。

第八页 `/8` 使用独立 `FinishSlide.vue`：1440×810 浅色画布、深色 finish 居中且始终位于礼花上层。原生 Canvas 从左右底部向上喷射三轮高饱和青、洋红、黄、蓝、紫纸屑，带重力、飘落与旋转，约 5 秒后清空停止，无依赖或网络请求。仅 Slidev 当前第 8 页且 renderContext 为 slide 时运行；离页、隐藏标签页、卸载立即取消 RAF 并清空，重新进入重播；reduced-motion 不播放。Canvas CSS 覆盖固定区域、pointer-events 为 none，DPR 上限为 2，最多 480 粒。

### 操作

- `→` / `Space` / `PageDown`：下一步，完成当前页步骤后翻页。
- `←` / `Shift+Space` / `PageUp`：后退。
- `↓` / `↑` 或 `Shift+→` / `Shift+←`：跳过步骤翻页。
- 直接访问 `/1` 至 `/8`；[`/4?clicks=2`](/4?clicks=2) 定位结构页第二步（链接相对演示服务根路径）。
- 教学按钮支持点击、Tab、Enter、Space；聚焦按钮后空格用于激活，不额外翻页。
- 使用浏览器全屏或 Slidev 原生 `F`。没有常驻全屏按钮。

减少动态效果偏好会关闭过渡，喷射默认暂停，仍可手动定位阶段或主动播放；喷射循环只在相关页面可见时推进。

## 构建与测试

```bash
npm run check       # JS 语法检查 + 生产构建
npm run build       # 静态输出 dist/
npx vite preview --host 127.0.0.1 --port 3102
TEST_URL=http://127.0.0.1:3000 npm run test:browser
TEST_URL=http://127.0.0.1:3000 npm run test:mobile # 8 页所有 clicks、触屏导航、旋转及桌面回归
npm run test:sidebar    # 默认检查已有 3000 服务，逐页新浏览器上下文
npm run test:production # base 子路径构建 + 临时静态服务 + 右栏及完整浏览器回归
```

浏览器测试使用 `playwright-core` 与本机 Chrome，默认路径为 macOS Google Chrome。其他环境通过 `CHROME_PATH` 指定。测试不负责启动/关闭服务，默认目标为 3101，可通过 `TEST_URL` 修改。

`test:production` 使用 `/uv-inkjet-presentation/` base，并模拟 Pages 深链接的 `404.html` 回退（HTTP 404），自动关闭自己的临时服务，不影响 3000。`test:sidebar` 检查第 1–7 页右栏及所有祖先的 display/visibility/opacity、文本及 bbox，第 5 页额外检查 `clicks=3` 的电极说明，第 8 页确认 finish 且无右栏；截图输出 `/tmp/uv-sidebar-production/page-{1..8}.png`。也可用 `TEST_URL=https://arnoliudaxia.github.io/uv-inkjet-presentation SCREENSHOT_DIR=/tmp/uv-sidebar-online npm run test:sidebar` 验证线上。

右栏排查应检查真实 DOM 与匹配 CSS，不应全局覆盖 `body aside`，以免影响 Slidev 自身内容。此次对 a26eff0 线上版本的干净 Chrome 检查中，右栏 `aside` 未被移除，`.adv-sidebar` 为 `display:flex`，所有祖先可见；没有复现截图中的空白。若特定浏览器仍出现，请在该浏览器记录 matched CSS（含扩展注入样式）、浏览器版本和资源请求，不能据此断言是 Slidev 生产隐藏规则。

部署 `dist/`，不要将开发服务暴露到公网。history 路由需要将未知路径回退到 `index.html`；构建包含 `404.html` 和 `_redirects`。不能直接双击 HTML 用 `file://` 打开。子路径部署可用 `npm run build -- --base /demo/`。

## GitHub Pages 部署

- 仓库：https://github.com/arnoliudaxia/uv-inkjet-presentation
- 在线课件：https://arnoliudaxia.github.io/uv-inkjet-presentation/
- 结束页：https://arnoliudaxia.github.io/uv-inkjet-presentation/8

`.github/workflows/pages.yml` 在推送 `main` 时自动部署，也支持手动触发。使用 Node.js 24、`npm ci` 和 `npm run build -- --base /uv-inkjet-presentation/` 构建，只上传 `dist/`；仓库 Pages 来源设置为 **GitHub Actions**。

部署时将 `dist/index.html` 复制为 `dist/404.html`，使 `/uv-inkjet-presentation/2`、`/uv-inkjet-presentation/8` 等深链接能够启动 Slidev。GitHub Pages 对这些回退请求仍返回 HTTP 404，但浏览器会正常加载课件；首页及静态资源返回 HTTP 200。上文 `/1` 至 `/8` 路径均相对于课件部署根目录，线上访问时需带 `/uv-inkjet-presentation/` 前缀。

## 文件

- `global-top.vue`：全局手机视口旋转、独立触屏导航、安全区及监听清理；只改变外层尺寸，内部缩放仍由 Slidev ResizeObserver 负责。
- `tests/mobile.mjs`：Chromium hasTouch/isMobile 双方向布局及全部点击状态检查，截图 `/tmp/uv-mobile-{portrait,landscape}-{1,3,6,8}.png`。

- `slides.md`：8 页编排、标题、演讲备注和逐步揭示数量。
- `components/DropletLayer.vue`：液滴体积与单层厚度的可逆过渡，独立 scoped CSS。
- `components/LayerProblem.vue`、`FlowLeveling.vue`、`CompensationDemo.vue`：问题与补偿策略及守恒面积的液面流平动画。
- `components/DropControl.vue`：保留备用，不再编入演示页序。
- `components/IsoInkSurface.vue`、`composables/isoInkSurface.js`：第三页静态等轴连续网格、确定性布局与纯 JS 投影。
- `tests/isoInkSurface.mjs`：96 格颜色对应、共享顶点、共面/起伏、可见侧面数量、绘制顺序、无翻折四边形及投影边界检查（纳入 check）。浏览器另检查 `/3` 零步导航、静态 DOM、颜色与 SVG 边界，截图 `/tmp/uv-slidev-random-static.png`；`/2` 检查终态保持期间 running、下一周期重置及 reduced-motion 不循环。
- `components/AnatomyBoard.vue`、`AnatomyAssembly.vue`：空白起始的供墨→陶瓷→喷嘴三步拼装展示；`PrintheadDiagram.vue` 保留给波形等页面的完整动态墨路。
- `components/WaveformConcept.vue`、`WaveformSync.vue`：波形概念与同步动画；`/6` 后直接进入测量页 `/7`。
- `components/WaveformParameters.vue`：参数探索组件保留备用，不再编入演示页序。
- `components/SurfaceMetrology.vue`：形貌图、截面和测量需求。
- `components/FinishSlide.vue`：独立结束页及有限时长 Canvas 礼花。
- `tests/finish.mjs`：由浏览器回归调用，独立验证 /7 → /8、居中、实际 Canvas 像素、三轮后停止、离页清理、重入重播、隐藏与 reduced-motion；截图 `/tmp/uv-slidev-finish-confetti.png` 和 `/tmp/uv-slidev-finish-still.png`。
- `components/LessonSlide.vue`、`PlaybackControls.vue`：公共排版和播放控件。
- `composables/motion.js`、`useInkCycle.js`：归一化教学响应与可见性时钟。
- `style.css`、`styles/`：样式和无导航演示模式；`styles/light.css` 统一亮色画布、卡片、控件、坐标标签与 SVG presentation attributes，液滴 scoped 样式单独适配。投影配色统一为 C 蓝青 `#00a6df`、M 洋红 `#e6007e`、Y 亮黄 `#ffd500`、S 蓝紫 `#4054dc`，跨页保持一致且 S 与 C 明显区分。液滴和沉积色块保持高饱和实填充；Y 文字用深金褐 `#8a5700`、C 标签用深蓝青，图表青/金强调线单独提饱和，普通正文仍为深色。不使用反色滤镜，不改变交互与排版。
- `tests/browser.mjs`：前 7 页教学浏览器回归 + 独立第 8 页验证，新增逐页 light color-scheme、浅色 body/画布/panel/卡片/控件、深色正文与 SVG 标签、原始标题字号检查，并输出 `/tmp/uv-slidev-page-1.png` 至 `page-7.png`；含新页单滴体积/半径关系、落下终态、后退重置、再推进进入 /2、减少动态效果，以及第二页 click 0 原始高度比、M/Y 等高、C 实际渲染顶面与 y=308 目标线对齐、目标线延迟 1.36s 与框/标签位置、逐层瞬现与无缩放动画、单句侧栏，以及 click 1 独立单块青色液体、无四色 data-ink/retention-label/target/mask、650 宽且无非等比缩放、圆润墨丘间的明显缺口、流动初态/中间态/终态的 128 网格高度、实际多边形面积恒为 46800 和初末体积相等、重进重播、离页 RAF 停止及 reduced-motion；click 2 最终 0.50 平齐的单个 `solid-block` 几何（x=0、y=308、w=106、h=72，无 story-layer）、轮廓框与终态立即可见、固定点阵 32/16/16/8（基准各 32，无额外喷射点组）、点阵确定性、补偿比例 100%/50%/50%/25%、两次回退恢复初态和再次推进进入 /3 检查。流动阶段截图另输出 `/tmp/uv-slidev-blocks-flow-{start,mid,settled}.png`，最终色块为 `/tmp/uv-slidev-blocks-final.png`。
- `vite.config.ts`：本机绑定、端口保护、旧版资源隔离。

## 旧版备用

原 `index.html`、`app.js`、`styles.css`、`server.mjs` 保留为三页零依赖原生版本：

```bash
PORT=3100 npm run legacy
```

Slidev 默认会读取根目录旧 HTML/CSS，因此 Vite 配置排除旧版资源。升级 Slidev/Vite 后应复测开发和静态构建。备用版本不包含新大纲。

## 局部流平模型

`composables/liquidFlow.js` 实现二阶非线性局部流平近似 `∂t h = ∂x(D(h) ∂x h)`，不是含四阶毛细曲率压力的完整薄膜润滑方程。界面扩散系数 `D = 800 × (0.12 + min(h_face / 72, 3)²)` 只依赖相邻两格平均高度；较厚区域更易流动，薄膜保持较低但非零的流动性。每步从高格向低格转移等量质量，左右端通量严格为零。初态的均值只用于配置总墨量，不参与演化驱动。

显式时间步由 `dt ≤ 0.45 dx² / D_max` 约束（另限至 1/1200 秒），使更新为非负凸组合；不裁剪负值、不全局归一化补偿误差。RAF 累积固定数值子步，每帧最多追赶 50ms，隐藏/离页取消、重入重置时钟；reduced-motion 运行同一求解器到 5 秒终态。128 点中心连线与两端半网格重建保存显示面积，密集斜线形成圆润轮廓而非阶梯，不使用可能穿过基底的样条。终态仍保留微小起伏。

这是未固化墨液在近似润湿基底上的教学示意：前驱膜使视觉上的接触合并不是严格干基底接触线问题；未模拟真实接触角、毛细脊、曲率驱动的四阶效应、惯性、固化或三维流动，时间和扩散系数不是材料参数。`tests/liquidFlow.mjs`（纳入 `npm run check`）检查单步扰动只影响相邻格、封闭边界体积守恒、非负/最大值原理、显示面积及自然趋平。

## 技术边界

- 不同配方在相同驱动下可能有不同的滴量、形态与固化层高；不能仅由颜色推断性能。黏度、表面张力、温度、背压、润湿、合滴与固化收缩也会影响结果。
- 抽点补偿可控制区域平均沉积量，但块体标定不能直接保证随机混色的局部平整；本演示不否定经过空间建模和实测验证的抽点策略。
- 波形有助于改善单滴与喷射一致性，不是固化表面平整的充分条件；需联合检查滴量、速度、卫星滴和喷射稳定性，再测固化形貌。
- 喷头剖面为简化压电按需喷墨通道，不对应型号。位移夸大，压力图不是流体仿真。
- “拉—保持—推—恢复”示例选择上升沿扩容的极性；实际方向依结构、安装约束和极性。四段等时和八秒循环仅方便观察，真实压力存在传播/反射延迟，阶段可能交叠。参数探索不提供实际电压或微秒时序，也不预测滴量单调关系。
- 测量需求当前显示分辨率（约 1 μm）、Z 量程（至少 100 μm）和视场（大约 1 cm 级）。AFM 并非默认满足该组合；共聚焦、白光干涉、色散共焦亦需按样品和设备验证。
- 没有加入 PDF/视频导出；静态 PDF 不能保留交互动画。
- 上次依赖审计仍报告 8 项问题（3 low、4 high、1 critical），涉及 Slidev 上游依赖链，尚未通过破坏性升级解决。已关闭编辑、导出、录制等非必要功能，但关闭功能不等于修复漏洞。只播放可信本地课件，不开放开发服务到公网，不加载不可信内容；升级后需重新审计。
