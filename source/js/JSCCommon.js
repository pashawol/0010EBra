// import "../libs/jquery/jquery.min.js";
// import "../libs/select2/js/select2.min.js";
// import "../libs/select2/js/i18n/ru.js";
// import {Fancybox} from "../libs/@fancyapps/ui/fancybox/fancybox.esm.js";
// import Inputmask from "../libs/inputmask/inputmask.es6.js";

class JSCCommon {
	static toggleClass(elements, className) {
		elements.forEach((el) => el.classList.toggle(className))
	}

	static removeClass(elements, className) {
		elements.forEach((el) => el.classList.remove(className))
	}
	static modalCall() {
		const link = '[data-fancybox="modal"], .link-modal-js'

		// Fancybox 6 убрал записываемый Fancybox.defaults (в 5 было
		// `Fancybox.defaults.autoFocus = false`). Теперь дефолты доступны только
		// через getDefaults(); присваивание в старом виде роняло весь
		// JSCCommon.init(), а вместе с ним — инициализацию слайдеров на странице.
		const fancyboxDefaults =
			typeof Fancybox.getDefaults === 'function' ? Fancybox.getDefaults() : null
		if (fancyboxDefaults) {
			fancyboxDefaults.autoFocus = false
			fancyboxDefaults.placeFocusBack = false
		}

		Fancybox.bind(link, {
			arrows: false,
			// // infobar: false,
			touch: false,
			trapFocus: false,
			placeFocusBack: false,
			infinite: false,
			// type: 'html',
			dragToClose: false,
			autoFocus: false,
			groupAll: false,
			groupAttr: false,
			showClass: 'fancybox-throwOutUp',
			hideClass: 'fancybox-throwOutDown',
			compact: false,
			l10n: {
				CLOSE: 'Закрыть',
				Escape: 'Закрыть',
				NEXT: 'Вперед',
				PREV: 'Назад',
				MODAL: 'Вы можете закрыть это модальное окно с помощью клавиши ESC.',
				ERROR: 'Что-то пошло не так. Пожалуйста, повторите попытку позже',
				IMAGE_ERROR: 'Изображение не найдено',
				ELEMENT_NOT_FOUND: 'HTML-элемент не найден',
				AJAX_NOT_FOUND: 'Ошибка при загрузке AJAX: не найдено',
				AJAX_FORBIDDEN: 'Ошибка при загрузке AJAX: запрещено',
				IFRAME_ERROR: 'Ошибка загрузки iframe',
			},
		})
		document.querySelectorAll('.modal-close-js').forEach((el) => {
			el.addEventListener('click', (event) => {
				event.preventDefault()
				const instance = Fancybox.getInstance()
				if (instance) {
					instance.close()
				}
			})
		})

		document.addEventListener('click', (event) => {
			const element = event.target.closest(link)
			if (!element) return
			const modal = document.querySelector(element.dataset.src)
			const data = element.dataset

			function setValue(val, elem) {
				if (elem && val) {
					const el = modal.querySelector(elem)
					el.tagName == 'INPUT' ? (el.value = val) : (el.innerHTML = val)
					// console.log(modal.querySelector(elem).tagName)
				}
			}
			setValue(data.title, '.ttu')
			setValue(data.text, '.after-headline')
			setValue(data.btn, '.btn')
			setValue(data.order, '.order')
		})
	}
	// /modalCall

	static toggleMenu() {
		const toggle = document.querySelectorAll('.toggle-menu-mobile--js')
		const menu = document.querySelector('.menu-mobile--js')
		JSCCommon.toggleClass(toggle, 'on')
		menu.classList.toggle('active')
		JSCCommon.toggleClass([document.body, document.querySelector('html')], 'fixed')
	}
	static closeMenu() {
		const toggle = document.querySelectorAll('.toggle-menu-mobile--js')
		const menu = document.querySelector('.menu-mobile--js')
		JSCCommon.removeClass(toggle, 'on')
		if (menu) {
			menu.classList.remove('active')
			JSCCommon.removeClass([document.body, document.querySelector('html')], 'fixed')
		}
	}

