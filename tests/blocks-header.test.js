import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pug from 'pug'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/header.json')

// renderBlock() has no gulp-data merge step by itself, so the fixture injects
// the same source/pug/data/header.json payload via pug locals — same pattern
// as tests/blocks-sExpertise.test.js.
const { header: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

function renderHeader() {
	return renderBlock('header', { locals: { header: fixtureData } })
}

function renderTopNav() {
	return renderBlock('top-nav', {
		call: '+top-nav()',
		locals: { header: fixtureData },
	})
}

// renderBlock() only supports a single include + single call; header wraps
// top-nav exactly like source/pug/pages/parts/header.pug does, so build the
// combined fixture directly with pug to assert the wrapping relationship.
function renderFull() {
	const src = [
		'include source/pug/layout/include.pug',
		'include source/pug/blocks/header/_header.pug',
		'include source/pug/blocks/top-nav/_top-nav.pug',
		'+header()',
		'\t+top-nav()',
	].join('\n')
	return pug.render(src, {
		basedir: PROJECT_ROOT,
		filename: path.join(PROJECT_ROOT, '_fixture.pug'),
		pretty: true,
		header: fixtureData,
	})
}

describe('header block', () => {
	it('renders without throwing', () => {
		expect(() => renderHeader()).not.toThrow()
	})

	it('is a <header> landmark with id="header"', () => {
		const root = parse(renderHeader())
		const el = root.querySelector('header.header')
		expect(el).toBeTruthy()
		expect(el.getAttribute('id')).toBe('header')
	})
})

describe('top-nav block (fixed bar)', () => {
	it('renders without throwing', () => {
		expect(() => renderTopNav()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(renderTopNav()).toMatchSnapshot()
	})

	it('renders burger, catalog pill, logo and the 4 action icons', () => {
		const root = parse(renderTopNav())
		expect(root.querySelector('.top-nav__burger')).toBeTruthy()
		expect(root.querySelector('.top-nav__catalog-btn')).toBeTruthy()
		expect(root.querySelector('.top-nav__catalog-btn-label')?.text.trim()).toBe('Каталог')
		expect(root.querySelector('.top-nav__logo')?.text.trim()).toBe('Esthetic Bra')
		expect(root.querySelectorAll('.top-nav__action').length).toBe(4)
	})

	it('burger and catalog button both carry data-catalog-open (mobile has no separate catalog pill)', () => {
		const root = parse(renderTopNav())
		expect(root.querySelector('.top-nav__burger').getAttribute('data-catalog-open')).not.toBeNull()
		expect(
			root.querySelector('.top-nav__catalog-btn').getAttribute('data-catalog-open'),
		).not.toBeNull()
	})

	it('no element carries a duplicated class (bemto raw-modifier-string grabля)', () => {
		const root = parse(renderTopNav())
		for (const el of root.querySelectorAll('[class]')) {
			const classes = el.getAttribute('class').trim().split(/\s+/)
			expect(new Set(classes).size).toBe(classes.length)
		}
	})

	it('has no literal hex colors in its stylesheet', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/top-nav/_top-nav.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})

describe('catalog popup (level1 / level2 / hover)', () => {
	it('renders a closed dialog by default (hidden attribute set)', () => {
		const root = parse(renderTopNav())
		const modal = root.querySelector('#catalogModal')
		expect(modal).toBeTruthy()
		expect(modal.getAttribute('hidden')).not.toBeNull()
		expect(modal.getAttribute('role')).toBe('dialog')
		expect(modal.getAttribute('aria-modal')).toBe('true')
	})

	it('renders one level1 item per category, with counts', () => {
		const root = parse(renderTopNav())
		const items = root.querySelectorAll('.catalog-modal__item')
		expect(items.length).toBe(fixtureData.catalog.categories.length)
		const firstCount = root.querySelector('.catalog-modal__item-count')
		expect(firstCount?.text.trim()).toBe(String(fixtureData.catalog.categories[0].count))
	})

	it('only categories with children get a data-catalog-trigger + level2 panel', () => {
		const root = parse(renderTopNav())
		const withChildren = fixtureData.catalog.categories.filter((c) => c.children)
		const triggers = root.querySelectorAll('.catalog-modal__item-link[data-catalog-trigger]')
		const panels = root.querySelectorAll('.catalog-modal__panel')
		expect(triggers.length).toBe(withChildren.length)
		expect(panels.length).toBe(withChildren.length)
	})

	// Контракт сознательно поменялся (Figma 41:156/41:223, см. _top-nav.pug):
	// level1 — чистый список, ничего не развёрнуто по умолчанию, панель
	// появляется только под наведением (header.js: activateCategory добавляет
	// --active/--peek на mouseover/focus, не на рендере).
	it('nothing is pre-activated on render — level1 is a plain list until hover', () => {
		const root = parse(renderTopNav())
		expect(root.querySelector('.catalog-modal__item-link.--active')).toBeNull()
		expect(root.querySelector('.catalog-modal__panel.--active')).toBeNull()
	})

	it('a level2 panel has the "view all" card, its sub-items as image cards', () => {
		const root = parse(renderTopNav())
		const panel = root.querySelector('.catalog-modal__panel[data-catalog-panel="0"]')
		expect(panel.querySelector('.catalog-modal__panel-card.--all')).toBeTruthy()
		const subItems = fixtureData.catalog.categories[0].children.items
		expect(panel.querySelectorAll('.catalog-modal__panel-card').length).toBe(subItems.length + 1)
		const img = panel.querySelector('.catalog-modal__panel-card-img')
		expect(img).toBeTruthy()
		expect(img.getAttribute('loading')).toBe('lazy')
	})

	it('general links (Frame 675) render below the category list, desktop-only', () => {
		const root = parse(renderTopNav())
		const links = root.querySelectorAll('.catalog-modal__link')
		expect(links.length).toBe(fixtureData.links.length)
		expect(root.querySelector('.catalog-modal__links').classList.contains('d-lg-flex')).toBe(true)
	})

	it('mobile drill-down back button is present per panel (d-lg-none)', () => {
		const root = parse(renderTopNav())
		const backButtons = root.querySelectorAll('[data-catalog-back]')
		const withChildren = fixtureData.catalog.categories.filter((c) => c.children)
		expect(backButtons.length).toBe(withChildren.length)
	})

	it('close button and backdrop both carry data-catalog-close', () => {
		const root = parse(renderTopNav())
		expect(root.querySelector('.catalog-modal__close').getAttribute('data-catalog-close')).not.toBe(
			null,
		)
		expect(
			root.querySelector('.catalog-modal__backdrop').getAttribute('data-catalog-close'),
		).not.toBe(null)
	})
})

describe('header + top-nav rendered together (as in pages/parts/header.pug)', () => {
	it('renders the header landmark wrapping the fixed bar and the popup', () => {
		const root = parse(renderFull())
		const headerEl = root.querySelector('header.header#header')
		expect(headerEl).toBeTruthy()
		expect(headerEl.querySelector('.top-nav')).toBeTruthy()
		expect(headerEl.querySelector('#catalogModal')).toBeTruthy()
	})
})
