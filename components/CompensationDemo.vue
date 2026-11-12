<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import '../styles/story.css'
import IsoInkSurface from './IsoInkSurface.vue'
import { continuousInk, mixedInk, inkColors as colors } from '../composables/isoInkSurface.js'

const props = defineProps({ mode: { type: String, default: 'calibration', validator: value => ['calibration', 'random'].includes(value) } })
const { $clicks } = useSlideContext()
const step = computed(() => props.mode === 'random' ? 0 : Math.max(0, Math.min(3, $clicks.value)))
const names = ['C', 'M', 'Y', 'S']
const heights = [90, 100, 112.5, 120]
const keep = [60, 54, 48, 45]
const calibrationDots = Array.from({ length: 60 }, (_, n) => ({ x: n % 10, y: Math.floor(n / 10), rank: (n * 17) % 60 }))
const calibrationCopy = [
  ['先打印同层数标定块', '分别打印 C / M / Y / S 大块，固定层数与名义点数，建立一致的比较条件。'],
  ['测量块体总高度', '以目标高度为基准，估计各通道的等效沉积差异；此处用归一化高度说明流程。'],
  ['换算名义保留比例', '在“高度与点数近似成比例”的示意模型下，计算抽点比例。先看原始 60 点阵列。'],
  ['按固定掩模抽点补偿', '保留 60 / 54 / 48 / 45 点，调整总沉积量。空心位置代表不喷，示意点阵不是生产掩模。'],
]
</script>

<template>
  <div v-if="props.mode === 'random'" class="story-demo random-ink-demo">
    <section class="story-visual">
      <div class="story-bar"><span>和之前不一样, 这个是一层内的二维墨水分布</span></div>
      <div class="ink-comparison">
        <section v-for="(layout, side) in [continuousInk, mixedInk]" :key="side" class="ink-column" :data-side="side">
          <h3>{{ side === 0 ? '连续色块' : '随机混色' }}</h3>
          <svg class="ink-plan" viewBox="0 0 368 148" role="img" :aria-label="side === 0 ? '连续四色分组，16 列 6 行' : '确定性随机混色，16 列 6 行'">
            <rect v-for="(ink, n) in layout" :key="n" class="plan-cell" :data-cell="n" :x="8 + n % 16 * 22" :y="8 + Math.floor(n / 16) * 22" width="22" height="22" :fill="colors[ink]" stroke="#fff" stroke-width=".8" />
          </svg>
          <h4>{{ side === 0 ? '共面平整' : '局部起伏' }}</h4>
          <IsoInkSurface :layout="layout" :rough="side === 1" />
        </section>
      </div>
    </section>
    <aside class="story-notes">
      <div class="story-card active"><h3>块体一致 ≠ 局部平整</h3><p>连续色块的补偿可使块体平齐；随机混色仍可能出现局部起伏。</p><p>抽点方案假设局部周围有和自己一样的颜色，但是真实的打印数据没有这个假设</p></div>
    </aside>
  </div>
  <div v-else class="story-demo">
    <section class="story-visual">
      <div class="story-bar"><span>块体标定 → 高度测量 → 点阵补偿</span><b>示意比例 · 非实测</b></div>
      <svg viewBox="0 0 860 480" role="img" :aria-label="`块体标定与固定抽点补偿，第 ${step} 步，共三步`">
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
      <div class="story-foot">点数比例只说明总量补偿思路；不计润湿、相邻滴合并与固化非线性，不能由此推断局部平整。</div>
    </section>
    <aside class="story-notes" aria-live="polite">
      <div class="story-step">标定流程 / {{ step }} · 3</div>
      <div class="story-card active"><h3>{{ calibrationCopy[step][0] }}</h3><p>{{ calibrationCopy[step][1] }}</p></div>
      <div class="story-card"><h3>标定得到什么？</h3><p>块体平均响应与名义补偿比例。它是校正起点，不是混色区域的局部表面保证。</p></div>
      <div class="story-caution"><b>不是“所有抽点都不可用”</b><p>合理掩模、足够采样密度及工艺控制可使抽点有效。这里仅说明：块体标定无法直接保证局部平整。</p></div>
      <div class="story-progress">→ / 空格推进 · ← 回退 · 数据与掩模固定</div>
    </aside>
  </div>
</template>

<style scoped>
.random-ink-demo { grid-template-columns: minmax(0, 3.5fr) minmax(260px, 1fr); gap: 24px; }
.ink-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 0 18px 12px; min-height: 0; flex: 1; }
.ink-column { display: flex; flex-direction: column; min-height: 0; }
.ink-column h3 { text-align: center; font-size: 21px; margin: 4px 0 8px; color: #24364b; }
.ink-column h4 { text-align: center; font-size: 17px; font-weight: 500; margin: 16px 0 0; color: #52677b; }
.random-ink-demo .ink-plan { flex: 0 0 auto; width: 100%; height: auto; }
.random-ink-demo .iso-ink-surface { flex: 1; width: 100%; min-height: 0; }
.random-ink-demo .story-card p + p { margin-top: 16px; }
</style>
