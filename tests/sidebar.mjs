import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

// Fresh contexts catch deep-link CSS loading problems that sequential navigation misses.
const url = (process.env.TEST_URL || 'http://localhost:3000').replace(/\/$/, '')
const screenshots = process.env.SCREENSHOT_DIR || '/tmp/uv-sidebar'
await mkdir(screenshots, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  for (let number = 1; number <= 9; number++) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 810 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${url}/${number}?clicks=${[0, 1, 2, 0, 3, 3, 0, 0, 0][number - 1]}`)
    const root = page.locator(number === 9 ? '.finish-slide:visible' : '.lesson-slide:visible')
    await root.waitFor()
    if (number === 9) {
      assert.equal(await root.innerText(), 'finish')
      assert.equal(await root.locator('aside, [role="complementary"]').count(), 0)
    } else if (number === 1) {
      assert.equal(await root.locator('.outline-card').count(), 6)
      assert.equal(await root.locator('aside, [role="complementary"]').count(), 0)
    } else {
      const sidebar = root.locator('aside, [role="complementary"]')
      assert.equal(await sidebar.count(), 1, `slide ${number}: sidebar exists`)
      const evidence = await sidebar.evaluate(el => {
        const ancestors = []
        for (let node = el; node; node = node.parentElement) {
          const s = getComputedStyle(node)
          ancestors.push({ tag: node.tagName, class: node.className, display: s.display, visibility: s.visibility, opacity: s.opacity })
        }
        const rect = el.getBoundingClientRect()
        const range = document.createRange()
        range.selectNodeContents(el)
        return { ancestors, text: el.innerText, box: rect.toJSON(), textBox: range.getBoundingClientRect().toJSON(), visible: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) }
      })
      console.log(`slide ${number}`, JSON.stringify(evidence))
      assert.ok(evidence.visible, `slide ${number}: visible including ancestors`)
      assert.ok(evidence.text.trim().length > 10)
      assert.ok(evidence.box.width > 200 && evidence.box.height > 100)
      assert.ok(evidence.box.x > 700 && evidence.box.right <= 1441 && evidence.box.bottom <= 811)
      assert.ok(evidence.textBox.width > 100 && evidence.textBox.height > 20)
      for (const ancestor of evidence.ancestors) {
        assert.notEqual(ancestor.display, 'none')
        assert.equal(ancestor.visibility, 'visible')
        assert.ok(Number(ancestor.opacity) > 0)
      }
      if (number === 6) {
        assert.match(evidence.text, /信号接到压电电极/)
        assert.match(evidence.text, /液滴响应不等于电压曲线/)
        for (const selector of ['.adv-explanation h2', '.adv-explanation p']) {
          const text = sidebar.locator(selector)
          assert.ok(await text.isVisible())
          const box = await text.boundingBox()
          assert.ok(box.width > 100 && box.height > 15 && box.x >= evidence.box.x)
        }
      }
    }
    assert.deepEqual(errors, [])
    await page.screenshot({ path: `${screenshots}/page-${number}.png` })
    await page.close()
  }
} finally {
  await browser.close()
}
