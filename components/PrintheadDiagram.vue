<script setup>
import { computed, useId } from 'vue'
import { getMotion } from '../composables/motion.js'
const props = defineProps({ phase: { type: Number, default: 0 }, animated: Boolean, interactive: Boolean, revealed: { type: Number, default: 3 } })
const emit = defineEmits(['select'])
const id = `head-${useId().replace(/:/g, '')}`
const motion = computed(() => props.animated ? getMotion(props.phase) : { stage: -1, local: 0, displacement: 0 })
const stage = computed(() => motion.value.stage)
const local = computed(() => motion.value.local)
const displacement = computed(() => motion.value.displacement)
const inkPath = computed(() => `M75 105H265V205Q412 ${205 + displacement.value * 2} 560 205V330H425L411 380V408H389V380L375 330H230V130H75Z`)
const ceramicPath = computed(() => `M286 174Q415 ${174 + displacement.value * 1.8} 546 174L546 197Q415 ${197 + displacement.value * 1.8} 286 197Z`)
function choose(part) { if (props.interactive) emit('select', part) }
</script>

<template>
<svg viewBox="0 0 800 470" :role="interactive ? 'group' : 'img'" aria-label="UV 压电喷头单通道剖面：左上供墨管道连入中央墨腔，墨腔连到底部喷嘴，金色压电陶瓷位于可变形腔壁外侧">
    <defs>
      <linearGradient :id="`${id}-inkGradient`" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1f9db3"/><stop offset=".55" stop-color="#237f99"/><stop offset="1" stop-color="#51dce7"/></linearGradient>
      <linearGradient :id="`${id}-goldGradient`" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f6d896"/><stop offset="1" stop-color="#ae7e36"/></linearGradient>
      <marker :id="`${id}-arrow`" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" fill="none" stroke="#b2faff" stroke-width="1.5"/></marker>
    </defs>
    <path class="head-outline" d="M210 166H583Q598 166 598 181V336Q598 351 583 351H437L425 387V411H375V387L363 351H210Z"/>
    <path d="M75 94H276V192" fill="none" stroke="#547184" stroke-width="2"/>
    <path d="M75 141H219V205" fill="none" stroke="#547184" stroke-width="2"/>
    <!-- 单一封闭墨水路径：供墨管 → 墨腔 → 喷嘴，无遮断或孤立墨腔。 -->
    <path class="ink-path" :fill="`url(#${id}-inkGradient)`" :d="inkPath"/>
    <path class="flow-line" d="M92 118H247V255H350" :marker-end="`url(#${id}-arrow)`"/>
    <path class="flow-line" d="M400 275V365" :marker-end="`url(#${id}-arrow)`"/>
    <g class="part-group svg-part supply-part" :class="{ muted: revealed < 1 }" :role="interactive ? 'button' : undefined" :tabindex="interactive ? 0 : undefined" aria-label="了解墨水供应管道" @click="choose(1)" @keydown.enter.prevent.stop="choose(1)" @keydown.space.prevent.stop="choose(1)">
      <path d="M75 105H265V200M75 130H230V200" fill="none" stroke="#6df0f4" stroke-width="3"/>
      <path class="leader" d="M156 105V88H100"/><circle cx="156" cy="105" r="3" fill="#74f3f7"/>
      <text class="svg-label" x="78" y="51">01 墨水供应管道</text><text class="svg-sub" x="78" y="72">连续供墨入口</text>
    </g>
    <g class="part-group svg-part piezo-part" :class="{ muted: revealed < 2 }" :role="interactive ? 'button' : undefined" :tabindex="interactive ? 0 : undefined" aria-label="了解压电陶瓷" @click="choose(2)" @keydown.enter.prevent.stop="choose(2)" @keydown.space.prevent.stop="choose(2)">
      <path class="ceramic" :d="ceramicPath" :fill="`url(#${id}-goldGradient)`" stroke="#ffe0a0" stroke-width="1.5"/>
      <path d="M303 177V193M325 177V193M347 177V193M369 177V193M391 177V193M413 177V193M435 177V193M457 177V193M479 177V193M501 177V193M523 177V193" stroke="#654f2c" stroke-width="1" opacity=".5"/>
      <path class="leader" d="M472 173V116H579"/><circle cx="472" cy="173" r="3" fill="#efc575"/>
      <text class="svg-label gold-label" x="488" y="77">02 压电陶瓷</text><text class="svg-sub" x="488" y="98">电信号 → 微小形变</text>
    </g>
    <path class="chamber-wall" :d="`M265 205Q412 ${205 + displacement * 2} 560 205`" fill="none" stroke="#dae3e8" stroke-width="6"/>
    <path class="leader" d="M552 205H619V231"/><text class="svg-sub" x="608" y="254">可变形腔壁</text>
    <path class="leader" d="M311 273H174V266H107"/><text class="svg-label" x="78" y="234">墨腔</text><text class="svg-sub" x="78" y="255">容纳墨水的空间</text>
    <g class="pressure-visual" :opacity="stage === 1 ? Math.sin(local * Math.PI) * .8 : 0" :transform="`translate(0 ${local * 35})`"><ellipse class="pressure-ring" cx="400" cy="275" rx="60" ry="20"/><ellipse class="pressure-ring" cx="400" cy="295" rx="95" ry="22" opacity=".5"/></g>
    <g class="part-group svg-part nozzle-part" :class="{ muted: revealed < 3 }" :role="interactive ? 'button' : undefined" :tabindex="interactive ? 0 : undefined" aria-label="了解喷嘴" @click="choose(3)" @keydown.enter.prevent.stop="choose(3)" @keydown.space.prevent.stop="choose(3)">
      <path d="M375 330L389 380V408M425 330L411 380V408" fill="none" stroke="#8cf5f7" stroke-width="3"/>
      <path class="leader" d="M417 390H493V412H544"/><circle cx="417" cy="390" r="3" fill="#74f3f7"/>
      <text class="svg-label" x="552" y="414">03 喷嘴</text><text class="svg-sub" x="552" y="437">液滴形成的出口</text>
    </g>
    <path class="meniscus" :d="`M389 408Q400 ${stage === 2 ? 416 : 410 + displacement * .2} 411 408`" fill="#55e5ed" stroke="#affcff" stroke-width="1.5"/>
    <path class="ligament" d="M393 408Q397 425 396 435Q400 441 404 435Q403 425 407 408Z" fill="#55e5ed" :opacity="stage === 2 && local < .42 ? 1 : 0"/>
    <g class="drop-motion" :opacity="stage === 2 && local >= .35 ? Math.min(1, (1 - local) * 4) : 0" :transform="`translate(0 ${413 + Math.max(0, local - .35) * 65})`"><path class="droplet" d="M400 0C397 7 391 12 391 18A9 9 0 0 0 409 18C409 12 403 7 400 0Z"/></g>
    <text class="svg-sub" x="78" y="440">墨水通路：供应管道 → 墨腔 → 喷嘴</text>
  </svg>
</template>
