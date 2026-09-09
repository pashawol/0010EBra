# Архитектура — 0010EBra

База: `mega-front-starter-boot5` (MegaFronTeam), локальная hardened-версия — Gulp 5 + Bootstrap 5.3.3 + SCSS (dart-sass) + Pug. ESM (`"type": "module"`).

## Дерево

```
source/                  ← ЕДИНСТВЕННОЕ место, где правим руками
  pug/
    pages/*.pug          ← страницы (что здесь лежит — то и собирается в public/*.html)
    layout/              ← main.pug (каркас), include.pug, js-css.pug (подключение ассетов)
    blocks/<name>/       ← блок = _<name>.pug + _<name>.scss (пара, всегда рядом)
    content.json         ← данные, доступны в Pug как переменные (gulp-data)
  sass/
    _root.scss           ← CSS-переменные (палитра, отступы) — источник правды по токенам
    _vars.scss           ← SCSS-переменные
    _var-dark.scss       ← тёмная тема
    _vars_base.scss      ← базовые размеры/сетка
    _mixin.scss, _media.scss  ← миксины, брейкпоинты
    _base.scss           ← базовые стили (тоже под strict-value)
    main.scss            ← точка входа → public/css/main.css
    custom-bootstrap.scss← точка входа Bootstrap → public/css/custom-bootstrap.css
    _sprite.scss         ← ГЕНЕРИРУЕТСЯ (svg-sprite), не править
    templates/           ← шаблоны генерации, bourbon/ — вендор
  js/
    common.js            ← основной скрипт
    JSCCommon.js
  img/*.{jpg,jpeg,png}   ← исходники картинок
  svg/*.svg              ← иконки → собираются в спрайт

public/                  ← АРТЕФАКТ СБОРКИ, руками не править
  css/ js/ img/ img/svg/ ← генерируются
  libs/                  ← вендор из node_modules, обновляется `npm run libs` (коммитится)

gulp/tasks/              ← реализация задач (pug, sass, script, svg, img-responsive, copylibs, serv, watch, file)
gulp/config/tasks.js     ← конфиг задач
gulpfile.js              ← сборка графа задач
block.js + lib/utils.js  ← интерактивный скаффолдер блоков
tests/                   ← vitest (unit/fuzz/snapshot) + playwright (e2e/a11y)
```

## Сборка

`npm run dev` (= `gulp`, задача `dev`):
`copyScripts → ensureVendorLibs → styles → sprite → images → compilePug → [serve ‖ watch]`
BrowserSync поднимает `public/`, watch следит за sass/pug/js/svg/img.

`npm run build` (= `NODE_ENV=production gulp build`):
`copyScripts → libs → styles → sprite → images → compilePug → validateHtml`
В production CSS минифицируется (cssnano), рядом остаётся неминифицированная копия.

Полезные env-флаги: `GULP_MINIFY_CSS=true` (минификация вне prod), `GULP_USE_POLLING=true` (watch на сетевых ФС).

Отдельные задачи: `gulp libs` (перезалить `public/libs` из node_modules), `gulp sprite`, `gulp styles`, `gulp images`, `gulp validate`.

## Соглашения по блокам

**Новый блок создаётся только через `node block.js`** — спросит имя, создаст `source/pug/blocks/<name>/_<name>.pug` и `_<name>.scss` по шаблону. Sass подтягивается glob-импортом, ручной `@import` не нужен.

Шаблон Pug использует BEM-миксины стартера (`+b`, `+e`):

```pug
mixin sHero(data)
	// start sHero
	+b.SECTION.sHero.section#sHero&attributes(attributes)
		.container
			+b.section-title.text-center
				h2 Заголовок
			+e.row.row
	// end sHero
```

Блок подключается в странице через `+sHero(data)`.

Именование: секции — `sPascalCase` (`sCatalog`, `sContact`, `sForm`), служебные — kebab (`top-nav`, `form-wrap`).

### Параллакс фона

