<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'

const { $nav, $page, $renderContext } = useSlideContext()
const canvas = ref(null)
const running = ref(false)
const particleCount = ref(0)
const rounds = ref(0)
const visible = ref(true)
const reduced = ref(false)
const colors = ['#00bde8', '#ed008c', '#ffd500', '#2455ff', '#8a2bff']
const width = 1440, height = 810
let ctx, raf = null, media, stopWatch, particles = []

function clear() {
  if (raf !== null) cancelAnimationFrame(raf)
  raf = null
  running.value = false
  particles = []
  particleCount.value = 0
  ctx?.clearRect(0, 0, width, height)
}
function resize() {
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
  canvas.value.width = Math.round(width * dpr)
  canvas.value.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
function burst() {
  rounds.value++
  for (const side of [-1, 1]) {
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: side < 0 ? 35 : width - 35, y: height + 12,
        vx: -side * (160 + Math.random() * 440), vy: -720 - Math.random() * 350,
        angle: Math.random() * Math.PI * 2, spin: (Math.random() - .5) * 12,
        size: 7 + Math.random() * 7, color: colors[i % colors.length], phase: Math.random() * 6.28,
      })
    }
  }
}
function play(active) {
  clear()
  rounds.value = 0
  if (!active) return
  resize()
  running.value = true
  const start = performance.now()
  let last = start
  burst()
  function tick(now) {
    raf = null
    const elapsed = now - start
    if (elapsed >= 5000) { clear(); return }
    const dt = Math.min(.033, Math.max(0, (now - last) / 1000))
    last = now
    if (rounds.value < 3 && elapsed >= rounds.value * 650) burst()
    ctx.clearRect(0, 0, width, height)
    particles = particles.filter(p => p.y < height + 40 || p.vy < 0)
    for (const p of particles) {
      p.vx *= Math.exp(-.32 * dt)
      p.vy += 510 * dt
      p.x += (p.vx + Math.sin(elapsed / 230 + p.phase) * 22) * dt
      p.y += p.vy * dt
      p.angle += p.spin * dt
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.scale(1, .3 + .7 * Math.abs(Math.cos(elapsed / 170 + p.phase)))
      ctx.globalAlpha = Math.min(1, (5000 - elapsed) / 450)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }
    particleCount.value = particles.length
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}
function updateVisibility() { visible.value = !document.hidden }
function updateReduced() { reduced.value = media.matches }
onMounted(() => {
  ctx = canvas.value.getContext('2d')
  if (!ctx) return
  media = matchMedia('(prefers-reduced-motion: reduce)')
  updateVisibility()
  updateReduced()
  media.addEventListener('change', updateReduced)
  document.addEventListener('visibilitychange', updateVisibility)
  window.addEventListener('resize', resize)
  stopWatch = watch(() => $page.value === 8 && $nav.value.currentSlideNo === $page.value
    && $renderContext.value === 'slide' && visible.value && !reduced.value,
  play, { immediate: true, flush: 'sync' })
})
onUnmounted(() => {
  stopWatch?.()
  clear()
  media?.removeEventListener('change', updateReduced)
  document.removeEventListener('visibilitychange', updateVisibility)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div class="finish-slide" :data-running="running" :data-particles="particleCount" :data-rounds="rounds">
    <canvas ref="canvas" aria-hidden="true" />
    <div class="finish-title">finish</div>
  </div>
</template>

<style scoped>
.finish-slide {
  position: relative;
  isolation: isolate;
  width: 1440px;
  height: 810px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #24364b;
}
.finish-slide canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
.finish-title { position: relative; z-index: 1; font-size: 96px; font-weight: 600; line-height: 1; }
</style>
