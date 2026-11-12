<script setup>
import PrintheadDiagram from './PrintheadDiagram.vue'
import PlaybackControls from './PlaybackControls.vue'
import { useInkCycle } from '../composables/useInkCycle.js'
import { stages } from '../composables/motion.js'
const { phase, playing, reduced, stage, selectStage, toggle } = useInkCycle()
</script>

<template>
  <div class="cycle-layout">
    <div class="visual-panel" :class="{ moving: playing && !reduced }">
      <div class="panel-label"><i class="live-dot" />动态剖面 <span>形变已夸张</span></div>
      <div class="diagram-host"><PrintheadDiagram animated :phase="phase" /></div>
      <div class="diagram-foot">连续供墨通路 · 示意单次按需喷射</div>
    </div>
    <aside class="cycle-notes">
      <div class="section-kicker">一滴墨 / 四个时刻</div>
      <div class="stage-list" @keydown.space.stop @keydown.enter.stop>
        <button v-for="(item, i) in stages" :key="item.title" class="stage-button" :class="{ active: stage === i }" :aria-pressed="stage === i" @click="selectStage(i)">
          <span class="stage-index">0{{ i + 1 }}</span><span><strong>{{ item.title }}</strong><small>{{ item.description }}</small></span>
        </button>
      </div>
      <PlaybackControls :playing="playing" @toggle="toggle" />
      <p class="note">点击阶段会暂停并定位。压力传播、反射与液面运动为简化示意，实际过程可能交叠。</p>
    </aside>
  </div>
</template>
