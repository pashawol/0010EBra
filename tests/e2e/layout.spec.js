import { test, expect } from '@playwright/test'

// Страницы-стенды готовых блоков. Список ОБЯЗАН пополняться на каждый новый
// блок — иначе он не проверяется ни на оверфлоу, ни на a11y вообще.
const PAGES = ['/', '/00-modal.html', '/01-ui-kit.html']
const VIEWPORTS = [
	{ name: 'mobile', width: 375, height: 812 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'desktop', width: 1280, height: 900 },
]

for (const page of PAGES) {
	for (const vp of VIEWPORTS) {
		test(`${page} — no horizontal overflow at ${vp.name} (${vp.width}px)`, async ({ page: pw }) => {
			await pw.setViewportSize({ width: vp.width, height: vp.height })
			await pw.goto(page)
			const overflow = await pw.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth + 1,
			)
			expect(overflow).toBe(true)
		})
	}
}

test('index.html — все секции макета отрисованы и имеют ненулевую высоту', async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 })
	await page.goto('/')

	// Список пополняется по мере вёрстки секций. Проверка не «есть в DOM»,
	// а именно ненулевая высота: блок, свёрнутый в 0px, формально в разметке
	// присутствует, но на странице его нет.
	const expected = [
		'sHero',
		'sAudience',
		'sProcess',
		'sTransformIntro',
		'sExpertise',
		'sGifts',
		'sBlog',
	]

	const sizes = await page.evaluate(
		(ids) =>
			ids.map((id) => {
				const el = document.getElementById(id)
				return { id, h: el ? Math.round(el.getBoundingClientRect().height) : -1 }
			}),
		expected,
	)

	for (const { id, h } of sizes) {
		expect(h, `секция ${id}`).toBeGreaterThan(100)
	}
})

test('index.html — слайдеры реально инициализированы и листаются', async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 })
	await page.goto('/')
	await page.waitForFunction(() => {
		const s = document.querySelector('.swiper')
		return s && s.swiper
	})

	// Стрелки без рабочего Swiper — классический «есть в DOM, но не работает».
	const slider = page.locator('#sExpertise .swiper')
	const before = await slider.evaluate((n) => n.swiper.realIndex)
	await page.locator('#sExpertise .swiper-button-next').click()
	await page.waitForTimeout(600)
	const after = await slider.evaluate((n) => n.swiper.realIndex)

	expect(after).not.toBe(before)
})

test('index.html — картинки каждой секции декодируются при показе', async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 })
	await page.goto('/')

	// Проверяем посекционно, а не «прокрутить всё и замерить»: у картинок стоит
	// loading="lazy", и если пролистать страницу насквозь и вернуться наверх,
	// Chrome отменяет отложенную загрузку для ушедших из вьюпорта картинок —
	// такой тест ловит несуществующий баг. Здесь секция показывается и
	// проверяется на месте, как это делает живой посетитель.
	const ids = await page.evaluate(() =>
		[...document.querySelectorAll('main > section')].map((s) => s.id).filter(Boolean),
	)

	expect(ids.length).toBeGreaterThan(0)

	for (const id of ids) {
		const section = page.locator(`#${id}`)
		await section.scrollIntoViewIfNeeded()

		await page.waitForFunction(
			(sectionId) => {
				const root = document.getElementById(sectionId)
				if (!root) return false
				return [...root.querySelectorAll('img')]
					.filter((i) => i.getBoundingClientRect().height > 0)
					.every((i) => i.complete)
			},
			id,
			{ timeout: 15000 },
		)

		const broken = await page.evaluate((sectionId) => {
			const root = document.getElementById(sectionId)
			return [...root.querySelectorAll('img')]
				.filter((i) => i.getBoundingClientRect().height > 0 && i.naturalWidth === 0)
				.map((i) => i.getAttribute('src'))
		}, id)

		expect(broken, `секция ${id}`).toEqual([])
	}
})

test('index.html — container has positive width at desktop', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto('/')

	const width = await page.evaluate(() => {
		const el = document.querySelector('.container')
		if (!el) return 0
		return el.getBoundingClientRect().width
	})
	expect(width).toBeGreaterThan(200)
})
