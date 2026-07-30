import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = '/Users/pawel/Documents/projects/Kaspor/0010EBra/public'
const PORT = 5231
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
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()
await page.goto(`http://localhost:${PORT}/dev/sBooking.html`, { waitUntil: 'networkidle' })

console.log('STEP A: click phone directly, no prior interaction')
await page.click('#sBookingPhone')
console.log('active:', await page.evaluate(() => document.activeElement.id))

console.log('STEP B: click submit')
await page.click('.sBooking__submit')
await page.waitForTimeout(100)
console.log('active after submit:', await page.evaluate(() => document.activeElement.id))

console.log('STEP C: click phone again')
await page.click('#sBookingPhone')
console.log('active after 2nd phone click:', await page.evaluate(() => document.activeElement.id))

await browser.close()
server.close()
