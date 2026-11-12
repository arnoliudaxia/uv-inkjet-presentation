<script setup>
import { computed } from 'vue'
import { makeInkSurface } from '../composables/isoInkSurface.js'
const props = defineProps({ layout: { type: Array, required: true }, rough: Boolean })
const mesh = computed(() => makeInkSurface(props.layout, props.rough))
</script>

<template>
  <svg class="iso-ink-surface" viewBox="0 0 410 280" role="img" :aria-label="rough ? '随机混色的连续起伏表面' : '连续色块的共面平整表面'">
    <polygon :points="mesh.base" fill="#d6e0e9" stroke="#9bacbb" stroke-width="2" />
    <g v-for="(side, i) in mesh.sides" :key="i">
      <polygon :points="side.points" :fill="side.color" />
      <polygon :points="side.points" fill="#142a40" :fill-opacity="side.shade" />
    </g>
    <polygon v-for="face in mesh.faces" :key="face.id" class="iso-cell" :data-cell="face.id" :data-heights="face.heights.join(',')" :points="face.points" :fill="face.color" stroke="#ffffff" stroke-opacity=".62" stroke-width=".65" stroke-linejoin="round" />
  </svg>
</template>