	static mobileMenu() {
		document.addEventListener(
			'click',
			(event) => {
				const container = event.target.closest('.menu-mobile--js')
				const toggle = event.target.closest('.toggle-menu-mobile--js')
				if (toggle) JSCCommon.toggleMenu()
				if (!container && !toggle) JSCCommon.closeMenu()
			},
			{ passive: true },
		)

		window.addEventListener(
			'resize',
			() => {
				if (window.matchMedia('(min-width: 992px)').matches) JSCCommon.closeMenu()
			},
			{ passive: true },
		)
	}
	// tabs  .
	static tabsCostume(tab) {
		// const tabs = document.querySelectorAll(tab);
		// const indexOf = element => Array.from(element.parentNode.children).indexOf(element);
		// tabs.forEach(element => {
		// 	let tabs = element;
		// 	const tabsCaption = tabs.querySelector(".tabs__caption");
		// 	const tabsBtn = tabsCaption.querySelectorAll(".tabs__btn");
		// 	const tabsWrap = tabs.querySelector(".tabs__wrap");
		// 	const tabsContent = tabsWrap.querySelectorAll(".tabs__content");
		// 	const random = Math.trunc(Math.random() * 1000);
		// 	tabsBtn.forEach((el, index) => {
		// 		const data = `tab-content-${random}-${index}`;
		// 		el.dataset.tabBtn = data;
		// 		const content = tabsContent[index];
		// 		content.dataset.tabContent = data;
		// 		if (!content.dataset.tabContent == data) return;

		// 		const active = content.classList.contains('active') ? 'active' : '';
		// 		// console.log(el.innerHTML);
		// 		content.insertAdjacentHTML("beforebegin", `<div class="tabs__btn-accordion  btn btn-primary  mb-1 ${active}" data-tab-btn="${data}">${el.innerHTML}</div>`)
		// 	})

		// 	tabs.addEventListener('click', function (element) {
		// 		const btn = element.target.closest(`[data-tab-btn]:not(.active)`);
		// 		if (!btn) return;
		// 		const data = btn.dataset.tabBtn;
		// 		const tabsAllBtn = this.querySelectorAll(`[data-tab-btn`);
		// 		const content = this.querySelectorAll(`[data-tab-content]`);
		// 		tabsAllBtn.forEach(element => {
		// 			element.dataset.tabBtn == data
		// 				? element.classList.add('active')
		// 				: element.classList.remove('active')
		// 		});
		// 		content.forEach(element => {
		// 			element.dataset.tabContent == data
		// 				? (element.classList.add('active'), element.previousSibling.classList.add('active'))
		// 				: element.classList.remove('active')
		// 		});
		// 	})
		// })

		$('.' + tab + '__caption').on('click', '.' + tab + '__btn:not(.active)', function () {
			$(this)
				.addClass('active')
				.siblings()
				.removeClass('active')
				.closest('.' + tab)
				.find('.' + tab + '__content')
				.hide()
				.removeClass('active')
				.eq($(this).index())
				.fadeIn()
				.addClass('active')
		})
	}
	// /tabs

