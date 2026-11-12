// One layer, 16 × 6 cells. Heights are morphology, never a per-ink lookup.
export const inkColors = ['#00a6df', '#e6007e', '#ffd500', '#4054dc']
export const continuousInk = Array.from({ length: 96 }, (_, n) => Math.floor((n % 16) / 4))
export const mixedInk = [...continuousInk]
let seed = 20261112
for (let i = mixedInk.length - 1; i > 0; i--) {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
  const j = seed % (i + 1)
  ;[mixedInk[i], mixedInk[j]] = [mixedInk[j], mixedInk[i]]
}
export function makeInkSurface(layout, rough = false) {
  const vertices = Array.from({ length: 7 }, (_, y) => Array.from({ length: 17 }, (_, x) => ({
    x, y, z: rough ? 34 + 12 * Math.sin(x * .62 + y * .7) + 7 * Math.cos(x * .38 - y * .8) : 34,
  })))
  const project = ({ x, y, z }) => [112 + (x - y) * 17, 52 + (x + y) * 9.815 - z]
  const points = vs => vs.map(v => project(v).map(n => n.toFixed(3)).join(',')).join(' ')
  const base = v => ({ ...v, z: 0 })
  const faces = []
  for (let y = 0; y < 6; y++) for (let x = 0; x < 16; x++) {
    const vs = [vertices[y][x], vertices[y][x + 1], vertices[y + 1][x + 1], vertices[y + 1][x]]
    const id = y * 16 + x
    faces.push({ id, depth: x + y, points: points(vs), heights: vs.map(v => v.z), color: inkColors[layout[id]] })
  }
  // Back to front along the viewing direction; bounded gradients prevent folds.
  faces.sort((a, b) => a.depth - b.depth || a.id - b.id)
  const sides = []
  for (const face of faces) {
    const x = face.id % 16, y = Math.floor(face.id / 16)
    for (const [a, b, shade] of [
      ...(y === 5 ? [[vertices[6][x], vertices[6][x + 1], .18]] : []),
      ...(x === 15 ? [[vertices[y][16], vertices[y + 1][16], .34]] : []),
    ]) sides.push({ points: points([a, b, base(b), base(a)]), color: face.color, shade })
  }
  return { vertices, faces, sides, base: points([{ x: 0, y: 0, z: 0 }, { x: 16, y: 0, z: 0 }, { x: 16, y: 6, z: 0 }, { x: 0, y: 6, z: 0 }]) }
}
