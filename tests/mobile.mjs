import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const url = process.env.TEST_URL || 'http://127.0.0.1:3000'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  page.on('pageerror', e => errors.push(e.message))
  const go = async (n, clicks = 0) => {
    await page.goto(`${url}/${n}?clicks=${clicks}`)
    await page.locator('#slide-content .slidev-page:visible').waitFor()
    await page.waitForTimeout(850)
  }
  const state = () => [new URL(page.url()).pathname, Number(new URL(page.url()).searchParams.get('clicks'))]
  const tap = async name => { await page.getByRole('button', { name, exact: true }).tap(); await page.waitForTimeout(200) }
  await go(1)
  assert.equal(await page.getByRole('button', { name: '上一步', exact: true }).isDisabled(), true)
  await tap('下一步'); assert.deepEqual(state(), ['/1', 1])
  await tap('下一步'); assert.deepEqual(state(), ['/2', 0])
  await tap('上一步'); assert.deepEqual(state(), ['/1', 1])
  await tap('上一步'); assert.deepEqual(state(), ['/1', 0])

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    const portrait = viewport.height > viewport.width
    for (let n = 1; n <= 8; n++) {
      for (let clicks = 0; clicks <= [1, 2, 0, 3, 3, 0, 0, 0][n - 1]; clicks++) {
        await go(n, clicks)
        const result = await page.evaluate(() => {
          const content = document.querySelector('#slide-content')
          const box = content.getBoundingClientRect()
          const root = content.querySelector('.lesson-slide, .finish-slide')
          const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'
          const outside = [...root.querySelectorAll('h1,h2,h3,p,button,input,svg,canvas')].filter(visible).filter(el => {
            const r = el.getBoundingClientRect()
            return r.left < box.left - 2 || r.top < box.top - 2 || r.right > box.right + 2 || r.bottom > box.bottom + 2
          }).map(el => el.tagName + ':' + el.textContent.slice(0, 30))
          const overlap = [...document.querySelectorAll('.mobile-deck-controls button')].some(el => {
            const r = el.getBoundingClientRect()
            return r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top
          })
          return { outside, overlap, box: box.toJSON(), scale: Number(getComputedStyle(content).getPropertyValue('--slidev-slide-scale')), rotated: document.documentElement.classList.contains('mobile-deck-portrait'), count: document.querySelectorAll('.mobile-deck-controls').length }
        })
        assert.equal(result.rotated, portrait)
        assert.equal(result.count, 1)
        assert.deepEqual(result.outside, [], `/${n}?clicks=${clicks} outside canvas`)
        assert.equal(result.overlap, false, 'navigation has its own rails')
        assert.ok(result.box.left >= -1 && result.box.top >= -1 && result.box.right <= viewport.width + 1 && result.box.bottom <= viewport.height + 1)
        assert.ok(Math.abs(result.scale - Math.min(748 / 1440, 390 / 810)) < .00001, 'single native Slidev scale')
        assert.equal(await page.locator('#slide-container nav:visible').count(), 0)
        if ([1, 3, 6, 8].includes(n) && clicks === 0)
          await page.screenshot({ path: `/tmp/uv-mobile-${portrait ? 'portrait' : 'landscape'}-${n}.png` })
      }
    }
    assert.equal(await page.getByRole('button', { name: '下一步', exact: true }).isDisabled(), true)
    await tap('上一步'); assert.deepEqual(state(), ['/7', 0])
  }
  // Orientation/visual viewport updates without remounting or resetting clicks.
  await go(1, 1)
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(300)
    assert.deepEqual(state(), ['/1', 1])
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('mobile-deck-portrait')), viewport.width < viewport.height)
  }
  // Existing teaching controls remain touch-operable, without navigation.
  await go(6)
  const play = page.locator('.lesson-slide:visible .play-toggle')
  const before = await play.innerText()
  await play.tap(); await page.waitForTimeout(100)
  assert.notEqual(await play.innerText(), before)
  assert.deepEqual(state(), ['/6', 0])
  // Physical-coordinate swipes must not trigger Slidev's default navigation.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 600, y: 80 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300, y: 80 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(200)
  assert.deepEqual(state(), ['/6', 0])
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await go(8)
  assert.equal(await page.locator('.mobile-next').evaluate(e => getComputedStyle(e).animationName), 'none')

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 810 }, hasTouch: false })
  for (const viewport of [{ width: 1440, height: 810 }, { width: 390, height: 844 }]) {
    await desktop.setViewportSize(viewport)
    await desktop.goto(`${url}/1`)
    await desktop.locator('.lesson-slide:visible').waitFor()
    await desktop.waitForTimeout(300)
    assert.equal(await desktop.locator('.mobile-deck-controls').count(), 0)
    assert.equal(await desktop.locator('#page-root').evaluate(e => getComputedStyle(e).transform), 'none')
    const scale = await desktop.locator('#slide-content').evaluate(e => Number(getComputedStyle(e).getPropertyValue('--slidev-slide-scale')))
    assert.ok(Math.abs(scale - Math.min(viewport.width / 1440, viewport.height / 810)) < .00001)
    await desktop.keyboard.press('ArrowRight'); await desktop.waitForTimeout(150)
    assert.equal(new URL(desktop.url()).searchParams.get('clicks'), '1')
  }
  assert.deepEqual(errors, [])
  console.log('Mobile: all 8 slides/all click states, rails/bounds, touch steps, finish guard, resize, desktop and reduced motion passed')
} finally { await browser.close() }
