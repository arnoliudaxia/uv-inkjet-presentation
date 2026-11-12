<script setup>
defineProps({ revealed: { type: Number, default: 0 } })
</script>

<template>
  <svg class="anatomy-assembly" viewBox="0 0 800 470" role="img" :aria-label="revealed ? '单通道喷头三部件逐步组装' : '待组装：空白示意区'">
    <!-- Supply, ceramic, and nozzle assemble in three steps, each with its annotation.
         No schematic or placeholder exists before step 1. -->
    <g v-if="revealed >= 1" class="assembly-module supply-module" data-part="supply">
      <path class="housing" d="M75 94H276V185H583V351H425V330H375V351H210V141H75Z" />
      <path class="assembly-ink supply-ink" d="M75 105H265V205H560V330H230V130H75Z" />
      <path class="edge" d="M75 105H265V205M75 130H230V330H375M425 330H560V205" />
      <path class="leader" d="M156 105V88H100" />
      <text class="svg-label" x="78" y="51">01 墨水供应管道</text>
      <text class="svg-sub" x="78" y="72">连续供墨入口</text>
      <path class="leader" d="M311 273H174V266H107" />
      <text class="svg-label" x="78" y="234">墨腔</text>
      <text class="svg-sub" x="78" y="255">容纳墨水的空间</text>
    </g>
    <g v-if="revealed >= 2" class="assembly-module ceramic-module" data-part="ceramic">
      <!-- Ceramic bottom 197 contacts coupling layer 197–205; wall caps ink at 205. -->
      <path fill="#c08000" d="M286 197H546V205H286Z" />
      <path fill="#ffd500" stroke="#c08000" stroke-width="2" d="M286 174H546V197H286Z" />
      <path d="M303 177V194M325 177V194M347 177V194M369 177V194M391 177V194M413 177V194M435 177V194M457 177V194M479 177V194M501 177V194M523 177V194" stroke="#a46b00" />
      <path class="assembly-wall" d="M265 205H560" fill="none" stroke="#657f92" stroke-width="6" />
      <path class="leader" d="M472 173V116H579" />
      <text class="svg-label gold-label" x="488" y="77">02 压电陶瓷</text>
      <text class="svg-sub" x="488" y="98">电信号 → 微小形变</text>
      <path class="leader" d="M552 205H619V231" />
      <text class="svg-sub" x="608" y="254">可变形腔壁</text>
    </g>
    <g v-if="revealed >= 3" class="assembly-module nozzle-module" data-part="nozzle">
      <!-- One-unit overlap with chamber ink prevents raster seams, no cross-outlet stroke. -->
      <path class="housing" d="M363 331H437L425 387V411H375V387Z" />
      <path class="assembly-ink nozzle-ink" d="M375 329H425L411 380V408Q400 412 389 408V380Z" />
      <path class="edge" d="M375 330L389 380V408M425 330L411 380V408" />
      <path class="leader" d="M417 390H493V412H544" />
      <text class="svg-label" x="552" y="414">03 喷嘴</text>
      <text class="svg-sub" x="552" y="437">液滴形成的出口</text>
    </g>
  </svg>
</template>

<style scoped>
.housing { fill: #e1e9ef; stroke: #657f92; stroke-width: 2; }
.assembly-ink { fill: #00a6df; }
.edge { fill: none; stroke: #007caf; stroke-width: 2; }
.assembly-module { transform: translate(0, 0); animation: assemble .65s cubic-bezier(.22,.7,.25,1) both; }
.supply-module { --entry-x: -220px; --entry-y: 0px; }
.ceramic-module { --entry-x: 0px; --entry-y: -160px; }
.nozzle-module { --entry-x: 0px; --entry-y: 145px; }
@keyframes assemble {
  from { transform: translate(var(--entry-x), var(--entry-y)); opacity: 0; }
  to { transform: translate(0, 0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .assembly-module { animation: none; }
}
</style>
