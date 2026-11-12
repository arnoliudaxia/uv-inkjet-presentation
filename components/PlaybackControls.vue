<script setup>
defineProps({ playing: Boolean, next: Boolean })
defineEmits(['toggle', 'next'])
</script>

<template>
  <div class="playback" @keydown.space.stop @keydown.enter.stop>
    <button class="play-toggle" :aria-label="playing ? '暂停喷墨循环及同步波形' : '播放喷墨循环及同步波形'" @click="$emit('toggle')">{{ playing ? 'Ⅱ 暂停演示' : '▶ 播放演示' }}</button>
    <button v-if="next" class="quiet-button" @click="$emit('next')">下一阶段 →</button>
    <span v-else class="phase-time">循环约 8 秒 · 慢动作</span>
  </div>
</template>
