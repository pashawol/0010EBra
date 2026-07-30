// .footer subscribe-field validation.
//
// Только вёрстка + Constraint Validation API, без отправки (решение
// заказчика, docs/PLAN.md §1.1 "Формы"): кнопка — type="submit" (нужен
// html-validate wcag/h32 — у формы обязан быть submit-контрол), а
// гарантия от реальной отправки — инлайновый onsubmit="return false" в
// _footer.pug, не зависящий от того, подключится ли этот файл.
//
// ВНИМАНИЕ координатору: source/pug/blocks/**/*.js СЕЙЧАС НЕ копируется в
// public/js — gulpfile.js:260 (copyScripts) собирает только jsWatch
// ('source/js/**/*.js'), строка `source + '/pug/**/*.js'` закомментирована.
// Значит ни один блочный .js (этот, form-wrap.js и т.д.) в сборку не
// попадает. См. заявку в docs/coordination/footer.md — трогать gulpfile.js
// самостоятельно нельзя (общий файл вне зоны блока). Пока строка не
// раскомментирована, ошибка в .footer__subscribe-field показывается только
// вручную (см. проверку в отчёте) — CSS-фолбэк на :invalid в _footer.scss
// подстраховывает базовое поведение и без JS.
function initFooterSubscribe() {
	const form = document.getElementById('footerSubscribeForm')
	if (!form) return

	const input = document.getElementById('footerSubscribeEmail')
	const field = input?.closest('.footer__subscribe-field')

	if (!input || !field) return

	function validate() {
		const valid = input.checkValidity()
		field.classList.toggle('footer__subscribe-field--error', !valid)
		input.setAttribute('aria-invalid', String(!valid))
		return valid
	}

	// pug уже гарантирует onsubmit="return false" инлайново — preventDefault
	// здесь для симметрии и на случай будущей правки разметки координатором.
	form.addEventListener('submit', (event) => {
		event.preventDefault()
		if (!validate()) {
			input.focus()
			return
		}
		// Отправки нет по требованию заказчика — только визуальное подтверждение.
		field.classList.remove('footer__subscribe-field--error')
	})

	input.addEventListener('input', () => {
		if (field.classList.contains('footer__subscribe-field--error')) validate()
	})
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initFooterSubscribe)
} else {
	initFooterSubscribe()
}
