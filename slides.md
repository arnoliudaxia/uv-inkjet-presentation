---
theme: default
title: 从层高差异到单滴控制
titleTemplate: '%s'
info: UV 多材料打印：层高补偿、喷头结构、驱动波形与三维形貌测量
lang: zh-CN
favicon: 'data:,'
mcp: false
colorSchema: light
aspectRatio: 16/9
canvasWidth: 1440
layout: none
fonts:
  sans: 'PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
  provider: none
  local: 'PingFang SC, Microsoft YaHei, Noto Sans CJK SC'
presenter: false
browserExporter: false
download: false
record: false
editor: false
contextMenu: false
selectable: true
drawings:
  enabled: false
transition: none
clicks: 1
---

<LessonSlide number="01" eyebrow="Different Drop Size" title="不同颜色墨水的液滴💧体积差异" subtitle="同样驱动下，配方会影响喷射" topic="液滴与层厚">
  <DropletLayer />
</LessonSlide>

---
layout: none
clicks: 2
---

<LessonSlide number="02" eyebrow="Large Layer Gap" :title="['同样的层数高度不同', '液体流动补缺', '补偿后等效平均高度一致'][Math.min($clicks, 2)]" subtitle="不同的液滴尺寸导致每一层的层高不一样" topic="层高差异">
  <LayerProblem mode="blocks" />
</LessonSlide>

<!-- 图中数值仅为示意。颜色不是唯一因素，还包括喷射、铺展与固化条件。 -->

---
layout: none
clicks: 0
---

<LessonSlide number="03" eyebrow="THE LIMIT" title="块体一致不等于局部平整" subtitle="抽点方案只适用于连续色块，不能直接保证随机混色情况下的表面形貌。" topic="随机混色">
  <CompensationDemo mode="random" />
</LessonSlide>

---
layout: none
clicks: 3
---

<LessonSlide number="04" eyebrow="ANATOMY" title="先看喷头结构" subtitle="整个喷头可以抽象为墨路、压电陶瓷、喷嘴三个部份" topic="喷头结构">
  <AnatomyBoard />
</LessonSlide>

---
layout: none
clicks: 3
---

<LessonSlide number="05" eyebrow="VOLTAGE OVER TIME" title="波形，就是电压随时间的变化。" subtitle="V(t) 施加在压电陶瓷电极之间：它描述驱动信号。" topic="认识波形">
  <WaveformConcept />
</LessonSlide>

---
layout: none
---

<LessonSlide number="06" eyebrow="DRIVE & RESPONSE" title="波形控制每一个液滴喷射模式" subtitle="电压变化 → 压电形变 → 腔体容积变化 → 压力响应 → 液柱与断滴。" topic="同步演示">
  <WaveformSync />
</LessonSlide>

---
layout: none
clicks: 0
---

<LessonSlide number="07" eyebrow="MEASURE & ITERATE" title="最后，用表面形貌验证。" subtitle="喷射一致性不是终点：测量固化后的平均层厚与局部起伏，才能闭合调参回路。" topic="测量闭环">
  <SurfaceMetrology />
</LessonSlide>

---
layout: none
clicks: 0
---

<FinishSlide />
