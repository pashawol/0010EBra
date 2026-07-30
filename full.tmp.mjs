import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
await p.goto('http://localhost:5200/index.html')
await p.waitForTimeout(1500)
const info = await p.evaluate(() => {
  const sections = [...document.querySelectorAll('main > section')].map(s => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height) }))
  const swipers = [...document.querySelectorAll('.swiper')].map(s => ({ in: s.closest('section')?.id, slides: s.swiper?.slides.length ?? 'НЕ ИНИЦИАЛИЗИРОВАН' }))
  const imgs = [...document.querySelectorAll('img')]
  return {
    sections,
    swipers,
    brokenImgs: imgs.filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src')),
    overflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
  }
})
console.log(JSON.stringify(info, null, 1))
await p.screenshot({ path: process.argv[2], fullPage: true })
await b.close()
