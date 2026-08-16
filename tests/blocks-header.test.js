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
const CATALOG_PATH = path.resolve(__dirname, '..', 'source/pug/data/catalog.json')

// renderBlock() has no gulp-data merge step by itself, so the fixture injects
// the same source/pug/data/header.json payload via pug locals — same pattern
// as tests/blocks-sExpertise.test.js.
const { header: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
const { catalog: catalogData } = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))

function renderHeader() {
	return renderBlock('header', { locals: { header: fixtureData } })
}

function renderTopNav() {
	return renderBlock('top-nav', {
		call: '+top-nav()',
		locals: { header: fixtureData, catalog: catalogData },
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
		catalog: catalogData,
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
		expect(root.querySelector('.top-nav__logo svg')).toBeTruthy()
		expect(root.querySelectorAll('.top-nav__action').length).toBe(4)
	})

	it('burger opens the menu, the pill opens the catalog — two separate buttons', () => {
		const root = parse(renderTopNav())
		const burger = root.querySelector('.top-nav__burger')
		const pill = root.querySelector('.top-nav__catalog-btn')

		expect(burger.getAttribute('data-mobile-menu-toggle')).not.toBeUndefined()
		expect(burger.getAttribute('data-catalog-open')).toBeUndefined()
		expect(burger.getAttribute('aria-controls')).toBe('mobileMenu')

		expect(pill.getAttribute('data-catalog-open')).not.toBeUndefined()
		expect(pill.getAttribute('data-mobile-menu-toggle')).toBeUndefined()
		expect(pill.getAttribute('aria-controls')).toBe('catalogModal')
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

describe('header + top-nav rendered together (as in pages/parts/header.pug)', () => {
	it('renders the header landmark wrapping the fixed bar', () => {
		const root = parse(renderFull())
		const headerEl = root.querySelector('header.header#header')
		expect(headerEl).toBeTruthy()
		expect(headerEl.querySelector('.top-nav')).toBeTruthy()
		expect(headerEl.querySelector('#catalogModal')).toBeFalsy()
	})
})
