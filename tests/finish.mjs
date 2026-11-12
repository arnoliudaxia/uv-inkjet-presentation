import assert from 'node:assert/strict'

export async function testFinish(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 3 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${url}/7`)
  await page.locator('.lesson-slide:visible h1').waitFor()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/8(?:\?|$)/)
  const finish = page.locator('.finish-slide:visible')
  const active = () => page.waitForFunction(() => {
    const el = document.querySelector('.finish-slide[data-running="true"]')
    return el && Number(el.dataset.particles) > 0
  })
  await active()
  assert.equal(await finish.innerText(), 'finish')
  assert.equal(await finish.locator('button').count(), 0)
  const layout = await finish.evaluate(el => {
    const root = el.getBoundingClientRect(), title = el.querySelector('.finish-title').getBoundingClientRect()
    const canvas = el.querySelector('canvas')
    return { dx: title.x + title.width / 2 - root.x - root.width / 2,
      dy: title.y + title.height / 2 - root.y - root.height / 2,
      width: canvas.width, height: canvas.height, pointer: getComputedStyle(canvas).pointerEvents,
      titleZ: getComputedStyle(el.querySelector('.finish-title')).zIndex }
  })
  assert.ok(Math.abs(layout.dx) < 1 && Math.abs(layout.dy) < 1)
  assert.equal(layout.width, 2880)
  assert.equal(layout.height, 1620)
  assert.equal(layout.pointer, 'none')
  assert.equal(layout.titleZ, '1')
  await page.waitForTimeout(1300)
  assert.ok(await finish.locator('canvas').evaluate(canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0)), 'canvas actually painted')
  await page.screenshot({ path: '/tmp/uv-slidev-finish-confetti.png', scale: 'css' })
  await page.waitForFunction(() => document.querySelector('.finish-slide')?.dataset.running === 'false')
  assert.equal(await finish.getAttribute('data-rounds'), '3')
  assert.equal(await finish.getAttribute('data-particles'), '0')
  await page.screenshot({ path: '/tmp/uv-slidev-finish-still.png', scale: 'css' })
  await page.keyboard.press('ArrowLeft')
  await page.waitForURL(/\/7(?:\?|$)/)
  await page.keyboard.press('ArrowRight')
  await active()
  // Retain a reference even if Slidev unmounts the leaving slide.
  await finish.evaluate(el => { window.__finish = el })
  await page.keyboard.press('ArrowLeft')
  await page.waitForURL(/\/7(?:\?|$)/)
  await page.waitForTimeout(150)
  assert.equal(await page.evaluate(() => window.__finish.dataset.running), 'false')
  assert.equal(await page.evaluate(() => window.__finish.dataset.particles), '0')
  await page.keyboard.press('ArrowRight')
  await active()
  // Deterministic visibilitychange, without headless OS tab-focus assumptions.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  assert.equal(await finish.getAttribute('data-running'), 'false')
  assert.equal(await finish.getAttribute('data-particles'), '0')
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await active()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(100)
  assert.equal(await finish.getAttribute('data-running'), 'false')
  assert.equal(await finish.getAttribute('data-particles'), '0')
  await page.reload()
  await finish.waitFor()
  await page.waitForTimeout(300)
  assert.equal(await finish.getAttribute('data-running'), 'false')
  assert.equal(await finish.getAttribute('data-rounds'), '0')
  assert.equal(await finish.getAttribute('data-particles'), '0')
  assert.equal(await finish.evaluate(el => el.getAnimations({ subtree: true }).length), 0)
  assert.deepEqual(errors, [])
  await page.close()
}
