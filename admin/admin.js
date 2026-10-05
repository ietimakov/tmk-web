(() => {
  'use strict';

  const OWNER = 'ietimakov';
  const REPOSITORY = 'tmk-web';
  const BRANCH = 'main';
  const DATA_PATH = 'content/site-data.json';
  const API_ROOT = 'https://api.github.com';
  let githubToken = '';
  let siteData = null;
  let dataSha = '';
  let editingProject = null;

  const $ = selector => document.querySelector(selector);
  const loginCard = $('#loginCard');
  const workspace = $('#workspace');
  const loginMessage = $('#loginMessage');
  const panelMessage = $('#panelMessage');
  const panelContent = $('#panelContent');
  const dialog = $('#portfolioDialog');

  function setMessage(element, text, type = '') {
    element.textContent = text;
    element.className = `message ${type}`;
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function encodeBase64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function decodeBase64Utf8(value) {
    const binary = atob(value.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function github(path, options = {}) {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.message || `GitHub вернул ошибку ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function readSiteData() {
    const file = await github(`/repos/${OWNER}/${REPOSITORY}/contents/${DATA_PATH}?ref=${BRANCH}`);
    return { data: JSON.parse(decodeBase64Utf8(file.content)), sha: file.sha };
  }

  async function saveSiteData(commitMessage) {
    const currentFile = await github(`/repos/${OWNER}/${REPOSITORY}/contents/${DATA_PATH}?ref=${BRANCH}`);
    if (dataSha && currentFile.sha !== dataSha) {
      const error = new Error('Данные уже изменил другой пользователь. Перезагрузите панель и повторите правку.');
      error.status = 409;
      throw error;
    }
    const saved = await github(`/repos/${OWNER}/${REPOSITORY}/contents/${DATA_PATH}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: commitMessage,
        content: encodeBase64Utf8(`${JSON.stringify(siteData, null, 2)}\n`),
        sha: currentFile.sha,
        branch: BRANCH
      })
    });
    dataSha = saved.content.sha;
    return saved.commit.sha;
  }

  function errorText(error) {
    if (error.status === 401) return 'Токен недействителен или истёк. Выйдите и подключитесь снова.';
    if (error.status === 403) return 'Нет разрешения на запись. Проверьте, что у токена есть Contents: Read and write для tmk-web.';
    if (error.status === 404) return 'Репозиторий или файл данных не найден.';
    if (error.status === 409 || error.status === 422) return 'Файл изменился параллельно. Обновите страницу и повторите правку.';
    return error.message || 'Не удалось выполнить запрос к GitHub.';
  }

  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const input = $('#tokenInput');
    githubToken = input.value.trim();
    input.value = '';
    if (!githubToken) return;
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    setMessage(loginMessage, 'Подключаюсь к GitHub…');
    try {
      await github(`/repos/${OWNER}/${REPOSITORY}`);
      const loaded = await readSiteData();
      siteData = loaded.data;
      dataSha = loaded.sha;
      loginCard.classList.add('hidden');
      workspace.classList.remove('hidden');
      openPanel('prices');
    } catch (error) {
      githubToken = '';
      setMessage(loginMessage, errorText(error), 'error');
    } finally {
      button.disabled = false;
    }
  });

  $('#logoutButton').addEventListener('click', () => {
    githubToken = '';
    siteData = null;
    dataSha = '';
    workspace.classList.add('hidden');
    loginCard.classList.remove('hidden');
    setMessage(loginMessage, '');
  });

  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => openPanel(button.dataset.panel));
  });

  function openPanel(name) {
    const module = panelModules[name];
    if (!module) return;
    document.querySelectorAll('.nav-button').forEach(button => {
      button.classList.toggle('active', button.dataset.panel === name);
    });
    $('#panelTitle').textContent = module.title;
    setMessage(panelMessage, '');
    module.render();
  }

  const priceSections = [
    { key: 'base', title: 'Разработка сайта', subtitle: 'Основной тип сайта и ориентировочные сроки.' },
    { key: 'marketing', title: 'Продвижение и трафик', subtitle: 'Стоимость выбранных каналов продвижения.' },
    { key: 'extras', title: 'Дополнительные опции', subtitle: 'Стоимость подключаемых сервисов.' }
  ];

  // Add future admin features by registering a panel here and a matching button in admin/index.html.
  const panelModules = {
    prices: { title: 'Цены калькулятора', render: renderPrices },
    portfolio: { title: 'Портфолио', render: renderPortfolioList },
    rocket: { title: 'Ракета', render: renderRocketControls }
  };

  function renderPrices() {
    const sections = priceSections.map(section => {
      const entries = Object.entries(siteData.prices[section.key] || {}).map(([key, item]) => `
        <div class="price-row">
          <div><div class="price-name">${escapeHtml(item.name)}</div><div class="price-sub">${escapeHtml(item.days || 'Цена за услугу')}</div></div>
          <label class="price-input-wrap"><span class="field-hint">Цена, ₽</span><input class="price-input" type="number" min="0" step="500" value="${Number(item.price) || 0}" data-price-group="${section.key}" data-price-key="${key}" aria-label="Цена: ${escapeHtml(item.name)}"></label>
        </div>`).join('');
      return `<section class="section-card price-group"><h3>${section.title}</h3><p class="section-description">${section.subtitle}</p>${entries}</section>`;
    }).join('');

    panelContent.innerHTML = `
      <section class="section-card"><h2 class="section-title">Базовые цены</h2><p class="section-description">Укажите суммы в рублях. Скидка 20% в калькуляторе рассчитывается автоматически.</p>
        ${sections}
        <div class="price-actions"><button class="button primary" id="savePrices">Сохранить цены</button></div>
      </section>`;

    $('#savePrices').addEventListener('click', async event => {
      const button = event.currentTarget;
      const inputs = [...document.querySelectorAll('[data-price-key]')];
      if (inputs.some(input => !Number.isFinite(Number(input.value)) || Number(input.value) < 0)) {
        setMessage(panelMessage, 'Укажите для каждой услуги цену от 0 ₽.', 'error');
        return;
      }
      button.disabled = true;
      inputs.forEach(input => {
        const value = Number(input.value);
        if (Number.isFinite(value) && value >= 0) {
          siteData.prices[input.dataset.priceGroup][input.dataset.priceKey].price = Math.round(value);
        }
      });
      setMessage(panelMessage, 'Сохраняю цены в Git…');
      try {
        const sha = await saveSiteData('Update calculator prices');
        setMessage(panelMessage, `Цены сохранены коммитом ${sha.slice(0, 7)}. Публикация страницы запущена.`, 'success');
      } catch (error) {
        setMessage(panelMessage, errorText(error), 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  function renderPortfolioList() {
    const items = siteData.portfolio || [];
    const rows = items.map((item, index) => `
      <article class="project-row" data-project-index="${index}">
        <img class="project-thumb" src="${escapeHtml(item.image || '')}" alt="" loading="lazy">
        <div><div class="project-name">${escapeHtml(item.title)}</div><div class="project-meta">${escapeHtml(item.category || '')} · ${(item.categories || []).map(escapeHtml).join(', ')}</div></div>
        <div class="project-actions"><button class="small-button" data-edit-project="${index}">Изменить</button><button class="small-button danger" data-delete-project="${index}">Удалить</button></div>
      </article>`).join('');

    panelContent.innerHTML = `
      <div class="toolbar"><p class="section-description">Добавляйте проекты, меняйте карточки или удаляйте их. После сохранения обновится раздел портфолио сайта.</p><button class="button primary" id="addProject">+ Добавить проект</button></div>
      <div class="portfolio-list">${rows || '<div class="empty-state">Пока нет проектов. Добавьте первую карточку.</div>'}</div>`;

    $('#addProject').addEventListener('click', () => openProjectEditor());
    panelContent.querySelectorAll('[data-edit-project]').forEach(button => {
      button.addEventListener('click', () => openProjectEditor(Number(button.dataset.editProject)));
    });
    panelContent.querySelectorAll('[data-delete-project]').forEach(button => {
      button.addEventListener('click', () => deleteProject(Number(button.dataset.deleteProject)));
    });
  }

  function renderRocketControls() {
    const enabled = siteData.features?.rocketEnabled !== false;
    panelContent.innerHTML = `
      <section class="section-card">
        <h2 class="section-title">Полёт ракеты</h2>
        <p class="section-description">Ракета с логотипом вылетает от Земли, делает оборот в центре экрана и направляется к Луне.</p>
        <div class="feature-status ${enabled ? 'is-on' : 'is-off'}">Сейчас ${enabled ? 'включена' : 'выключена'}</div>
        <div><button class="button ${enabled ? 'ghost' : 'primary'}" id="toggleRocket">${enabled ? 'Отключить ракету' : 'Включить ракету'}</button></div>
        <p class="hint">После сохранения GitHub Pages обновит сайт. Чтобы увидеть результат, обновите главную страницу.</p>
      </section>`;

    $('#toggleRocket').addEventListener('click', async event => {
      const button = event.currentTarget;
      const previousFeatures = { ...(siteData.features || {}) };
      siteData.features = { ...previousFeatures, rocketEnabled: !enabled };
      button.disabled = true;
      setMessage(panelMessage, 'Сохраняю настройку в Git…');
      try {
        const sha = await saveSiteData(enabled ? 'Disable rocket animation' : 'Enable rocket animation');
        renderRocketControls();
        setMessage(panelMessage, `Настройка сохранена коммитом ${sha.slice(0, 7)}. Публикация страницы запущена.`, 'success');
      } catch (error) {
        siteData.features = previousFeatures;
        setMessage(panelMessage, errorText(error), 'error');
        button.disabled = false;
      }
    });
  }

  function openProjectEditor(index = null) {
    editingProject = index === null ? null : index;
    const item = index === null ? {} : siteData.portfolio[index];
    $('#editorTitle').textContent = index === null ? 'Новый проект' : 'Изменить проект';
    $('#projectId').value = item.id || '';
    $('#projectTitle').value = item.title || '';
    $('#projectCategory').value = item.category || '';
    $('#projectDescription').value = item.description || '';
    $('#projectTags').value = (item.tags || []).join(', ');
    $('#projectScore').value = item.score || '';
    $('#projectUrl').value = item.url || '';
    $('#projectImage').value = item.image || '';
    $('#projectImageFile').value = '';
    [...$('#projectCategories').options].forEach(option => {
      option.selected = (item.categories || []).includes(option.value);
    });
    setMessage($('#editorMessage'), '');
    dialog.showModal();
  }

  function safeSlug(value) {
    const translit = value.toLowerCase().replace(/[а-яё]/g, letter => {
      const map = { а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'e', ж:'zh', з:'z', и:'i', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f', х:'h', ц:'c', ч:'ch', ш:'sh', щ:'sch', ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya' };
      return map[letter] ?? letter;
    });
    return translit.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'project';
  }

  async function imageAsJpegBase64(file) {
    if (!file || !file.type.startsWith('image/')) throw new Error('Выберите файл изображения.');
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84));
    if (!blob || blob.size > 4 * 1024 * 1024) throw new Error('Не удалось подготовить изображение. Попробуйте файл меньшего размера.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  async function uploadImage(file, projectTitle) {
    const imageContent = await imageAsJpegBase64(file);
    const path = `assets/portfolio/${safeSlug(projectTitle)}-${Date.now()}.jpg`;
    await github(`/repos/${OWNER}/${REPOSITORY}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Add portfolio project image',
        content: imageContent,
        branch: BRANCH
      })
    });
    return path;
  }

  $('#portfolioForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const saveButton = form.querySelector('[type="submit"]');
    const previousPortfolio = [...siteData.portfolio];
    saveButton.disabled = true;
    try {
      const title = $('#projectTitle').value.trim();
      let image = $('#projectImage').value.trim();
      const file = $('#projectImageFile').files[0];
      if (file) {
        setMessage($('#editorMessage'), 'Загружаю изображение в репозиторий…');
        image = await uploadImage(file, title);
      }
      if (!image) throw new Error('Укажите ссылку на изображение или выберите файл для загрузки.');
      if (image && !/^https:\/\//i.test(image) && (!/^assets\/[\w./-]+$/i.test(image) || image.split('/').includes('..'))) {
        throw new Error('Изображение: укажите HTTPS-ссылку или путь внутри assets/.');
      }
      const url = $('#projectUrl').value.trim();
      if (url && !/^https?:\/\//i.test(url)) throw new Error('Ссылка на проект должна начинаться с https:// или http://.');
      const categories = [...$('#projectCategories').selectedOptions].map(option => option.value);
      if (!categories.length) throw new Error('Выберите хотя бы одну категорию портфолио.');
      const record = {
        id: $('#projectId').value || `project-${Date.now()}`,
        title,
        category: $('#projectCategory').value.trim(),
        categories,
        description: $('#projectDescription').value.trim(),
        tags: $('#projectTags').value.split(',').map(tag => tag.trim()).filter(Boolean),
        score: $('#projectScore').value.trim(),
        image,
        url
      };
      if (editingProject === null) siteData.portfolio.push(record);
      else siteData.portfolio[editingProject] = record;
      setMessage($('#editorMessage'), 'Сохраняю изменения в Git…');
      const sha = await saveSiteData(editingProject === null ? 'Add portfolio project' : 'Update portfolio project');
      dialog.close();
      renderPortfolioList();
      setMessage(panelMessage, `Проект сохранён коммитом ${sha.slice(0, 7)}. Публикация страницы запущена.`, 'success');
    } catch (error) {
      siteData.portfolio = previousPortfolio;
      setMessage($('#editorMessage'), errorText(error), 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  async function deleteProject(index) {
    const item = siteData.portfolio[index];
    if (!item || !window.confirm(`Удалить проект «${item.title}» из портфолио?`)) return;
    const previous = [...siteData.portfolio];
    siteData.portfolio.splice(index, 1);
    setMessage(panelMessage, 'Удаляю проект и сохраняю Git-коммит…');
    try {
      const sha = await saveSiteData('Remove portfolio project');
      renderPortfolioList();
      setMessage(panelMessage, `Проект удалён коммитом ${sha.slice(0, 7)}. Публикация страницы запущена.`, 'success');
    } catch (error) {
      siteData.portfolio = previous;
      setMessage(panelMessage, errorText(error), 'error');
    }
  }

  $('#closeDialog').addEventListener('click', () => dialog.close());
  $('#cancelDialog').addEventListener('click', () => dialog.close());
})();
