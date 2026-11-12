<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import '../styles/story.css'

const props = defineProps({ mode: { type: String, default: 'blocks', validator: value => ['blocks', 'layer'].includes(value) } })
const { $clicks } = useSlideContext()
// Keep all three block stages on the same physical slide.
const step = computed(() => props.mode === 'blocks' ? 2 + Math.max(0, Math.min(2, $clicks.value)) : Math.max(0, Math.min(2, $clicks.value)))
const inks = [
  { name: 'C', color: '#00a6df', height: 18, ratio: '0.50' },
  { name: 'M', color: '#e6007e', height: 36, ratio: '1.00' },
  { name: 'Y', color: '#ffd500', height: 36, ratio: '1.00' },
  { name: 'S', color: '#4054dc', height: 72, ratio: '2.00' },
]
// Fixed 32-point baseline per ink; compensate to the lowest height (C 0.50).
const dots = Array.from({ length: 32 }, (_, n) => ({ x: n % 8, y: Math.floor(n / 8), rank: n * 13 % 32 }))
const keepCounts = [32, 16, 16, 8]
const blockCopy = [
  ['通过测量高度，计算补偿比例。', ''],
  ['液体流动补缺', '未固化墨水横向流动，逐渐填补空缺。'],
  ['等效平均高度一致', 'C 不变，M/Y 抽点后保留 50%，S 保留 25%。'],
]
const layerCopy = [
  ['单层已经出现台阶', '各颜色区域的等效层厚不同；同一遍打印，不等于同一高度。'],
  ['下一层仍落在已有表面上', '虚线标出下一层的名义目标；底层台阶不会因层号增加而自动消失。'],
  ['系统性层厚差会累积', '此例重复相同层厚偏差，第二层高差随之放大；实际演化还受流动与固化影响。'],
]
</script>

