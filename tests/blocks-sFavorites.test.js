import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'
import sFavoritesData from '../source/pug/data/sFavorites.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Block reads its data from the global `sFavorites` var, normally merged in
// by gulp-data at build time (source/pug/data/*.json). The render helper
// uses a bare pug.render() with no such merge step, so the fixture is
// injected here the same way gulp does — as a top-level local matching the
// JSON's key.
const locals = { sFavorites: sFavoritesData.sFavorites }

function render() {
	return renderBlock('sFavorites', { locals })
}

// ---------------------------------------------------------------------------
// sFavorites block — «Самые любимые модели», node 428:10 (desktop) /
// 692:1129 → 726:551 (mobile). No tabs — 4 product cards reusing the SAME
// shared +ebProductCard component as sBestSets (not a bespoke copy).
// ---------------------------------------------------------------------------
describe('sFavorites block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('renders the title', () => {
		const root = parse(render())
		expect(root.querySelector('.sFavorites__title h2')?.text.trim()).toBe(
			sFavoritesData.sFavorites.title,
		)
	})

	it('renders exactly 4 product cards via the shared +ebProductCard component', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.eb-product-card.sFavorites__card')
		expect(cards.length).toBe(4)
	})

	it('cards render photo (decodable src, lazy, alt), title and price in the data order', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.sFavorites__card')
		sFavoritesData.sFavorites.products.forEach((product, i) => {
			const card = cards[i]
			const img = card.querySelector('.eb-product-card__img')
			expect(img?.getAttribute('src')).toBe(product.image)
			expect(img?.getAttribute('loading')).toBe('lazy')
			expect(img?.getAttribute('alt')).toBeTruthy()
			expect(card.querySelector('.eb-product-card__title')?.text.trim()).toBe(product.title)
			expect(card.querySelector('.eb-product-card__price-current')?.text.trim()).toBe(product.price)
		})
	})

	it('renders the swatch color as inline style and omits the +N count when absent in data', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.sFavorites__card')
		const noCountProduct = sFavoritesData.sFavorites.products.find((p) => !p.swatch.count)
		const index = sFavoritesData.sFavorites.products.indexOf(noCountProduct)
		const dot = cards[index].querySelector('.eb-product-card__swatch-dot')
		expect(dot?.getAttribute('style')).toContain(noCountProduct.swatch.color)
		expect(cards[index].querySelector('.eb-product-card__swatch-count')).toBeFalsy()
	})

	it('renders old price struck-through only for the product that has one', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.sFavorites__card')
		sFavoritesData.sFavorites.products.forEach((product, i) => {
			const oldPrice = cards[i].querySelector('.eb-product-card__price-old')
			if (product.oldPrice) {
				expect(oldPrice?.text.trim()).toBe(product.oldPrice)
			} else {
				expect(oldPrice).toBeFalsy()
			}
		})
	})

	it('no element carries a duplicated class (bemto raw-modifier-string pitfall)', () => {
		const root = parse(render())
		for (const el of root.querySelectorAll('[class]')) {
			const classes = el.getAttribute('class').trim().split(/\s+/)
			expect(new Set(classes).size).toBe(classes.length)
		}
	})

	it('has no literal hex colors in its stylesheet', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/sFavorites/_sFavorites.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
