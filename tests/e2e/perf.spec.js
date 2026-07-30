import { expect, test } from '@playwright/test'

/**
 * Бюджет производительности.
 *
 * Проверяется не «быстро ли ощущается», а два числа, которые ловят реальные
 * регрессии в вёрстке: сколько байт уходит на первый экран и когда появляется
 * самый большой элемент. Главная страница — фуллскрин-фото плюс несколько
 * слайдеров, то есть именно тот случай, где вес легко уезжает незаметно.
 *
 * Порог сознательно не выкручен до идеала: задача теста — не пропустить
 * ухудшение в разы (забыли lazy, положили несжатый PNG на 8 МБ), а не спорить
 * о десятках килобайт.
 */

const PAGES = ['/', '/00-modal.html', '/01-ui-kit.html']

// Байты, которые страница тянет ДО прокрутки. Всё, что ниже первого экрана,
// стоит на loading="lazy" и в этот бюджет попадать не должно.
const INITIAL_BUDGET_BYTES = 4_500_000

// Largest Contentful Paint на локальном сервере без троттлинга.
const LCP_BUDGET_MS = 2500

for (const path of PAGES) {
	test(`${path} — вес первого экрана в пределах бюджета`, async ({ page }) => {
		let transferred = 0
		const heavy = []

		page.on('response', async (response) => {
			const length = Number(response.headers()['content-length'] || 0)
			if (!length) return
			transferred += length
			if (length > 400_000) {
				heavy.push(`${response.url().split('/').pop()} — ${Math.round(length / 1024)} КБ`)
			}
		})

		await page.goto(path, { waitUntil: 'load' })
		// Ничего не прокручиваем специально: замеряем именно первый экран.
		await page.waitForTimeout(1500)

		// Сообщение с разбивкой: без него падение теста ничего не объясняет.
		expect(
			transferred,
			`первый экран: ${Math.round(transferred / 1024)} КБ. Самые тяжёлые файлы: ${heavy.join(', ') || 'нет'}`,
		).toBeLessThan(INITIAL_BUDGET_BYTES)
	})
}

test('/ — LCP в пределах бюджета', async ({ page }) => {
	await page.goto('/', { waitUntil: 'load' })

	const lcp = await page.evaluate(
		() =>
			new Promise((resolve) => {
				// Берём последнее значение: LCP уточняется по мере отрисовки.
				let last = 0
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) last = entry.startTime
				}).observe({ type: 'largest-contentful-paint', buffered: true })

				// Наблюдатель может не выстрелить, если всё уже отрисовано до его
				// подписки — отдаём то, что есть, через фиксированную паузу.
				setTimeout(() => resolve(last), 2000)
			}),
	)

	expect(lcp, `LCP = ${Math.round(lcp)} мс`).toBeLessThan(LCP_BUDGET_MS)
})

test('/ — у LCP-картинки первого экрана не стоит lazy', async ({ page }) => {
	await page.goto('/')

	// Классическая регрессия: кто-то добавляет loading="lazy" всем картинкам
	// подряд, и картинка первого экрана начинает грузиться позже, чем нужно.
	const heroImages = await page.evaluate(() => {
		const first = document.querySelector('main > section')
		if (!first) return []
		return [...first.querySelectorAll('img')].map((img) => ({
			src: img.getAttribute('src'),
			loading: img.getAttribute('loading'),
			fetchpriority: img.getAttribute('fetchpriority'),
		}))
	})

	for (const img of heroImages) {
		expect(img.loading, `${img.src} на первом экране`).not.toBe('lazy')
	}
})