`source/js/parallax.js` двигает любой `<img data-parallax>` внутри ближайшего родителя с
`overflow: hidden`. Контракт блока:

| Что | Где | Роль |
| --- | --- | --- |
| `--<block>-photo-ratio` | SCSS блока (`2556 / 1664`) | пропорции исходного файла |
| `--<block>-parallax-zoom` | SCSS блока (`1.18`) | во сколько раз картинка крупнее бокса — он же ход, он же обрезка по бокам |
| `--parallax-amount` | опционально, `0…1` | приглушить ход, не трогая геометрию |
| `data-parallax-start` / `data-parallax-end` | атрибуты `<img>` | границы скраба, по умолчанию `top bottom` / `bottom top` |

Скрипт ходит ровно до края запаса и не дальше — за границу бокса картинка не уезжает,
дыры на скролле не появляются.

**Бокс под фото повторяет пропорции файла:** `aspect-ratio: var(--<block>-photo-ratio)`. Тогда
`object-fit: cover` срезает по бокам ровно `1 − 1/zoom` и ничего сверх того. Если бокс не
повторяет пропорции, cover догоняет высоту и режет кадр: на sBooking/1440 так терялось 40%
ширины. Бокс ниже секции — остаток красится фоном секции, низ фото уводится `mask-image` в цвет.

**Границы скраба важнее амплитуды.** Дефолтный `bottom top` требует, чтобы секция целиком ушла
выше вьюпорта; у последней секции страницы прокрутки на это не хватает — скраб не доигрывает и
ход размазывается по всей странице. sBooking поэтому стоит на `data-parallax-end="bottom bottom"`:
168 px хода за 937 px прокрутки (18% разницы со скоростью страницы) вместо 105 px за 1900 px (5%,
глазом не видно).

## Токены и запрет хардкода

Stylelint с `stylelint-declaration-strict-value` **падает** на литеральном значении в `color|*-color|background|fill|stroke` внутри `source/pug/blocks/**/*.scss`, `source/sass/_base.scss`, `_select2.scss`.
Разрешены: `var(--…)`, SCSS-переменные, функции, и белый список (`transparent`, `currentColor`, `inherit`, `unset`, `initial`, `none`, `0`).
Значит: **любой цвет из макета сначала заводится токеном** в `_root.scss` (CSS-var) или `_vars.scss`, и только потом используется.

Исключены из проверки: `public/**`, `bourbon/`, `_sprite*.scss`, `templates/`, `custom-bootstrap.scss`.

## Вендор

`dependencies`: jQuery 3.7, Bootstrap 5.3.3, Swiper 11, Fancybox (`@fancyapps/ui`), select2, inputmask. Копируются в `public/libs` через `gulp-npm-dist`. Подключение — в `source/pug/layout/js-css.pug`.

## Линт и хуки

- Biome — JS (`source/js`, `block.js`, `gulpfile.js`, `gulp`, `tests`).
- Stylelint (+scss plugin) — SCSS.
- html-validate — по собранным `public/**/*.html` (входит в `build`).
- husky + lint-staged: на коммите автофикс `*.{js,json}` через Biome и `*.scss` через Stylelint. Коммиты делает Pavel — хуки отработают у него.

## Отличия от стартера

- `html-validate` поднят `^9.5.0` → `^11.6.0`. Причина: 9.x объявляет optional peer `vitest ^0.34 || ^1 || ^2 || ^3`, а в проекте vitest 4 — `npm install` падал с ERESOLVE. В 11.6.0 peer уже `vitest ^3 || ^4`, конфликт уходит штатно, без `--legacy-peer-deps`. Проверено: `npm run build` (в т.ч. `validateHtml`) зелёный на существующих страницах.
- `.npmrc` содержит `package-lock=false` — lock-файла в проекте нет by design (наследие стартера).
- Playwright требует один раз `npx playwright install chromium` на машине.

## Деплой

`.github/workflows/static.yml` — публикация статики на GitHub Pages. Пуш делает только Pavel.
