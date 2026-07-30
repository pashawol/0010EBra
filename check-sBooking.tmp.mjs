import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = '/Users/pawel/Documents/projects/Kaspor/0010EBra/public'
const PORT = 5226
const OUT = '/private/tmp/claude-501/-Users-pawel-Documents-projects-Kaspor-0010EBra/070b9338-38ad-4ebd-a16a-73f7555539c5/scratchpad/shots'

const MIME = {
	'.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
	'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff',
	'.json': 'application/json', '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
	let p = decodeURIComponent(req.url.split('?')[0])
	if (p === '/') p = '/index.html'
	let fp = path.join(ROOT, p)
	try {
		const data = await readFile(fp)
		const ext = path.extname(fp)
		res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
		res.end(data)
	} catch {
		res.writeHead(404)
		res.end('not found')
	}
})

await new Promise((resolve) => server.listen(PORT, resolve))
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const consoleErrors = []
const pageErrors = []
const netRequests = []

async function newCtxPage(viewport) {
	const context = await browser.newContext({ viewport })
	const page = await context.newPage()
	page.on('pageerror', (err) => pageErrors.push(`[${viewport.width}] ${err.message}`))
	page.on('console', (msg) => {
		if (msg.type() === 'error') consoleErrors.push(`[${viewport.width}] ${msg.text()}`)
	})
	page.on('request', (req) => {
		if (req.method() === 'POST') netRequests.push(`POST ${req.url()}`)
	})
	return { context, page }
}

const results = {}

// ---------------------------------------------------------------------
// 1920 — desktop
// ---------------------------------------------------------------------
{
	const { context, page } = await newCtxPage({ width: 1920, height: 1080 })
	await page.goto(`http://localhost:${PORT}/dev/sBooking.html`, { waitUntil: 'networkidle' })
	const section = page.locator('#sBooking')
	await section.scrollIntoViewIfNeeded()

	// overflow check
	const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
	results.overflow1920 = hasOverflow

	// images decoded
	const imgsOk = await page.evaluate(() =>
		Array.from(document.images).every((img) => img.naturalWidth > 0),
	)
	results.imagesDecoded1920 = imgsOk

	await section.screenshot({ path: `${OUT}/sBooking-1920-default.png` })

	// --- empty submit: errors show, no POST fired ---
	await page.click('.sBooking__submit')
	await page.waitForTimeout(200)
	const nameInvalid = await page.getAttribute('#sBookingName', 'aria-invalid')
	const phoneInvalid = await page.getAttribute('#sBookingPhone', 'aria-invalid')
	const consentInvalid = await page.getAttribute('#sBookingConsent', 'aria-invalid')
	const hintHidden = await page.getAttribute('#sBookingTimeHint', 'hidden')
	results.emptySubmit = { nameInvalid, phoneInvalid, consentInvalid, hintHiddenAfterSubmit: hintHidden }
	await section.screenshot({ path: `${OUT}/sBooking-1920-error.png` })

	// --- fill + mask check ---
	await page.fill('#sBookingName', 'Александра')
	const debugBefore = await page.evaluate(() => ({
		activeId: document.activeElement?.id,
		hasInputmask: !!document.getElementById('sBookingPhone').inputmask,
	}))
	results.debugBefore = debugBefore
	await page.click('#sBookingPhone')
	const debugAfterClick = await page.evaluate(() => document.activeElement?.id)
	results.debugAfterClick = debugAfterClick
	await page.keyboard.type('99203423211', { delay: 30 })
	await page.waitForTimeout(200)
	const phoneValue = await page.inputValue('#sBookingPhone')
	results.phoneMaskValue = phoneValue

	await page.click('label[for="sBookingTime-10-12"]')
	await page.click('label[for="sBookingConsent"]')
	await page.waitForTimeout(200)
	const nameInvalid2 = await page.getAttribute('#sBookingName', 'aria-invalid')
	const hintHidden2 = await page.getAttribute('#sBookingTimeHint', 'hidden')
	const timeChecked = await page.isChecked('#sBookingTime-10-12')
	results.afterFill = { nameInvalid2, hintHiddenAfterSelect: hintHidden2, timeChecked }
	await section.screenshot({ path: `${OUT}/sBooking-1920-filled.png` })

	// --- submit valid form: no network POST ---
	await page.click('.sBooking__submit')
	await page.waitForTimeout(300)
	results.netRequestsAfterValidSubmit = [...netRequests]

	await context.close()
}

// ---------------------------------------------------------------------
// 375 — mobile
// ---------------------------------------------------------------------
{
	const { context, page } = await newCtxPage({ width: 375, height: 812 })
	await page.goto(`http://localhost:${PORT}/dev/sBooking.html`, { waitUntil: 'networkidle' })
	const section = page.locator('#sBooking')
	await section.scrollIntoViewIfNeeded()
	const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
	results.overflow375 = hasOverflow
	await section.screenshot({ path: `${OUT}/sBooking-375-default.png` })

	await page.click('.sBooking__submit')
	await page.waitForTimeout(200)
	await section.screenshot({ path: `${OUT}/sBooking-375-error.png` })

	await page.fill('#sBookingName', 'Александра')
	await page.click('#sBookingPhone')
	await page.keyboard.type('99203423211', { delay: 30 })
	await page.click('label[for="sBookingTime-asap"]')
	await page.click('label[for="sBookingConsent"]')
	await page.waitForTimeout(200)
	await section.screenshot({ path: `${OUT}/sBooking-375-filled.png` })

	await context.close()
}

results.pageErrors = pageErrors
results.consoleErrors = consoleErrors

console.log(JSON.stringify(results, null, 2))

await browser.close()
server.close()
