<script setup>
defineProps({ number: String, eyebrow: String, title: String, subtitle: String, topic: String })
</script>

<template>
  <section class="lesson-slide" :aria-label="`第${number}页：${topic}`">
    <header class="slide-heading">
      <div>
        <p class="eyebrow">{{ number }} / {{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
    </header>
    <slot />
  </section>
</template>
