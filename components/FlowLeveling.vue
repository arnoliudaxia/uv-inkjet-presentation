<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import { createLiquid, advanceLiquid, surfacePoints, duration, target } from '../composables/liquidFlow.js'

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
let model = createLiquid(props.width, props.retain)
const initialHeights = computed(() => Array.from(createLiquid(props.width, props.retain).heights))
const initialArea = computed(() => initialHeights.value.reduce((sum, h) => sum + h * props.width / initialHeights.value.length, 0))
const heights = ref(Array.from(model.heights))
const area = computed(() => heights.value.reduce((sum, h) => sum + h * props.width / heights.value.length, 0))
const surface = computed(() => surfacePoints(heights.value, props.width, props.base).map(p => p.join(',')).join(' '))
function publish() {
  heights.value = Array.from(model.heights)
  progress.value = model.time >= duration - 1e-12 ? 1 : model.time / duration
}
function cancel() {
  if (raf !== null) cancelAnimationFrame(raf)
  raf = null
  running.value = false
}
function play(active) {
  cancel()
  if (!active) return
  model = createLiquid(props.width, props.retain)
  if (reduced.value) {
    advanceLiquid(model, duration)
    publish()
    return
  }
  publish()
  running.value = true
  let last = performance.now(), accumulator = 0, settledAt = null
  function tick(now) {
    raf = null
    // Hold the settled surface briefly, then replay while this stage is visible.
    if (settledAt !== null) {
      if (now - settledAt >= 1000) {
        model = createLiquid(props.width, props.retain)
        accumulator = 0
        settledAt = null
        publish()
      }
      last = now
      raf = requestAnimationFrame(tick)
      return
    }
    // Cap catch-up work after a stalled frame; never carry elapsed time across visits.
    accumulator += Math.min(.05, Math.max(0, (now - last) / 1000))
    last = now
    const steps = Math.floor(accumulator / model.dt)
    accumulator -= steps * model.dt
    advanceLiquid(model, model.time + steps * model.dt)
    publish()
    if (model.time >= duration - 1e-12) settledAt = now
    raf = requestAnimationFrame(tick)
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
  </g>
</template>

<style scoped>
.flow-liquid { stroke: none; }
</style>
