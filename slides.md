---
theme: default
title: UV 打印喷头课堂
titleTemplate: '%s'
info: 三页中文压电喷墨原理教学演示
lang: zh-CN
favicon: 'data:,'
mcp: false
colorSchema: dark
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
clicks: 3
---

<LessonSlide number="01" eyebrow="ANATOMY" title="一滴墨，从哪里开始？" subtitle="认识 UV 压电喷头的三个关键部件，让内部结构先连起来。" topic="结构认识">
  <AnatomyBoard />
</LessonSlide>

<!-- 按 → / 空格依次揭示供应管道、压电陶瓷、喷嘴；第四次前进进入下一页。 -->

---
layout: none
---

<LessonSlide number="02" eyebrow="DROP FORMATION" title="一次形变，一滴墨。" subtitle="从补墨到断滴：观察腔体容积、压力扰动与液滴的协同变化。" topic="喷墨循环">
  <InkCycle />
</LessonSlide>

---
layout: none
---

<LessonSlide number="03" eyebrow="DRIVE & RESPONSE" title="波形，是形变的节奏。" subtitle="电信号 → 压电形变 → 腔体容积变化 → 压力响应 → 液滴形成。" topic="驱动波形">
  <WaveformSync />
</LessonSlide>
