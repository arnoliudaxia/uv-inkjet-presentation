<script setup>
import { computed } from 'vue'
import PrintheadDiagram from './PrintheadDiagram.vue'
import PlaybackControls from './PlaybackControls.vue'
import { useInkCycle } from '../composables/useInkCycle.js'
import { stages, wavePath, waveY } from '../composables/motion.js'
const { phase, playing, reduced, stage, selectStage, toggle } = useInkCycle()
const cursorX = computed(() => 70 + phase.value * 685)
</script>

<template>
  <div class="wave-layout">
    <div class="wave-column">
      <div class="visual-panel wave-panel">
        <svg viewBox="0 0 800 330" role="img" aria-label="概念波形与喷头动作共用一个循环时钟，金色游标为当前时刻">
          <g class="chart-grid"><path d="M70 65H755 M70 120H755 M70 175H755 M70 230H755 M70 65V255 M241.25 65V255 M412.5 65V255 M583.75 65V255 M755 65V255" /></g>
          <rect :x="70 + stage * 171.25" y="65" width="171.25" height="190" fill="#49dfeb" opacity=".045" />
          <path class="chart-axis" d="M70 50V255H768" />
          <text x="70" y="30" class="axis-text">电压 V(t)</text><text x="665" y="292" class="axis-text">时间(微秒) →</text><text x="40" y="180" class="axis-text">0</text>
          <path :d="`${wavePath}L755 255H70Z`" fill="#49dfeb" opacity=".07" />
          <path class="wave-line" :d="wavePath" />
          <g class="wave-labels"><text v-for="(item, i) in stages" :key="item.tag" :x="155.6 + i * 171.25" y="317">{{ item.tag }}示意</text></g>
          <g class="wave-cursor"><path :d="`M${cursorX} 55V259`" /><circle :cx="cursorX" :cy="waveY(cursorX)" r="6" /></g>
        </svg>
        <div class="wave-legend"><span><i class="swatch cyan" />波形信号</span></div>
      </div>
    </div>
    <aside class="response-panel" :class="{ moving: playing && !reduced }">
      <div class="section-kicker">同步机械响应</div>
      <div class="diagram-host"><PrintheadDiagram animated :phase="phase" /></div>
      <div class="response-stage"><span>0{{ stage + 1 }} / 04 · {{ stages[stage].tag }}</span><h2>{{ stages[stage].title }}</h2><p>{{ stages[stage].description }}</p></div>
      <div class="sync-stage-buttons"><button v-for="(item, i) in stages" :key="item.tag" :aria-pressed="stage === i" :class="{ active: stage === i }" @click="selectStage(i)" @keydown.space.stop @keydown.enter.stop>{{ ['拉', '保持', '推', '恢复'][i] }}</button></div>
      <PlaybackControls :playing="playing" next @toggle="toggle" @next="selectStage((stage + 1) % 4)" />
    </aside>
  </div>
</template>
