import assert from 'node:assert/strict'
import { continuousInk, mixedInk, inkColors, makeInkSurface } from '../composables/isoInkSurface.js'
for (const [rough, layout] of [[false, continuousInk], [true, mixedInk]]) {
  const mesh = makeInkSurface(layout, rough)
  assert.deepEqual(mesh, makeInkSurface(layout, rough), 'deterministic geometry')
  assert.equal(mesh.vertices.flat().length, 119)
  assert.equal(mesh.faces.length, 96)
  assert.equal(mesh.sides.length, 22, 'only the two visible perimeter skirts, no isolated pillars')
  for (let color = 0; color < 4; color++) assert.equal(layout.filter(c => c === color).length, 24)
  let previous = -1
  for (const face of mesh.faces) {
    const x = face.id % 16, y = Math.floor(face.id / 16)
    assert.equal(face.color, inkColors[layout[face.id]])
    assert.deepEqual(face.heights, [mesh.vertices[y][x].z, mesh.vertices[y][x + 1].z, mesh.vertices[y + 1][x + 1].z, mesh.vertices[y + 1][x].z], 'adjacent cells share exact height vertices')
    assert.ok(face.depth >= previous, 'painter order runs back to front')
    previous = face.depth
    const points = face.points.split(' ').map(p => p.split(',').map(Number))
    for (let i = 0; i < 4; i++) {
      const a = points[i], b = points[(i + 1) % 4], c = points[(i + 2) % 4]
      assert.ok(a[0] >= 0 && a[0] <= 410 && a[1] >= 0 && a[1] <= 280)
      assert.ok((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) > 0, 'no folded or inverted projected quads')
    }
  }
  const heights = mesh.vertices.flat().map(v => v.z)
  if (!rough) assert.deepEqual([...new Set(heights)], [34])
  else {
    assert.ok(Math.max(...heights) - Math.min(...heights) > 30)
    for (const color of inkColors) assert.ok(new Set(mesh.faces.filter(f => f.color === color).flatMap(f => f.heights)).size > 20, 'height is not a per-color constant')
  }
}
assert.deepEqual(continuousInk, Array.from({ length: 96 }, (_, n) => Math.floor(n % 16 / 4)))
console.log('Iso ink surface geometry checks passed')
