const paths = {
	publicDir: 'public',
	sourceDir: 'source',
	libsDir: 'public/libs',
	cssDir: 'public/css',
	jsDir: 'public/js',
	spritePublicDir: 'public/img/svg',
	pugPages: 'source/pug/pages/**/*.pug',
	pugData: 'source/pug/content.json',
	sassMainEntry: 'source/sass/main.scss',
	sassBootstrapEntry: 'source/sass/custom-bootstrap.scss',
	sassWatch: [
		'source/sass/**/*.css',
		'source/sass/**/*.scss',
		'source/sass/**/*.sass',
		'source/pug/blocks/**/*.scss',
	],
	jsWatch: 'source/js/**/*.js',
	fontsSource: 'source/fonts/**/*.{woff2,woff,ttf}',
	fontsDest: 'public/fonts',
	videoSource: 'source/video/**/*.{mp4,webm}',
	videoDest: 'public/video',
	imgSource: 'source/img/**/*.{jpg,jpeg,png}',
	imgVectorSource: 'source/img/**/*.{svg,gif}',
	imgDest: 'public/img',
	svgSource: 'source/svg/*.svg',
	spriteTemplate: 'source/sass/templates/_sprite_template.scss',
	spriteScssDest: '../_sprite.scss',
	spriteSource: 'source/sass/sprite.svg',
}

const shouldMinifyCss =
	process.env.NODE_ENV === 'production' || process.env.GULP_MINIFY_CSS === 'true'
const usePolling = process.env.GULP_USE_POLLING === 'true'

import pkg from 'gulp'
const { src, dest, parallel, series, watch, lastRun } = pkg

import { deleteAsync } from 'del'
import pug from 'gulp-pug'
import notify from 'gulp-notify'
import svgmin from 'gulp-svgmin'
import cheerio from 'gulp-cheerio'
import replace from 'gulp-replace'
import svgSprite from 'gulp-svg-sprite'
import npmDist from 'gulp-npm-dist'
import rename from 'gulp-rename'
import gulpSass from 'gulp-sass'
import sassGlob from 'gulp-sass-glob'
import * as dartSass from 'sass'
const sass = gulpSass(dartSass)
import tabify from 'gulp-tabify'
import gcmq from 'postcss-sort-media-queries'
import browserSync from 'browser-sync'
import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
// Явный путь к файлу: postcss-nested@8 объявлен как ESM, но не имеет ни "main",
// ни "exports" — Node ругается DeprecationWarning DEP0151 на index-lookup.
import nested from 'postcss-nested/index.js'
import plumber from 'gulp-plumber'
import data from 'gulp-data'
// gulp-imagemin@9 содержит top-level await, из-за которого весь граф gulpfile
// становится «async ESM»: старый глобальный gulp-cli грузит gulpfile через
// require() и падает с ERR_REQUIRE_ASYNC_MODULE. Поэтому импортируем его
// динамически внутри задачи — граф остаётся require-совместимым.
import webp from 'gulp-webp'
import fs from 'node:fs'
import { spawn } from 'node:child_process'

// Данные для Pug: общий content.json + по одному файлу на блок в source/pug/data/.
// Разведено по файлам специально: при параллельной вёрстке блоков общий
// content.json становится точкой конфликта, а свой файл блок правит один.
const readPugData = () => {
	const data = JSON.parse(fs.readFileSync(paths.pugData, 'utf8'))
	const dataDir = `${paths.sourceDir}/pug/data`

	if (!fs.existsSync(dataDir)) return data

	for (const file of fs
		.readdirSync(dataDir)
		.filter((f) => f.endsWith('.json'))
		.sort()) {
		const key = file.replace(/\.json$/, '')
		const parsed = JSON.parse(fs.readFileSync(`${dataDir}/${file}`, 'utf8'))
		// Файл может либо описывать один блок (ключ = имя файла), либо
		// содержать несколько top-level ключей — поддерживаем оба варианта.
		if (
			parsed &&
			typeof parsed === 'object' &&
			!Array.isArray(parsed) &&
			parsed[key] !== undefined
		) {
			Object.assign(data, parsed)
		} else {
			data[key] = parsed
		}
	}

	return data
}
const createCssProcessors = () => {
	const processors = [autoprefixer(), nested(), gcmq()]
	if (shouldMinifyCss) {
		processors.push(cssnano())
	}
	return processors
}

class BuildTasks {
	static serve() {
		browserSync.init({
			server: {
				baseDir: `./${paths.publicDir}`,
				// middleware: bssi({ baseDir: './' + publicPath, ext: '.html' })б
				serveStaticOptions: {
					extensions: ['html'],
				},
			},
			// ghostMode: { clicks: false },
			// notify: false,
			// online: true,
			// tunnel: 'layouts', // Attempt to use the URL https://layouts.loca.lt
		})
	}

