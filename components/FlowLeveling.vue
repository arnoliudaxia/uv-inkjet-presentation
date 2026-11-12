<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'

const props = defineProps({
  color: String,
  retain: Number,
  width: { type: Number, default: 106 },
  base: { type: Number, default: 380 },
})
const { $clicks, $nav, $page, $renderContext } = useSlideContext()
const progress = ref(0)
const running = ref(false)
const reduced = ref(false)
const visible = ref(true)
let raf = null, media, stop
const target = 72, count = 16
// Equal-width columns: retained columns start at original height; gaps start empty.
// Linear interpolation to the mean conserves sum(height) and polygon area at EVERY frame.
const initialHeights = computed(() => Array.from({ length: count }, (_, i) =>
  i % (1 / props.retain) === 0 ? target / props.retain : 0))
const initialArea = computed(() => initialHeights.value.reduce((sum, h) => sum + h * props.width / count, 0))
const heights = computed(() => initialHeights.value.map(initial =>
  initial * (1 - progress.value) + target * progress.value))
const area = computed(() => heights.value.reduce((sum, h) => sum + h * props.width / count, 0))
const surface = computed(() => {
  const points = [`0,${props.base}`]
  heights.value.forEach((h, i) => points.push(`${i * props.width / count},${props.base - h}`, `${(i + 1) * props.width / count},${props.base - h}`))
  points.push(`${props.width},${props.base}`)
  return points.join(' ')
})
function cancel() {
  if (raf !== null) cancelAnimationFrame(raf)
  raf = null
  running.value = false
}
function play(active) {
  cancel()
  if (!active) return
  progress.value = reduced.value ? 1 : 0
  if (reduced.value) return
  running.value = true
  const start = performance.now()
  function tick(now) {
    raf = null
    const t = Math.min(1, (now - start) / 2600)
    progress.value = t * t * (3 - 2 * t)
    if (t < 1) raf = requestAnimationFrame(tick)
    else running.value = false
  }
  raf = requestAnimationFrame(tick)
}
function updateReduced() { reduced.value = media.matches }
function updateVisibility() { visible.value = !document.hidden }
onMounted(() => {
  media = matchMedia('(prefers-reduced-motion: reduce)')
  updateReduced()
  updateVisibility()
  media.addEventListener('change', updateReduced)
  document.addEventListener('visibilitychange', updateVisibility)
  stop = watch(() => $clicks.value === 1 && $nav.value.currentSlideNo === $page.value && $renderContext.value === 'slide' && visible.value
    ? (reduced.value ? 'reduced' : 'animate') : false, play, { immediate: true })
})
onUnmounted(() => {
  stop?.()
  cancel()
  media?.removeEventListener('change', updateReduced)
  document.removeEventListener('visibilitychange', updateVisibility)
})
</script>

<template>
  <g class="flow-leveling" :data-progress="progress" :data-area="area" :data-initial-area="initialArea" :data-initial-heights="initialHeights.join(',')" :data-final-area="width * target" :data-heights="heights.join(',')" :data-retain="retain" :data-running="running">
    <polygon class="flow-liquid" :points="surface" :fill="color" />
    <g v-if="retain < 1 && progress < .95" class="flow-arrows" :opacity="1 - progress">
      <path v-for="x in [width * .2, width * .65]" :key="x" :d="`M${x} ${base - 32}h24m-7 -6 7 6-7 6`" />
    </g>
  </g>
</template>

<style scoped>
.flow-liquid { stroke: none; }
.flow-arrows { fill: none; stroke: #24364b; stroke-width: 2.3; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 1px 1px white); }
</style>
