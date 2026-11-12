import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

// Run against a Slidev dev server or HTTP-served dist. Never starts/stops port 3000.
const url = process.env.TEST_URL || 'http://127.0.0.1:3101'
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${url}/1`)
  await page.locator('.component-card').first().waitFor()
  const anatomy = page.locator('.lesson-slide').filter({ has: page.locator('.anatomy-layout') })
  assert.equal(await page.locator('#deck, #helpDialog, .masthead').count(), 0, 'legacy HTML isolated')
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
  assert.equal(await anatomy.locator('.component-card.revealed').count(), 3)
  await page.keyboard.press('Tab') // release button focus before navigation
  await page.locator('h1').first().click()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/2(?:\?|$)/)
  const cycle = page.locator('.cycle-layout')
  await cycle.locator('.stage-button').nth(2).click()
  assert.match(await cycle.locator('.play-toggle').innerText(), /播放/)
  const path = cycle.locator('.chamber-wall')
  const paused = await path.getAttribute('d')
  await page.waitForTimeout(250)
  assert.equal(await path.getAttribute('d'), paused, 'pause freezes geometry')
  assert.equal(await cycle.locator('.drop-motion').getAttribute('opacity'), '1', 'detached drop at stage midpoint')
  await cycle.locator('.play-toggle').focus()
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
  assert.match(page.url(), /\/2(?:\?|$)/, 'button Space does not navigate')
  assert.match(await cycle.locator('.play-toggle').innerText(), /暂停/)
  assert.notEqual(await path.getAttribute('d'), paused, 'clock advances while playing')
  await cycle.locator('.stage-button').nth(1).click()
  const compression = await path.getAttribute('d')
  await page.locator('.lesson-slide:visible h1').click()
  await page.keyboard.press('ArrowRight')
  await page.waitForURL(/\/3(?:\?|$)/)
  const wave = page.locator('.wave-layout')
  assert.equal(await wave.locator('.chamber-wall').getAttribute('d'), compression, 'cross-page clock preserved')
  assert.match(await wave.locator('.response-stage h2').innerText(), /压缩/)
  const cursor = wave.locator('.wave-cursor circle')
  assert.equal(Number(await cursor.getAttribute('cx')), 70 + .375 * 685)
  await wave.locator('.quiet-button').click()
  assert.match(await wave.locator('.response-stage h2').innerText(), /喷出/)
  assert.equal(Number(await cursor.getAttribute('cx')), 70 + .625 * 685)
  for (const viewport of [{width:1440,height:810},{width:810,height:1080},{width:1920,height:1080}]) {
    await page.setViewportSize(viewport)
    await page.mouse.move(2, viewport.height - 2)
    await page.waitForTimeout(150)
    assert.equal(await page.locator('#slide-container nav:visible').count(), 0, 'hover/portrait toolbar hidden')
    assert.equal(await page.locator('.lesson-slide:visible').count(), 1)
  }
  await page.screenshot({ path: '/tmp/uv-slidev-browser.png' })
  assert.deepEqual(errors, [], 'no runtime errors')
  const reduced = await browser.newPage({ reducedMotion: 'reduce' })
  await reduced.goto(`${url}/2`)
  await reduced.locator('.cycle-layout .play-toggle').waitFor()
  assert.match(await reduced.locator('.cycle-layout .play-toggle').innerText(), /播放/, 'reduced motion defaults paused')
  const wall = reduced.locator('.cycle-layout .chamber-wall')
  const initial = await wall.getAttribute('d')
  await reduced.waitForTimeout(250)
  assert.equal(await wall.getAttribute('d'), initial)
  console.log(`Browser checks passed: ${url} (reveal, keyboard, pause, stages, sync, hidden UI, reduced motion)`)
} finally {
  await browser.close()
}
