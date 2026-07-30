import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'
import sBestSetsData from '../source/pug/data/sBestSets.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Block reads its data from the global `sBestSets` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sBestSets: sBestSetsData.sBestSets }

function render() {
	return renderBlock('sBestSets', { locals })
}

// ---------------------------------------------------------------------------
// sBestSets block — «Лучшие наборы белья», node 384:633 (desktop) /
// 692:1129 → 726:377 (mobile). Tabs switch the visible set of 4 product
// cards; cards reuse the shared +ebProductCard component (also used by
// sFavorites).
// ---------------------------------------------------------------------------
describe('sBestSets block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('renders the title', () => {
		const root = parse(render())
		expect(root.querySelector('.sBestSets__title h2')?.text.trim()).toBe(
			sBestSetsData.sBestSets.title,
		)
	})

	it('renders exactly 5 tabs with WAI-ARIA tab roles', () => {
		const root = parse(render())
		const tabs = root.querySelectorAll('.sBestSets__tab')
		expect(tabs.length).toBe(5)
		for (const tab of tabs) {
			expect(tab.getAttribute('role')).toBe('tab')
			expect(tab.getAttribute('aria-controls')).toBeTruthy()
		}
		const tablist = root.querySelector('.sBestSets__tabs')
		expect(tablist?.getAttribute('role')).toBe('tablist')
	})

	it('exactly one tab is aria-selected=true and it matches activeTab', () => {
		const root = parse(render())
		const selected = root.querySelectorAll('.sBestSets__tab[aria-selected="true"]')
		expect(selected.length).toBe(1)
		expect(selected[0].getAttribute('data-tab')).toBe(sBestSetsData.sBestSets.activeTab)
	})

	it('renders 5 tabpanels, all present in DOM, only the active one visible (not hidden)', () => {
		const root = parse(render())
		const panels = root.querySelectorAll('.sBestSets__panel')
		expect(panels.length).toBe(5)
		const visible = panels.filter((p) => !p.hasAttribute('hidden'))
		expect(visible.length).toBe(1)
		expect(visible[0].getAttribute('data-tab-panel')).toBe(sBestSetsData.sBestSets.activeTab)
	})

	it('each panel renders exactly 4 product cards via the shared +ebProductCard component', () => {
		const root = parse(render())
		const panels = root.querySelectorAll('.sBestSets__panel')
		for (const panel of panels) {
			const cards = panel.querySelectorAll('.eb-product-card.sBestSets__card')
			expect(cards.length).toBe(4)
		}
	})

	it('cards render photo (decodable src, lazy, alt), title and price', () => {
		const root = parse(render())
		const card = root.querySelector('.sBestSets__card')
		const img = card.querySelector('.eb-product-card__img')
		expect(img?.getAttribute('src')).toBeTruthy()
		expect(img?.getAttribute('loading')).toBe('lazy')
		expect(img?.getAttribute('alt')).toBeTruthy()
		expect(card.querySelector('.eb-product-card__title')?.text.trim()).toBeTruthy()
		expect(card.querySelector('.eb-product-card__price-current')?.text.trim()).toBeTruthy()
	})

	it('renders a badge with a non-BEM runtime modifier class (is-new/is-sale), not a duplicated bemto class', () => {
		const root = parse(render())
		const badges = root.querySelectorAll('.eb-product-card__badge')
		expect(badges.length).toBeGreaterThan(0)
		for (const badge of badges) {
			const classes = badge.getAttribute('class').trim().split(/\s+/)
			expect(new Set(classes).size).toBe(classes.length)
			expect(classes.some((c) => c === 'is-new' || c === 'is-sale')).toBe(true)
		}
	})

	it('renders the color swatch dot with an inline style color from data (content, not a stylesheet literal)', () => {
		const root = parse(render())
		const dot = root.querySelector('.eb-product-card__swatch-dot')
		expect(dot?.getAttribute('style')).toMatch(/background-color:\s*#/i)
	})

	it('renders old price struck-through only for products that have one', () => {
		const root = parse(render())
		const activeSet = sBestSetsData.sBestSets.sets[sBestSetsData.sBestSets.activeTab]
		const cards = root.querySelectorAll('.sBestSets__card')
		activeSet.forEach((product, i) => {
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
			path.resolve(__dirname, '..', 'source/pug/blocks/sBestSets/_sBestSets.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})

	it('the shared eb-product-card component stylesheet also has no literal hex colors', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/mixin-wrap/components/eb-product-card.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
