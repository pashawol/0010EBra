import { parse } from 'node-html-parser'
import { describe, expect, it } from 'vitest'
import { renderBlock } from './helpers/render-block.js'

describe('sSale block', () => {
	it('рендерится без исключения', () => {
		expect(() => renderBlock('sSale')).not.toThrow()
	})

	it('содержит все элементы из макета', () => {
		const root = parse(renderBlock('sSale'))

		expect(root.querySelector('.sSale__eyebrow')?.text.trim()).toBe('Брафиттинг +')
		expect(root.querySelector('.sSale__title')).toBeTruthy()
		expect(root.querySelector('.sSale__text')).toBeTruthy()
	})

	// Кнопка ведёт на другую страницу, значит это ссылка, а не <button>:
	// подменять семантику ради переиспользования миксина нельзя.
	it('кнопка — ссылка с href', () => {
		const root = parse(renderBlock('sSale'))
		const btn = root.querySelector('.sSale__btn')

		expect(btn?.tagName).toBe('A')
		expect(btn?.getAttribute('href')).toBeTruthy()
	})

	it('не содержит литеральных цветов в разметке', () => {
		expect(renderBlock('sSale')).not.toMatch(/#[0-9a-fA-F]{6}/)
	})
})
