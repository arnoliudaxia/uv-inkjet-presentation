<script setup>
import { useNav } from '@slidev/client'

const { go } = useNav()
const items = [
  { title: '液滴体积与层高差异', page: 2, color: '#00a6df' },
  { title: '抽点补偿与流动补缺', page: 3, color: '#e6007e' },
  { title: '随机混色与局部起伏', page: 4, color: '#ffd500' },
  { title: '喷头结构', page: 5, color: '#4054dc' },
  { title: '驱动波形与液滴喷射', page: 6, color: '#e6007e' },
  { title: '表面形貌测量', page: 8, color: '#00a6df' },
]
</script>

<template>
  <LessonSlide number="01" eyebrow="OUTLINE" title="演示大纲" topic="演示大纲">
    <div class="outline-grid" role="navigation" aria-label="演示目录">
      <button v-for="(item, index) in items" :key="item.page" class="outline-card"
        :style="{ '--accent': item.color }" :data-page="item.page" @click.stop="go(item.page, 0)">
        <span class="outline-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="outline-title">{{ item.title }}</span>
      </button>
    </div>
  </LessonSlide>
</template>

<style scoped>
.outline-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(3, 1fr); gap: 24px; flex: 1; min-height: 0; padding: 10px 0 20px; background: #f8fafc; }
.lesson-slide .outline-card { display: flex; align-items: center; gap: 24px; padding: 30px; text-align: left; border: 1px solid #dbe3ec; border-left: 8px solid var(--accent); border-radius: 14px; background: #fff; color: #24364b; transition: none; }
.lesson-slide .outline-card:hover { background: #f1f5f9; border-color: var(--accent); }
.lesson-slide .outline-card:focus-visible { outline: 3px solid #006b91; outline-offset: 4px; }
.outline-number { display: grid; place-items: center; flex: 0 0 68px; height: 68px; border-radius: 50%; background: var(--accent); color: #17283b; font-size: 30px; font-weight: 750; }
.outline-title { font-size: 30px; font-weight: 650; line-height: 1.4; }
</style>
