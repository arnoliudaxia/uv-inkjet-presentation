<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import '../styles/story.css'

const props = defineProps({ mode: { type: String, default: 'calibration', validator: value => ['calibration', 'random'].includes(value) } })
const { $clicks } = useSlideContext()
const step = computed(() => Math.max(0, Math.min(props.mode === 'calibration' ? 3 : 2, $clicks.value)))
const colors = ['#00a6df', '#e6007e', '#ffd500', '#4054dc']
const names = ['C', 'M', 'Y', 'S']
const heights = [90, 100, 112.5, 120]
const keep = [60, 54, 48, 45]
// A fixed permutation spreads omissions without runtime randomness.
const calibrationDots = Array.from({ length: 60 }, (_, n) => ({ x: n % 10, y: Math.floor(n / 10), rank: (n * 17) % 60 }))
const continuous = Array.from({ length: 96 }, (_, n) => Math.floor((n % 16) / 4))
const mixed = [...continuous]
let seed = 20261112
for (let i = mixed.length - 1; i > 0; i--) {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
  const j = seed % (i + 1)
  ;[mixed[i], mixed[j]] = [mixed[j], mixed[i]]
}
function mapCells(layout) {
  const counts = [0, 0, 0, 0]
  return layout.map((color, n) => ({ color, x: n % 16, y: Math.floor(n / 16), removed: counts[color]++ % 4 === 0 }))
}
const layouts = [mapCells(continuous), mapCells(mixed)]
function columnHeight(cells, x) {
  // Column sums are a deposition proxy, not a wetting or cured-surface simulation.
  return cells.filter(c => c.x === x && !(step.value >= 2 && c.removed)).reduce((sum, c) => sum + [42, 50, 58, 66][c.color], 0) / 6
}
const calibrationCopy = [
  ['先打印同层数标定块', '分别打印 C / M / Y / S 大块，固定层数与名义点数，建立一致的比较条件。'],
  ['测量块体总高度', '以目标高度为基准，估计各通道的等效沉积差异；此处用归一化高度说明流程。'],
  ['换算名义保留比例', '在“高度与点数近似成比例”的示意模型下，计算抽点比例。先看原始 60 点阵列。'],
  ['按固定掩模抽点补偿', '保留 60 / 54 / 48 / 45 点，调整总沉积量。空心位置代表不喷，示意点阵不是生产掩模。'],
]
const randomCopy = [
  ['同配比，不同空间排列', '左侧为连续颜色区域，右侧为固定种子随机混色。两侧每种颜色均为 24 点。'],
  ['平均相同，局部仍起伏', '两侧颜色计数相同，示意总沉积量及全域均值相同；逐列沉积量仍不同，局部台阶不会由平均值描述。'],
  ['抽点还会改变空间采样', '两侧每色均抽去 6 点，总量仍相同。右侧出现分散缺口；其影响取决于点距、润湿、流平和固化。'],
]
</script>

