import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const url = process.env.TEST_URL || 'http://127.0.0.1:3101'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  async function go(number, clicks = 0) {
    await page.goto(`${url}/${number}?clicks=${clicks}`)
    await page.locator('.lesson-slide:visible h1').waitFor()
    await page.waitForTimeout(200)
  }
  const inkPalette = ['rgb(0, 166, 223)', 'rgb(230, 0, 126)', 'rgb(255, 213, 0)', 'rgb(64, 84, 220)']
  const clickCounts = [1, 2, 2, 2, 3, 3, 0, 0, 2]
  for (let number = 1; number <= 9; number++) {
    await go(number, clickCounts[number - 1])
    assert.equal(await page.locator('.lesson-slide:visible').count(), 1)
    const light = await page.locator('.lesson-slide:visible').evaluate(root => {
      const luminance = color => {
        const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number)
        return rgb.reduce((sum, channel) => sum + channel, 0) / 3
      }
      const panel = root.querySelector('.droplet-visual, .story-visual, .visual-panel, .adv-panel')
      return {
        scheme: getComputedStyle(document.documentElement).colorScheme,
        body: luminance(getComputedStyle(document.body).backgroundColor),
        canvas: luminance(getComputedStyle(root).backgroundColor),
        panel: panel && luminance(getComputedStyle(panel).backgroundColor),
        text: luminance(getComputedStyle(root).color),
        dark: document.documentElement.classList.contains('dark'),
        titleSize: parseFloat(getComputedStyle(root.querySelector('h1')).fontSize),
        cards: [...root.querySelectorAll('.droplet-explanation, .story-card, .component-card, .adv-specs, .adv-root button')].map(el => luminance(getComputedStyle(el).backgroundColor)),
        svgLabels: [...root.querySelectorAll('svg .svg-label, svg .svg-sub, svg .axis-text, svg .adv-svg-text, svg .adv-svg-muted, svg .drop-ratio')].map(el => luminance(getComputedStyle(el).fill)),
      }
    })
    assert.equal(light.scheme, 'light', `slide ${number}: light color-scheme`)
    assert.equal(light.dark, false, `slide ${number}: no dark theme`)
    for (const surface of ['body', 'canvas', 'panel']) assert.ok(light[surface] > 230, `slide ${number}: ${surface} stays light (${light[surface]})`)
    assert.ok(light.text < 100, `slide ${number}: dark text on light canvas`)
    assert.equal(light.titleSize, 44, 'palette overrides must preserve original heading typography')
    assert.ok(light.cards.every(value => value > 225), `slide ${number}: cards/controls stay light`)
    assert.ok(light.svgLabels.every(value => value < 130), `slide ${number}: SVG labels stay readable on light panels`)
    assert.equal(await page.locator('#deck, #helpDialog, .masthead').count(), 0)
    assert.equal(await page.locator('#slide-container nav:visible').count(), 0)
    // Catch content overflow outside the fixed presentation canvas.
    const overflow = await page.locator('.lesson-slide:visible').evaluate(root => {
      const box = root.getBoundingClientRect()
      return [...root.querySelectorAll('h1,h2,h3,p,button,input,svg')].filter(el => {
        if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false
        const r = el.getBoundingClientRect()
        return r.bottom > box.bottom + 2 || r.right > box.right + 2 || r.left < box.left - 2
      }).map(el => `${el.tagName}: ${el.textContent.slice(0, 65)}`)
    })
    assert.deepEqual(overflow, [], `slide ${number}: no content escapes canvas`)
    await page.screenshot({ path: `/tmp/uv-slidev-page-${number}.png` })
    if (clickCounts[number - 1]) {
      await page.locator('.lesson-slide:visible h1').click()
      await page.keyboard.press('ArrowLeft')
      await page.waitForTimeout(70)
      assert.match(page.url(), new RegExp(`/${number}(?:\\?|$)`), 'backward stays within click steps')
    }
  }

  await go(1)
  const drops = page.locator('.lesson-slide:visible .droplet-layer')
  assert.equal(await drops.locator('[data-explanation]').count(), 1)
  assert.equal(await drops.locator('button, .story-step, .topic-pill').count(), 0)
  const dropGeometry = await drops.locator('.drop-channel').evaluateAll(groups => groups.map(group => ({
    ink: group.dataset.ink,
    volume: Number(group.dataset.volume),
    radii: [...group.querySelectorAll('.volume-drop')].map(drop => Number(drop.getAttribute('r'))),
    xs: [...group.querySelectorAll('.volume-drop')].map(drop => Number(drop.getAttribute('cx'))),
    width: Number(group.querySelector('.deposited-layer').getAttribute('width')),
    thickness: Number(group.querySelector('.deposited-layer').getAttribute('height')),
  })))
  assert.deepEqual(dropGeometry.map(group => group.ink), ['C', 'M', 'Y', 'S'])
  assert.deepEqual(dropGeometry.map(group => group.volume), [.5, 1, 1, 2])
  for (const group of dropGeometry) {
    assert.equal(group.radii.length, 3)
    assert.deepEqual(group.xs, [32, 90, 148])
    assert.equal(group.width, 180)
    assert.equal(group.thickness, group.volume * 64)
    for (const radius of group.radii) assert.ok(Math.abs(radius - 18 * group.volume ** .65) < 1e-10, 'perceptual radius exaggeration retains labeled volume')
  }
  async function assertDropState(landed) {
    assert.equal(await drops.getAttribute('data-state'), landed ? 'landed' : 'suspended')
    for (const selector of ['.falling-drops', '.deposited-layer']) {
      const expected = selector === '.falling-drops' ? Number(!landed) : Number(landed)
      assert.deepEqual(await drops.locator(selector).evaluateAll(nodes => nodes.map(node => Number(getComputedStyle(node).opacity))), Array(4).fill(expected))
    }
  }
  await assertDropState(false)
  assert.deepEqual(await drops.locator('.volume-drop:first-child').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fill)), inkPalette, 'scoped droplet fills use saturated C/M/Y/S')
  assert.deepEqual(await drops.locator('.drop-name').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fill)), ['rgb(0, 107, 145)', inkPalette[1], 'rgb(138, 87, 0)', inkPalette[3]], 'C/Y labels remain readable without darkening their swatches')
  assert.deepEqual(await drops.locator('.deposited-layer').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fillOpacity)), Array(4).fill('1'))
  await page.screenshot({ path: '/tmp/uv-slidev-droplets-initial.png' })
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1100)
  await assertDropState(true)
  assert.match(page.url(), /\/1(?:\?|$)/)
  assert.deepEqual(await drops.locator('.deposited-layer').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).transform)), Array(4).fill('matrix(1, 0, 0, 1, 0, 0)'))
  await page.screenshot({ path: '/tmp/uv-slidev-droplets-landed.png' })
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(1100)
  await assertDropState(false)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1100)
  await assertDropState(true)
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/2(?:\?|$)/)
  await page.waitForTimeout(250)
  assert.match(await page.locator('.lesson-slide:visible h1').innerText(), /同样的层数/)

  await go(2)
  assert.equal(await page.locator('.lesson-slide:visible h1').innerText(), '同样的层数高度不同')
  const blocks = page.locator('.lesson-slide:visible [data-ink]')
  const geometry = await blocks.evaluateAll(groups => groups.map(group => {
    const layers = [...group.querySelectorAll('rect.story-layer')]
    const top = Math.min(...layers.map(rect => Number(rect.getAttribute('y'))))
    return {
      ink: group.dataset.ink,
      height: Number(group.dataset.height),
      ratio: Number(group.dataset.ratio),
      layers: layers.length,
      top,
      totalHeight: 380 - top,
      frameY: Number(group.querySelector('rect[stroke-dasharray]').getAttribute('y')),
      frameHeight: Number(group.querySelector('rect[stroke-dasharray]').getAttribute('height')),
      labelY: Number(group.querySelector('.story-number').getAttribute('y')),
    }
  }))
  assert.deepEqual(geometry.map(block => block.ink), ['C', 'M', 'Y', 'S'])
  assert.deepEqual(geometry.map(block => block.height), [18, 36, 36, 72])
  assert.deepEqual(geometry.map(block => block.ratio), [.5, 1, 1, 2])
  assert.deepEqual(geometry.map(block => block.totalHeight / geometry[0].totalHeight), [1, 2, 2, 4])
  assert.equal(geometry[1].top, geometry[2].top, 'M and Y have identical actual top surfaces')
  assert.equal(geometry[0].top, 308)
  for (const block of geometry) {
    assert.equal(block.layers, 10)
    assert.equal(block.totalHeight, block.height * 4)
    assert.equal(block.frameY, block.top - 1)
    assert.equal(block.frameHeight, block.totalHeight)
    assert.equal(block.labelY, block.top - 16)
  }
  const target = page.locator('.lesson-slide:visible .story-target')
  assert.equal(await target.getAttribute('d'), 'M52 308H807')
  assert.equal(await target.evaluate(node => getComputedStyle(node).animationDelay), '1.36s')
  assert.equal(await target.evaluate(node => getComputedStyle(node).visibility), 'hidden', 'target waits for all ten layers')
  assert.match(await blocks.nth(3).textContent(), /支撑 S/)
  const blockSvgText = await page.locator('.lesson-slide:visible .story-visual svg').textContent()
  assert.doesNotMatch(blockSvgText, /补偿目标|参考目标|最低 C|只能抽点|建议保留/)

  assert.deepEqual(await blocks.locator('.retention-label').allTextContents(), ['补偿比例 100%', '补偿比例 50%', '补偿比例 50%', '补偿比例 25%'])
  assert.equal(await blocks.locator('.compensation-mask').count(), 0)
  assert.equal(await page.locator('.lesson-slide:visible .story-notes').innerText(), '通过测量高度，计算补偿比例。')
  assert.equal(await page.locator('.lesson-slide:visible .story-notes h3').count(), 1)
  // Each layer appears instantaneously in order, with no scale/geometry tween.
  const animations = await blocks.first().locator('.story-layer').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node)
    const animation = node.getAnimations()[0]
    return {
      duration: style.animationDuration,
      delay: parseFloat(style.animationDelay),
      easing: style.animationTimingFunction,
      transform: style.transform,
      properties: animation ? Object.keys(animation.effect.getKeyframes()[0]).filter(key => !['offset', 'computedOffset', 'easing', 'composite'].includes(key)) : [],
    }
  }))
  for (const [index, animation] of animations.entries()) {
    assert.equal(animation.duration, '0.01s')
    assert.ok(Math.abs(animation.delay - index * .15) < 1e-10)
    assert.equal(animation.easing, 'linear')
    assert.equal(animation.transform, 'none')
    assert.deepEqual(animation.properties, ['visibility'])
  }
  await page.waitForTimeout(1600)
  assert.deepEqual(await blocks.evaluateAll(groups => groups.map(group => getComputedStyle(group.querySelector('.story-layer')).fill)), inkPalette, 'block legend matches droplets')
  assert.ok(await blocks.locator('.story-layer').evaluateAll(nodes => nodes.every(node => Number(getComputedStyle(node).opacity) >= .92)), 'layers must not wash out to pastel')
  await page.screenshot({ path: '/tmp/uv-slidev-blocks-initial.png' })
  const alignment = await page.locator('.lesson-slide:visible').evaluate(root => {
    const line = root.querySelector('.story-target').getBoundingClientRect().top
    return [...root.querySelectorAll('[data-ink]')].map(group => {
      const visible = [...group.querySelectorAll('.story-layer')].filter(el => getComputedStyle(el).visibility === 'visible')
      return { ink: group.dataset.ink, count: visible.length, top: Math.min(...visible.map(el => el.getBoundingClientRect().top)), line }
    })
  })
  for (const ink of alignment) {
    assert.equal(ink.count, 10, 'all ten layers become visible after the animation')
    if (ink.ink === 'C') assert.ok(Math.abs(ink.top - ink.line) < .1, 'rendered C top aligns with target line')
  }
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(100)
  assert.equal(Number(new URL(page.url()).searchParams.get('clicks')), 1)
  const flow = page.locator('.lesson-slide:visible .flow-leveling')
  assert.equal(await flow.count(), 1)
  const flowSvg = page.locator('.lesson-slide:visible .story-visual svg')
  assert.equal(await flowSvg.locator('[data-ink], .retention-label, .story-target, .compensation-mask, .story-layer, .solid-block, text, circle, .story-base').count(), 0)
  assert.equal(await flow.getAttribute('data-retain'), '0.5')
  assert.deepEqual(await flow.locator('polygon').evaluateAll(nodes => nodes.map(n => getComputedStyle(n).fill)), [inkPalette[0]])
  assert.deepEqual(await flow.locator('polygon').evaluate(node => {
    const box = node.getBBox()
    const matrix = node.getCTM()
    return { x: box.x, width: box.width, base: Math.max(...[...node.points].map(p => p.y)), uniform: matrix.a === matrix.d }
  }), { x: 0, width: 650, base: 342, uniform: true }, 'geometry is widened without stretching strokes or labels')
  assert.equal(await page.locator('.lesson-slide:visible h1').innerText(), '液体流动补缺')
  assert.equal(await page.locator('.lesson-slide:visible .story-bar').innerText(), '液体流动补缺')
  assert.equal(await page.locator('.lesson-slide:visible .story-card').count(), 1)
  assert.equal(await page.locator('.lesson-slide:visible .story-card h3').innerText(), '液体流动补缺')
  assert.equal(await page.locator('.lesson-slide:visible .story-card p').innerText(), '未固化墨水横向流动，逐渐填补空缺。')
  async function sampleFlow() {
    const samples = await flow.evaluateAll(nodes => nodes.map(node => {
      const pts = node.querySelector('polygon').points
      let twiceArea = 0
      for (let i = 0; i < pts.numberOfItems; i++) {
        const a = pts.getItem(i), b = pts.getItem((i + 1) % pts.numberOfItems)
        twiceArea += a.x * b.y - b.x * a.y
      }
      return { progress: Number(node.dataset.progress), area: Number(node.dataset.area), initial: Number(node.dataset.initialArea), final: Number(node.dataset.finalArea), heights: node.dataset.heights.split(',').map(Number), initialHeights: node.dataset.initialHeights.split(',').map(Number), polygonArea: Math.abs(twiceArea) / 2 }
    }))
    for (const s of samples) {
      assert.equal(s.initial, 46800)
      assert.equal(s.final, 46800)
      assert.equal(s.initialHeights.reduce((a, b) => a + b) * 650 / 16, s.final, 'actual initial columns and final flat layer have identical volume')
      assert.ok(Math.abs(s.area - 46800) < 1e-6, 'column area remains constant')
      assert.ok(Math.abs(s.polygonArea - 46800) < .1, 'actual rendered polygon conserves area')
      assert.ok(s.heights.every(h => h >= 0 && h <= 144))
      assert.ok(Math.abs(s.heights.reduce((a, b) => a + b) / 16 - 72) < 1e-6)
    }
    return samples
  }
  const early = await sampleFlow()
  assert.ok(early.every(s => s.progress < .2))
  assert.ok(early[0].heights[0] > 130 && early[0].heights[1] < 14)
  assert.deepEqual(early[0].initialHeights, Array.from({ length: 16 }, (_, i) => i % 2 === 0 ? 144 : 0))
  assert.equal(early[0].initialHeights.filter(h => h === 0).length, 8, 'multiple visible gaps fill during leveling')
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(450)
    const mid = await sampleFlow()
    assert.ok(mid.every(s => s.progress > early[0].progress && s.progress < 1))
    if (i === 1) await page.screenshot({ path: '/tmp/uv-slidev-blocks-flow-mid.png' })
  }
  await page.waitForTimeout(1000)
  const settled = await sampleFlow()
  assert.ok(settled.every(s => s.progress === 1 && s.heights.every(h => h === 72)))
  assert.deepEqual(await flow.first().getAttribute('data-running'), 'false')
  await page.screenshot({ path: '/tmp/uv-slidev-blocks-flow-settled.png' })
  // Return to the original state and re-enter: a fresh conservative animation, not a cached end frame.
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(80)
  assert.equal(await flow.count(), 0)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(80)
  assert.ok((await sampleFlow()).every(s => s.progress < .1))
  await page.screenshot({ path: '/tmp/uv-slidev-blocks-flow-start.png' })
  // Page departure must cancel RAF even when Slidev retains a neighbouring slide instance.
  await page.keyboard.press('ArrowDown')
  await page.waitForURL(/\/3(?:\?|$)/)
  const hiddenFlow = page.locator('.flow-leveling')
  const stopped = await hiddenFlow.evaluateAll(nodes => nodes.map(n => [n.dataset.progress, n.dataset.running]))
  assert.ok(stopped.every(([, running]) => running === 'false'))
  await page.waitForTimeout(200)
  assert.deepEqual(await hiddenFlow.evaluateAll(nodes => nodes.map(n => [n.dataset.progress, n.dataset.running])), stopped)
  await page.keyboard.press('ArrowUp')
  await page.waitForURL(/\/2(?:\?|$)/)
  // Direct links also replay the middle stage.
  await go(2, 1)
  assert.ok((await sampleFlow()).every(s => s.progress < .2))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(80)
  assert.ok((await sampleFlow()).every(s => s.progress === 1 && s.heights.every(h => h === 72)))
  assert.deepEqual(await flow.locator('polygon').evaluateAll(nodes => nodes.map(n => getComputedStyle(n).fill)), [inkPalette[0]])
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(80)
  assert.ok((await sampleFlow()).every(s => s.progress === 1))
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(100)
  assert.equal(await flow.count(), 0)
  assert.equal(Number(new URL(page.url()).searchParams.get('clicks')), 2)
  const mask = await blocks.locator('.compensation-mask').evaluateAll(groups => groups.map(group => ({
    baseline: Number(group.dataset.baseline),
    total: group.querySelectorAll('circle').length,
    passes: [...group.querySelectorAll('[data-pass]')].map(pass => pass.querySelectorAll('circle').length),
    kept: group.querySelectorAll('[data-retained="true"]').length,
    markup: group.innerHTML,
  })))
  assert.deepEqual(mask.map(group => group.baseline), [32, 32, 32, 32])
  assert.deepEqual(mask.map(group => group.total), [32, 32, 32, 32])
  assert.deepEqual(mask.map(group => group.passes), [[32], [32], [32], [32]])
  assert.deepEqual(mask.map(group => group.kept), [32, 16, 16, 8])
  const finalGeometry = await blocks.evaluateAll(groups => groups.map(group => ({
    effective: group.dataset.effectiveHeight,
    top: Number(group.querySelector('.solid-block').getAttribute('y')),
    x: Number(group.querySelector('.solid-block').getAttribute('x')),
    width: Number(group.querySelector('.solid-block').getAttribute('width')),
    solids: group.querySelectorAll('.solid-block').length,
    frameY: Number(group.querySelector('rect[stroke-dasharray]').getAttribute('y')),
    frameHeight: Number(group.querySelector('rect[stroke-dasharray]').getAttribute('height')),
    layerHeight: Number(group.querySelector('.solid-block').getAttribute('height')),
    labelY: Number(group.querySelector('.story-number').getAttribute('y')),
    label: group.querySelector('.story-number').textContent,
  })))
  assert.deepEqual(finalGeometry.map(block => block.effective), ['0.50', '0.50', '0.50', '0.50'])
  assert.deepEqual(finalGeometry.map(block => block.top), [308, 308, 308, 308])
  assert.deepEqual(finalGeometry.map(block => block.label), ['0.50', '0.50', '0.50', '0.50'])
  assert.deepEqual(finalGeometry.map(block => block.frameY), [307, 307, 307, 307])
  assert.deepEqual(finalGeometry.map(block => block.frameHeight), [72, 72, 72, 72])
  assert.deepEqual(finalGeometry.map(block => block.layerHeight), Array(4).fill(72))
  assert.deepEqual(finalGeometry.map(block => block.x), Array(4).fill(0))
  assert.deepEqual(finalGeometry.map(block => block.width), Array(4).fill(106))
  assert.deepEqual(finalGeometry.map(block => block.solids), Array(4).fill(1))
  assert.equal(await blocks.locator('.story-layer').count(), 0)
  assert.deepEqual(finalGeometry.map(block => block.labelY), [292, 292, 292, 292])
  assert.equal(await target.getAttribute('d'), 'M52 308H807')
  assert.equal(await target.evaluate(node => getComputedStyle(node).animationName), 'none')
  assert.equal(await target.evaluate(node => getComputedStyle(node).visibility), 'visible', 'final target is immediately visible')
  assert.ok(await blocks.locator('.solid-block').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).visibility === 'visible' && getComputedStyle(node).animationName === 'none')))
  await page.screenshot({ path: '/tmp/uv-slidev-blocks-final.png' })
  assert.deepEqual(await blocks.locator('.retention-label').allTextContents(), ['补偿比例 100%', '补偿比例 50%', '补偿比例 50%', '补偿比例 25%'])
  assert.equal(await page.locator('.lesson-slide:visible .story-card').count(), 1)
  assert.equal(await page.locator('.lesson-slide:visible .story-card h3').innerText(), '等效平均高度一致')
  assert.equal(await page.locator('.lesson-slide:visible .story-card p').innerText(), 'C 不变，M/Y 抽点后保留 50%，S 保留 25%。')
  assert.equal(await page.locator('.lesson-slide:visible .topic-pill').count(), 0)
  assert.equal(await page.locator('.lesson-slide:visible .story-foot').count(), 0)
  assert.match(await page.locator('.lesson-slide:visible h1').innerText(), /等效平均高度一致/)
  assert.equal(await page.locator('.lesson-slide:visible h1').innerText(), '补偿后等效平均高度一致')
  assert.equal(Number(new URL(page.url()).searchParams.get('clicks')), 2)
  // Two steps back restore original geometry, retaining ratios/frames.
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(80)
  assert.equal(await flow.count(), 1)
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(100)
  assert.equal(Number(new URL(page.url()).searchParams.get('clicks') || 0), 0)
  assert.equal(await page.locator('.lesson-slide:visible .story-step').count(), 0, 'removed step counter stays absent')
  assert.equal(await blocks.locator('.compensation-mask').count(), 0)
  assert.equal(await blocks.locator('.retention-label').count(), 4)
  assert.deepEqual(await blocks.evaluateAll(groups => groups.map(group => Math.min(...[...group.querySelectorAll('.story-layer')].map(r => Number(r.getAttribute('y')))))), geometry.map(block => block.top))
  assert.equal(await blocks.locator('.story-number').count(), 4)
  assert.equal(await page.locator('.lesson-slide:visible h1').innerText(), '同样的层数高度不同')
  assert.equal(await page.locator('.lesson-slide:visible .story-notes').innerText(), '通过测量高度，计算补偿比例。')
  await go(2, 2)
  assert.deepEqual(await blocks.locator('.story-number').allTextContents(), ['0.50', '0.50', '0.50', '0.50'])
  assert.deepEqual(await blocks.locator('.compensation-mask').evaluateAll(groups => groups.map(group => group.innerHTML)), mask.map(group => group.markup), 'fixed masks are deterministic')

  await page.locator('.lesson-slide:visible h1').click()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/3(?:\?|$)/)

  for (const clicks of [0, 1, 2]) {
    await go(3, clicks)
    const random = page.locator('.lesson-slide:visible .story-visual')
    const fills = await random.locator('.story-dot').evaluateAll(nodes => [...new Set(nodes.map(node => getComputedStyle(node).fill))].filter(fill => fill !== 'none').sort())
    assert.deepEqual(fills, [...inkPalette].sort(), 'random and continuous areas retain the same four saturated inks')
    assert.ok(await random.locator('text').evaluateAll(nodes => nodes.every(node => {
      const rgb = getComputedStyle(node).fill.match(/[\d.]+/g).slice(0, 3).map(Number)
      return rgb.reduce((a, b) => a + b) / 3 < 130
    })), 'random-mix labels stay dark and readable')
    await page.screenshot({ path: `/tmp/uv-slidev-random-${clicks}.png` })
  }

  await go(5)
  const anatomy = page.locator('.anatomy-layout')
  assert.equal(await anatomy.locator('.component-card.revealed').count(), 0)
  for (const [i, key] of ['ArrowRight', 'Space', 'ArrowRight'].entries()) {
    await page.keyboard.press(key)
    await page.waitForTimeout(100)
    assert.equal(await anatomy.locator('.component-card.revealed').count(), i + 1)
  }
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(100)
  assert.equal(await anatomy.locator('.component-card.revealed').count(), 2)
  await anatomy.locator('.component-card').nth(2).click()
  assert.match(page.url(), /\/5(?:\?|$)/, 'part selection stays on anatomy slide 5')
  assert.equal(await anatomy.locator('.component-card.revealed').count(), 3)
  await page.locator('.lesson-slide:visible h1').click()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/6(?:\?|$)/)

  await go(7)
  const wave = page.locator('.wave-layout')
  await wave.locator('.sync-stage-buttons button').nth(2).click()
  assert.match(await wave.locator('.play-toggle').innerText(), /播放/)
  const wall = wave.locator('.chamber-wall')
  const paused = await wall.getAttribute('d')
  await page.waitForTimeout(200)
  assert.equal(await wall.getAttribute('d'), paused)
  assert.equal(await wave.locator('.drop-motion').getAttribute('opacity'), '1')
  assert.equal(Number(await wave.locator('.wave-cursor circle').getAttribute('cx')), 70 + .625 * 685)
  await wave.locator('.sync-stage-buttons button').nth(0).click()
  const pullWall = await wall.getAttribute('d')
  await wave.locator('.play-toggle').focus()
  await page.keyboard.press('Space')
  await page.waitForTimeout(200)
  assert.match(page.url(), /\/7(?:\?|$)/, 'button Space does not navigate')
  assert.match(await wave.locator('.play-toggle').innerText(), /暂停/)
  assert.notEqual(await wall.getAttribute('d'), pullWall)
  await wave.locator('.sync-stage-buttons button').nth(1).click()
  assert.match(await wave.locator('.response-stage h2').innerText(), /保持/)

  await go(8)
  const parameter = page.locator('.adv-parameters')
  for (let index = 0; index < 4; index++) {
    await parameter.locator('.adv-tabs button').nth(index).click()
    const before = await parameter.locator('.adv-wave').getAttribute('d')
    await parameter.locator('input[type=range]').fill('90')
    assert.notEqual(await parameter.locator('.adv-wave').getAttribute('d'), before)
  }
  await parameter.locator('.adv-reset').click()
  assert.equal(await parameter.locator('input[type=range]').inputValue(), '50')
  for (const viewport of [{ width: 810, height: 1080 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport)
    await page.mouse.move(2, viewport.height - 2)
    await page.waitForTimeout(100)
    assert.equal(await page.locator('#slide-container nav:visible').count(), 0)
  }
  assert.deepEqual(errors, [], 'no browser runtime errors')

  const reduced = await browser.newPage({ reducedMotion: 'reduce' })
  await reduced.goto(`${url}/1`)
  const reducedDrops = reduced.locator('.droplet-layer')
  await reducedDrops.waitFor()
  await reduced.keyboard.press('ArrowRight')
  await reduced.waitForTimeout(80)
  assert.equal(await reducedDrops.getAttribute('data-state'), 'landed')
  assert.equal(await reducedDrops.locator('.deposited-layer').first().evaluate(node => getComputedStyle(node).opacity), '1')
  await reduced.keyboard.press('ArrowLeft')
  await reduced.waitForTimeout(80)
  assert.equal(await reducedDrops.locator('.falling-drops').first().evaluate(node => getComputedStyle(node).opacity), '1')
  await reduced.goto(`${url}/7`)
  await reduced.locator('.wave-layout .play-toggle').waitFor()
  assert.match(await reduced.locator('.play-toggle').innerText(), /播放/)
  const initial = await reduced.locator('.chamber-wall').getAttribute('d')
  await reduced.waitForTimeout(250)
  assert.equal(await reduced.locator('.chamber-wall').getAttribute('d'), initial)
  console.log(`Browser checks passed: ${url} (9 pages, droplet volumes/landing/reversal, block height ratios, layout, reveal, keyboard, pause, waveform, sliders, hidden UI, reduced motion)`)
} finally {
  await browser.close()
}
