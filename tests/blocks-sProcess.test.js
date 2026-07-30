import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/sProcess.json')

// The block reads `data = data || sProcess` — sTransformIntro/sHero use the
// same pattern. render-block.js has no gulp-data merge step (that only
// happens in the real gulp pug task), so the fixture must inject the same
// `source/pug/data/sProcess.json` payload via pug locals, exactly like
// production does via gulp-data.
const { sProcess: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

function render() {
	return renderBlock('sProcess', { locals: { sProcess: fixtureData } })
}

// ---------------------------------------------------------------------------
// sProcess block — node 214:97 / mobile 710:1924
// ---------------------------------------------------------------------------
describe('sProcess block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('renders exactly 4 steps', () => {
		const html = render()
		const root = parse(html)
		const steps = root.querySelectorAll('.sProcess__step')
		expect(steps.length).toBe(4)
	})

	it('each step has an image with alt text and lazy loading', () => {
		const html = render()
		const root = parse(html)
		const imgs = root.querySelectorAll('.sProcess__step-img')
		expect(imgs.length).toBe(4)
		for (const img of imgs) {
			expect(img.getAttribute('src')).toBeTruthy()
			expect(img.getAttribute('alt')).toBeTruthy()
			expect(img.getAttribute('loading')).toBe('lazy')
		}
	})

	it('step numbers 01–04 are present in the DOM', () => {
		const html = render()
		const root = parse(html)
		const nums = root.querySelectorAll('.sProcess__step-num').map((el) => el.text.trim())
		expect(nums).toEqual(['01', '02', '03', '04'])
	})

	it('each step has a ruler and a label', () => {
		const html = render()
		const root = parse(html)
		expect(root.querySelectorAll('.sProcess__step-ruler').length).toBe(4)
		const labels = root.querySelectorAll('.sProcess__step-label').map((el) => el.text.trim())
		expect(labels).toEqual(['Измерение', 'Примерка', 'Подбор', 'Рекомендации'])
	})

	it('renders the title', () => {
		const html = render()
		const root = parse(html)
		expect(root.querySelector('.sProcess__title')?.text.trim()).toBe(
			'Что происходит на брафиттинге',
		)
	})

	it('renders the video widget with a play button', () => {
		const html = render()
		const root = parse(html)
		const widget = root.querySelector('.sProcess__widget')
		expect(widget).toBeTruthy()
		expect(widget.querySelector('.sProcess__widget-label')?.text.trim()).toBe('Видео обзор')
		expect(widget.querySelector('.sProcess__widget-title')?.text.trim()).toBe('О брафиттинге')
		const btn = widget.querySelector('.eb-icon-btn')
		expect(btn).toBeTruthy()
		expect(btn.querySelector('.icon-play')).toBeTruthy()
	})

	it('matches HTML snapshot', () => {
		const html = render()
		expect(html).toMatchSnapshot()
	})
})
