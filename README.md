# 从层高差异到单滴控制 · Slidev

9 页中文 UV 多材料打印动画演示（1 页目录 + 7 页教学 + 1 页 finish）。使用 Slidev、Vue、SVG 和原生 Canvas；浅色背景、深色正文，高饱和青/洋红/黄/蓝紫强调，无常驻 Slidev 工具栏。

## 启动

需要 Node.js 22.12+（推荐 24）和 npm。

```bash
npm ci
npm start
```

打开 http://127.0.0.1:3000 。

## 操作与手机模式

- `→` / `Space` / `PageDown`：下一步，完成当前页步骤后翻页。
- `←` / `Shift+Space` / `PageUp`：后退。
- `↓` / `↑` 或 `Shift+→` / `Shift+←`：跳过步骤翻页。

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
