import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import { renderBlock } from './helpers/render-block.js'

// Демо-блоки стартера (sCatalog, product-item) удалены как не относящиеся
// к макету — их карточку заменил общий компонент +ebProductCard,
// он покрыт tests/blocks-sBestSets.test.js и blocks-sFavorites.test.js.

describe('form-wrap input mixin', () => {
	it('renders without throwing', () => {
		expect(() =>
			renderBlock('form-wrap', {
				call: "+input('Your name', 'text', 'Name label')",
			}),
		).not.toThrow()
	})

	it('renders an input with the given placeholder', () => {
		const html = renderBlock('form-wrap', {
			call: "+input('Your name', 'text', 'Name label')",
		})
		const root = parse(html)
		const input = root.querySelector('input.form-control')
		expect(input?.getAttribute('placeholder')).toBe('Your name')
	})

	it('renders a label when label arg is provided', () => {
		const html = renderBlock('form-wrap', {
			call: "+input('Placeholder', 'text', 'Label text')",
		})
		const root = parse(html)
		expect(root.querySelector('label')).toBeTruthy()
		expect(root.querySelector('.input-title')?.text.trim()).toBe('Label text')
	})

	it('matches HTML snapshot', () => {
		const html = renderBlock('form-wrap', {
			call: "+input('Snapshot placeholder', 'text', 'Snapshot label')",
		})
		expect(html).toMatchSnapshot()
	})
})
