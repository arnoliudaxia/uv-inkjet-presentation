<script setup>
import { computed, ref } from 'vue'
import '../styles/advanced.css'

const selected = ref('amplitude')
const values = ref({ amplitude: 65, edge: 35, hold: 50, interval: 50 })
const parameters = [
  { id: 'amplitude', title: '幅值', symbol: 'ΔV', description: '改变电场激励强度。腔体响应还受压电结构、负载和流体状态影响，不能仅凭幅值推断滴体积。', coupling: '体积与速度可能同时变化；过强激励也可能带来长液丝或卫星滴。' },
  { id: 'edge', title: '边沿时间', symbol: 'tₑ', description: '改变电压过渡的快慢，也改变压力扰动的频谱及其与腔体声学响应的匹配。', coupling: '较快边沿不保证更快液滴；压力振荡和断滴状态也可能改变。' },
  { id: 'hold', title: '保持时间', symbol: 'tₕ', description: '改变两次电压跃迁之间的等待时间，使后续激励遇到不同的压力波相位。', coupling: '滴体积、速度与卫星滴需共同观察，不能假定保持越长、滴就越大。' },
  { id: 'interval', title: '脉冲间隔', symbol: 'T', description: '这里指相邻脉冲起点间隔。它影响补墨、残余振荡与下一次激励的初始状态。', coupling: '间隔缩短可能引入脉冲间耦合；可用频率范围须由具体喷头与墨水验证。' },
]
const current = computed(() => parameters.find(p => p.id === selected.value))
const geometry = computed(() => {
  const a = 30 + values.value.amplitude * .65
  const e = 13 + values.value.edge * .4
  const h = 48 + values.value.hold * .8
  const start = 110
  const p1 = start + e, p2 = p1 + h, p3 = p2 + e, p4 = p3 + 65, end = p4 + e
  const next = end + 40 + values.value.interval * 1.25
  return { a, e, h, start, p1, p2, p3, p4, end, next,
    path: `M65 190H${start}L${p1} ${190-a}H${p2}L${p3} ${190+a}H${p4}L${end} 190H${next}L${next+e} ${190-a}H800` }
})
const highlight = computed(() => {
  const g = geometry.value
  if (selected.value === 'amplitude') return { x1: g.p1 + 12, y1: 190, x2: g.p1 + 12, y2: 190 - g.a, label: 'ΔV', x: g.p1 + 25, y: 190 - g.a / 2 }
  if (selected.value === 'edge') return { x1: g.start, y1: 315, x2: g.p1, y2: 315, label: 'tₑ', x: (g.start + g.p1) / 2, y: 343 }
  if (selected.value === 'hold') return { x1: g.p1, y1: 80, x2: g.p2, y2: 80, label: 'tₕ', x: (g.p1 + g.p2) / 2, y: 62 }
  return { x1: g.start, y1: 350, x2: g.next, y2: 350, label: 'T · 起点到起点', x: (g.start + g.next) / 2, y: 380 }
})
</script>

<template>
  <div class="adv-root adv-parameters">
    <div class="adv-parameter-visual">
      <div class="adv-tabs" role="group" aria-label="选择波形参数">
        <button v-for="item in parameters" :key="item.id" type="button" :aria-pressed="selected === item.id" :class="{ 'is-selected': selected === item.id }" @click="selected = item.id" @keydown.space.stop @keydown.enter.stop>{{ item.title }} <span>{{ item.symbol }}</span></button>
      </div>
      <div class="adv-panel adv-main-visual">
        <div class="adv-panel-head"><span>参数实验台 · 无量纲示意</span><span>金色标记 = 当前参数</span></div>
        <svg viewBox="0 0 850 415" role="img" :aria-label="`当前突出${current.title}。滑块仅改变电压时间示意图，不预测液滴。`">
          <g class="adv-grid"><path d="M65 100H800 M65 190H800 M65 280H800 M110 70V300 M300 70V300 M490 70V300 M680 70V300" /></g>
          <path class="adv-axis" d="M65 60V300 M65 190H810" /><text x="25" y="40" class="adv-svg-muted">电压 V</text><text x="751" y="327" class="adv-svg-muted">时间 t</text><text x="40" y="196" class="adv-svg-muted">0</text>
          <path :d="geometry.path" class="adv-wave" />
          <g class="adv-dimension">
            <path :d="`M${highlight.x1} ${highlight.y1}L${highlight.x2} ${highlight.y2}`" />
            <circle :cx="highlight.x1" :cy="highlight.y1" r="4" /><circle :cx="highlight.x2" :cy="highlight.y2" r="4" />
            <text :x="highlight.x" :y="highlight.y" :text-anchor="selected === 'amplitude' ? 'start' : 'middle'">{{ highlight.label }}</text>
          </g>
          <path v-if="selected === 'interval'" :d="`M${geometry.start} 198V356 M${geometry.next} 198V356`" class="adv-leader" stroke-dasharray="4 5" />
        </svg>
        <div class="adv-slider" @keydown.stop>
          <label :for="`wave-parameter-${selected}`">{{ current.title }} <span>小 / 短</span></label>
          <input :id="`wave-parameter-${selected}`" v-model.number="values[selected]" type="range" min="0" max="100" step="1" :aria-label="`${current.title}，无量纲示意控制`" :aria-valuetext="`示意档位 ${values[selected]}，非实际参数`" />
          <span>大 / 长</span>
          <button type="button" class="adv-reset" @click="values = { amplitude: 65, edge: 35, hold: 50, interval: 50 }">复位</button>
        </div>
      </div>
      <p class="adv-help">仅改变图形，不输出实际电压、时间或液滴预测；幅值以基线到正电平为标记，负电平同步缩放。</p>
    </div>
    <aside class="adv-sidebar">
      <div class="adv-kicker">参数不是独立旋钮 <span>耦合响应</span></div>
      <div class="adv-explanation" aria-live="polite"><span class="adv-small">{{ current.symbol }} / {{ current.title }}</span><h2>{{ current.title }}改变了什么？</h2><p>{{ current.description }}</p></div>
      <div class="adv-coupling"><span>滴体积</span><i>↔</i><span>滴速度</span><i>↔</i><span>卫星滴</span></div>
      <p class="adv-body" aria-live="polite">{{ current.coupling }}</p>
      <div class="adv-caution"><strong>不是单调关系，也不是定量预测</strong><p>需在特定喷头、墨水、温度与背压下，以滴观测验证；本页不提供虚构实测或“越大越好”的结论。</p></div>
    </aside>
  </div>
</template>
