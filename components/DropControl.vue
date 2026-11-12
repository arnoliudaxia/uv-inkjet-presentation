<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import '../styles/story.css'

const { $clicks } = useSlideContext()
const step = computed(() => Math.max(0, Math.min(2, $clicks.value)))
const omitted = new Set([2, 5, 9])
const sites = Array.from({ length: 12 }, (_, n) => ({ x: 40 + (n % 6) * 51, y: 111 + Math.floor(n / 6) * 42 }))
const smallRadius = 12 * Math.cbrt(.75)
const copy = [
  ['从相同落点和单滴开始', '两侧均为 12 个名义落点，每滴体积记作 1。先保持总量与采样一致。'],
  ['路径 A：减少大滴数量', '左侧固定抽去 3 点：单滴仍为 1，总量降为 9，但空间采样变稀。'],
  ['路径 B：保留落点，调单滴', '右侧保留 12 点，单滴示意体积降为 0.75，总量同为 9；要求各落点的单滴响应一致。'],
]
</script>

<template>
  <div class="story-demo">
    <section class="story-visual">
      <div class="story-bar"><span>两条调量路径 · 总量与空间采样分开看</span><b>归一化示意 · 非实测</b></div>
      <svg viewBox="0 0 860 480" role="img" :aria-label="`对比减少大滴数量与保留落点调整单滴体积，第 ${step} 步。相同总量不保证相同局部表面。`">
        <g v-for="side in [0, 1]" :key="side" :transform="`translate(${38 + side * 425}, 0)`">
          <text x="175" y="32" text-anchor="middle">{{ side === 0 ? 'A / 减少大滴数量' : 'B / 保留落点，调单滴大小' }}</text>
          <text x="0" y="68" class="story-small">名义落点俯视 / 圆表示单滴体积</text>
          <rect x="0" y="83" width="350" height="100" rx="7" fill="#080f1c" stroke="#2b4153" />
          <g v-for="(site, n) in sites" :key="n">
            <path :d="`M${site.x - 5} ${site.y}h10 M${site.x} ${site.y - 5}v10`" stroke="#486174" />
            <circle :cx="site.x" :cy="site.y" :r="side === 1 && step >= 2 ? smallRadius : 12" :fill="side === 0 ? '#efc575' : '#49dfeb'" :fill-opacity="side === 0 && step >= 1 && omitted.has(n) ? 0 : 1" :stroke="side === 0 ? '#efc575' : '#49dfeb'" :stroke-opacity="side === 0 && step >= 1 && omitted.has(n) ? .2 : 1" class="story-dot" />
          </g>
          <text x="175" y="218" text-anchor="middle" class="story-number">{{ side === 0 && step >= 1 ? '9 × 1 = 9' : side === 1 && step >= 2 ? '12 × 0.75 = 9' : '12 × 1 = 12' }}</text>
          <text x="175" y="245" text-anchor="middle" class="story-small">落点数 × 单滴体积 = 总沉积量</text>
          <text x="0" y="286" class="story-small">截面概念 / 仅画离散滴，不预测流平</text>
          <path class="story-base" d="M10 337H339" />
          <g v-for="n in 6" :key="n">
            <path v-if="!(side === 0 && step >= 1 && omitted.has(n - 1))" :d="`M${40 + (n - 1) * 51 - (side === 1 && step >= 2 ? 14 : 17)} 335 Q${40 + (n - 1) * 51} ${side === 1 && step >= 2 ? 297 : 287} ${40 + (n - 1) * 51 + (side === 1 && step >= 2 ? 14 : 17)} 335Z`" :fill="side === 0 ? '#efc575' : '#49dfeb'" fill-opacity="1" />
            <circle v-else :cx="40 + (n - 1) * 51" cy="335" r="3" fill="none" stroke="#efc575" />
          </g>
          <text x="0" y="372" class="story-small">{{ side === 0 ? '单滴不变 / 改变发滴位置' : '落点不变 / 需校准单滴响应' }}</text>
          <path class="story-guide" d="M10 425H339" />
          <path v-if="side === 0" class="story-signal" :d="step >= 1 ? 'M10 425H30V395H60V425H130V395H160V425H270V395H300V425H339' : 'M10 425H30V395H60V425H100V395H130V425H170V395H200V425H240V395H270V425H339'" />
          <path v-else class="story-signal" :d="step >= 2 ? 'M10 425H30V405H48V432H60V425H100V405H118V432H130V425H170V405H188V432H200V425H240V405H258V432H270V425H339' : 'M10 425H30V395H60V425H100V395H130V425H170V395H200V425H240V395H270V425H339'" />
          <text x="175" y="462" text-anchor="middle" class="story-small">{{ side === 0 ? '发滴使能示意（非实际驱动波形）' : '波形调整概念（非电压 / 时序参数）' }}</text>
        </g>
      </svg>
      <div class="story-foot">圆半径按体积立方根缩放，仅示意滴大小；截面不按实际比例。波形需经喷头、墨水和温度条件下的单滴实验校准，不表示幅值与体积单调对应。</div>
    </section>
    <aside class="story-notes" aria-live="polite">
      <div class="story-step">单滴控制 / {{ step }} · 2</div>
      <div class="story-card active"><h3>{{ copy[step][0] }}</h3><p>{{ copy[step][1] }}</p></div>
      <div class="story-card"><h3>同总量，不同空间采样</h3><p><strong>数量补偿</strong>改变有效落点；<strong>单滴调节</strong>保留落点，但必须关注滴体积、速度、方向及卫星滴的一致性。</p></div>
      <div class="story-caution"><b>波形不是“固化平整保证”</b><p>最终表面仍受润湿、铺展、相邻滴合并、固化时序与收缩影响。两条路径均需结合工艺验证。</p></div>
      <div class="story-progress">→ / 空格推进 · ← 回退 · 体积均为归一化值</div>
    </aside>
  </div>
</template>
