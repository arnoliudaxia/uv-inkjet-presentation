<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const { $clicks } = useSlideContext()
const landed = computed(() => $clicks.value >= 1)
// Perceptual teaching exaggeration: r ∝ V^0.65 instead of physical V^(1/3).
// The labeled volume and deposited layer thickness retain their original ratios.
const inks = [
  { name: 'C', volume: .5, color: '#00a6df' },
  { name: 'M', volume: 1, color: '#e6007e' },
  { name: 'Y', volume: 1, color: '#ffd500' },
  { name: 'S', volume: 2, color: '#4054dc' },
]
const positions = [32, 90, 148]
</script>

<template>
  <div class="droplet-layer" :class="{ 'is-landed': landed }" :data-state="landed ? 'landed' : 'suspended'">
    <section class="droplet-visual">
      <svg viewBox="0 0 860 540" role="img" :aria-label="landed ? '等数量液滴形成相邻层区，厚度比 0.5:1:1:2' : '四组悬空液滴，单滴体积比 0.5:1:1:2'">
        <text x="70" y="54" class="drop-caption">{{ landed ? '数据完全相同 → 不同厚度的一层' : ' ' }}</text>
        <g v-for="(ink, index) in inks" :key="ink.name" class="drop-channel" :data-ink="ink.name" :data-volume="ink.volume" :transform="`translate(${70 + index * 180}, 0)`" :style="{ '--ink': ink.color }">
          <path class="drop-guide" d="M32 202V425 M90 202V425 M148 202V425" />
          <g class="falling-drops">
            <circle v-for="x in positions" :key="x" class="volume-drop" :cx="x" cy="152" :r="18 * ink.volume ** .65" :data-volume="ink.volume" />
          </g>
          <rect class="deposited-layer" x="0" :y="450 - ink.volume * 64" width="180" :height="ink.volume * 64" :data-thickness="ink.volume * 64" />
          <text x="90" y="492" text-anchor="middle" class="drop-name">{{ ink.name === 'S' ? '支撑 S' : ink.name }}</text>
          <text x="90" y="522" text-anchor="middle" class="drop-ratio">{{ landed ? '相对层厚' : '相对单滴体积' }} {{ ink.volume.toFixed(2) }}</text>
        </g>
        <path class="drop-base" d="M52 451H808" />
      </svg>
    </section>
    <aside class="droplet-notes" aria-live="polite">
      <div class="droplet-explanation" data-explanation>
        <p>不同颜色的墨水由于成份不一样，导致喷出的每一个墨滴的体积并不一样。绝对差异大约 10 pL，相对差异可以达到 50%。</p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.droplet-layer { display: grid; grid-template-columns: 2.25fr 1fr; gap: 36px; flex: 1; min-height: 0; }
.droplet-visual { display: flex; align-items: center; border: 1px solid var(--line); border-radius: 12px; background: radial-gradient(ellipse at center, #edf6f8, transparent 75%), #ffffff; min-height: 0; }
.droplet-visual svg { display: block; width: 100%; max-height: 100%; }
.drop-caption { font-size: 18px; fill: #52677b; }
.drop-name { font-size: 24px; font-weight: 600; fill: var(--ink); }
.drop-channel[data-ink="C"] .drop-name { fill: #006b91; }
.drop-channel[data-ink="Y"] .drop-name { fill: #8a5700; }
.drop-ratio { font-size: 15px; fill: #52677b; }
.drop-guide { stroke: #536b8033; stroke-width: 1; stroke-dasharray: 3 9; fill: none; }
.drop-base { stroke: #6e879b; stroke-width: 2; fill: none; }
.volume-drop { fill: var(--ink); stroke: var(--ink); stroke-width: 1.5; }
.falling-drops { opacity: 1; transform: translateY(0); transition: transform 850ms cubic-bezier(.4, 0, .8, 1), opacity 220ms 0ms; }
.deposited-layer { fill: var(--ink); fill-opacity: 1; transform-box: fill-box; transform-origin: center bottom; transform: scaleY(0); opacity: 0; transition: transform 450ms, opacity 250ms; }
.is-landed .falling-drops { transform: translateY(298px); opacity: 0; transition: transform 850ms cubic-bezier(.4, 0, .8, 1), opacity 350ms 550ms; }
.is-landed .deposited-layer { transform: scaleY(1); opacity: 1; transition-delay: 550ms; }
.droplet-notes { display: flex; align-items: center; }
.droplet-explanation { width: 100%; border: 1px solid #a8c5cd; border-radius: 9px; background: #eaf5f7; padding: 20px 22px; }
.droplet-explanation p { font-size: 20px; font-weight: 400; line-height: 1.75; color: #24364b; margin: 0; }
@media (prefers-reduced-motion: reduce) {
  .droplet-layer .falling-drops, .droplet-layer .deposited-layer { transition: none; }
}
</style>
