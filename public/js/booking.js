// .sBooking form validation — node 497:931 / 739:898, states spec 652:1373.
//
// Только вёрстка + Constraint Validation API, без отправки (решение
// заказчика, docs/PLAN.md §1.1 "Формы"): кнопка — type="submit" (нужен
// html-validate wcag/h32 — у формы обязан быть submit-контрол), а гарантия
// от реальной отправки — инлайновый onsubmit="return false" в _sBooking.pug,
// не зависящий от того, подключится ли этот файл.
//
// Маска телефона НЕ здесь: input[type="tel"] уже попадает под глобальный
// JSCCommon.inputMask() (вызывается JSCCommon.init() из common.js на каждой
// странице) — Inputmask "+9(999)999-99-99" навешивается сама.
//
// ВНИМАНИЕ координатору: этот файл лежит в source/js/ (не
// source/pug/blocks/sBooking/), поэтому copyScripts (gulpfile.js, jsWatch =
// 'source/js/**/*.js') копирует его в public/js штатно — гэп про
// source/pug/blocks/**/*.js (см. docs/coordination/footer.md §4) сюда не
// относится. Но <script src="js/booking.js"> нужно добавить в
// source/pug/layout/js-css.pug (allcjs()) — этот файл вне зоны блока,
// заявка в docs/coordination/sBooking.md.
function initBookingForm() {
	const form = document.getElementById('sBookingForm')
	if (!form) return

	const nameInput = document.getElementById('sBookingName')
	const phoneInput = document.getElementById('sBookingPhone')
	const consentInput = document.getElementById('sBookingConsent')
	const timeHint = document.getElementById('sBookingTimeHint')
	const timeInputs = Array.from(form.querySelectorAll('input[name="timeSlot"]'))

	if (!nameInput || !phoneInput || !consentInput || !timeHint || timeInputs.length === 0) return

	// input.validity.valid — НЕ input.checkValidity(). Обе возвращают одно и
	// то же булево, но checkValidity() ДОПОЛНИТЕЛЬНО диспатчит cancelable
	// событие "invalid" на элементе, если он не прошёл валидацию. Для
	// input[type=tel] с навешенным Inputmask это событие запускает в Chromium
	// побочный эффект: следующий клик пользователя по ЭТОМУ ЖЕ полю фокусит
	// его и тут же (0.1мс) блюрит обратно — реальная невозможность попасть
	// в поле мышью после первой неудачной попытки отправки. Подтверждено
	// воспроизведением в headed Chromium (не артефакт Playwright/headless) и
	// сведено к причине через устранение: включал/выключал именно вызов
	// checkValidity() и именно на type=tel-поле. validity.valid — чистый
	// геттер без побочных эффектов, ведёт себя идентично для наших целей.
	function setFieldValidity(input) {
		const valid = input.validity.valid
		input.setAttribute('aria-invalid', String(!valid))
		return valid
	}

	function timeSelected() {
		return timeInputs.some((input) => input.checked)
	}

	// forceShow=true — вызывается при попытке отправки: показывает чип, если
	// время не выбрано. forceShow=false (обычная смена выбора) — только
	// прячет чип при валидном выборе, никогда не показывает его сама по себе
	// (чип — реакция на попытку отправки, не на «поле просто пустое», иначе
	// он появлялся бы сразу при заходе на страницу).
	function setTimeValidity(forceShow) {
		const valid = timeSelected()
		if (valid) {
			timeHint.hidden = true
		} else if (forceShow) {
			timeHint.hidden = false
		}
		return valid
	}

	function validateAll() {
		const nameValid = setFieldValidity(nameInput)
		const phoneValid = setFieldValidity(phoneInput)
		const timeValid = setTimeValidity(true)
		const consentValid = setFieldValidity(consentInput)
		return nameValid && phoneValid && timeValid && consentValid
	}

	// pug уже гарантирует onsubmit="return false" инлайново — preventDefault
	// здесь для симметрии и на случай будущей правки разметки координатором.
	form.addEventListener('submit', (event) => {
		event.preventDefault()
		if (!validateAll()) {
			const firstInvalid =
				form.querySelector('[aria-invalid="true"]') || (!timeSelected() ? timeInputs[0] : null)
			// setTimeout(0), а не синхронный .focus() — иначе Chromium съедает
			// ПЕРВЫЙ клик пользователя по любому ДРУГОМУ полю сразу после этой
			// попытки отправки (focus(), вызванный синхронно внутри обработчика
			// submit — не прямого клика по самому полю, триггерит защиту от
			// focus-stealing и глотает следующий click). Подтверждено
			// воспроизведением в headed Chromium, не артефакт Playwright —
			// см. заявку в docs/coordination/sBooking.md.
			setTimeout(() => firstInvalid?.focus(), 0)
			return
		}
		// Отправки нет по требованию заказчика — только визуальное
		// подтверждение того, что все поля прошли валидацию.
	})

	for (const input of [nameInput, phoneInput]) {
		input.addEventListener('input', () => {
			if (input.getAttribute('aria-invalid') === 'true') setFieldValidity(input)
		})
	}

	for (const input of timeInputs) {
		input.addEventListener('change', () => setTimeValidity(false))
	}

	consentInput.addEventListener('change', () => {
		if (consentInput.getAttribute('aria-invalid') === 'true') setFieldValidity(consentInput)
	})
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initBookingForm)
} else {
	initBookingForm()
}
