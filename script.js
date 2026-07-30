/* -------------------------------------------------------------
   TMK-WEB — Interactive JavaScript Controller
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const mainNav = document.getElementById('mainNav');

    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });

        // Close nav on click link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
            });
        });
    }

    // 2. Header Scroll Effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8)';
            header.style.padding = '12px 0';
        } else {
            header.style.boxShadow = 'none';
            header.style.padding = '16px 0';
        }
    });

    // 3. Interactive Calculator Logic
    const basePrices = {
        landing: { price: 25000, days: '3 – 5 дней', name: 'Лендинг' },
        corporate: { price: 45000, days: '7 – 10 дней', name: 'Многостраничный сайт' },
        shop: { price: 75000, days: 'от 14 дней', name: 'Интернет-магазин' }
    };

    const marketingPrices = {
        yandex: { price: 15000, name: 'Яндекс.Директ' },
        seo: { price: 18000, name: 'SEO продвижение' },
        smm: { price: 12000, name: 'Трафик VK/Telegram' }
    };

    const extraPrices = {
        crm: { price: 5000, name: 'CRM' },
        pagespeed: { price: 5000, name: 'PageSpeed 95+' },
        payment: { price: 8000, name: 'Онлайн-оплата' }
    };

    function updateCalculator() {
        const siteTypeRadio = document.querySelector('input[name="siteType"]:checked');
        const marketingCheckboxes = document.querySelectorAll('input[name="marketing"]:checked');
        const extraCheckboxes = document.querySelectorAll('input[name="extra"]:checked');

        let totalPrice = 0;
        let siteTypeName = 'Лендинг';
        let timeDays = '3 – 5 рабочих дней';
        let marketingNames = [];
        let extraNames = [];

        // Base Site
        if (siteTypeRadio && basePrices[siteTypeRadio.value]) {
            const siteObj = basePrices[siteTypeRadio.value];
            totalPrice += siteObj.price;
            siteTypeName = siteObj.name;
            timeDays = siteObj.days;
        }

        // Marketing Channels
        marketingCheckboxes.forEach(chk => {
            if (marketingPrices[chk.value]) {
                totalPrice += marketingPrices[chk.value].price;
                marketingNames.push(marketingPrices[chk.value].name);
            }
        });

        // Extras
        extraCheckboxes.forEach(chk => {
            if (extraPrices[chk.value]) {
                totalPrice += extraPrices[chk.value].price;
                extraNames.push(extraPrices[chk.value].name);
            }
        });

        // Discount 20%
        const discountPrice = Math.round(totalPrice * 0.8);

        // Update DOM
        const summaryType = document.getElementById('summaryType');
        const summaryMarketing = document.getElementById('summaryMarketing');
        const summaryExtras = document.getElementById('summaryExtras');
        const summaryTime = document.getElementById('summaryTime');
        const summaryOldPrice = document.getElementById('summaryOldPrice');
        const summaryPrice = document.getElementById('summaryPrice');
        const calcDetailsInput = document.getElementById('calcDetailsInput');

        if (summaryType) summaryType.textContent = siteTypeName;
        if (summaryMarketing) summaryMarketing.textContent = marketingNames.length ? marketingNames.join(', ') : 'Без рекламы';
        if (summaryExtras) summaryExtras.textContent = extraNames.length ? extraNames.join(', ') : 'Без опций';
        if (summaryTime) summaryTime.textContent = timeDays;
        if (summaryOldPrice) summaryOldPrice.textContent = totalPrice.toLocaleString('ru-RU') + ' ₽';
        if (summaryPrice) summaryPrice.textContent = discountPrice.toLocaleString('ru-RU') + ' ₽';

        if (calcDetailsInput) {
            calcDetailsInput.value = `Тип: ${siteTypeName}; Реклама: ${marketingNames.join('+') || 'Нет'}; Опции: ${extraNames.join('+') || 'Нет'}; Итог: ${discountPrice} руб`;
        }
    }

    // Radio card active state switcher
    document.querySelectorAll('.radio-card input').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
            radio.closest('.radio-card').classList.add('active');
            updateCalculator();
        });
    });

    // Checkbox card active state switcher
    document.querySelectorAll('.checkbox-card input').forEach(chk => {
        chk.addEventListener('change', () => {
            if (chk.checked) {
                chk.closest('.checkbox-card').classList.add('active');
            } else {
                chk.closest('.checkbox-card').classList.remove('active');
            }
            updateCalculator();
        });
    });

    document.querySelectorAll('.custom-checkbox input').forEach(chk => {
        chk.addEventListener('change', updateCalculator);
    });

    // Initialize Calculator
    updateCalculator();

    // 4. Portfolio Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            portfolioCards.forEach(card => {
                const categories = card.getAttribute('data-category');
                if (filterValue === 'all' || (categories && categories.includes(filterValue))) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // 5. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        questionBtn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            
            // Close all
            faqItems.forEach(i => i.classList.remove('open'));

            // Toggle clicked
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // 6. Modal Callbacks
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalServiceInput = document.getElementById('modalServiceInput');

    document.querySelectorAll('.open-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const serviceName = btn.getAttribute('data-service') || 'Проект';
            if (modalTitle) modalTitle.textContent = `Рассчитать стоимость: ${serviceName}`;
            if (modalServiceInput) modalServiceInput.value = serviceName;
            if (modalBackdrop) modalBackdrop.classList.add('active');
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalBackdrop.classList.remove('active');
        });
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.classList.remove('active');
            }
        });
    }

    // 7. Toast Notifications & Form Submissions
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMsg');

    function showToast(title, message) {
        if (toastTitle) toastTitle.textContent = title;
        if (toastMsg) toastMsg.textContent = message;
        if (toast) {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }

    // Form handlers
    const calcForm = document.getElementById('calcForm');
    if (calcForm) {
        calcForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('calcPhone').value;
            showToast('Скидка 20% забронирована!', `Спасибо! Наш специалист перезвонит на номер ${phone} в течение 15 минут.`);
            calcForm.reset();
            updateCalculator();
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Заявка успешно принята!', 'Мы уже обрабатываем ваше обращение и скоро свяжемся с вами.');
            contactForm.reset();
        });
    }

    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (modalBackdrop) modalBackdrop.classList.remove('active');
            showToast('Запрос отправлен!', 'Наш менеджер в Уфе свяжется с вами в течение 15 минут.');
            modalForm.reset();
        });
    }

    // Phone Auto Format
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.startsWith('7') || val.startsWith('8')) {
                val = val.substring(1);
            }
            if (val.length > 10) val = val.substring(0, 10);

            let formatted = '+7 ';
            if (val.length > 0) formatted += '(' + val.substring(0, 3);
            if (val.length >= 3) formatted += ') ' + val.substring(3, 6);
            if (val.length >= 6) formatted += '-' + val.substring(6, 8);
            if (val.length >= 8) formatted += '-' + val.substring(8, 10);

            e.target.value = val.length === 0 ? '' : formatted;
        });
    });
});
