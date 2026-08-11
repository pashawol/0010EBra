# BLOCK-KIT — всё, что нужно для вёрстки блока

Компактный бриф вместо чтения плана, архитектуры и чужих блоков.
Читать только этот файл + свою ноду Figma.

Figma: `Wu9ocMTTTZvyFYbVm9Pz2D`. Стек: Gulp 5 · Bootstrap 5.3 · Pug + bemto · SCSS ·
Swiper 14 · Fancybox 6 · GSAP 3.15. Только вёрстка, внедрять будут после нас.

---

## 1. Структура блока

```
source/pug/blocks/<name>/_<name>.pug     # миксин +<name>(data)
source/pug/blocks/<name>/_<name>.scss    # стили, подхватываются glob-импортом
source/pug/data/<name>.json              # {"<name>": {...}} — тексты и данные
source/img/<name>/*.jpg|png              # исходники; сборка сама делает webp
tests/blocks-<name>.test.js              # рендер + ключевые узлы
```

Скелет:

```pug
mixin sName(data)
	- data = data || sName
	// start sName
	+b.SECTION.sName.section#sName&attributes(attributes)
		.container
			+e.DIV.inner
	// end sName
```

Картинки в разметке — **сразу `.webp`**: `img/sName/photo.webp`. Оригиналы в `public`
не копируются, целевые браузеры webp поддерживают нативно.

---

## 2. Токены (литеральный hex в SCSS блока запрещён механически)

Цвет: `--eb-burgundy` `--eb-ink` `--eb-light-blue` `--eb-beige` `--eb-error`
`--eb-error-text` `--eb-white` + ступени `--eb-ink-75/65/35`, `--eb-white-75/35/15`.

Роли (читать их, а не конкретные цвета): `--eb-text` `--eb-text-muted` `--eb-text-soft`
`--eb-text-faint` `--eb-surface` `--eb-surface-hover` `--eb-accent` `--eb-on-accent`
`--eb-hairline`.

Геометрия: `--eb-radius` 14 · `--eb-radius-badge` 10 · `--eb-radius-check` 8 ·
`--eb-control-size` 52 · `--eb-blur` 15 · `--eb-gutter` (16 → 32 → 65).

Типографика: `--eb-h1..h4`, `--eb-subtitle-1/2`, `--eb-body`, `--eb-caption`.
Заголовки — Vetrino (`$font-family-display`), остальное Inter.

**Темы.** Тёмная секция — класс `eb-theme--dark` на корне, белый руками НЕ писать.
Светлый под-блок внутри тёмной секции — класс `eb-theme--light`, иначе унаследует
тёмные роли (было: текст ошибки светло-красным на белом, контраст 1.7).

Размеры — через `rem(px)`.

---

## 3. Готовые атомы (свои аналоги не писать)

`+ebBtn(text, mode, icon, href)` — mode `primary|secondary`; с `href` рендерит `<a>`
`+ebBtnText(text, href)` · `+ebIconBtn(icon, label, mode)` — mode `solid|ghost`
`+ebSliderNav()` — буллеты + пара стрелок · `+ebTag(text, icon)` · `+ebTitle(text, level)`
`+ebFact(value, caption, tag)` · `+ebHotspot(title, text, href)` · `+ebProductCard(product)`
`+icon(name)` — иконки Lucide из спрайта

---

## 4. Каталог граблей — каждая уже стоила времени на этом проекте

1. **bemto достраивает базовый класс из модификатора.** Передавать ТОЛЬКО модификатор
   (`class="--" + mode`). Срабатывает и на runtime-строках с `--`: для классов из данных
   брать не-BEM имя (`is-new`). Иначе html-validate валит сборку на `no-dup-class`.
2. **`.swiper { z-index: 1 }`** из CSS Swiper перебивает оверлей: элемент есть в DOM и
   невидим. Ловится ТОЛЬКО скриншотом, computed-стили врут.
3. **`overflow: hidden` на секции** режет карточки хотспотов у края фото.
4. **Full-bleed снимается ПАРНЫМ сбросом**: `eb-bleed()` / `eb-bleed-reset()`.
   Снять только margin недостаточно — остаётся `width: 100vw`.
5. **Слайду только `flex-shrink: 0`.** Никогда width/flex-basis — ломает `slidesPerView`.
6. **Слайдер без `data-swiper-scope`** на корне блока: общий инициализатор не найдёт
   стрелки, и они останутся декорацией. Опции — `data-swiper-options` с
   `navigation: true, pagination: true`.
7. **`flex: 1 0 0` без брейкпоинта** схлопывает карточки на мобилке.
8. **`object-fit: cover` на фикс-боксе** режет разноформатные фото — проверять лица.
9. **Процентный `top` у абсолютных детей** не резолвится, если у родителя только
   `min-height`: нужна определённая высота.
10. **Контраст ≥ 4.5**, иначе axe валит как serious. 35% серого годится только для
    декоративного текста.
11. **`gulp-plumber` глотает ошибки sass**: билд возвращает 0 при упавшей компиляции.
    Проверять `grep -i error` по логу, а не только exit code.
12. **Pug компилится молча при ошибке** — правка «не появляется». Проверять собранный HTML.
13. **`+icon()` без `&attributes`** терял классы цепочки — уже починено, но помнить.

---

## 5. Definition of Done

- `npm run build` — exit 0 **и** `grep -i error` по логу чист.
- `npm run lint`, `npx vitest run tests/blocks-<name>.test.js` — exit 0, явным `echo EXIT=$?`.
- Браузер: **слушать `pageerror`**. Не резать эту проверку: однажды при зелёных
  build/lint/test/axe на всём проекте не работал ни один слайдер.
- Замеры числами: оверфлоу (`scrollWidth <= innerWidth + 1`), `naturalWidth > 0` у
  видимых картинок (мерить ПОСЛЕ прокрутки к секции — из-за `lazy`), пересечение боксов,
  `realIndex` слайдера меняется по клику.
- Скриншот-сверка с макетом: **один десктоп + один мобайл**, в конце. Кадры Figma
  снимать `maxDimension: 600`.
- Лимит **2 круга** переснятия. Не сошлось — в отчёт как расхождение.

Заголовки рисуются fallback-шрифтом: Vetrino заказчик не прислал. Начертание не сверять,
сверять геометрию. 404 на `Vetrino-Regular.woff2` — ожидаемый.

---

## 6. Границы при параллельной работе

Правишь только свой блок, свой JSON, свои картинки, свой тест.
НЕ трогать: `index.pug`, `content.json`, `common.js`, `JSCCommon.js`, `anim.js`,
`_root.scss`, `_base.scss`, `_vars*.scss`, `_mixin.scss`, `eb-ui.*`, `eb-product-card.*`,
`mixin-wrap.pug`, `layout/*`, `gulpfile.js`, `package.json`, `source/svg/*`, `tests/e2e/*`.
Нужна правка общего — заявка в `docs/coordination/<name>.md` + локальный обход.

Никаких git-команд: коммиты и пуш делает только Pavel.
