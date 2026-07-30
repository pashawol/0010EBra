import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1920, height: 1000 } })
const errs = []
p.on('pageerror', e => errs.push(e.message.slice(0, 150)))
p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url().split('/').pop()) })
await p.goto('http://localhost:5200/index.html')
await p.waitForTimeout(1200)
// состояние слайдера ДО клика
const el = p.locator('#sExpertise .swiper')
const before = await el.evaluate(n => ({ inited: !!n.swiper, index: n.swiper?.realIndex, slides: n.swiper?.slides.length, bullets: n.closest('#sExpertise').querySelectorAll('.swiper-pagination-bullet').length }))
await p.locator('#sExpertise .swiper-button-next').click()
await p.waitForTimeout(700)
const after = await el.evaluate(n => ({ index: n.swiper?.realIndex, translate: Math.round(n.swiper?.translate || 0) }))
console.log(JSON.stringify({ before, after, errs: [...new Set(errs)] }, null, 1))
await b.close()
