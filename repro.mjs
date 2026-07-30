import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('file:///Users/pawel/Documents/projects/Kaspor/0010EBra/repro.html')
await page.click('#submit')
console.log('active after submit:', await page.evaluate(() => document.activeElement.id))
await page.click('#b')
console.log('active after click b:', await page.evaluate(() => document.activeElement.id))
await browser.close()
