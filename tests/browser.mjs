import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { testFinish } from './finish.mjs'

const url = process.env.TEST_URL || 'http://127.0.0.1:3101'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  async function go(number, clicks = 0) {
    await page.goto(`${url}/${number}${clicks ? `?clicks=${clicks}` : ''}`)
    await page.locator('.lesson-slide:visible h1').waitFor()
    await page.waitForTimeout(200)
  }
  const inkPalette = ['rgb(0, 166, 223)', 'rgb(230, 0, 126)', 'rgb(255, 213, 0)', 'rgb(64, 84, 220)']
  const clickCounts = [0, 1, 2, 0, 3, 3, 0, 0]
  for (let number = 1; number <= 8; number++) {
    await go(number, clickCounts[number - 1])
    assert.equal(await page.locator('.lesson-slide:visible').count(), 1)
    const light = await page.locator('.lesson-slide:visible').evaluate(root => {
      const luminance = color => {
        const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number)
        return rgb.reduce((sum, channel) => sum + channel, 0) / 3
      }
      const panel = root.querySelector('.outline-grid, .droplet-visual, .story-visual, .visual-panel, .adv-panel')
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
  assert.equal(await page.locator('.lesson-slide:visible h1').innerText(), '演示大纲')
  const outline = page.locator('.lesson-slide:visible .outline-card')
  assert.deepEqual(await outline.allTextContents().then(texts => texts.map(t => t.trim().replace(/^\d+\s*/, ''))), ['液滴体积与层高差异', '抽点补偿与流动补缺', '随机混色与局部起伏', '喷头结构', '驱动波形与液滴喷射', '表面形貌测量'])
  for (const target of [2, 3, 4, 5, 6, 8]) {
    await page.locator(`.lesson-slide:visible .outline-card[data-page="${target}"]`).click()
    await page.waitForURL(new RegExp(`/${target}(?:\\?|$)`))
    assert.equal(Number(new URL(page.url()).searchParams.get('clicks')), 0)
    await page.goBack()
    await page.waitForURL(/\/1(?:\?|$)/)
  }
  await page.locator('.lesson-slide:visible h1').click()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/2(?:\?|$)/)
  await page.keyboard.press('ArrowLeft')
  await page.waitForURL(/\/1(?:\?|$)/)
  await go(2)
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
  assert.match(page.url(), /\/2(?:\?|$)/)
  assert.deepEqual(await drops.locator('.deposited-layer').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).transform)), Array(4).fill('matrix(1, 0, 0, 1, 0, 0)'))
  await page.screenshot({ path: '/tmp/uv-slidev-droplets-landed.png' })
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(1100)
  await assertDropState(false)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1100)
  await assertDropState(true)
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/3(?:\?|$)/)
  await page.waitForTimeout(250)
  assert.match(await page.locator('.lesson-slide:visible h1').innerText(), /同样的层数/)

  await go(3)
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
      assert.ok(Math.abs(s.initial - 46800) < 1e-6)
      assert.equal(s.final, 46800)
      assert.ok(Math.abs(s.initialHeights.reduce((a, b) => a + b) * 650 / s.initialHeights.length - s.final) < 1e-6, 'initial volume includes precursor film')
      assert.ok(Math.abs(s.area - 46800) < 1e-6, 'column area remains constant')
      assert.ok(Math.abs(s.polygonArea - 46800) < .1, 'actual rendered polygon conserves area')
      assert.ok(s.heights.every(h => h >= .35 - 1e-9 && h <= Math.max(...s.initialHeights)))
      assert.ok(Math.abs(s.heights.reduce((a, b) => a + b) / s.heights.length - 72) < 1e-6)
    }
    return samples
  }
  const early = await sampleFlow()
  assert.ok(early.every(s => s.progress < .2))
  assert.equal(early[0].initialHeights.length, 128)
  assert.ok(Math.max(...early[0].heights) > 110 && Math.min(...early[0].heights) < 10)
  assert.ok(early[0].initialHeights.filter(h => h === .35).length > 32, 'visible gaps above a thin wetting film')
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(450)
    const mid = await sampleFlow()
    assert.ok(mid.every(s => s.progress > early[0].progress && s.progress < 1))
    assert.ok(Math.max(...mid[0].heights) < Math.max(...early[0].heights))
    assert.ok(Math.min(...mid[0].heights) > Math.min(...early[0].heights))
    if (i === 1) await page.screenshot({ path: '/tmp/uv-slidev-blocks-flow-mid.png' })
  }
  await page.waitForFunction(() => document.querySelector('.lesson-slide .flow-leveling')?.dataset.progress === '1')
  const settled = await sampleFlow()
  assert.ok(settled.every(s => s.progress === 1 && s.heights.every(h => Math.abs(h - 72) < .2)))
  assert.equal(await flow.first().getAttribute('data-running'), 'true', 'loop remains running during settled hold')
  await page.screenshot({ path: '/tmp/uv-slidev-blocks-flow-settled.png' })
  await page.waitForFunction(() => Number(document.querySelector('.lesson-slide .flow-leveling')?.dataset.progress) < .1)
  assert.equal(await flow.getAttribute('data-running'), 'true')
  assert.ok((await sampleFlow()).every(s => s.progress < .2), 'next cycle resets the conservative model')
  // Return to the original state and re-enter: a fresh conservative animation, not a cached end frame.
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(80)
  assert.equal(await flow.count(), 0)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(80)
  assert.ok((await sampleFlow()).every(s => s.progress < .1))
  await page.screenshot({ path: '/tmp/uv-slidev-blocks-flow-start.png' })
  // Deterministic visibility event: hide cancels, show restarts without elapsed catch-up.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(40)
  const pausedProgress = await flow.getAttribute('data-progress')
  assert.equal(await flow.getAttribute('data-running'), 'false')
  await page.waitForTimeout(150)
  assert.equal(await flow.getAttribute('data-progress'), pausedProgress)
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(80)
  assert.equal(await flow.getAttribute('data-running'), 'true')
  assert.ok(Number(await flow.getAttribute('data-progress')) < .1)
  // Page departure must cancel RAF even when Slidev retains a neighbouring slide instance.
  await page.keyboard.press('ArrowDown')
  await page.waitForURL(/\/4(?:\?|$)/)
  const hiddenFlow = page.locator('.flow-leveling')
  const stopped = await hiddenFlow.evaluateAll(nodes => nodes.map(n => [n.dataset.progress, n.dataset.running]))
  assert.ok(stopped.every(([, running]) => running === 'false'))
  await page.waitForTimeout(200)
  assert.deepEqual(await hiddenFlow.evaluateAll(nodes => nodes.map(n => [n.dataset.progress, n.dataset.running])), stopped)
  await page.keyboard.press('ArrowUp')
  await page.waitForURL(/\/3(?:\?|$)/)
  // Direct links also replay the middle stage.
  await go(3, 1)
  assert.ok((await sampleFlow()).every(s => s.progress < .2))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(80)
  assert.ok((await sampleFlow()).every(s => s.progress === 1 && s.heights.every(h => Math.abs(h - 72) < .2)))
  assert.deepEqual(await flow.locator('polygon').evaluateAll(nodes => nodes.map(n => getComputedStyle(n).fill)), [inkPalette[0]])
  assert.equal(await flow.getAttribute('data-running'), 'false', 'reduced motion never loops')
  await page.waitForTimeout(1200)
  assert.equal(await flow.getAttribute('data-progress'), '1')
  assert.equal(await flow.getAttribute('data-running'), 'false')
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
  await go(3, 2)
  assert.deepEqual(await blocks.locator('.story-number').allTextContents(), ['0.50', '0.50', '0.50', '0.50'])
  assert.deepEqual(await blocks.locator('.compensation-mask').evaluateAll(groups => groups.map(group => group.innerHTML)), mask.map(group => group.markup), 'fixed masks are deterministic')

  await page.locator('.lesson-slide:visible h1').click()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/4(?:\?|$)/)

  await go(4)
  const random = page.locator('.lesson-slide:visible .random-ink-demo')
  assert.equal(await random.locator('button, .story-step, .story-target, .story-foot, .story-progress').count(), 0)
  assert.equal(await random.locator('.story-card').count(), 1)
  const meshes = await random.locator('.ink-column').evaluateAll(columns => columns.map(column => {
    const top = [...column.querySelectorAll('.plan-cell')].map(n => getComputedStyle(n).fill)
    const faces = [...column.querySelectorAll('.iso-cell')]
    const bottom = Array(96)
    faces.forEach(n => { bottom[Number(n.dataset.cell)] = getComputedStyle(n).fill })
    const svg = column.querySelector('.iso-ink-surface')
    const box = svg.getBBox(), view = svg.viewBox.baseVal
    return { top, bottom, heights: faces.flatMap(n => n.dataset.heights.split(',').map(Number)), bounded: box.x >= 0 && box.y >= 0 && box.x + box.width <= view.width && box.y + box.height <= view.height }
  }))
  for (const mesh of meshes) {
    assert.equal(mesh.top.length, 96)
    assert.deepEqual(mesh.bottom, mesh.top, '96 projected cells match their own plan by row/column')
    assert.deepEqual([...new Set(mesh.top)].sort(), [...inkPalette].sort())
    assert.ok(mesh.bounded, 'all projected geometry stays within SVG viewBox')
  }
  assert.equal(new Set(meshes[0].heights).size, 1)
  assert.ok(Math.max(...meshes[1].heights) - Math.min(...meshes[1].heights) > 30)
  const staticMarkup = await random.innerHTML()
  await page.waitForTimeout(1100)
  assert.equal(await random.innerHTML(), staticMarkup, 'no automatic animation')
  await page.screenshot({ path: '/tmp/uv-slidev-random-static.png' })
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/5(?:\?|$)/)
  await page.locator('.lesson-slide:visible .anatomy-layout').waitFor()
  assert.equal(await page.locator('.lesson-slide:visible .component-card.revealed').count(), 0)
  await page.keyboard.press('ArrowLeft')
  await page.waitForURL(/\/4(?:\?|$)/)
  assert.equal(Number(new URL(page.url()).searchParams.get('clicks') || 0), 0)
  assert.equal(await random.innerHTML(), staticMarkup)
  await page.keyboard.press('ArrowLeft')
  await page.waitForURL(/\/3(?:\?|$)/)
  assert.equal(Number(new URL(page.url()).searchParams.get('clicks')), 2)

  await go(5)
  assert.equal(await page.locator('.lesson-slide:visible h1').innerText(), '先看喷头结构')
  assert.ok((await page.locator('.lesson-slide:visible').innerText()).includes('整个喷头可以抽象为墨路、压电陶瓷、喷嘴三个部份'))
  const anatomy = page.locator('.anatomy-layout')
  assert.equal(await anatomy.locator('.panel-label span').count(), 0)
  assert.equal(await anatomy.locator('.component-card.revealed').count(), 0)
  assert.equal(await anatomy.locator('.detail-box').count(), 0)
  const assembly = anatomy.locator('.anatomy-assembly')
  const primitives = 'path,rect,circle,ellipse,line,polyline,polygon,text,image,use'
  assert.equal(await assembly.locator(primitives).count(), 0, 'click 0 has no actual SVG primitives')
  assert.equal(await anatomy.locator('.component-card:visible').count(), 0)
  await page.screenshot({ path: '/tmp/uv-anatomy-click-0.png' })
  for (const [i, key] of ['ArrowRight', 'Space', 'ArrowRight'].entries()) {
    await page.keyboard.press(key)
    await page.waitForTimeout(80)
    const modules = assembly.locator('.assembly-module')
    assert.equal(await modules.count(), i + 1)
    assert.equal(await assembly.locator('[data-part="nozzle"]').count(), i === 2 ? 1 : 0)
    const moving = await modules.last().evaluate(el => ({
      transform: getComputedStyle(el).transform,
      duration: getComputedStyle(el).animationDuration,
      entryX: getComputedStyle(el).getPropertyValue('--entry-x').trim(),
      entryY: getComputedStyle(el).getPropertyValue('--entry-y').trim(),
    }))
    assert.notEqual(moving.transform, 'matrix(1, 0, 0, 1, 0, 0)', 'actual module enters from outside its final position')
    assert.equal(moving.duration, '0.65s')
    if (i === 2) {
      assert.equal(moving.entryX, '0px')
      assert.equal(moving.entryY, '145px')
      const nozzle = assembly.locator('[data-part="nozzle"]')
      assert.equal(await nozzle.locator('path').count(), 4)
      assert.equal(await nozzle.locator('text').count(), 2, 'labels enter with the nozzle')
      assert.equal(await nozzle.locator('.housing, .assembly-ink, .edge').count(), 3)
    }
    await page.waitForTimeout(700)
    assert.deepEqual(await modules.evaluateAll(nodes => nodes.map(el => getComputedStyle(el).transform)), Array(i + 1).fill('matrix(1, 0, 0, 1, 0, 0)'))
    assert.equal(await anatomy.locator('.component-card:visible').count(), i + 1)
    assert.equal(await assembly.locator('.nozzle-module .nozzle-ink').count(), i + 1 >= 3 ? 1 : 0)
    assert.equal(await assembly.locator('.supply-module .nozzle-ink').count(), 0)
    assert.equal(await assembly.locator('.assembly-wall').count(), i >= 1 ? 1 : 0)
    await page.screenshot({ path: `/tmp/uv-anatomy-click-${i + 1}.png` })
  }
  const joins = await assembly.evaluate(svg => {
    const box = selector => svg.querySelector(selector).getBBox()
    const chamber = box('.supply-ink'), nozzle = box('.nozzle-ink'), wall = box('.assembly-wall')
    return { chamberBottom: chamber.y + chamber.height, nozzleTop: nozzle.y, wallY: wall.y }
  })
  assert.equal(joins.chamberBottom, 330)
  assert.equal(joins.nozzleTop, 329, 'ink overlaps at outlet to avoid antialiasing seam')
  assert.equal(joins.wallY, 205)
  for (const count of [2, 1, 0]) {
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    assert.equal(await assembly.locator('.assembly-module').count(), count)
    assert.equal(await assembly.locator('[data-part="nozzle"]').count(), 0)
    assert.equal(await assembly.locator('.nozzle-ink').count(), count >= 3 ? 1 : 0)
  }
  assert.equal(await assembly.locator(primitives).count(), 0, 'back to zero removes all geometry')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(80)
  assert.notEqual(await assembly.locator('.supply-module').evaluate(el => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 0, 0)', 'forward replays assembly')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(750)
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

  async function assertStaticMetrology() {
    const metrology = page.locator('.lesson-slide:visible .adv-metrology')
    assert.equal(await metrology.count(), 1)
    assert.equal(await page.locator('.lesson-slide:visible h1').innerText(), '最后，用表面形貌验证。')
    assert.equal(await metrology.locator('.adv-explanation h2').innerText(), '平均值 ≠ 局部起伏')
    assert.equal(await metrology.locator('.adv-explanation p').innerText(), '平均层厚需相对共同基底求取；截面的局部起伏用于观察不均匀，不能只用平均值代替。')
    assert.equal(await metrology.locator('.adv-kicker').innerText(), '表面测量与反馈')
    assert.equal(await metrology.locator('.adv-help, .adv-reveal, .is-hidden, [aria-hidden="true"]').count(), 0)
    assert.doesNotMatch(await metrology.innerText(), /先看空间分布|复测才形成闭环|揭示截面|逆向收起|0\s*\/\s*2/)
    assert.equal(await metrology.locator('.adv-profile').count(), 2)
    for (const profile of await metrology.locator('.adv-profile').all()) {
      assert.equal(await profile.isVisible(), true)
      assert.equal(await profile.locator('.adv-wave').isVisible(), true)
    }
    assert.equal(await metrology.locator('.adv-loop').isVisible(), true)
    assert.deepEqual(await metrology.locator('.adv-loop span').allTextContents(), ['测量', '修正工艺', '复测 ↺'])
    assert.equal(await metrology.locator('.adv-specs h3').innerText(), '测量需求 · 待设备验证')
    assert.deepEqual(await metrology.locator('.adv-specs dd').allTextContents(), ['约 1 μm', '≥ 100 μm', '大约 1 cm 级'])
    assert.ok(await metrology.locator('*').evaluateAll(nodes => nodes.every(node => {
      const style = getComputedStyle(node)
      return style.animationName === 'none' && style.transitionDuration === '0s' && style.visibility === 'visible' && style.opacity === '1'
    })), 'all metrology content is static and visible without advancing')
    const markup = await metrology.innerHTML()
    await page.waitForTimeout(350)
    assert.equal(await metrology.innerHTML(), markup)
  }
  // Enter from the preceding slide: no additional clicks reveal the content.
  await page.locator('.lesson-slide:visible h1').click()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/8(?:\?|$)/)
  await page.locator('.wave-layout').waitFor({ state: 'hidden' })
  await assertStaticMetrology()
  await page.keyboard.press('ArrowLeft')
  await page.waitForURL(/\/7(?:\?|$)/)
  await go(8)
  assert.equal(new URL(page.url()).searchParams.has('clicks'), false)
  await assertStaticMetrology()
  await page.screenshot({ path: '/tmp/uv-slidev-metrology-static.png' })
  for (const viewport of [{ width: 810, height: 1080 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport)
    await page.mouse.move(2, viewport.height - 2)
    await page.waitForTimeout(100)
    assert.equal(await page.locator('#slide-container nav:visible').count(), 0)
  }
  assert.deepEqual(errors, [], 'no browser runtime errors')

  const reduced = await browser.newPage({ reducedMotion: 'reduce' })
  await reduced.goto(`${url}/2`)
  const reducedDrops = reduced.locator('.droplet-layer')
  await reducedDrops.waitFor()
  await reduced.keyboard.press('ArrowRight')
  await reduced.waitForTimeout(80)
  assert.equal(await reducedDrops.getAttribute('data-state'), 'landed')
  assert.equal(await reducedDrops.locator('.deposited-layer').first().evaluate(node => getComputedStyle(node).opacity), '1')
  await reduced.keyboard.press('ArrowLeft')
  await reduced.waitForTimeout(80)
  assert.equal(await reducedDrops.locator('.falling-drops').first().evaluate(node => getComputedStyle(node).opacity), '1')
  await reduced.goto(`${url}/5`)
  await reduced.locator('.anatomy-assembly').waitFor()
  assert.equal(await reduced.locator('.anatomy-assembly path').count(), 0)
  for (let step = 1; step <= 3; step++) {
    await reduced.keyboard.press('ArrowRight')
    await reduced.waitForTimeout(80)
    const modules = reduced.locator('.anatomy-assembly .assembly-module')
    assert.equal(await modules.count(), step)
    assert.deepEqual(await modules.evaluateAll(nodes => nodes.map(el => [getComputedStyle(el).animationName, getComputedStyle(el).transform])), Array.from({ length: step }, () => ['none', 'matrix(1, 0, 0, 1, 0, 0)']))
    assert.equal(await reduced.locator('.anatomy-assembly .nozzle-ink').count(), step >= 3 ? 1 : 0)
    assert.equal(await reduced.locator('.anatomy-assembly [data-part="nozzle"]').count(), step === 3 ? 1 : 0)
  }
  await reduced.goto(`${url}/7`)
  await reduced.locator('.wave-layout .play-toggle').waitFor()
  assert.match(await reduced.locator('.play-toggle').innerText(), /播放/)
  const initial = await reduced.locator('.chamber-wall').getAttribute('d')
  await reduced.waitForTimeout(250)
  assert.equal(await reduced.locator('.chamber-wall').getAttribute('d'), initial)
  await testFinish(browser, url)
  console.log(`Browser checks passed: ${url} (9 pages, outline links/back navigation, finish confetti/lifecycle/reduced motion, droplet volumes/landing/reversal, block height ratios, layout, reveal, keyboard, pause, waveform, metrology, hidden UI, reduced motion)`)
} finally {
  await browser.close()
}
