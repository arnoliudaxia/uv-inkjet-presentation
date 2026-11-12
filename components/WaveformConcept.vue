<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import '../styles/advanced.css'

const { $clicks } = useSlideContext()
const step = computed(() => Math.max(0, Math.min(3, $clicks.value)))
const notes = [
  { title: '先读坐标：V(t)', text: '纵轴是电极间驱动电压，横轴是时间。' },
  { title: '再读信号：分段变化', text: '从基线升至正电平并保持，再降至负电平并保持，最后回到基线。' },
  { title: '理解时序：拉—保持—推—恢复', text: '“拉 / 推”是工业界俗语。常常将变化曲线分为几个阶段' },
  { title: '信号接到压电电极', text: '驱动器在两电极间施加 V(t)，电场使压电体形变，再经腔壁影响压力；液滴响应不等于电压曲线。' },
]
</script>

<template>
  <div class="adv-root adv-concept">
    <div class="adv-panel adv-main-visual">
      <div class="adv-panel-head"><span>V(t) · 时间电压函数</span></div>
      <svg viewBox="0 0 870 485" role="img" :aria-label="`电压时间坐标。${step >= 1 ? '波形由基线上升保持，下降到负电平保持，再恢复基线。' : ''}${step >= 3 ? '驱动器通过两根导线连接压电体两侧电极。' : ''}`">
        <g class="adv-grid"><path d="M65 95H800 M65 175H800 M65 255H800 M165 70V290 M210 70V290 M365 70V290 M425 70V290 M600 70V290 M650 70V290" /></g>
        <path class="adv-axis" d="M65 58V295 M65 175H815 M60 68L65 58L70 68 M805 170L815 175L805 180" />
        <g class="adv-svg-muted"><text x="24" y="40">电压 V</text><text x="747" y="312">时间 t</text><text x="39" y="180">0</text><text x="31" y="100">+</text><text x="31" y="260">−</text></g>
        <g class="adv-reveal" :class="{ 'is-hidden': step < 1 }" :aria-hidden="step < 1">
          <path d="M65 175H165L210 95H365L425 255H600L650 175H795" class="adv-wave" />
          <text x="85" y="205" class="adv-svg-muted">基线</text>
        </g>
        <g class="adv-reveal adv-svg-text" :class="{ 'is-hidden': step < 2 }" :aria-hidden="step < 2">
          <text x="178" y="66">拉</text><text x="266" y="66">保持</text><text x="388" y="66">推</text><text x="485" y="285">保持</text><text x="634" y="148">恢复</text>
          <path d="M395 77V120 M645 154V170" class="adv-leader" />
          <text x="85" y="342" class="adv-svg-muted">名称描述本例功能；正 / 负电平不直接等于腔体扩张 / 收缩。</text>
        </g>
        <g class="adv-reveal" :class="{ 'is-hidden': step < 3 }" :aria-hidden="step < 3">
          <rect x="80" y="385" width="140" height="65" rx="9" class="adv-device" />
          <text x="150" y="424" text-anchor="middle" class="adv-svg-text">驱动器 V(t)</text>
          <path d="M220 400H420V390H545 M220 436H450V450H545" class="adv-wire" />
          <rect x="545" y="395" width="150" height="50" rx="3" fill="#53462d" stroke="#b39962" />
          <path d="M545 390H695 M545 450H695" stroke="#efc575" stroke-width="6" />
          <text x="620" y="426" text-anchor="middle" class="adv-svg-text">压电体</text>
          <text x="715" y="395" class="adv-svg-muted">电极 A</text><text x="715" y="455" class="adv-svg-muted">电极 B</text>
        </g>
      </svg>

    </div>
    <aside class="adv-sidebar">
      <div class="adv-kicker">波形含义解析 <span>{{ step }} / 3</span></div>
      <div class="adv-explanation" aria-live="polite"><h2>{{ notes[step].title }}</h2><p>{{ notes[step].text }}</p></div>
      <ol class="adv-step-list"><li :class="{ 'is-active': step >= 1 }">波形形状</li><li :class="{ 'is-active': step >= 2 }">功能时序</li><li :class="{ 'is-active': step >= 3 }">电极连接</li></ol>
    </aside>
  </div>
</template>