<template>
  <div class="story-demo">
    <section class="story-visual">
      <div class="story-bar"><span>{{ props.mode === 'blocks' ? (step === 3 ? '液体流动补缺' : '同层数 · 四色标定块') : '相邻颜色区域 · 局部截面' }}</span></div>
      <svg v-if="props.mode === 'blocks'" viewBox="0 0 860 540" role="img" :aria-label="step === 3 ? '液体流动补缺：单色液体以守恒面积填补空缺，教学示意' : `四色块沉积量补偿，第 ${step} 步；区域平均沉积量教学模型，非真实表面仿真`">
        <g v-if="step === 3" transform="translate(105, 0)">
          <FlowLeveling color="#00a6df" :retain=".5" :width="650" :base="342" />
        </g>
        <g v-else>
        <g v-if="step >= 1">
          <path class="story-target" :d="`M52 ${380 - inks[0].height * 4}H807`" :style="step === 2 ? { animation: 'story-appear 10ms linear 1.36s both' } : undefined" />
        </g>
        <g v-for="(ink, i) in inks" :key="ink.name" :data-ink="ink.name" :data-height="ink.height" :data-ratio="ink.ratio" :data-effective-height="step >= 3 ? '0.50' : ink.ratio" :transform="`translate(${95 + i * 188}, 0)`">
          <rect v-if="step >= 4" class="solid-block" x="0" y="308" width="106" height="72" :fill="ink.color" />
          <template v-else>
            <rect v-for="n in 10" :key="n" x="0" :y="380 - n * ink.height / 2.5" width="106" :height="ink.height / 2.5 - 2" :fill="ink.color" :opacity="0.92 + n * .008" class="story-layer" :style="{ '--delay': `${(n - 1) * .15}s` }" />
          </template>
          <rect v-if="step === 2 || step === 4" x="-1" :y="379 - (step >= 4 ? 18 : ink.height) * 4" width="108" :height="(step >= 4 ? 18 : ink.height) * 4" fill="none" :stroke="ink.color" stroke-width="2" stroke-dasharray="4 4" :style="step < 4 ? { animation: 'story-appear 10ms linear 1.35s both' } : undefined" />
          <text v-if="step >= 1" x="53" :y="364 - (step >= 4 ? 18 : ink.height) * 4" text-anchor="middle" class="story-number">{{ step >= 4 ? '0.50' : ink.ratio }}</text>
          <text x="53" y="414" text-anchor="middle">{{ ink.name === 'S' ? '支撑 S' : ink.name }}</text>
          <text x="53" y="437" text-anchor="middle" class="story-small">{{ step >= 3 ? '等效平均高度 0.50' : '同为 10 层' }}</text>
          <text v-if="step >= 2" x="53" y="462" text-anchor="middle" class="story-gold retention-label" style="font-size: 14px">补偿比例 {{ keepCounts[i] / 32 * 100 }}%</text>
          <g v-if="step >= 3" class="compensation-mask" data-baseline="32" :data-kept="keepCounts[i]" :aria-label="`${ink.name}：基准 32 点，补偿后 ${keepCounts[i]} 次沉积`">
            <g data-pass="1">
              <circle v-for="(dot, n) in dots" :key="n" :cx="11 + dot.x * 12" :cy="477 + dot.y * 12" r="3.5" :data-retained="dot.rank < keepCounts[i]" :fill="dot.rank < keepCounts[i] ? ink.color : 'none'" :stroke="ink.color" :stroke-opacity="dot.rank < keepCounts[i] ? 1 : .3" />
            </g>
          </g>
        </g>
        <path class="story-base" d="M52 382H807" />
        </g>
      </svg>
      <svg v-else viewBox="0 0 860 480" role="img" :aria-label="`单层截面台阶，当前揭示第 ${step} 步；每层厚度及累计误差仅为示意`">
        <text x="48" y="40" class="story-small">等效层厚放大示意 / 横向为颜色区域</text>
        <path class="story-base" d="M70 365H790" />
        <path class="story-target" d="M70 245H790" />
        <text x="785" y="232" text-anchor="end" class="story-gold">第 1 层目标</text>
        <g v-for="(ink, i) in inks" :key="ink.name">
          <rect :x="70 + i * 180" :y="365 - ink.height * 2" width="180" :height="ink.height * 2" :fill="ink.color" fill-opacity="1" stroke="#ffffff" stroke-width="2" />
          <text :x="160 + i * 180" y="331" text-anchor="middle">{{ ink.name }}</text>
          <text :x="160 + i * 180" y="402" text-anchor="middle" class="story-small">单层 {{ ink.ratio }}</text>
          <g class="story-reveal" :class="{ 'story-hidden': step < 1 }" :aria-hidden="step < 1">
            <rect :x="70 + i * 180" :y="365 - ink.height * 4" width="180" :height="ink.height * 2" :fill="ink.color" :fill-opacity="step >= 2 ? 1 : .06" :stroke="ink.color" stroke-dasharray="5 4" />
            <text v-if="step >= 2" :x="160 + i * 180" :y="350 - ink.height * 4" text-anchor="middle" class="story-number">{{ (Number(ink.ratio) * 2).toFixed(2) }}</text>
          </g>
        </g>
        <g v-if="step >= 1"><path class="story-target" d="M70 125H790" /><text x="785" y="91" text-anchor="end" class="story-gold">第 2 层目标 2.00</text></g>
        <text x="430" y="450" text-anchor="middle" class="story-small">{{ step === 0 ? '先观察：单层顶面并不共面' : step === 1 ? '虚框：下一层仍以各区域已有高度为起点' : '同向偏差重复叠加：层数一致 ≠ 总高度一致' }}</text>
      </svg>
      <div v-if="props.mode !== 'blocks'" class="story-foot">C / M / Y 为材料通道，S 为支撑材料。用户图的相对高度关系仅为示意，配色、尺寸与层厚均非实测。</div>
    </section>
    <aside class="story-notes" aria-live="polite">
      <div class="story-card active">
        <template v-if="props.mode === 'blocks'">
          <h3 v-if="blockCopy[step - 2][0]">{{ blockCopy[step - 2][0] }}</h3>
          <p v-if="blockCopy[step - 2][1]">{{ blockCopy[step - 2][1] }}</p>
        </template>
        <template v-else><h3>{{ layerCopy[step][0] }}</h3><p>{{ layerCopy[step][1] }}</p></template>
      </div>
    </aside>
  </div>
</template>
