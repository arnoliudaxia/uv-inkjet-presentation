import assert from 'node:assert/strict'
import { createLiquid, stepLiquid, advanceLiquid, surfacePoints, duration } from '../composables/liquidFlow.js'
const sum = a => a.reduce((s, h) => s + h, 0)
// One step cannot change a remote cell: only faces adjacent to a perturbation move mass.
const local = createLiquid()
local.heights.fill(1)
local.heights[64] = 100
const before = Array.from(local.heights)
stepLiquid(local)
assert.ok(local.heights[63] > 1 && local.heights[64] < 100 && local.heights[65] > 1)
for (let i = 0; i < 128; i++) if (Math.abs(i - 64) > 1) assert.equal(local.heights[i], before[i])
assert.ok(Math.abs(sum(local.heights) - sum(before)) < 1e-10)
assert.throws(() => stepLiquid(local, local.dt * 2), RangeError)
const model = createLiquid(), initial = Array.from(model.heights), volume = sum(initial) * model.dx
let max = Math.max(...initial), min = Math.min(...initial)
const start = performance.now()
while (model.time < duration - 1e-12) {
  advanceLiquid(model, Math.min(duration, model.time + .05))
  assert.ok(Math.abs(sum(model.heights) * model.dx - volume) < 1e-6)
  assert.ok(Math.min(...model.heights) >= min - 1e-9)
  assert.ok(Math.max(...model.heights) <= max + 1e-9)
  min = Math.min(...model.heights); max = Math.max(...model.heights)
  const pts = surfacePoints(model.heights, 650, 342)
  const area = Math.abs(pts.reduce((s, a, i) => {
    const b = pts[(i + 1) % pts.length]
    return s + a[0] * b[1] - b[0] * a[1]
  }, 0)) / 2
  assert.ok(Math.abs(area - volume) < 1e-6)
  assert.ok(pts.every(p => p[1] <= 342))
}
assert.ok(max - min < .4)
assert.ok(max > min, 'no forced flat endpoint')
console.log(`Liquid model passed; 5 simulated seconds in ${(performance.now() - start).toFixed(1)}ms, final range ${min.toFixed(4)}–${max.toFixed(4)}`)