	static inputMask() {
		// mask for input
		const InputTel = [].slice.call(document.querySelectorAll('input[type="tel"]'))

		// Паттерн из стартера (`[+][0-9]{1}[(][0-9]{3}[)]...`) современные браузеры
		// уже не принимают: атрибут pattern компилируется с флагом `v`, а в нём
		// `(` и `)` внутри класса символов обязаны быть экранированы. Chrome
		// писал в консоль «is not a valid regular expression», и валидация поля
		// по факту не работала вообще.
		// Плюс код страны здесь был `[0-9]{1}` — не совпадал с маской «+7».
		const TEL_PATTERN = '\\+7\\(\\d{3}\\)\\d{3}-\\d{2}-\\d{2}'
		for (const element of InputTel) {
			element.setAttribute('pattern', TEL_PATTERN)
		}
		// Префикс фиксированный: в стартере стояло '+9(...)', где 9 — любая цифра,
		// и первая введённая пользователем цифра уезжала в код страны
		// (набрал 987… → получил +9(871)…). В макете префикс «+ 7».
		Inputmask({ mask: '+7(999)999-99-99', showMaskOnHover: false }).mask(InputTel)
	}
	// /inputMask
	static sendForm() {
		var gets = (function () {
			var a = window.location.search
			var b = new Object()
			var c
			a = a.substring(1).split('&')
			for (var i = 0; i < a.length; i++) {
				c = a[i].split('=')
				b[c[0]] = c[1]
			}
			return b
		})()
		// form
		$(document).on('submit', 'form', function (e) {
			e.preventDefault()
			const th = $(this)
			var data = th.serialize()
			th.find('.utm_source').val(decodeURIComponent(gets.utm_source || ''))
			th.find('.utm_term').val(decodeURIComponent(gets.utm_term || ''))
			th.find('.utm_medium').val(decodeURIComponent(gets.utm_medium || ''))
			th.find('.utm_campaign').val(decodeURIComponent(gets.utm_campaign || ''))
			$.ajax({
				url: 'action.php',
				type: 'POST',
				data: data,
			})
				.done(function () {
					Fancybox.close()
					Fancybox.show([{ src: '#modal-thanks', type: 'inline' }])
					// window.location.replace("/thanks.html");
					setTimeout(function () {
						// Done Functions
						th.trigger('reset')
						// $.magnificPopup.close();
						// ym(53383120, 'reachGoal', 'zakaz');
						// yaCounter55828534.reachGoal('zakaz');
					}, 4000)
				})
				.fail(function () {})
		})

		// async function submitForm(event) {
		// 	event.preventDefault(); // отключаем перезагрузку/перенаправление страницы
		// 	try {
		// 		// Формируем запрос
		// 		const response = await fetch(event.target.action, {
		// 			method: 'POST',
		// 			body: new FormData(event.target)
		// 		});
		// 		// проверяем, что ответ есть
		// 		if (!response.ok) throw (`Ошибка при обращении к серверу: ${response.status}`);
		// 		// проверяем, что ответ действительно JSON
		// 		const contentType = response.headers.get('content-type');
		// 		if (!contentType || !contentType.includes('application/json')) {
		// 			throw ('Ошибка обработки. Ответ не JSON');
		// 		}
		// 		// обрабатываем запрос
		// 		const json = await response.json();
		// 		if (json.result === "success") {
		// 			// в случае успеха
		// 			alert(json.info);
		// 		} else {
		// 			// в случае ошибки
		// 			console.log(json);
		// 			throw (json.info);
		// 		}
		// 	} catch (error) { // обработка ошибки
		// 		alert(error);
		// 	}
		// }
	}
	static heightWindow() {
		// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
		const vh = window.innerHeight * 0.01
		// Then we set the value in the --vh custom property to the root of the document
		document.documentElement.style.setProperty('--vh', `${vh}px`)

		// We listen to the resize event
		window.addEventListener(
			'resize',
			() => {
				// We execute the same script as before
				const vh = window.innerHeight * 0.01
				document.documentElement.style.setProperty('--vh', `${vh}px`)
			},
			{ passive: true },
		)
	}
	static animateScroll() {
		$(document).on('click', ' .menu li a, .scroll-link', function () {
			const elementClick = $(this).attr('href')
			if (!document.querySelector(elementClick)) {
				$(this).attr('href', '/' + elementClick)
			} else {
				const destination = $(elementClick).offset().top
				$('html, body').animate({ scrollTop: destination - 80 }, 0)
				return false
			}
		})
	}
	static getCurrentYear(el) {
		const now = new Date()
		const currentYear = document.querySelector(el)
		if (currentYear) currentYear.innerText = now.getFullYear()
	}

