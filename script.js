/* -------------------------------------------------------------
   TMK-WEB — Interactive JavaScript Controller + Telegram Bot
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Telegram Bot Configuration
    const TG_BOT_TOKEN = '8810758612:AAEpvVanXYog58IeR4vMtPjheN2dLEyEqnk';
    let TG_CHAT_ID = localStorage.getItem('tmk_tg_chat_id') || '';

    // Auto-fetch Chat ID from Telegram getUpdates (prioritizing Group Chats starting with -)
    async function getOrFetchChatId() {
        try {
            const resp = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/getUpdates`);
            const data = await resp.json();
            if (data.ok && data.result && data.result.length > 0) {
                // 1. First search for Group Chat ID (starts with -)
                for (let i = data.result.length - 1; i >= 0; i--) {
                    const update = data.result[i];
                    const msg = update.message || update.channel_post || (update.my_chat_member && update.my_chat_member.chat);
                    if (msg) {
                        const chatObj = msg.chat || msg;
                        if (chatObj && chatObj.id && String(chatObj.id).startsWith('-')) {
                            TG_CHAT_ID = chatObj.id;
                            localStorage.setItem('tmk_tg_chat_id', TG_CHAT_ID);
                            return TG_CHAT_ID;
                        }
                    }
                }
                // 2. Fallback to private user chat ID
                if (!TG_CHAT_ID) {
                    for (let i = data.result.length - 1; i >= 0; i--) {
                        const update = data.result[i];
                        const msg = update.message || update.channel_post;
                        if (msg && msg.chat && msg.chat.id) {
                            TG_CHAT_ID = msg.chat.id;
                            localStorage.setItem('tmk_tg_chat_id', TG_CHAT_ID);
                            return TG_CHAT_ID;
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch Telegram Chat ID:', err);
        }
        return TG_CHAT_ID;
    }

    async function sendTelegramNotification(htmlText) {
        const chatId = await getOrFetchChatId();
        if (!chatId) {
            console.warn('Telegram Chat ID missing. Please add @tmkweb_bot to your Telegram Group!');
            return;
        }

        try {
            await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: htmlText,
                    parse_mode: 'HTML'
                })
            });
        } catch (error) {
            console.error('Error sending Telegram notification:', error);
        }
    }

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

    let currentCalcSummary = {};

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

        currentCalcSummary = {
            type: siteTypeName,
            marketing: marketingNames.join(', ') || 'Без рекламы',
            extras: extraNames.join(', ') || 'Без доп. опций',
            time: timeDays,
            oldPrice: totalPrice.toLocaleString('ru-RU') + ' ₽',
            discountPrice: discountPrice.toLocaleString('ru-RU') + ' ₽'
        };

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
        btn.addEventListener('click', () => {
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

    // Form Handlers & Telegram Dispatcher
    const calcForm = document.getElementById('calcForm');
    if (calcForm) {
        calcForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('calcPhone').value;

            // Formatted Telegram Message
            const tgMsg = `🔥 <b>НОВАЯ ЗАЯВКА ИЗ КАЛЬКУЛЯТОРА!</b>\n\n` +
                          `📱 <b>Телефон:</b> <code>${phone}</code>\n` +
                          `🌐 <b>Тип сайта:</b> ${currentCalcSummary.type}\n` +
                          `📈 <b>Реклама:</b> ${currentCalcSummary.marketing}\n` +
                          `⚙️ <b>Доп. опции:</b> ${currentCalcSummary.extras}\n` +
                          `⏱ <b>Сроки:</b> ${currentCalcSummary.time}\n` +
                          `💰 <b>Итоговая цена (со скидкой 20%):</b> <b>${currentCalcSummary.discountPrice}</b> (без скидки: ${currentCalcSummary.oldPrice})`;

            sendTelegramNotification(tgMsg);

            showToast('Скидка 20% забронирована!', `Спасибо! Наш специалист перезвонит на номер ${phone} в течение 15 минут.`);
            calcForm.reset();
            updateCalculator();
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('userName').value;
            const phone = document.getElementById('userPhone').value;
            const task = document.getElementById('userTask').value;
            const msg = document.getElementById('userMsg').value || 'Без комментария';

            const tgMsg = `🚀 <b>НОВАЯ ЗАЯВКА НА РАЗРАБОТКУ!</b>\n\n` +
                          `👤 <b>Имя:</b> ${name}\n` +
                          `📱 <b>Телефон:</b> <code>${phone}</code>\n` +
                          `🎯 <b>Интересует:</b> ${task}\n` +
                          `💬 <b>Комментарий:</b> ${msg}`;

            sendTelegramNotification(tgMsg);

            showToast('Заявка успешно принята!', 'Мы уже обрабатываем ваше обращение и скоро свяжемся с вами.');
            contactForm.reset();
        });
    }

    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('modalPhone').value;
            const service = document.getElementById('modalServiceInput').value || 'Консультация';

            const tgMsg = `⚡ <b>БЫСТРЫЙ ЗАПРОС РАСЧЕТА СТОИМОСТИ!</b>\n\n` +
                          `🎯 <b>Услуга:</b> ${service}\n` +
                          `📱 <b>Телефон:</b> <code>${phone}</code>`;

            sendTelegramNotification(tgMsg);

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
