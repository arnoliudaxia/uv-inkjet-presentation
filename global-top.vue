<script setup lang="ts">
import { useNav } from '@slidev/client'
import { onMounted, onUnmounted, ref } from 'vue'

const nav = useNav()
const mobile = ref(false)
const busy = ref(false)
let cleanup = () => {}
async function step(forward: boolean) {
  if (busy.value || !(forward ? nav.hasNext.value : nav.hasPrev.value)) return
  busy.value = true
  try { await (forward ? nav.next() : nav.prev()) }
  finally { busy.value = false }
}

onMounted(() => {
  // GlobalTop also exists in print/overview: only alter the normal player.
  const root = document.querySelector<HTMLElement>('#page-root')
  const container = root?.querySelector<HTMLElement>('#slide-container')
  if (!root || !container) return
  const coarse = matchMedia('(pointer: coarse)')
  const probe = document.createElement('div')
  probe.className = 'mobile-safe-probe'
  document.body.append(probe)
  const html = document.documentElement
  let frame = 0
  const update = () => {
    frame = 0
    const vv = window.visualViewport
    const width = vv?.width ?? innerWidth
    const height = vv?.height ?? innerHeight
    // Narrow desktop windows are not phones. Touch laptops wider than 600px
    // on their short side retain the desktop presentation too.
    mobile.value = (coarse.matches || navigator.maxTouchPoints > 0) && Math.min(width, height) <= 600
    html.classList.toggle('mobile-deck', mobile.value)
    html.classList.toggle('mobile-deck-portrait', mobile.value && height > width)
    if (!mobile.value) return
    const safe = getComputedStyle(probe)
    const t = parseFloat(safe.paddingTop), r = parseFloat(safe.paddingRight)
    const b = parseFloat(safe.paddingBottom), l = parseFloat(safe.paddingLeft)
    for (const [key, value] of Object.entries({ w: width - l - r, h: height - t - b, x: (vv?.offsetLeft ?? 0) + l, y: (vv?.offsetTop ?? 0) + t }))
      html.style.setProperty(`--mobile-${key}`, `${value}px`)
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  // Stop only bubbling into Slidev's physical-axis swipe listener. Target
  // controls still receive pointer events, including SVG dragging/capture.
  const stopSwipe = (event: PointerEvent) => {
    if (mobile.value && event.pointerType === 'touch') event.stopPropagation()
  }
  const stopBlankClick = (event: PointerEvent) => {
    if (mobile.value && event.target === container) event.stopImmediatePropagation()
  }
  container.addEventListener('pointerdown', stopSwipe)
  container.addEventListener('pointerdown', stopBlankClick, true)
  window.addEventListener('resize', schedule)
  window.addEventListener('orientationchange', schedule)
  window.visualViewport?.addEventListener('resize', schedule)
  window.visualViewport?.addEventListener('scroll', schedule)
  coarse.addEventListener('change', schedule)
  update()
  cleanup = () => {
    cancelAnimationFrame(frame)
    container.removeEventListener('pointerdown', stopSwipe)
    container.removeEventListener('pointerdown', stopBlankClick, true)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('orientationchange', schedule)
    window.visualViewport?.removeEventListener('resize', schedule)
    window.visualViewport?.removeEventListener('scroll', schedule)
    coarse.removeEventListener('change', schedule)
    probe.remove()
    html.classList.remove('mobile-deck', 'mobile-deck-portrait')
    for (const key of ['w', 'h', 'x', 'y']) html.style.removeProperty(`--mobile-${key}`)
  }
})
onUnmounted(() => cleanup())
</script>

<template>
  <Teleport to="body">
    <div v-if="mobile" class="mobile-deck-controls" aria-label="触屏逐步导航">
      <button class="mobile-prev" aria-label="上一步" :disabled="busy || !nav.hasPrev.value" @click.stop="step(false)">‹</button>
      <button class="mobile-next" aria-label="下一步" :disabled="busy || !nav.hasNext.value" @click.stop="step(true)">›</button>
    </div>
  </Teleport>
</template>

<style>
.mobile-safe-probe { position: fixed; visibility: hidden; pointer-events: none; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }
html.mobile-deck { overflow: hidden; --mobile-h: 100vh; --mobile-w: 100vw; }
@supports (height: 100dvh) { html.mobile-deck { --mobile-h: 100dvh; } }
.mobile-deck #page-root, .mobile-deck-controls {
  position: fixed !important; left: var(--mobile-x, 0px); top: var(--mobile-y, 0px);
  width: var(--mobile-w); height: var(--mobile-h); transform-origin: 0 0;
}
.mobile-deck-portrait #page-root, .mobile-deck-portrait .mobile-deck-controls {
  width: var(--mobile-h); height: var(--mobile-w);
  transform: translateX(var(--mobile-w)) rotate(90deg);
}
/* A separate 48px rail each side: never cover or crop the 1440×810 canvas.
   SlideContainer's useElementSize observes this untransformed content box. */
.mobile-deck #slide-container { width: calc(100% - 96px); margin-left: 48px; }
.mobile-deck-controls { z-index: 100; pointer-events: none; }
.mobile-deck-controls button {
  position: absolute; top: calc(50% - 22px); width: 44px; height: 44px;
  padding: 0; border: 1px solid #ccd7e2; border-radius: 50%;
  background: #fff; color: #52677b; font: 30px/1 system-ui;
  pointer-events: auto; touch-action: manipulation; cursor: pointer;
}
.mobile-prev { left: 2px; } .mobile-next { right: 2px; }
.mobile-deck-controls button:disabled { opacity: .3; cursor: default; }
.mobile-deck-controls button:focus-visible { outline: 2px solid #006b91; outline-offset: -3px; }
@media (prefers-reduced-motion: reduce) { .mobile-deck-controls, .mobile-deck-controls * { transition: none !important; animation: none !important; } }
</style>
