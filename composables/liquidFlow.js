// Local nonlinear diffusion approximation, NOT the fourth-order capillary equation.
// Cell averages, sealed ends, q = -D(h_face) dh/dx. Units are illustrative px/s.
export const duration = 5
export const target = 72
export const diffusivity = h => 800 * (.12 + Math.min(h / target, 3) ** 2)
export function createLiquid(width = 650, retain = .5, count = 128) {
  const dx = width / count, film = .35, period = width / 4
  const support = Math.min(.9, Math.max(.25, retain * 1.3))
  const shape = Array.from({ length: count }, (_, i) => {
    const phase = (((i + .5) * dx / period) % 1) - .5
    return Math.abs(phase) < support / 2 ? Math.cos(Math.PI * phase / support) ** 2 : 0
  })
  const scale = (target - film) * count / shape.reduce((a, b) => a + b, 0)
  const heights = Float64Array.from(shape, h => film + scale * h)
  // D is bounded: dt * (D_left + D_right) / dx² <= .9.
  // Thus every updated cell is a convex combination; no clipping/renormalization.
  const dt = Math.min(1 / 1200, .45 * dx * dx / diffusivity(3 * target))
  return { heights, next: new Float64Array(count), dx, dt, time: 0 }
}
export function stepLiquid(model, dt = model.dt) {
  if (!(dt > 0 && dt <= model.dt)) throw new RangeError('unstable time step')
  const { heights: h, next, dx } = model
  next.set(h)
  for (let i = 0; i < h.length - 1; i++) {
    const transfer = dt / (dx * dx) * diffusivity((h[i] + h[i + 1]) / 2) * (h[i] - h[i + 1])
    next[i] -= transfer
    next[i + 1] += transfer
  }
  model.heights = next
  model.next = h
  model.time += dt
}
export function advanceLiquid(model, until) {
  const end = Math.min(duration, until)
  while (model.time < end - 1e-12) stepLiquid(model, Math.min(model.dt, end - model.time))
}
// Center-to-center linear reconstruction preserves area exactly including half end cells.
// Dense samples form rounded silhouettes without spline overshoot below the substrate.
export function surfacePoints(heights, width, base) {
  const dx = width / heights.length
  return [[0, base], [0, base - heights[0]],
    ...Array.from(heights, (h, i) => [(i + .5) * dx, base - h]),
    [width, base - heights[heights.length - 1]], [width, base]]
}
