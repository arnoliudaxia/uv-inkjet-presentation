<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import AnatomyAssembly from './AnatomyAssembly.vue'
const { $clicks, $nav, $page } = useSlideContext()
const revealed = computed(() => Math.min(3, $clicks.value))
const parts = [
  { title: '墨水供应管道', brief: '把墨水送进墨腔，维持连续供墨。' },
  { title: '压电陶瓷', brief: '经可变形腔壁，改变墨腔容积。' },
  { title: '喷嘴', brief: '液柱在惯性与表面张力作用下断滴。' },
]
function choose(part) { $nav.value.go($page.value, part) }
</script>

<template>
  <div class="anatomy-layout">
    <div class="visual-panel">
      <div class="panel-label"><i class="live-dot" />单通道剖面 · 结构示意</div>
      <div class="diagram-host"><AnatomyAssembly :revealed="revealed" /></div>
    </div>
    <aside class="anatomy-notes">
      <div class="section-kicker">三个关键部件 <span>{{ revealed }} / 3</span></div>
      <button v-for="(part, i) in parts" :key="part.title" class="component-card" :class="{ revealed: revealed > i, selected: revealed === i + 1, 'ceramic-card': i === 1 }" :aria-pressed="revealed === i + 1" @click="choose(i + 1)" @keydown.space.stop @keydown.enter.stop>
        <span class="card-number">0{{ i + 1 }}</span><span><strong>{{ part.title }}</strong><small>{{ part.brief }}</small></span><i class="card-dot" />
      </button>
    </aside>
  </div>
</template>

<style scoped>
.component-card:not(.revealed) { visibility: hidden; pointer-events: none; }
.visual-panel::before { display: none; }
</style>
