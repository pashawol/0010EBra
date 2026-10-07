import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/catalog.json')

const { catalog: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

const withSubs = fixtureData.categories.filter((cat) => cat.items.length)
const withoutSubs = fixtureData.categories.filter((cat) => !cat.items.length)

const render = () => renderBlock('catalog', { locals: { catalog: fixtureData } })

describe('catalog block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('is a closed dialog by default', () => {
		const modal = parse(render()).querySelector('#catalogModal')
		expect(modal).toBeTruthy()
		expect(modal.getAttribute('hidden')).not.toBeUndefined()
		expect(modal.getAttribute('role')).toBe('dialog')
		expect(modal.getAttribute('aria-modal')).toBe('true')
	})

	it('renders one row per category, with name and count', () => {
		const root = parse(render())
		const cats = root.querySelectorAll('.catalog__cat')
		expect(cats.length).toBe(fixtureData.categories.length)

		fixtureData.categories.forEach((cat, i) => {
			expect(cats[i].getAttribute('data-catalog-cat')).toBe(cat.slug)
			expect(cats[i].querySelector('.catalog__cat-name')?.text.trim()).toBe(cat.name)
			expect(cats[i].querySelector('.catalog__cat-count')?.text.trim()).toBe(String(cat.count))
		})
	})

	it('nothing is pre-opened: level 2 exists in DOM but every sublist starts hidden', () => {
		const root = parse(render())
		const subs = root.querySelectorAll('[data-catalog-sub]')
		expect(subs.length).toBe(withSubs.length)
		for (const sub of subs) expect(sub.getAttribute('hidden')).not.toBeUndefined()
		for (const cat of root.querySelectorAll('.catalog__cat')) {
			expect(cat.getAttribute('aria-expanded')).toBe('false')
			expect(cat.classList.contains('--active')).toBe(false)
		}
	})

	it('every sublist starts with "Смотреть все" and then the category items', () => {
		const root = parse(render())
		for (const cat of withSubs) {
			const sub = root.querySelector(`[data-catalog-sub="${cat.slug}"]`)
			const links = sub.querySelectorAll('.catalog__sublink').map((el) => el.text.trim())
			expect(links).toEqual([fixtureData.viewAllLabel, ...cat.items.map((i) => i.name)])
		}
	})

	it('each category row is wired to its own sublist through aria-controls', () => {
		const root = parse(render())
		for (const item of withSubs) {
			const cat = root.querySelector(`[data-catalog-cat="${item.slug}"]`)
			expect(cat.getAttribute('aria-controls')).toBe(`catalogSub-${item.slug}`)
			expect(cat.getAttribute('data-catalog-has-subs')).not.toBeUndefined()
			expect(root.querySelector(`#catalogSub-${item.slug}`)).toBeTruthy()
		}
	})

	it('categories without items render no sublist, aria-controls or has-subs marker', () => {
		const root = parse(render())
		expect(withoutSubs.length).toBeGreaterThanOrEqual(2)
		for (const item of withoutSubs) {
			const cat = root.querySelector(`[data-catalog-cat="${item.slug}"]`)
			expect(cat.getAttribute('aria-controls')).toBeUndefined()
			expect(cat.getAttribute('aria-haspopup')).toBeUndefined()
			expect(cat.getAttribute('data-catalog-has-subs')).toBeUndefined()
			expect(root.querySelector(`#catalogSub-${item.slug}`)).toBeNull()
			expect(root.querySelector(`[data-catalog-img="${item.slug}"]`)).toBeTruthy()
		}
	})

	it('media column holds the cover plus one hidden image per category', () => {
		const root = parse(render())
		const cover = root.querySelector('.catalog__media-img.--cover')
		expect(cover.getAttribute('src')).toBe(fixtureData.image.src)
		expect(cover.getAttribute('hidden')).toBeUndefined()

		const perCategory = root.querySelectorAll('[data-catalog-img]')
		expect(perCategory.length).toBe(fixtureData.categories.length)
		for (const img of perCategory) {
			expect(img.getAttribute('hidden')).not.toBeUndefined()
			expect(img.getAttribute('src')).toBeTruthy()
		}
	})

	it('close button and backdrop both carry data-catalog-close', () => {
		const root = parse(render())
		expect(root.querySelector('.catalog__close')?.getAttribute('data-catalog-close')).not.toBe(
			undefined,
		)
		expect(root.querySelector('.catalog__backdrop')?.getAttribute('data-catalog-close')).not.toBe(
			undefined,
		)
	})

	it('has no literal hex colors in its stylesheet', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/catalog/_catalog.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})
})
