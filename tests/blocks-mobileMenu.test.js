import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/mobileMenu.json')
const CATALOG_PATH = path.resolve(__dirname, '..', 'source/pug/data/catalog.json')

// Тот же паттерн, что sProcess/sHero: `data = data || mobileMenu`, а
// render-block.js не мёржит source/pug/data/*.json сам — фикстура должна
// подать ровно тот payload, что и gulp-data в реальной сборке.
const { mobileMenu: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
const { catalog: catalogData } = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))

function render() {
	return renderBlock('mobileMenu', {
		locals: { mobileMenu: fixtureData, catalog: catalogData },
	})
}

// ---------------------------------------------------------------------------
// mobileMenu block — node 777:2 (уровень 1) / 777:1466 (Каталог, уровень 2) /
// 777:1584 (Для вас, уровень 2). Drill-down на 3 экрана, все в DOM одновременно,
// переключение — атрибутом [hidden] (source/js/mobile-menu.js, vanilla JS).
// ---------------------------------------------------------------------------
describe('mobileMenu block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('root container is hidden by default and has dialog semantics', () => {
		const html = render()
		const root = parse(html)
		const menu = root.querySelector('.mobileMenu')
		expect(menu).toBeTruthy()
		expect(menu.getAttribute('hidden')).not.toBeUndefined()
		expect(menu.getAttribute('role')).toBe('dialog')
		expect(menu.getAttribute('aria-modal')).toBe('true')
	})

	it('renders exactly 3 kinds of screens: root, one per category, and client', () => {
		const html = render()
		const root = parse(html)
		const screens = root.querySelectorAll('[data-menu-screen]')
		// root + N категорий + client
		expect(screens.length).toBe(1 + catalogData.categories.length + 1)

		const rootScreen = root.querySelector('[data-menu-screen="root"]')
		expect(rootScreen).toBeTruthy()
		expect(rootScreen.getAttribute('hidden')).toBeUndefined()

		const clientScreen = root.querySelector('[data-menu-screen="client"]')
		expect(clientScreen).toBeTruthy()
		expect(clientScreen.getAttribute('hidden')).not.toBeUndefined()
	})

	it('every non-root screen starts hidden (drill-down levels are not visible upfront)', () => {
		const html = render()
		const root = parse(html)
		const subScreens = root
			.querySelectorAll('[data-menu-screen]')
			.filter((el) => el.getAttribute('data-menu-screen') !== 'root')
		expect(subScreens.length).toBeGreaterThan(0)
		for (const screen of subScreens) {
			expect(screen.getAttribute('hidden')).not.toBeUndefined()
		}
	})

	it('each category has a drill-down trigger wired to its own catalog screen', () => {
		const html = render()
		const root = parse(html)
		const triggers = root.querySelectorAll('.mobileMenu__catalog-trigger')
		expect(triggers.length).toBe(catalogData.categories.length)

		catalogData.categories.forEach((cat, i) => {
			const trigger = triggers[i]
			expect(trigger.getAttribute('data-menu-open')).toBe(`catalog-${cat.slug}`)
			expect(trigger.getAttribute('aria-haspopup')).toBe('true')
			expect(trigger.querySelector('.mobileMenu__catalog-name')?.text.trim()).toBe(cat.name)
			expect(trigger.querySelector('.mobileMenu__catalog-count')?.text.trim()).toBe(
				String(cat.count),
			)

			const screen = root.querySelector(`[data-menu-screen="catalog-${cat.slug}"]`)
			expect(screen).toBeTruthy()
			expect(screen.querySelectorAll('.mobileMenu__sublist-link').length).toBe(cat.items.length)
			expect(screen.querySelector('.mobileMenu__banner-btn')?.text.trim()).toBe(
				catalogData.viewAllLabel,
			)
			expect(screen.querySelector('.mobileMenu__banner-img')?.getAttribute('src')).toBe(
				cat.image.src,
			)
			expect(screen.querySelector('.mobileMenu__back')).toBeTruthy()
		})
	})

	it('"Для вас" trigger opens the client screen with its links', () => {
		const html = render()
		const root = parse(html)
		const trigger = root
			.querySelectorAll('.mobileMenu__link')
			.find((el) => el.getAttribute('data-menu-open') === 'client')
		expect(trigger).toBeTruthy()
		expect(trigger.text.trim()).toBe(fixtureData.client.label)

		const screen = root.querySelector('[data-menu-screen="client"]')
		expect(screen.querySelectorAll('.mobileMenu__sublist-link').length).toBe(
			fixtureData.client.links.length,
		)
		expect(screen.querySelector('.mobileMenu__back')).toBeTruthy()
	})

	it('renders 4 header icon buttons on every screen (close + search/profile/heart/cart)', () => {
		const html = render()
		const root = parse(html)
		const screens = root.querySelectorAll('[data-menu-screen]')
		for (const screen of screens) {
			expect(screen.querySelector('[data-menu-close]')).toBeTruthy()
			expect(screen.querySelectorAll('.mobileMenu__head-icon').length).toBe(4)
		}
	})

	it('renders the services row as links with images and labels', () => {
		const html = render()
		const root = parse(html)
		const services = root.querySelectorAll('.mobileMenu__service')
		expect(services.length).toBe(fixtureData.services.length)
		for (const [i, el] of services.entries()) {
			expect(el.tagName).toBe('A')
			const img = el.querySelector('.mobileMenu__service-img')
			expect(img.getAttribute('src')).toBeTruthy()
			expect(img.getAttribute('loading')).toBe('lazy')
			expect(el.querySelector('.mobileMenu__service-label')?.text.trim()).toBe(
				fixtureData.services[i].label,
			)
		}
	})

	it('other flat links (Бренды, Спец предложения, Блог, Контакты) are plain anchors', () => {
		const html = render()
		const root = parse(html)
		const labels = fixtureData.otherLinks.map((l) => l.label)
		const links = root
			.querySelectorAll('.mobileMenu__link')
			.filter((el) => el.tagName === 'A')
			.map((el) => el.text.trim())
		for (const label of labels) {
			expect(links).toContain(label)
		}
	})

	it('every [data-mobile-menu-toggle]-style trigger inside the component owns an aria-expanded flag', () => {
		const html = render()
		const root = parse(html)
		const openTriggers = root.querySelectorAll('[data-menu-open]')
		expect(openTriggers.length).toBeGreaterThan(0)
		for (const trigger of openTriggers) {
			expect(trigger.getAttribute('aria-expanded')).toBe('false')
		}
	})

	it('each service card carries its tint modifier (gradient colour comes from data)', () => {
		const html = render()
		const root = parse(html)
		const services = root.querySelectorAll('.mobileMenu__service')
		fixtureData.services.forEach((service, i) => {
			expect(service.tint).toBeTruthy()
			expect(services[i].classNames).toContain(`--tint-${service.tint}`)
		})
	})

	it('every screen head has the "Меню" title used by the desktop popup', () => {
		const html = render()
		const root = parse(html)
		const rootScreen = root.querySelector('[data-menu-screen="root"]')
		expect(rootScreen.querySelector('.mobileMenu__head-title')?.text.trim()).toBe('Меню')
	})

	it('client links are also rendered inline (desktop shows them expanded, not as a drill-down)', () => {
		const html = render()
		const root = parse(html)
		const section = root.querySelector('.mobileMenu__client')
		expect(section).toBeTruthy()
		expect(section.querySelector('.mobileMenu__client-title')?.text.trim()).toBe(
			fixtureData.client.label,
		)
		expect(
			section.querySelectorAll('.mobileMenu__client-link').map((el) => el.text.trim()),
		).toEqual(fixtureData.client.links)
	})

	it('the mobile "Для вас" entry is marked --client so the desktop can drop it', () => {
		const html = render()
		const root = parse(html)
		const trigger = root
			.querySelectorAll('.mobileMenu__link')
			.find((el) => el.getAttribute('data-menu-open') === 'client')
		expect(trigger.classNames).toContain('--client')
	})

	it('matches HTML snapshot', () => {
		const html = render()
		expect(html).toMatchSnapshot()
	})
})
