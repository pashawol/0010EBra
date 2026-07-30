import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = '/Users/pawel/Documents/projects/Kaspor/0010EBra/public'
const PORT = 5245
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

console.log('--- checkValidity() on phone, no submit click ---')
await page.evaluate(() => document.getElementById('sBookingPhone').checkValidity())
await page.click('#sBookingPhone')
console.log('active after checkValidity+click:', await page.evaluate(() => document.activeElement.id))

console.log('--- now try clicking the REAL submit BUTTON element (not form.requestSubmit) ---')
// reset by clicking name
await page.click('#sBookingName')
console.log('active after clicking name:', await page.evaluate(() => document.activeElement.id))

// dispatch submit programmatically without a click (bypass click handler noise)
await page.evaluate(() => document.getElementById('sBookingForm').requestSubmit())
await page.waitForTimeout(100)
console.log('active after requestSubmit:', await page.evaluate(() => document.activeElement.id))
await page.click('#sBookingPhone')
console.log('active after click phone (post requestSubmit):', await page.evaluate(() => document.activeElement.id))

await browser.close()
server.close()
