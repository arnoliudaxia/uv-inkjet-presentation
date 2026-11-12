<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import PrintheadDiagram from './PrintheadDiagram.vue'
const { $clicks, $nav } = useSlideContext()
const revealed = computed(() => Math.min(3, $clicks.value))
const parts = [
  { title: '墨水供应管道', brief: '把墨水送进墨腔，维持连续供墨。', detail: '墨水沿供应管道进入墨腔，再通向底部喷嘴。实际系统还需控制供墨压力、过滤与脱气；本图只保留单通道。' },
  { title: '压电陶瓷', brief: '经可变形腔壁，改变墨腔容积。', detail: '压电陶瓷位于墨腔外，通过可变形腔壁传递位移。形变改变墨腔容积并激发压力波，而不是直接接触墨水“挤出一滴”。' },
  { title: '喷嘴', brief: '液柱在惯性与表面张力作用下断滴。', detail: '墨腔与底部喷嘴直接连通。合适的瞬态压力使液面外凸、拉成液柱，并在惯性与表面张力作用下断滴。' },
]
function choose(part) { $nav.value.go(1, part) }
</script>

<template>
  <div class="anatomy-layout">
    <div class="visual-panel">
      <div class="panel-label"><i class="live-dot" />单通道剖面 · 结构示意 <span>非实际比例</span></div>
      <div class="diagram-host"><PrintheadDiagram interactive :revealed="revealed" @select="choose" /></div>
      <div class="diagram-foot"><span><i class="swatch cyan" />墨水通路</span><span><i class="swatch gold" />压电执行器</span><span>点击部件可定位揭示</span></div>
    </div>
    <aside class="anatomy-notes">
      <div class="section-kicker">三个关键部件 <span>{{ revealed }} / 3</span></div>
      <button v-for="(part, i) in parts" :key="part.title" class="component-card" :class="{ revealed: revealed > i, selected: revealed === i + 1, 'ceramic-card': i === 1 }" :aria-pressed="revealed === i + 1" @click="choose(i + 1)" @keydown.space.stop @keydown.enter.stop>
        <span class="card-number">0{{ i + 1 }}</span><span><strong>{{ part.title }}</strong><small>{{ part.brief }}</small></span><i class="card-dot" />
      </button>
      <div class="detail-box" aria-live="polite">
        <span class="tiny-label">{{ revealed ? `0${revealed} / ${parts[revealed - 1].title}` : '观察提示' }}</span>
        <p>{{ revealed ? parts[revealed - 1].detail : '先看完整墨路：供应管道 → 墨腔 → 喷嘴。按 → 或空格，依次认识三个部件；按 ← 可逐步收起。' }}</p>
      </div>
      <p class="note">→ / 空格：逐步揭示，三步后进入喷墨循环</p>
    </aside>
  </div>
</template>
