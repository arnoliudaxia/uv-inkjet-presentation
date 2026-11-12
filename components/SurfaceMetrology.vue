<script setup>
import '../styles/advanced.css'

// Deterministic illustrative fields, not measurements or a calibration model.
const columns = 28, rows = 16
function height(x, y, after) {
  const ripple = Math.sin(x * 18 + y * 5) * .075 + Math.cos(y * 17 - x * 4) * .055
  const tilt = (x - .5) * .25 + (y - .5) * .12
  const bump = .16 * Math.exp(-((x - .68) ** 2 + (y - .35) ** 2) / .035)
  return after ? .48 + ripple * .38 + tilt * .15 + bump * .3 : .58 + ripple + tilt + bump
}
const palette = ['#2934b8', '#0066cc', '#00a6df', '#00bfa6', '#50c400', '#e0c600', '#ff9d00', '#e64524']
const maps = [false, true].map(after => {
  const cells = Array.from({ length: columns * rows }, (_, i) => {
    const col = i % columns, row = Math.floor(i / columns)
    const z = height((col + .5) / columns, (row + .5) / rows, after)
    return { x: col * 11, y: row * 10, color: palette[Math.max(0, Math.min(7, Math.floor(z * 8)))] , z }
  })
  const mean = cells.reduce((sum, cell) => sum + cell.z, 0) / cells.length
  const profile = Array.from({ length: 100 }, (_, i) => {
    const x = i / 99
    return `${i ? 'L' : 'M'}${(x * 308).toFixed(2)} ${(115 - height(x, .5, after) * 100).toFixed(2)}`
  }).join(' ')
  return { title: after ? '校准后 · 目标状态示意' : '校准前 · 偏差状态示意', cells, meanY: 115 - mean * 100, profile }
})
</script>

<template>
  <div class="adv-root adv-metrology">
    <div class="adv-panel adv-metrology-visual">
      <div class="adv-panel-head"> <span>示意 同位置截面</span></div>
      <svg viewBox="0 0 850 475" role="img" aria-label="校准前后两幅示意高度图，共用相对高度色标。下方显示沿A—A线的截面与全图平均层厚参考线，校准后起伏较小，仅表示目标。">
        <g v-for="(map, index) in maps" :key="map.title" :transform="`translate(${55 + index * 410}, 0)`">
          <text x="0" y="32" class="adv-svg-text">{{ map.title }}</text>
          <g transform="translate(0, 52)">
            <rect v-for="(cell, i) in map.cells" :key="i" :x="cell.x" :y="cell.y" width="11.2" height="10.2" :fill="cell.color" />
            <rect width="308" height="160" fill="none" stroke="#6e91a0" />
            <path d="M0 80H308" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 5" />
            <text x="-22" y="85" class="adv-svg-muted">A</text><text x="316" y="85" class="adv-svg-muted">A′</text>
          </g>
          <g class="adv-profile" transform="translate(0, 240)">
            <text x="0" y="18" class="adv-svg-muted">A—A′ 截面 · 与上图同一高度场</text>
            <path d="M0 32V130H308" class="adv-axis" />
            <path :d="`M0 ${map.meanY}H308`" stroke="#efc575" stroke-width="1.5" stroke-dasharray="5 5" />
            <path :d="map.profile" class="adv-wave" />
            <text x="6" y="152" class="adv-svg-muted">共同基底参考</text><text x="238" y="152" class="adv-svg-muted">横向位置</text>
          </g>
        </g>
        <g transform="translate(245, 441)"><rect v-for="(color, i) in palette" :key="color" :x="i * 32" width="33" height="10" :fill="color" /><text x="-80" y="11" class="adv-svg-muted">低</text><text x="274" y="11" class="adv-svg-muted">高</text></g>
      </svg>
      <div class="adv-caption"><span class="adv-line-key" />截面高度 <span class="adv-line-key adv-mean-key" />全图平均层厚参考</div>
      <div class="adv-loop"><span>测量</span><b>→</b><span>修正工艺</span><b>→</b><span>复测 ↺</span></div>
    </div>
    <aside class="adv-sidebar adv-metrology-notes">
      <div class="adv-kicker">表面测量与反馈</div>
      <div class="adv-explanation">
        <h2>平均值 ≠ 局部起伏</h2>
        <p>平均层厚需相对共同基底求取；截面的局部起伏用于观察不均匀，不能只用平均值代替。</p>
      </div>
      <div class="adv-specs"><h3>测量需求 · 待设备验证</h3><dl><div><dt>分辨率</dt><dd>约 1 μm</dd></div><div><dt>Z 量程</dt><dd>≥ 100 μm</dd></div><div><dt>视场</dt><dd>大约 1 cm 级</dd></div></dl></div>
      <div class="adv-methods"><h3>候选方法</h3><p>共聚焦 / 白光干涉 / 色散共焦</p><small></small></div>
    </aside>
  </div>
</template>
