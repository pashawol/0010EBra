# CLAUDE.md — 0010EBra (Kaspor)

Вёрстка на базе `mega-front-starter-boot5` (MegaFronTeam): Gulp 5 + Bootstrap 5.3 + SCSS + Pug.

## Git-политика (жёсткая, не обсуждается)

**Коммиты и пуш делает ТОЛЬКО Pavel. Claude в истории репозитория не появляется.**

- ❌ НЕ запускать `git commit`, `git push`, `git tag`, `git merge`, `git rebase` — ни при каких обстоятельствах, ни «на всякий случай», ни в конце задачи.
- ❌ НЕ добавлять trailer `Co-Authored-By: Claude ...` — нигде и никогда (в т.ч. если попросят подготовить текст коммита).
- ❌ НЕ трогать `git config user.name/user.email` — стоит `PAVEL KHALUNIN <wol1414@gmail.com>`.
- ✅ Можно: `git status`, `git diff`, `git log`, `git show`, `git stash list` — read-only.
- ✅ Можно: `git add` — **только по прямой просьбе** Pavel («застейдж это»), без коммита.
- ✅ Всё остальное (код, сборка, линт, тесты, скриншот-сверка, отчёт) — на мне, автономно до конца.

Итог работы = чистое рабочее дерево с готовыми изменениями + отчёт «что сделано, что коммитить». Дальше Pavel сам.

Remote: `origin` → https://github.com/pashawol/0010EBra (private). Пуш — тоже только Pavel.

## Перед стартом читать

1. `docs/architecture.md` — структура, сборка, соглашения по блокам.
2. `docs/testing.md` — что и чем проверяется, Definition of Done.
3. `~/.claude/verstka-delivery.md` — движок автономной сдачи вёрстки по макету (интейк → план → fan-out → ревизор на каждый блок → один финальный отчёт).
4. `~/.claude/lessons/frontend.md` — глобальные грабли по фронту.

## Ключевые команды

```bash
npm run dev            # gulp: сборка + browser-sync watch
npm run build          # NODE_ENV=production gulp build
npm run lint           # biome (js) + stylelint (scss)
npm run format         # автофикс обоих
npm run validate:html  # html-validate по public/**/*.html
npm test               # vitest run
npm run test:e2e       # playwright (билдит и поднимает public на :5180)
node block.js          # интерактивный скаффолдер нового блока
```

После каждого изменения: `npm test && npm run lint`.

## Правила вёрстки в этом проекте

- **Хардкод цветов запрещён** в `source/pug/blocks/**/*.scss` и `source/sass/_base.scss` — stylelint (`declaration-strict-value`) режет `color/background/fill/stroke` с литеральным значением. Только `var(--…)` или SCSS-переменная. Токены — `source/sass/_root.scss`, `_vars.scss`, `_var-dark.scss`.
- **Новый блок — только через `node block.js`**, не руками: он кладёт `_name.pug` + `_name.scss` в `source/pug/blocks/name/` и подхватывается glob-импортом.
- Правим **только `source/`**. `public/` — артефакт сборки (кроме коммиченного `public/libs`, который обновляется через `npm run libs`).
- Файл > 300 строк → разбить (глобальное правило).
- «Есть в DOM, но не видно на скриншоте = БАГ, не готово».

## Макет

Figma-ссылка ещё не получена. Когда придёт — интейк одним пакетом `AskUserQuestion` (шрифты, брейкпоинты, набор страниц, ассеты), потом токены в `_root.scss`/`_vars.scss`, потом блоки.
