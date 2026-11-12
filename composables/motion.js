// Normalized teaching cycle only; polarity is chosen for this schematic, not a device specification.
export const stages = [
  { title: '拉：扩容与液面回缩', description: '本示意中，上升沿使腔壁向外微移、墨腔扩容，液面回缩并发生补墨。真实方向取决于喷头结构和驱动极性。', tag: '拉 / 扩容' },
  { title: '保持：等待压力响应', description: '电压暂时保持，腔体处于扩容位置。实际压力波仍会传播、反射；保持时间需匹配通道响应，并不表示墨水静止。', tag: '保持' },
  { title: '推：压缩、液柱与断滴', description: '下降沿驱动腔体压缩，压力扰动传向喷嘴；液柱在惯性与表面张力作用下颈缩、断滴。示意不表示瞬时电压直接决定滴量。', tag: '推 / 喷射' },
  { title: '恢复：回填与振荡衰减', description: '驱动恢复到基线，腔壁和喷嘴液面逐渐恢复，准备下一次喷射；残余振荡会影响后续墨滴。', tag: '恢复' },
]
export function getMotion(phase) {
  const stage = Math.min(3, Math.floor(phase * 4))
  const local = phase * 4 - stage
  const displacement = stage === 0 ? -10 * Math.sin(local * Math.PI / 2)
    : stage === 1 ? -10
      : stage === 2 ? (local < .35 ? -10 + 23 * Math.sin(local / .35 * Math.PI / 2) : 13)
        : 13 * (1 - local) - 2 * Math.sin(local * 2 * Math.PI) * (1 - local)
  return { stage, local, displacement }
}
// Equal teaching stages, not physical timing. The positive level is the chosen pull polarity.
export const wavePoints = [[70,175],[100,175],[241.25,85],[412.5,85],[472.44,235],[583.75,235],[720,175],[755,175]]
export const wavePath = wavePoints.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('')
export function waveY(x) {
  for (let i = 1; i < wavePoints.length; i++) {
    const [a, b] = wavePoints[i - 1], [c, d] = wavePoints[i]
    if (x <= c) return b + (d - b) * (x - a) / (c - a)
  }
  return 175
}