	// Сборка pug не удаляет HTML, оставшийся от переименованных или удалённых
	// страниц: в public копились осиротевшие файлы, и они попадали в сдачу.
	// Чистим только *.html — это единственные генерируемые из pug артефакты,
	// css/js/img/libs лежат в своих папках и не затрагиваются.
	static cleanHtml() {
		return deleteAsync([`${paths.publicDir}/**/*.html`])
	}

	static compilePug() {
		const pageData = readPugData()
		return (
			src([paths.pugPages])
				.pipe(
					data(function () {
						return pageData
					}),
				)
				.pipe(
					pug({
						pretty: true,
						cache: true,
						// locals: pageData || {}
					}).on('error', notify.onError()),
				)
				.pipe(tabify(2, true))
				// .pipe( urlBuilder() )
				.pipe(dest(paths.publicDir))
				.on('end', browserSync.reload)
		)
	}

	static validateHtml(done) {
		const proc = spawn(`npx html-validate "${paths.publicDir}/**/*.html"`, {
			stdio: 'inherit',
			shell: true,
		})
		proc.on('error', (err) => done(err))
		proc.on('close', (code) => {
			done(code === 0 ? undefined : new Error(`html-validate found errors (exit ${code})`))
		})
	}

	static cleanVendorLibs() {
		return deleteAsync([paths.libsDir])
	}

	static copyVendorLibs() {
		return src(
			npmDist({
				copyUnminified: true,
				excludes: [
					// '*.map',
					'src/**/*',
					'./@babel/*',
					'animate.css/source/',
					'inputmask/inputmask/',
					'inputmask/bindings',
					'source',
					'./babel*/*',
					'./gulp*',
					'swiper/components',
					'swiper/angular',
					'swiper/react',
					'swiper/svelte',
					'swiper/cjs',
					'swiper/bundle',
					'swiper/vue',
					// '*.mjs',
					'swiper/modules',
					'swiper/shared',
					'swiper/types',
					'examples',
					'example',
					'node_modules',
					'core',
					'demo/**/*',
					'spec/**/*',
					'docs/**/*',
					'tests/**/*',
					'test/**/*',
					'Gruntfile.js',
					'gulpfile.js',
					'package.json',
					'package-lock.json',
					'bower.json',
					'composer.json',
					'yarn.lock',
					'webpack.config.js',
					'README',
					'LICENSE',
					'CHANGELOG',
					'*.yml',
					'*.md',
					'*.coffee',
					'*.ts',
					'*.less',
				],
			}),
			{ base: './node_modules' },
		)
			.pipe(
				rename(function (path) {
					path.dirname = path.dirname.replace(/\/dist/, '').replace(/\\dist/, '')
				}),
			)
			.pipe(dest(paths.libsDir))
	}

	static ensureVendorLibs(done) {
		const hasLibs = fs.existsSync(paths.libsDir) && fs.readdirSync(paths.libsDir).length > 0
		if (hasLibs) {
			done()
			return
		}

		return BuildTasks.copyVendorLibs()
	}

	static compileMainStyles() {
		const processors = createCssProcessors()
		return src(paths.sassMainEntry)
			.pipe(sassGlob())
			.pipe(sass.sync().on('error', sass.logError))
			.pipe(postcss(processors))
			.pipe(rename({ suffix: '.min', prefix: '' }))
			.pipe(dest(paths.cssDir))
			.pipe(browserSync.stream())
	}

	static compileBootstrapStyles() {
		const processors = createCssProcessors()
		return src(paths.sassBootstrapEntry)
			.pipe(sass.sync().on('error', sass.logError))
			.pipe(postcss(processors))
			.pipe(rename({ suffix: '.min', prefix: '' }))
			.pipe(dest(paths.cssDir))
			.pipe(browserSync.stream())
	}

	static copyScripts() {
		return (
			src(
				[
					paths.jsWatch,
					// source + '/pug/**/*.js',
				],
				{ since: lastRun(BuildTasks.copyScripts) },
			)
				// .pipe(babel())
				// .pipe(tabify(2, true))
				.pipe(dest(paths.jsDir))
				.pipe(browserSync.stream())
		)
	}

	// В стартере не было задачи копирования шрифтов: @font-face ссылался на
	// public/fonts, которого сборка не создавала — все шрифты отдавали 404.
	static copyFonts() {
		return src(paths.fontsSource, { encoding: false }).pipe(dest(paths.fontsDest))
	}

	static copyVideo() {
		return src(paths.videoSource, { encoding: false, allowEmpty: true }).pipe(dest(paths.videoDest))
	}

