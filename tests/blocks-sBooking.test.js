import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import { renderBlock } from './helpers/render-block.js'
import sBookingData from '../source/pug/data/sBooking.json' with { type: 'json' }

// Block reads its data from the global `sBooking` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sBooking: sBookingData.sBooking }

// ---------------------------------------------------------------------------
// sBooking block — node 497:931 (desktop), 739:898 (mobile, inside 692:1129)
// Form states spec — 652:1373 (Default 652:1679, Filed+Error 652:1745,
// Filed 652:1789, chip hint 652:1777).
// ---------------------------------------------------------------------------
describe('sBooking block', () => {
	it('renders without throwing', () => {
		expect(() => renderBlock('sBooking', { locals })).not.toThrow()
	})

	it('renders the dark theme root', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const el = root.querySelector('section.sBooking')
		expect(el).toBeTruthy()
		expect(el.classList.contains('eb-theme--dark')).toBe(true)
	})

	it('renders one accessible h2 carrying the full sentence, plus a decorative tail', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const headings = root.querySelectorAll('h2')
		expect(headings.length).toBe(1)
		const hidden = headings[0].querySelector('.visually-hidden')
		expect(hidden?.text.trim()).toBe(sBookingData.sBooking.titleAccessible)
		expect(root.querySelector('.sBooking__title-tail')?.getAttribute('aria-hidden')).toBe('true')
	})

	it('renders the background photo with a mobile-first <picture> and a desktop <source>', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const source = root.querySelector('.sBooking__media source')
		expect(source?.getAttribute('media')).toBeTruthy()
		expect(source?.getAttribute('srcset')).toBe(sBookingData.sBooking.photo.desktop)
		const img = root.querySelector('.sBooking__photo')
		expect(img?.getAttribute('src')).toBe(sBookingData.sBooking.photo.mobile)
		expect(img?.getAttribute('loading')).toBe('lazy')
	})

	it('renders name and phone as labelled, described inputs (a11y grabля #1/#4)', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		for (const [id, type] of [
			['sBookingName', 'text'],
			['sBookingPhone', 'tel'],
		]) {
			const input = root.querySelector(`#${id}`)
			expect(input).toBeTruthy()
			expect(input.getAttribute('type')).toBe(type)
			expect(input.getAttribute('required')).toBeTruthy()
			const label = root.querySelector(`label[for="${id}"]`)
			expect(label?.text.trim()).toBeTruthy()
			const describedBy = input.getAttribute('aria-describedby')
			expect(describedBy).toBeTruthy()
			expect(root.querySelector(`#${describedBy}`)).toBeTruthy()
		}
	})

	it('renders exactly 4 mutually exclusive time radios sharing one name, "asap" spanning full width', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const radios = root.querySelectorAll('input[name="timeSlot"]')
		expect(radios.length).toBe(4)
		for (const radio of radios) {
			expect(radio.getAttribute('required')).toBeTruthy()
			const id = radio.getAttribute('id')
			expect(root.querySelector(`label[for="${id}"]`)).toBeTruthy()
		}
		const wideOption = root.querySelector('.sBooking__time-option--wide')
		expect(wideOption?.getAttribute('for')).toBe(radios[0].getAttribute('id'))
	})

	it('renders the "choose a time" hint chip hidden by default (matches the Default state screenshot)', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const hint = root.querySelector('#sBookingTimeHint')
		expect(hint).toBeTruthy()
		expect(hint.getAttribute('hidden')).not.toBeNull()
		expect(hint.text.trim()).toBe(sBookingData.sBooking.form.timeHint)
	})

	it('renders the consent checkbox as a described, required, labelled control with a link', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const input = root.querySelector('#sBookingConsent')
		expect(input.getAttribute('type')).toBe('checkbox')
		expect(input.getAttribute('required')).toBeTruthy()
		const describedBy = input.getAttribute('aria-describedby')
		expect(root.querySelector(`#${describedBy}`)).toBeTruthy()
		expect(root.querySelector('label[for="sBookingConsent"]')).toBeTruthy()
		const link = root.querySelector('.sBooking__consent-link')
		expect(link?.getAttribute('href')).toBeTruthy()
	})

	it('renders the submit button as type="submit" and the form blocks real submission inline', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const submitBtn = root.querySelector('.sBooking__submit')
		expect(submitBtn.tagName).toBe('BUTTON')
		expect(submitBtn.getAttribute('type')).toBe('submit')
		const form = root.querySelector('#sBookingForm')
		expect(form.getAttribute('onsubmit')).toBe('return false')
		expect(form.getAttribute('novalidate')).not.toBeNull()
	})

	it('renders exactly 2 decorative logo marks (background + card corner)', () => {
		const html = renderBlock('sBooking', { locals })
		const root = parse(html)
		const marks = root.querySelectorAll('.eb-logo-mark')
		expect(marks.length).toBe(2)
		const decor = root.querySelector('.sBooking__decor')
		const cardDecor = root.querySelector('.sBooking__card-decor')
		expect(decor?.tagName).toBe('SVG')
		expect(cardDecor?.tagName).toBe('SVG')
		expect(decor.getAttribute('aria-hidden')).toBe('true')
		expect(decor.querySelector('path')?.getAttribute('fill')).toBe('currentColor')
	})

	it('matches HTML snapshot', () => {
		const html = renderBlock('sBooking', { locals })
		expect(html).toMatchSnapshot()
	})
})
