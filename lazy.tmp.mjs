import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
await p.goto('http://localhost:5200/index.html')
// прокрутить всю страницу, чтобы отработал lazy-load
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y)
    await new Promise(r => setTimeout(r, 120))
  }
  window.scrollTo(0, 0)
})
await p.waitForTimeout(1500)
const r = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')]
  return {
    total: imgs.length,
    broken: imgs.filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src')),
    overflowAt1920: document.documentElement.scrollWidth <= window.innerWidth + 1,
  }
})
console.log(JSON.stringify(r))
await b.close()