	static buildSvgSprite() {
		return src(paths.svgSource)
			.pipe(
				svgmin({
					js2svg: {
						pretty: true,
					},
				}),
			)
			.pipe(
				cheerio({
					run: function ($) {
						$('[fill]').removeAttr('fill')
						$('[stroke]').removeAttr('stroke')
						$('[style]').removeAttr('style')
						$('[opacity]').removeAttr('opacity')
					},
					parserOptions: { xmlMode: true },
				}),
			)
			.pipe(replace('&gt;', '>'))
			.pipe(
				svgSprite({
					shape: {
						dimension: {
							// Set maximum dimensions
							maxWidth: 500,
							maxHeight: 500,
						},
						spacing: {
							// Add padding
							padding: 0,
						},
					},
					mode: {
						symbol: {
							sprite: '../sprite.svg',
							render: {
								scss: {
									template: `./${paths.spriteTemplate}`,
									dest: paths.spriteScssDest,
								},
							},
						},
					},
				}),
			)

			.pipe(dest(`${paths.sourceDir}/sass/`))
	}

	static copySvgSprite() {
		return src(paths.spriteSource).pipe(plumber()).pipe(dest(paths.spritePublicDir))
	}

	// source/img (raster, SVG excluded — that goes through the sprite pipeline)
	// → optimized same-format copy in public/img. Reads from source, never
	// re-compresses in place, so quality does not degrade across builds.
	static async optimizeImages() {
		const [{ default: imagemin, mozjpeg }, { default: imageminPngquant }] = await Promise.all([
			import('gulp-imagemin'),
			import('imagemin-pngquant'),
		])

		await new Promise((resolve, reject) => {
			src(paths.imgSource, { encoding: false, since: lastRun(BuildTasks.optimizeImages) })
				.pipe(plumber())
				.pipe(
					imagemin([
						mozjpeg({ quality: 80, progressive: true }),
						imageminPngquant({ quality: [0.6, 0.8], strip: true }),
					]),
				)
				.pipe(dest(paths.imgDest))
				.on('finish', resolve)
				.on('error', reject)
		})
	}

	// Векторные и анимированные ассеты imagemin-пайплайн не берёт (он про
	// jpg/png), но в разметке они нужны — копируем как есть, без обработки.
	static copyImgVectors() {
		return src(paths.imgVectorSource, { encoding: false }).pipe(dest(paths.imgDest))
	}

	// One .webp per raster source image (single size, no responsive variants).
	static makeWebp() {
		return src(paths.imgSource, { encoding: false, since: lastRun(BuildTasks.makeWebp) })
			.pipe(plumber())
			.pipe(webp({ quality: 80 }))
			.pipe(dest(paths.imgDest))
	}

	static watchFiles() {
		const watchOptions = { usePolling }
		const stylesTask = parallel(BuildTasks.compileMainStyles, BuildTasks.compileBootstrapStyles)

		watch(paths.sassWatch, watchOptions, stylesTask)
		watch(
			[`${paths.sourceDir}/pug/**/*.pug`, paths.pugData, `${paths.sourceDir}/pug/data/*.json`],
			watchOptions,
			BuildTasks.compilePug,
		)
		watch(
			paths.svgSource,
			watchOptions,
			series(BuildTasks.buildSvgSprite, BuildTasks.copySvgSprite),
		)
		watch(paths.jsWatch, watchOptions, BuildTasks.copyScripts)
		watch(paths.imgSource, watchOptions, BuildTasks.images)
		watch(paths.videoSource, watchOptions, BuildTasks.copyVideo)
	}
}

// В сборку идут только webp и вектор. Оригиналы png/jpg остаются в source/img
// как источник правды, но в public не копируются: вся разметка ссылается на
// webp (целевые браузеры — Safari/iOS 15.4+, там webp поддерживается нативно),
// поэтому оригиналы были бы 6.8 МБ мёртвого веса в сдаваемой папке.
// Нужны оптимизированные растры — есть отдельная задача: `npx gulp raster`.
BuildTasks.images = parallel(BuildTasks.makeWebp, BuildTasks.copyImgVectors)

export const raster = BuildTasks.optimizeImages

export const libs = series(BuildTasks.cleanVendorLibs, BuildTasks.copyVendorLibs)
export const sprite = series(BuildTasks.buildSvgSprite, BuildTasks.copySvgSprite)
export const styles = parallel(BuildTasks.compileBootstrapStyles, BuildTasks.compileMainStyles)
export const images = BuildTasks.images

export const validate = BuildTasks.validateHtml

export const fonts = BuildTasks.copyFonts
export const video = BuildTasks.copyVideo

export const build = series(
	BuildTasks.copyScripts,
	BuildTasks.copyFonts,
	BuildTasks.copyVideo,
	libs,
	styles,
	sprite,
	BuildTasks.images,
	BuildTasks.cleanHtml,
	BuildTasks.compilePug,
	BuildTasks.validateHtml,
)

export const dev = series(
	BuildTasks.copyScripts,
	BuildTasks.copyFonts,
	BuildTasks.copyVideo,
	BuildTasks.ensureVendorLibs,
	styles,
	sprite,
	BuildTasks.images,
	BuildTasks.cleanHtml,
	BuildTasks.compilePug,
	parallel(BuildTasks.serve, BuildTasks.watchFiles),
)

export default dev
