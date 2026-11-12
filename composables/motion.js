// Reused teaching model from the legacy app; one normalized eight-second cycle.
export const stages = [
  { title: '补墨与扩容', description: '腔壁向外微移，墨腔容积增大；墨水由供应通路补入。', tag: '扩容' },
  { title: '压缩与压力波', description: '腔壁向内微移，墨腔容积减小；压力扰动向喷嘴传播。', tag: '压缩' },
  { title: '喷出与断滴', description: '液面形成液柱，随后颈缩、断裂，主墨滴离开喷嘴。', tag: '喷出 / 过渡' },
  { title: '恢复与回填', description: '腔壁与液面逐步恢复，残余振荡衰减，准备下一次喷射。', tag: '恢复' },
]
export function getMotion(phase) {
  const stage = Math.min(3, Math.floor(phase * 4))
  const local = phase * 4 - stage
  const displacement = stage === 0 ? -10 * Math.sin(local * Math.PI / 2)
    : stage === 1 ? -10 + 23 * Math.sin(local * Math.PI / 2)
      : stage === 2 ? 13 * (1 - local)
        : -2 * Math.sin(local * 2 * Math.PI) * (1 - local)
  return { stage, local, displacement }
}
// Stage boundaries exactly match the mechanical model (quarter-cycle each).
export const wavePoints = [[70,175],[105,175],[145,225],[225,225],[275,90],[340,90],[390,175],[470,175],[515,152],[555,175],[755,175]]
export const wavePath = wavePoints.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('')
export function waveY(x) {
  for (let i = 1; i < wavePoints.length; i++) {
    const [a, b] = wavePoints[i - 1], [c, d] = wavePoints[i]
    if (x <= c) return b + (d - b) * (x - a) / (c - a)
  }
  return 175
}
