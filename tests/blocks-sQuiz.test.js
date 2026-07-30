import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'
import sQuizData from '../source/pug/data/sQuiz.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Block reads its data from the global `sQuiz` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sQuiz: sQuizData.sQuiz }

function render() {
	return renderBlock('sQuiz', { locals })
}

// ---------------------------------------------------------------------------
// sQuiz block — «Интерактивный квиз на базе ИИ-ассистента», node 357:242
// (desktop) / 692:1129 → 726:151 (mobile). Statically-laid-out chat mockup
// only — no quiz logic, no reveal/typing animation (docs/PLAN.md §1.1).
// ---------------------------------------------------------------------------
describe('sQuiz block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('renders the eyebrow label and the two-line title', () => {
		const root = parse(render())
		expect(root.querySelector('.sQuiz__eyebrow')?.text.trim()).toBe(sQuizData.sQuiz.eyebrow)
		const title = root.querySelector('.sQuiz__title h2')
		expect(title).toBeTruthy()
		expect(title.innerHTML).toContain('<br>')
	})

	it('renders the visitor row: label, one bubble, and the user-round avatar icon', () => {
		const root = parse(render())
		const row = root.querySelector('.sQuiz__row--visitor')
		expect(row).toBeTruthy()
		expect(row.querySelector('.sQuiz__row-label')?.text.trim()).toBe(sQuizData.sQuiz.visitor.label)
		expect(row.querySelector('.sQuiz__bubble--visitor')?.text.trim()).toBe(
			sQuizData.sQuiz.visitor.message,
		)
		expect(row.querySelector('.sQuiz__avatar--visitor .icon-user-round')).toBeTruthy()
	})

	it('renders the assistant row: label, the eb-monogram avatar, and exactly 4 message bubbles', () => {
		const root = parse(render())
		const row = root.querySelector('.sQuiz__row--assistant')
		expect(row).toBeTruthy()
		expect(row.querySelector('.sQuiz__row-label')?.text.trim()).toBe(
			sQuizData.sQuiz.assistant.label,
		)
		expect(row.querySelector('.sQuiz__avatar--assistant .icon-eb-monogram')).toBeTruthy()

		const bubbles = row.querySelectorAll('.sQuiz__bubble--assistant')
		expect(bubbles.length).toBe(4)
		expect(bubbles.map((b) => b.text.trim())).toEqual(sQuizData.sQuiz.assistant.messages)
	})

	it('renders the bottom panel with the questions pill and the primary CTA button', () => {
		const root = parse(render())
		const panel = root.querySelector('.sQuiz__panel')
		expect(panel).toBeTruthy()
		expect(panel.querySelector('.sQuiz__hint-label')?.text.trim()).toBe(
			sQuizData.sQuiz.questionsCount,
		)
		expect(panel.querySelector('.sQuiz__hint .icon-message-circle-question')).toBeTruthy()

		const cta = panel.querySelector('.eb-btn.sQuiz__cta')
		expect(cta).toBeTruthy()
		expect(cta.tagName).toBe('BUTTON')
		expect(cta.classList.contains('eb-btn--primary')).toBe(true)
		expect(cta.querySelector('.icon-sparkles')).toBeTruthy()
		expect(cta.querySelector('.eb-btn__label')?.text.trim()).toBe(sQuizData.sQuiz.cta)
	})

	it('renders the full-bleed decorative background as a responsive picture, marked aria-hidden and lazy', () => {
		const root = parse(render())
		const bg = root.querySelector('.sQuiz__bg')
		expect(bg?.getAttribute('aria-hidden')).toBe('true')
		const source = bg.querySelector('picture source')
		expect(source?.getAttribute('srcset')).toBe('img/sQuiz/bg-desktop.webp')
		const img = bg.querySelector('picture img.sQuiz__bg-photo')
		expect(img?.getAttribute('src')).toBe('img/sQuiz/bg-mobile.webp')
		expect(img?.getAttribute('loading')).toBe('lazy')
		expect(img?.getAttribute('alt')).toBe('')
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
			path.resolve(__dirname, '..', 'source/pug/blocks/sQuiz/_sQuiz.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
