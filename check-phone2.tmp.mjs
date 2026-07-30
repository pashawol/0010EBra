import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = '/Users/pawel/Documents/projects/Kaspor/0010EBra/public'
const PORT = 5228
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

// replicate: click submit empty first
await page.click('.sBooking__submit')
await page.waitForTimeout(200)

const box = await page.locator('#sBookingPhone').boundingBox()
console.log('boundingBox after submit:', box)
const elAtPoint = await page.evaluate(([x, y]) => {
	const el = document.elementFromPoint(x, y)
	return el ? el.outerHTML.slice(0, 120) : null
}, [box.x + box.width / 2, box.y + box.height / 2])
console.log('elementFromPoint at phone center:', elAtPoint)

await browser.close()
server.close()
