import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import { getMotion } from './motion.js'

// Module state preserves progress and playback between slides 2 and 3.
const phase = ref(0)
const playing = ref(true)
const reduced = ref(false)
const active = new Set()
let users = 0, raf = null, lastTime = 0, media
function tick(now) {
  raf = null
  if (!playing.value || !active.size || document.hidden) { lastTime = 0; return }
  if (lastTime) phase.value = (phase.value + Math.min(now - lastTime, 100) / 8000) % 1
  lastTime = now
  raf = requestAnimationFrame(tick)
}
function schedule() {
  if (raf !== null) cancelAnimationFrame(raf)
  raf = null
  lastTime = 0
  if (playing.value && active.size && !document.hidden) raf = requestAnimationFrame(tick)
}
function onReduced(event) {
  reduced.value = event.matches
  if (event.matches) playing.value = false
  schedule()
}
export function useInkCycle() {
  const { $nav, $page, $renderContext } = useSlideContext()
  const key = Symbol('ink-cycle')
  let stop, stopPlaying
  onMounted(() => {
    if (users++ === 0) {
      media = matchMedia('(prefers-reduced-motion: reduce)')
      onReduced(media)
      media.addEventListener('change', onReduced)
      document.addEventListener('visibilitychange', schedule)
    }
    stop = watch(() => $nav.value.currentSlideNo === $page.value && $renderContext.value === 'slide', value => {
      if (value) active.add(key)
      else active.delete(key)
      schedule()
    }, { immediate: true })
    stopPlaying = watch(playing, schedule)
  })
  onUnmounted(() => {
    stop?.(); stopPlaying?.(); active.delete(key); schedule()
    if (--users === 0) {
      media.removeEventListener('change', onReduced)
      document.removeEventListener('visibilitychange', schedule)
    }
  })
  const stage = computed(() => getMotion(phase.value).stage)
  function selectStage(index) {
    playing.value = false
    phase.value = (index + .5) / 4
    schedule()
  }
  return { phase, playing, reduced, stage, selectStage, toggle: () => { playing.value = !playing.value } }
}
