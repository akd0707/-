'use strict';

// ====== データ管理 ======
class StorageManager {
  static KEYS = {
    tasks: 'todo_tasks',
    events: 'todo_events',
    genres: 'todo_genres',
    settings: 'todo_settings',
    completed: 'todo_completed',
    nextId: 'todo_nextId'
  };

  static get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }
}

// ====== デフォルトジャンル ======
const DEFAULT_GENRES = [
  { id: 'homework', name: '課題', color: '#FF6B6B' },
  { id: 'study', name: '勉強', color: '#4A90D9' },
  { id: 'exam', name: 'テスト', color: '#FFA726' },
  { id: 'other', name: 'その他', color: '#9B59B6' }
];

const DEFAULT_SETTINGS = {
  autoComplete: true,
  confirmDialog: true,
  showSubject: true
};

// ====== メインアプリ ======
class TodoApp {
  constructor() {
    this.tasks = [];
    this.events = [];
    this.completed = [];
    this.genres = [];
    this.settings = {};
    this.nextId = 1;
    this.currentTab = 'tasks';
    this.currentNav = 'tasks';
    this.editingItem = null;
    this.editingType = null;
    this.selectedGenre = null;

    this.init();
  }

  init() {
    this.loadData();
    this.renderGenres();
    this.renderAll();
    this.bindEvents();
    this.updateCounts();
    this.checkAutoComplete();
    this.cleanupCompleted();
  }

  // ====== データ読み込み ======
  loadData() {
    this.tasks = StorageManager.get(StorageManager.KEYS.tasks) || [];
    this.events = StorageManager.get(StorageManager.KEYS.events) || [];
    this.completed = StorageManager.get(StorageManager.KEYS.completed) || [];
    this.genres = StorageManager.get(StorageManager.KEYS.genres) || DEFAULT_GENRES;
    this.settings = StorageManager.get(StorageManager.KEYS.settings) || { ...DEFAULT_SETTINGS };
    this.nextId = StorageManager.get(StorageManager.KEYS.nextId) || 1;
  }

  // ====== データ保存 ======
  saveAll() {
    StorageManager.set(StorageManager.KEYS.tasks, this.tasks);
    StorageManager.set(StorageManager.KEYS.events, this.events);
    StorageManager.set(StorageManager.KEYS.completed, this.completed);
    StorageManager.set(StorageManager.KEYS.genres, this.genres);
    StorageManager.set(StorageManager.KEYS.settings, this.settings);
    StorageManager.set(StorageManager.KEYS.nextId, this.nextId);
  }

  // ====== ID生成 ======
  generateId() {
    return this.nextId++;
  }

  // ====== ジャンル操作 ======
  getGenre(id) {
    return this.genres.find(g => g.id === id);
  }

  getGenreColor(id) {
    const genre = this.getGenre(id);
    return genre ? genre.color : '#9B59B6';
  }

  addGenre(name, color) {
    const id = 'genre_' + Date.now();
    this.genres.push({ id, name, color });
    this.saveAll();
    this.renderGenres();
    this.renderGenreSettings();
    this.renderAll();
  }

  updateGenreColor(id, color) {
    const genre = this.getGenre(id);
    if (genre) {
      genre.color = color;
      this.saveAll();
      this.renderGenres();
      this.renderGenreSettings();
      this.renderAll();
    }
  }

  deleteGenre(id) {
    if (this.genres.length <= 1) return;
    this.genres = this.genres.filter(g => g.id !== id);
    this.saveAll();
    this.renderGenres();
    this.renderGenreSettings();
    this.renderAll();
  }

  // ====== タスク操作 ======
  addTask(data) {
    const task = {
      id: this.generateId(),
      type: 'task',
      title: data.title.trim(),
      subject: data.subject || '',
      location: data.location || '',
      dueDate: data.dueDate || '',
      genre: data.genre || 'homework',
      createdAt: new Date().toISOString(),
      completed: false
    };
    this.tasks.unshift(task);
    this.saveAll();
    this.renderTasks();
    this.updateCounts();
    return task;
  }

