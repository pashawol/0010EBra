import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = '/Users/pawel/Documents/projects/Kaspor/0010EBra/public'
const PORT = 5227
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2' }

const server = createServer(async (req, res) => {
	let p = decodeURIComponent(req.url.split('?')[0])
	if (p === '/') p = '/index.html'
	try {
		const data = await readFile(path.join(ROOT, p))
		res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' })
		res.end(data)
	} catch {
		res.writeHead(404)
		res.end('not found')
	}
})
await new Promise((r) => server.listen(PORT, r))

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (m) => console.log('CONSOLE', m.type(), m.text()))
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
page.on('requestfailed', (r) => console.log('REQFAILED', r.url(), r.failure()?.errorText))

await page.goto(`http://localhost:${PORT}/dev/sBooking.html`, { waitUntil: 'networkidle' })

const hasInputmask = await page.evaluate(() => typeof window.Inputmask)
console.log('typeof Inputmask:', hasInputmask)
const hasJSCCommon = await page.evaluate(() => typeof window.JSCCommon)
console.log('typeof JSCCommon:', hasJSCCommon)

const telCount = await page.evaluate(() => document.querySelectorAll('input[type="tel"]').length)
console.log('tel inputs on page:', telCount)

await page.click('#sBookingPhone')
await page.keyboard.type('9920342321', { delay: 30 })
await page.waitForTimeout(300)
const val = await page.inputValue('#sBookingPhone')
console.log('value after typing:', JSON.stringify(val))

const maskAttached = await page.evaluate(() => {
	const el = document.getElementById('sBookingPhone')
	return { hasPattern: el.getAttribute('pattern'), hasInputmaskProp: !!el.inputmask }
})
console.log('mask attached info:', maskAttached)

await browser.close()
server.close()
