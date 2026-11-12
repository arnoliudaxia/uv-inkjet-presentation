import assert from 'node:assert/strict'
import { mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

// Uses the existing development server; never starts/stops it or changes slide content.
const base = (process.env.TEST_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const output = fileURLToPath(new URL('../docs/screenshots/', import.meta.url))
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1,
    isMobile: false, hasTouch: false, reducedMotion: 'no-preference',
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const clicks = [0, 0, 0, 0, 3, 3, 0, 0, 0]
  for (let number = 1; number <= 9; number++) {
    await page.goto(`${base}/${number}?clicks=${clicks[number - 1]}`)
    const root = page.locator(number === 9 ? '.finish-slide:visible' : '.lesson-slide:visible')
    await root.waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.mouse.move(0, 0)
    if (number === 9) {
      await page.waitForFunction(() => Number(document.querySelector('.finish-slide[data-running="true"]')?.dataset.particles) > 0)
      await page.waitForTimeout(1200)
      assert.ok(await root.locator('canvas').evaluate(canvas =>
        canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0)), 'visible confetti')
    } else {
      // Layer stacks and assembly transitions must finish before capture.
      await page.waitForTimeout(2000)
      if (number === 7) {
        await root.getByRole('button', { name: '推', exact: true }).click()
        await page.mouse.move(0, 0)
        await page.waitForTimeout(300)
      }
    }
    assert.equal(await page.locator('#slide-container nav:visible, .mobile-deck-controls:visible').count(), 0)
    const box = await root.boundingBox()
    assert.ok(Math.abs(box.width - 1440) < 1 && Math.abs(box.height - 810) < 1, 'full desktop canvas')
    const path = `${output}slide-${String(number).padStart(2, '0')}.png`
    await page.screenshot({ path, clip: { x: 0, y: 0, width: 1440, height: 810 }, scale: 'css' })
    console.log(`${path} (${(await stat(path)).size} bytes) — ${await root.locator(number === 9 ? '.finish-title' : 'h1').innerText()}`)
  }
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
}
