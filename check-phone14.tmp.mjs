import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = '/Users/pawel/Documents/projects/Kaspor/0010EBra/public'
const PORT = 5239
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
	let p = decodeURIComponent(req.url.split('?')[0])
	if (p === '/') p = '/index.html'
	try {
		const data = await readFile(path.join(ROOT, p))
		res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' })
		res.end(data)
	} catch { res.writeHead(404); res.end('not found') }
})
await new Promise((r) => server.listen(PORT, r))
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
await page.goto(`http://localhost:${PORT}/dev/sBooking.html`, { waitUntil: 'networkidle' })

console.log('--- click submit ---')
await page.click('.sBooking__submit')
await page.waitForTimeout(50)
console.log('active:', await page.evaluate(() => document.activeElement.id))

console.log('--- immediately click phone (skip name) ---')
await page.click('#sBookingPhone')
console.log('active:', await page.evaluate(() => document.activeElement.id))

console.log('--- try clicking CONSENT label now ---')
await page.click('label[for="sBookingConsent"]')
console.log('active:', await page.evaluate(() => document.activeElement.id))
console.log('consent checked:', await page.isChecked('#sBookingConsent'))

await browser.close()
server.close()