  updateTask(id, data) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    Object.assign(task, data);
    this.saveAll();
    this.renderTasks();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveAll();
    this.renderTasks();
    this.updateCounts();
  }

  completeTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = true;
    task.completedAt = new Date().toISOString();
    this.completed.unshift({
      id: task.id,
      type: 'task',
      title: task.title,
      subject: task.subject,
      genre: task.genre,
      completedAt: task.completedAt
    });
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveAll();
    this.renderTasks();
    this.renderCompleted();
    this.updateCounts();
  }

  // ====== イベント操作 ======
  addEvent(data) {
    const event = {
      id: this.generateId(),
      type: 'event',
      title: data.title.trim(),
      subject: data.subject || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      genre: data.genre || 'exam',
      createdAt: new Date().toISOString(),
      completed: false
    };
    this.events.unshift(event);
    this.saveAll();
    this.renderEvents();
    this.updateCounts();
    return event;
  }

  updateEvent(id, data) {
    const event = this.events.find(e => e.id === id);
    if (!event) return;
    Object.assign(event, data);
    this.saveAll();
    this.renderEvents();
  }

  deleteEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this.saveAll();
    this.renderEvents();
    this.updateCounts();
  }

  completeEvent(id) {
    const event = this.events.find(e => e.id === id);
    if (!event) return;
    event.completed = true;
    event.completedAt = new Date().toISOString();
    this.completed.unshift({
      id: event.id,
      type: 'event',
      title: event.title,
      subject: event.subject,
      genre: event.genre,
      completedAt: event.completedAt
    });
    this.events = this.events.filter(e => e.id !== id);
    this.saveAll();
    this.renderEvents();
    this.renderCompleted();
    this.updateCounts();
  }

  // ====== 完了タスク操作 ======
  clearCompleted() {
    if (this.settings.confirmDialog && !confirm('全ての完了済みアイテムを削除しますか？')) return;
    this.completed = [];
    this.saveAll();
    this.renderCompleted();
    this.updateCounts();
  }

  deleteCompletedItem(id) {
    this.completed = this.completed.filter(c => c.id !== id);
    this.saveAll();
    this.renderCompleted();
    this.updateCounts();
  }

  // ====== 自動完了チェック ======
  checkAutoComplete() {
    if (!this.settings.autoComplete) return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // 期限切れイベントを自動完了
    const toComplete = this.events.filter(e => {
      if (!e.endDate) return false;
      const end = new Date(e.endDate + 'T23:59:59').getTime();
      return end < today;
    });

    toComplete.forEach(e => {
      e.completed = true;
      e.completedAt = new Date().toISOString();
      this.completed.unshift({
        id: e.id,
        type: 'event',
        title: e.title,
        subject: e.subject,
        genre: e.genre,
        completedAt: e.completedAt
      });
    });

    if (toComplete.length > 0) {
      this.events = this.events.filter(e => !e.completed);
      this.saveAll();
      this.renderEvents();
      this.renderCompleted();
      this.updateCounts();
    }
  }

  // ====== 完了タスククリーンアップ（30日経過で削除） ======
  cleanupCompleted() {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const before = this.completed.length;
    this.completed = this.completed.filter(c => {
      const completedTime = new Date(c.completedAt).getTime();
      return (now - completedTime) < thirtyDays;
    });
    if (this.completed.length !== before) {
      this.saveAll();
      this.renderCompleted();
      this.updateCounts();
    }
  }

  // ====== レンダリング ======
  renderGenres() {
    // ジャンル選択オプションの描画
    const genreSelects = ['genreSelect', 'editGenreSelect'];
    genreSelects.forEach(id => {
      const container = document.getElementById(id);
      if (!container) return;
      container.innerHTML = '';
      this.genres.forEach(g => {
        const option = document.createElement('div');
        option.className = 'genre-option';
        option.dataset.genreId = g.id;
        option.innerHTML = `<span class="genre-color-dot" style="background:${g.color}"></span>${g.name}`;
        if (g.id === this.selectedGenre) option.classList.add('active');
        option.addEventListener('click', () => {
          container.querySelectorAll('.genre-option').forEach(o => o.classList.remove('active'));
          option.classList.add('active');
          this.selectedGenre = g.id;
        });
        container.appendChild(option);
      });
    });
  }

  renderGenreSettings() {
    const container = document.getElementById('genreSettings');
    if (!container) return;
    container.innerHTML = '';
    this.genres.forEach(g => {
      const row = document.createElement('div');
      row.className = 'genre-setting-row';
      row.innerHTML = `
        <div class="genre-color-preview" style="background:${g.color}"></div>
        <span class="genre-name">${g.name}</span>
        <input type="color" value="${g.color}" data-genre-id="${g.id}">
        <button class="delete-genre-btn" data-genre-id="${g.id}">✕</button>
      `;
      const colorInput = row.querySelector('input[type="color"]');
      colorInput.addEventListener('input', (e) => {
        this.updateGenreColor(g.id, e.target.value);
      });
      const deleteBtn = row.querySelector('.delete-genre-btn');
      deleteBtn.addEventListener('click', () => {
        this.deleteGenre(g.id);
      });
      container.appendChild(row);
    });
  }

  renderTasks() {
    const list = document.getElementById('taskList');
    const empty = document.getElementById('taskEmpty');
    if (!list) return;

    list.innerHTML = '';
    if (this.tasks.length === 0) {
      list.style.display = 'none';
      empty.style.display = 'flex';
      return;
    }

    list.style.display = 'flex';
    empty.style.display = 'none';

    this.tasks.forEach(task => {
      const item = this.createTaskItem(task);
      list.appendChild(item);
    });
  }

  renderEvents() {
    const list = document.getElementById('eventList');
    const empty = document.getElementById('eventEmpty');
    if (!list) return;

    list.innerHTML = '';
    if (this.events.length === 0) {
      list.style.display = 'none';
      empty.style.display = 'flex';
      return;
    }

    list.style.display = 'flex';
    empty.style.display = 'none';

    // 直近のイベントを強調表示するため、日付順にソート
    const sorted = [...this.events].sort((a, b) => {
      const aDate = a.startDate || a.endDate || '';
      const bDate = b.startDate || b.endDate || '';
      return aDate.localeCompare(bDate);
    });

    sorted.forEach(event => {
      const item = this.createEventItem(event);
      list.appendChild(item);
    });
  }

  renderCompleted() {
    const list = document.getElementById('completedList');
    const empty = document.getElementById('completedEmpty');
    const countEl = document.getElementById('completedCount');
    if (!list) return;

    list.innerHTML = '';
    if (this.completed.length === 0) {
      list.style.display = 'none';
      empty.style.display = 'flex';
      if (countEl) countEl.textContent = '0';
      return;
    }

    list.style.display = 'flex';
    empty.style.display = 'none';
    if (countEl) countEl.textContent = this.completed.length;

    this.completed.forEach(item => {
      const el = document.createElement('div');
      el.className = 'task-item completed';
      const genreColor = this.getGenreColor(item.genre);
      el.style.setProperty('--genre-color', genreColor);
      el.style.borderLeft = `4px solid ${genreColor}`;

      const icon = item.type === 'task' ? '📋' : '📅';

      el.innerHTML = `
        <div class="task-checkbox checked"></div>
        <div class="task-content">
          <div class="task-title">${this.escapeHtml(item.title)}</div>
          ${item.subject ? `<div class="task-subject">${this.escapeHtml(item.subject)}</div>` : ''}
          <div class="task-meta">
            <span class="task-meta-item">${this.formatDate(item.completedAt)}</span>
            <span class="task-meta-item">${icon}</span>
          </div>
        </div>
        <button class="task-menu-btn" data-action="delete-completed" data-id="${item.id}">🗑️</button>
      `;

      const deleteBtn = el.querySelector('[data-action="delete-completed"]');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteCompletedItem(item.id);
      });

      list.appendChild(el);
    });
  }

  renderAll() {
    this.renderTasks();
    this.renderEvents();
    this.renderCompleted();
    this.renderGenreSettings();
    this.loadSettingsUI();
  }

  updateCounts() {
    const taskCount = document.getElementById('taskCount');
    const eventCount = document.getElementById('eventCount');
    const completedCount = document.getElementById('completedCount');

    if (taskCount) taskCount.textContent = this.tasks.length;
    if (eventCount) eventCount.textContent = this.events.length;
    if (completedCount) completedCount.textContent = this.completed.length;
  }

  // ====== タスクアイテム作成 ======
  createTaskItem(task) {
    const el = document.createElement('div');
    el.className = 'task-item';
    const genreColor = this.getGenreColor(task.genre);
    el.style.setProperty('--genre-color', genreColor);
    el.style.borderLeft = `4px solid ${genreColor}`;

    // 期限が近いかチェック
    if (task.dueDate) {
      const today = new Date();
      const due = new Date(task.dueDate + 'T23:59:59');
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1 && diffDays >= 0) {
        el.classList.add('critical');
      } else if (diffDays <= 3 && diffDays >= 0) {
        el.classList.add('urgent');
      }
    }

    el.innerHTML = `
      <div class="task-checkbox" data-action="complete-task" data-id="${task.id}"></div>
      <div class="task-content">
        <div class="task-title">${this.escapeHtml(task.title)}</div>
        ${this.settings.showSubject && task.subject ? `<div class="task-subject">${this.escapeHtml(task.subject)}</div>` : ''}
        <div class="task-meta">
          ${task.dueDate ? `<span class="task-meta-item">📅 ${this.formatDate(task.dueDate)}</span>` : ''}
          ${task.location ? `<span class="task-meta-item">📍 ${this.escapeHtml(task.location)}</span>` : ''}
          <span class="task-meta-item" style="background:${genreColor}22;color:${genreColor}">●</span>
        </div>
      </div>
      <button class="task-menu-btn" data-action="edit-task" data-id="${task.id}">⋯</button>
    `;

    const checkbox = el.querySelector('[data-action="complete-task"]');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.settings.confirmDialog && !confirm(`「${task.title}」を完了しますか？`)) return;
      this.completeTask(task.id);
    });

    const menuBtn = el.querySelector('[data-action="edit-task"]');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditModal(task, 'task');
    });

    return el;
  }

  // ====== イベントアイテム作成 ======
  createEventItem(event) {
    const el = document.createElement('div');
    el.className = 'task-item';
    const genreColor = this.getGenreColor(event.genre);
    el.style.setProperty('--genre-color', genreColor);
    el.style.borderLeft = `4px solid ${genreColor}`;

    // 直近のイベントを強調表示（2週間以内）
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let isNearby = false;
    if (event.startDate) {
      const start = new Date(event.startDate + 'T00:00:00');
      const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 14) {
        el.classList.add('event-highlight');
        isNearby = true;
      }
    }

    let dateInfo = '';
    if (event.startDate && event.endDate) {
      dateInfo = `📅 ${this.formatDate(event.startDate)} 〜 ${this.formatDate(event.endDate)}`;
    } else if (event.startDate) {
      dateInfo = `📅 ${this.formatDate(event.startDate)}`;
    } else if (event.endDate) {
      dateInfo = `📅 ${this.formatDate(event.endDate)} まで`;
    }

    el.innerHTML = `
      <div class="task-checkbox" data-action="complete-event" data-id="${event.id}"></div>
      <div class="task-content">
        <div class="task-title">${this.escapeHtml(event.title)}${isNearby ? ' 🔥' : ''}</div>
        ${this.settings.showSubject && event.subject ? `<div class="task-subject">${this.escapeHtml(event.subject)}</div>` : ''}
        <div class="task-meta">
          <span class="task-meta-item">${dateInfo}</span>
          <span class="task-meta-item" style="background:${genreColor}22;color:${genreColor}">●</span>
        </div>
      </div>
      <button class="task-menu-btn" data-action="edit-event" data-id="${event.id}">⋯</button>
    `;

    const checkbox = el.querySelector('[data-action="complete-event"]');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.settings.confirmDialog && !confirm(`「${event.title}」を完了しますか？`)) return;
      this.completeEvent(event.id);
    });

    const menuBtn = el.querySelector('[data-action="edit-event"]');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditModal(event, 'event');
    });

    return el;
  }

  // ====== モーダル操作 ======
  openCreateModal(type) {
    this.selectedGenre = null;
    this.renderGenres();

    // 日付のデフォルト設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').value = today;
    document.getElementById('eventStartDate').value = today;

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('eventEndDate').value = nextWeek.toISOString().split('T')[0];

    // 入力クリア
    document.getElementById('itemTitle').value = '';
    document.getElementById('taskSubject').value = '';
    document.getElementById('taskLocation').value = '';
    document.getElementById('eventSubject').value = '';

    this.switchCreateTab(type || 'task');
    document.getElementById('createModal').classList.add('active');
  }

  openEditModal(item, type) {
    this.editingItem = item;
    this.editingType = type;

    document.getElementById('editTitle').value = item.title;
    document.getElementById('editSubject').value = item.subject || '';

    // ジャンル選択
    this.selectedGenre = item.genre;
    this.renderGenres();
    // editGenreSelectの再描画
    const editContainer = document.getElementById('editGenreSelect');
    editContainer.innerHTML = '';
    this.genres.forEach(g => {
      const option = document.createElement('div');
      option.className = 'genre-option';
      option.dataset.genreId = g.id;
      option.innerHTML = `<span class="genre-color-dot" style="background:${g.color}"></span>${g.name}`;
      if (g.id === item.genre) option.classList.add('active');
      option.addEventListener('click', () => {
        editContainer.querySelectorAll('.genre-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        this.selectedGenre = g.id;
      });
      editContainer.appendChild(option);
    });

    if (type === 'task') {
      document.getElementById('editSubjectGroup').style.display = 'block';
      document.getElementById('editLocationGroup').style.display = 'block';
      document.getElementById('editDueDateGroup').style.display = 'block';
      document.getElementById('editStartDateGroup').style.display = 'none';
      document.getElementById('editEndDateGroup').style.display = 'none';
      document.getElementById('editLocation').value = item.location || '';
      document.getElementById('editDueDate').value = item.dueDate || '';
    } else {
      document.getElementById('editSubjectGroup').style.display = 'block';
      document.getElementById('editLocationGroup').style.display = 'none';
      document.getElementById('editDueDateGroup').style.display = 'none';
      document.getElementById('editStartDateGroup').style.display = 'block';
      document.getElementById('editEndDateGroup').style.display = 'block';
      document.getElementById('editStartDate').value = item.startDate || '';
      document.getElementById('editEndDate').value = item.endDate || '';
    }

    document.getElementById('editModal').classList.add('active');
  }

  switchCreateTab(type) {
    // タブ切り替え
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    document.getElementById('taskFields').style.display = type === 'task' ? 'block' : 'none';
    document.getElementById('eventFields').style.display = type === 'event' ? 'block' : 'none';
  }

  saveCreateModal() {
    const title = document.getElementById('itemTitle').value.trim();
    if (!title) {
      alert('タイトルを入力してください');
      return;
    }

    const activeTab = document.querySelector('.modal-tab-btn.active');
    const type = activeTab ? activeTab.dataset.type : 'task';
    const genre = this.selectedGenre || (type === 'task' ? 'homework' : 'exam');

    if (type === 'task') {
      this.addTask({
        title,
        subject: document.getElementById('taskSubject').value.trim(),
        location: document.getElementById('taskLocation').value.trim(),
        dueDate: document.getElementById('taskDueDate').value,
        genre
      });
    } else {
      this.addEvent({
        title,
        subject: document.getElementById('eventSubject').value.trim(),
        startDate: document.getElementById('eventStartDate').value,
        endDate: document.getElementById('eventEndDate').value,
        genre
      });
    }

    document.getElementById('createModal').classList.remove('active');
  }

  saveEditModal() {
    const title = document.getElementById('editTitle').value.trim();
    if (!title) {
      alert('タイトルを入力してください');
      return;
    }

    const genre = this.selectedGenre || this.editingItem.genre;

    if (this.editingType === 'task') {
      this.updateTask(this.editingItem.id, {
        title,
        subject: document.getElementById('editSubject').value.trim(),
        location: document.getElementById('editLocation').value.trim(),
        dueDate: document.getElementById('editDueDate').value,
        genre
      });
    } else {
      this.updateEvent(this.editingItem.id, {
        title,
        subject: document.getElementById('editSubject').value.trim(),
        startDate: document.getElementById('editStartDate').value,
        endDate: document.getElementById('editEndDate').value,
        genre
      });
    }

    document.getElementById('editModal').classList.remove('active');
    this.editingItem = null;
    this.editingType = null;
  }

  deleteEditItem() {
    const type = this.editingType;
    const id = this.editingItem.id;
    const title = this.editingItem.title;

    if (this.settings.confirmDialog && !confirm(`「${title}」を削除しますか？`)) return;

    if (type === 'task') {
      this.deleteTask(id);
    } else {
      this.deleteEvent(id);
    }

    document.getElementById('editModal').classList.remove('active');
    this.editingItem = null;
    this.editingType = null;
  }

  // ====== ナビゲーション ======
  switchNav(nav) {
    this.currentNav = nav;

    // ビューの切り替え
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewMap = {
      'tasks': 'tasksView',
      'events': 'eventsView',
      'completed': 'completedView',
      'settings': 'settingsView'
    };
    document.getElementById(viewMap[nav]).classList.add('active');

    // ナビゲーションボタンのアクティブ切り替え
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === nav);
    });

    // タブヘッダーの表示/非表示
    const tabHeader = document.getElementById('tabHeader');
    tabHeader.style.display = (nav === 'tasks' || nav === 'events') ? 'flex' : 'none';
  }

  switchTab(tab) {
    this.currentTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'tasks') {
      this.switchNav('tasks');
    } else {
      this.switchNav('events');
    }
  }

  // ====== 設定 ======
  loadSettingsUI() {
    document.getElementById('autoCompleteSetting').checked = this.settings.autoComplete;
    document.getElementById('confirmDialogSetting').checked = this.settings.confirmDialog;
    document.getElementById('showSubjectSetting').checked = this.settings.showSubject;
  }

  saveSetting(key, value) {
    this.settings[key] = value;
    this.saveAll();
    if (key === 'autoComplete') {
      this.checkAutoComplete();
    }
    if (key === 'showSubject') {
      this.renderAll();
    }
  }

  // ====== データエクスポート/インポート ======
  exportData() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: this.tasks,
      events: this.events,
      completed: this.completed,
      genres: this.genres,
      settings: this.settings,
      nextId: this.nextId
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.tasks || !data.genres) {
          alert('無効なデータファイルです');
          return;
        }
        this.tasks = data.tasks || [];
        this.events = data.events || [];
        this.completed = data.completed || [];
        this.genres = data.genres || DEFAULT_GENRES;
        this.settings = data.settings || { ...DEFAULT_SETTINGS };
        this.nextId = data.nextId || 1;
        this.saveAll();
        this.renderAll();
        this.updateCounts();
        alert('データをインポートしました');
      } catch {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  }

  resetData() {
    if (this.settings.confirmDialog) {
      if (!confirm('全てのデータをリセットしますか？\nこの操作は元に戻せません。')) return;
      if (!confirm('本当によろしいですか？')) return;
    }
    this.tasks = [];
    this.events = [];
    this.completed = [];
    this.genres = [...DEFAULT_GENRES];
    this.settings = { ...DEFAULT_SETTINGS };
    this.nextId = 1;
    this.saveAll();
    this.renderAll();
    this.updateCounts();
  }

  // ====== ユーティリティ ======
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[d.getDay()];
    return `${month}/${day}(${weekday})`;
  }

  // ====== イベントバインディング ======
  bindEvents() {
    // FAB
    document.getElementById('fabBtn').addEventListener('click', () => {
      this.openCreateModal(this.currentNav === 'events' ? 'event' : 'task');
    });

    // ナビゲーションボタン
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nav = btn.dataset.nav;
        if (nav === 'tasks' || nav === 'events') {
          this.switchTab(nav);
        } else {
          this.switchNav(nav);
        }
      });
    });

    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // モーダル - 新規作成
    document.getElementById('modalClose').addEventListener('click', () => {
      document.getElementById('createModal').classList.remove('active');
    });
    document.getElementById('modalCancel').addEventListener('click', () => {
      document.getElementById('createModal').classList.remove('active');
    });
    document.getElementById('createModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.getElementById('createModal').classList.remove('active');
      }
    });
    document.getElementById('modalSave').addEventListener('click', () => {
      this.saveCreateModal();
    });

    // モーダル - 新規作成 タブ切り替え
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchCreateTab(btn.dataset.type);
      });
    });

    // モーダル - 編集
    document.getElementById('editModalClose').addEventListener('click', () => {
      document.getElementById('editModal').classList.remove('active');
    });
    document.getElementById('editModalCancel').addEventListener('click', () => {
      document.getElementById('editModal').classList.remove('active');
    });
    document.getElementById('editModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.getElementById('editModal').classList.remove('active');
      }
    });
    document.getElementById('editModalSave').addEventListener('click', () => {
      this.saveEditModal();
    });
    document.getElementById('editDeleteBtn').addEventListener('click', () => {
      this.deleteEditItem();
    });

    // Enterキーで保存
    document.getElementById('itemTitle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveCreateModal();
    });
    document.getElementById('editTitle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveEditModal();
    });

    // 設定
    document.getElementById('autoCompleteSetting').addEventListener('change', (e) => {
      this.saveSetting('autoComplete', e.target.checked);
    });
    document.getElementById('confirmDialogSetting').addEventListener('change', (e) => {
      this.saveSetting('confirmDialog', e.target.checked);
    });
    document.getElementById('showSubjectSetting').addEventListener('change', (e) => {
      this.saveSetting('showSubject', e.target.checked);
    });

    // ジャンル追加
    document.getElementById('addGenreBtn').addEventListener('click', () => {
      const name = document.getElementById('newGenreName').value.trim();
      if (!name) { alert('ジャンル名を入力してください'); return; }
      const color = document.getElementById('newGenreColor').value;
      this.addGenre(name, color);
      document.getElementById('newGenreName').value = '';
    });
    document.getElementById('newGenreName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('addGenreBtn').click();
    });

    // データ管理
    document.getElementById('clearCompletedBtn').addEventListener('click', () => {
      this.clearCompleted();
    });
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      this.exportData();
    });
    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.importData(e.target.files[0]);
        e.target.value = '';
      }
    });
    document.getElementById('resetDataBtn').addEventListener('click', () => {
      this.resetData();
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('createModal').classList.remove('active');
        document.getElementById('editModal').classList.remove('active');
      }
    });

    // タッチスワイプ対応
    let touchStartX = 0;
    let touchEndX = 0;
    const views = ['tasksView', 'eventsView'];
    const viewsContainer = document.getElementById('app');

    viewsContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewsContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    // 定期的な自動完了チェック（1分ごと）
    setInterval(() => {
      this.checkAutoComplete();
      this.cleanupCompleted();
      this.renderTasks();
      this.renderEvents();
      this.updateCounts();
    }, 60000);
  }

  handleSwipe() {
    const diff = touchStartX - touchEndX;
    const threshold = 60;

    if (Math.abs(diff) > threshold) {
      const currentNav = this.currentNav;
      if (diff > 0) {
        // 左スワイプ → イベント
        if (currentNav === 'tasks') this.switchTab('events');
      } else {
        // 右スワイプ → タスク
        if (currentNav === 'events') this.switchTab('tasks');
      }
    }
  }
}

// ====== アプリ起動 ======
document.addEventListener('DOMContentLoaded', () => {
  const app = new TodoApp();
  window.app = app;
});