import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import { renderBlock } from './helpers/render-block.js'
import footerData from '../source/pug/data/footer.json' with { type: 'json' }

// Block reads its data from the global `footer` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { footer: footerData.footer }

// ---------------------------------------------------------------------------
// footer block — node 508:96 (desktop), 744:1165 (mobile)
// ---------------------------------------------------------------------------
describe('footer block', () => {
	it('renders without throwing', () => {
		expect(() => renderBlock('footer', { locals })).not.toThrow()
	})

	it('renders the dark theme root', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		const el = root.querySelector('footer.footer')
		expect(el).toBeTruthy()
		expect(el.classList.contains('eb-theme--dark')).toBe(true)
	})

	it('renders the monogram and the wordmark', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		expect(root.querySelector('.footer__monogram')).toBeTruthy()
		const wordmark = root.querySelector('.footer__wordmark')
		expect(wordmark?.text.trim()).toBe(footerData.footer.brand)
	})

	it('renders exactly 3 contact items with label + value', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		const items = root.querySelectorAll('.footer__contact')
		expect(items.length).toBe(3)
		for (const item of items) {
			expect(item.querySelector('.footer__contact-label')?.text.trim()).toBeTruthy()
			expect(item.querySelector('.footer__contact-value')?.text.trim()).toBeTruthy()
		}
	})

	it('renders the CTA card as a link with an image and an arrow icon', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		const cta = root.querySelector('.footer__cta')
		expect(cta).toBeTruthy()
		expect(cta.tagName).toBe('A')
		const img = cta.querySelector('.footer__cta-img')
		expect(img?.getAttribute('src')).toBeTruthy()
		expect(img?.getAttribute('loading')).toBe('lazy')
		expect(cta.querySelector('.footer__cta-arrow .icon-arrow-right')).toBeTruthy()
	})

	it('renders the subscribe field with a labelled email input and an error slot', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		const input = root.querySelector('#footerSubscribeEmail')
		expect(input).toBeTruthy()
		expect(input.getAttribute('type')).toBe('email')
		expect(input.getAttribute('required')).toBeTruthy()
		const label = root.querySelector('label[for="footerSubscribeEmail"]')
		expect(label?.text.trim()).toBeTruthy()
		// type="submit" is required by html-validate (wcag/h32: a form must
		// have a submit control) — actual submission is blocked inline via
		// onsubmit="return false" on the <form>, independent of any JS.
		const submitBtn = root.querySelector('#footerSubscribeSubmit')
		expect(submitBtn.getAttribute('type')).toBe('submit')
		const submitForm = root.querySelector('#footerSubscribeForm')
		expect(submitForm.getAttribute('onsubmit')).toBe('return false')
		expect(root.querySelector('#footerSubscribeError')).toBeTruthy()
	})

	it('renders exactly 3 social links with accessible labels', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		const links = root.querySelectorAll('.footer__social-btn')
		expect(links.length).toBe(3)
		for (const link of links) {
			expect(link.getAttribute('href')).toBeTruthy()
			expect(link.getAttribute('aria-label')).toBeTruthy()
			expect(link.classList.contains('eb-icon-btn')).toBe(true)
		}
	})

	it('renders 3 menu columns, marking the long list as --split', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		const menus = root.querySelectorAll('.footer__menu')
		expect(menus.length).toBe(3)
		const split = root.querySelector('.footer__menu--split')
		expect(split).toBeTruthy()
		expect(split.querySelectorAll('.footer__menu-link').length).toBe(6)
	})

	it('renders exactly 8 payment badges with alt text and explicit dimensions', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		const badges = root.querySelectorAll('.footer__payment-icon')
		expect(badges.length).toBe(8)
		for (const badge of badges) {
			expect(badge.getAttribute('src')).toBeTruthy()
			expect(badge.getAttribute('alt')).toBeTruthy()
			expect(badge.getAttribute('width')).toBeTruthy()
			expect(badge.getAttribute('height')).toBeTruthy()
			expect(badge.getAttribute('loading')).toBe('lazy')
		}
	})

	it('renders the copyright and 2 legal links', () => {
		const html = renderBlock('footer', { locals })
		const root = parse(html)
		expect(root.querySelector('.footer__copyright')?.text.trim()).toBeTruthy()
		expect(root.querySelectorAll('.footer__legal-link').length).toBe(2)
	})

	it('matches HTML snapshot', () => {
		const html = renderBlock('footer', { locals })
		expect(html).toMatchSnapshot()
	})
})
