# 0010EBra (Kaspor)

Вёрстка на базе [mega-front-starter-boot5](https://github.com/MegaFronTeam/mega-front-starter-boot5): Gulp 5 + Bootstrap 5.3 + SCSS + Pug.

## Старт

```bash
npm install
npm run dev      # browser-sync + watch по source/
```

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сборка + watch + browser-sync |
| `npm run build` | production-сборка в `public/` + валидация HTML |
| `npm run libs` | перезалить `public/libs` из node_modules |
| `npm run lint` | Biome (JS) + Stylelint (SCSS) |
| `npm run format` | автофикс обоих линтеров |
| `npm run validate:html` | html-validate по `public/**/*.html` |
| `npm test` | Vitest (unit + fuzz + snapshot) |
| `npm run test:e2e` | Playwright: оверфлоу + axe-a11y |
| `node block.js` | скаффолдер нового блока |

## Документация

- [`docs/architecture.md`](docs/architecture.md) — структура, сборка, соглашения по блокам, токены.
- [`docs/testing.md`](docs/testing.md) — слои тестов и Definition of Done.
- [`CLAUDE.md`](CLAUDE.md) — правила работы в проекте (в т.ч. git-политика).

Правим только `source/`. `public/` — артефакт сборки.