<template>
  <div class="story-demo">
    <section class="story-visual">
      <div class="story-bar"><span>{{ props.mode === 'calibration' ? '块体标定 → 高度测量 → 点阵补偿' : '连续色块 vs 固定种子随机混色' }}</span><b>示意比例 · 非实测</b></div>
      <svg v-if="props.mode === 'calibration'" viewBox="0 0 860 480" role="img" :aria-label="`块体标定与固定抽点补偿，第 ${step} 步，共三步`">
        <text x="40" y="36" class="story-small">同为 10 层 / 每通道原始点阵 60 点（缩略示意）</text>
        <path class="story-target" d="M55 150H800" /><text x="799" y="133" text-anchor="end" class="story-gold">目标高度 1.00</text>
        <g v-for="(color, i) in colors" :key="color" :transform="`translate(${90 + i * 190}, 0)`">
          <rect x="0" :y="285 - heights[i] * 1.5" width="112" :height="heights[i] * 1.5" :fill="color" fill-opacity="1" />
          <path v-for="n in 9" :key="n" :d="`M0 ${285 - n * heights[i] * .15}H112`" stroke="#ffffff" stroke-width="2" />
          <text x="56" y="311" text-anchor="middle">{{ names[i] }}</text>
          <text v-if="step >= 1" x="56" :y="270 - heights[i] * 1.5" text-anchor="middle" class="story-number">{{ (heights[i] / 90).toFixed(2) }}</text>
          <g v-if="step >= 2">
            <circle v-for="(dot, n) in calibrationDots" :key="n" :cx="2 + dot.x * 12" :cy="344 + dot.y * 12" r="3.7" :fill="step >= 3 && dot.rank >= keep[i] ? 'none' : color" :stroke="color" :stroke-opacity="step >= 3 && dot.rank >= keep[i] ? .25 : 1" class="story-dot" />
            <text x="56" y="444" text-anchor="middle" class="story-small">{{ step >= 3 ? `保留 ${keep[i]} / 60` : `计划保留 ${Math.round(keep[i] / 60 * 100)}%` }}</text>
          </g>
        </g>
        <path class="story-base" d="M55 286H800" />
      </svg>
      <svg v-else viewBox="0 0 860 480" role="img" :aria-label="`连续色块与固定随机混色的俯视点阵和逐列截面对比，第 ${step} 步。平均一致不代表局部平整。`">
        <g v-for="(cells, side) in layouts" :key="side" :transform="`translate(${40 + side * 422}, 0)`">
          <text x="175" y="32" text-anchor="middle">{{ side === 0 ? '连续颜色区域' : '固定随机混色' }}</text>
          <text x="0" y="64" class="story-small">俯视 / {{ step >= 2 ? '每色保留 18 点' : '每色 24 点' }}</text>
          <rect x="0" y="78" width="352" height="132" fill="#f1f5f9" stroke="#b5c6d3" />
          <rect v-for="(cell, n) in cells" :key="n" :x="cell.x * 22 + 2" :y="80 + cell.y * 22" width="18" height="18" :fill="step >= 2 && cell.removed ? 'none' : colors[cell.color]" :stroke="colors[cell.color]" :stroke-opacity="step >= 2 && cell.removed ? .25 : 0" class="story-dot" />
          <g v-if="step >= 1">
            <text x="0" y="255" class="story-small">逐列沉积量截面代理 / 非真实表面</text>
            <rect v-for="x in 16" :key="x" :x="(x - 1) * 22" :y="402 - columnHeight(cells, x - 1) * 1.65" width="22" :height="columnHeight(cells, x - 1) * 1.65" :fill="side === 0 ? colors[Math.floor((x - 1) / 4)] : '#00a6df'" fill-opacity="1" stroke="#ffffff" />
            <path class="story-target" :d="`M0 ${402 - (step >= 2 ? 40.5 : 54) * 1.65}H352`" />
            <path class="story-base" d="M0 403H352" />
            <text x="176" y="439" text-anchor="middle" class="story-gold">全域均值 {{ step >= 2 ? '0.75' : '1.00' }}（两侧相同）</text>
          </g>
          <text v-else x="175" y="321" text-anchor="middle" class="story-small">下一步：比较平均与局部</text>
        </g>
      </svg>
      <div class="story-foot">{{ props.mode === 'calibration' ? '点数比例只说明总量补偿思路；不计润湿、相邻滴合并与固化非线性，不能由此推断局部平整。' : '金色虚线为全域平均；柱高按每列材料贡献求和。缺口指未采样落点，不等同于固化后的实体孔洞。' }}</div>
    </section>
    <aside class="story-notes" aria-live="polite">
      <div class="story-step">{{ props.mode === 'calibration' ? '标定流程' : '空间分布' }} / {{ step }} · {{ props.mode === 'calibration' ? 3 : 2 }}</div>
      <div class="story-card active"><h3>{{ (props.mode === 'calibration' ? calibrationCopy : randomCopy)[step][0] }}</h3><p>{{ (props.mode === 'calibration' ? calibrationCopy : randomCopy)[step][1] }}</p></div>
      <div class="story-card"><h3>{{ props.mode === 'calibration' ? '标定得到什么？' : '总量 ≠ 局部分布' }}</h3><p>{{ props.mode === 'calibration' ? '块体平均响应与名义补偿比例。它是校正起点，不是混色区域的局部表面保证。' : '相同配比、相同总量，可以对应不同的邻域组成和空间采样。评价平整度还需要局部尺度。' }}</p></div>
      <div class="story-caution"><b>不是“所有抽点都不可用”</b><p>合理掩模、足够采样密度及工艺控制可使抽点有效。这里仅说明：块体标定无法直接保证局部平整。</p></div>
      <div class="story-progress">→ / 空格推进 · ← 回退 · 数据与掩模固定</div>
    </aside>
  </div>
</template>