	static makeDDGroup() {
		$('.dd-head-js').on('click', function () {
			$(this).parent().toggleClass('active')
			$(this)
				.next()
				.slideToggle(function () {
					$(this).toggleClass('active')
				})
		})
		// let parents = document.querySelectorAll('.dd-group-js');
		// for (let parent of parents) {
		// 	if (parent) {
		// 		// childHeads, kind of funny))
		// 		let ChildHeads = parent.querySelectorAll('.dd-head-js:not(.disabled)');
		// 		$(ChildHeads).click(function () {
		// 			let clickedHead = this;

		// 			$(ChildHeads).each(function () {
		// 				if (this === clickedHead) {
		// 					//parent element gain toggle class, style head change via parent
		// 					$(this.parentElement).toggleClass('active');
		// 					$(this.parentElement).find('.dd-content-js').slideToggle(function () {
		// 						$(this).toggleClass('active');
		// 					});
		// 				}
		// 				else {
		// 					$(this.parentElement).removeClass('active');
		// 					$(this.parentElement).find('.dd-content-js').slideUp(function () {
		// 						$(this).removeClass('active');
		// 					});
		// 				}
		// 			});

		// 		});
		// 	}
		// }
	}

	static imgToSVG() {
		const convertImages = (query, callback) => {
			const images = document.querySelectorAll(query)

			images.forEach((image) => {
				fetch(image.src)
					.then((res) => res.text())
					.then((data) => {
						const parser = new DOMParser()
						const svg = parser.parseFromString(data, 'image/svg+xml').querySelector('svg')

						if (image.id) svg.id = image.id
						if (image.className) svg.classList = image.classList

						image.parentNode.replaceChild(svg, image)
					})
					.then(callback)
					.catch((error) => console.error(error))
			})
		}

		convertImages('.img-svg-js')
	}

	static disabledBtn(
		input = '.form-wrap__policy input',
		btn = '.form-wrap__btn',
		parent = '.form-wrap',
	) {
		$(document).on('change', input, function () {
			const btnDisabled = $(this).parents(parent).find(btn)
			if (this.checked) {
				btnDisabled.removeAttr('disabled')
			} else {
				btnDisabled.attr('disabled', 'disabled')
			}
		})
	}

	static setScreen() {
		var x = window.location.host
		let screenName
		if (document.body.dataset.bg) screenName = '../screen/' + document.body.dataset.bg
		if (screenName && x.includes('localhost:30')) {
			document.body.insertAdjacentHTML(
				'beforeend',
				`<div class="pixel-perfect" style="--screen: url('${screenName}');"></div>`,
			)
		}
	}

	static getTopNav() {
		if (JSCCommon.topNavElement === undefined) {
			JSCCommon.topNavElement = document.querySelector('.top-nav')
		}
		return JSCCommon.topNavElement
	}

	static setFixedNav() {
		const topNav = JSCCommon.getTopNav()
		if (!topNav) return
		topNav.classList.toggle('fixed', window.scrollY > 0)
	}

	static customSelect() {
		$('.custom-select-wrap').each(function () {
			const self = $(this)
			self.find('.custom-select-js').select2({
				allowClear: false,
				dropdownParent: self,
			})
		})
	}

	static init() {
		JSCCommon.modalCall()
		// this.tabsCostume('tabs');
		JSCCommon.mobileMenu()
		JSCCommon.inputMask()
		// this.sendForm();
		JSCCommon.heightWindow()
		JSCCommon.makeDDGroup()
		JSCCommon.disabledBtn()
		JSCCommon.customSelect()
		JSCCommon.setScreen()
		// JSCCommon.toggleShow(".catalog-block__toggle--desctop", '.catalog-block__dropdown');
		// JSCCommon.animateScroll();

		// JSCCommon.CustomInputFile();
	}
}

window.JSCCommon = JSCCommon
