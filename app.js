/**
 * ============================================================
 *  PROMPT MANAGER — Frontend SPA
 *  Lógica completa: API, Estado, UI, Temas, Búsqueda
 * ============================================================
 */

// ─── CONFIGURACIÓN ──────────────────────────────────────────
// ⚠️ REEMPLAZA ESTA URL con la URL de tu Web App de Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbwEVNbV0MVHY0aWRjiI8gsT70eKOzmLFypk8xLI_iNZFD2RVD2tf4wZXbpn-h78uUg9/exec';

// ─── API SERVICE ────────────────────────────────────────────
const ApiService = {
  /**
   * Obtener todos los prompts
   */
  async getAll() {
    try {
      const response = await fetch(`${API_URL}?action=getAll`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Error al obtener los prompts');
      return data.data;
    } catch (error) {
      console.error('ApiService.getAll:', error);
      throw error;
    }
  },

  /**
   * Obtener categorías únicas
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_URL}?action=getCategories`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Error al obtener categorías');
      return data.data;
    } catch (error) {
      console.error('ApiService.getCategories:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo prompt
   */
  async create(promptData) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'create', data: promptData }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Error al crear el prompt');
      return data;
    } catch (error) {
      console.error('ApiService.create:', error);
      throw error;
    }
  },

  /**
   * Actualizar un prompt existente
   */
  async update(row, promptData) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'update', row: row, data: promptData }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Error al actualizar el prompt');
      return data;
    } catch (error) {
      console.error('ApiService.update:', error);
      throw error;
    }
  },

  /**
   * Eliminar un prompt
   */
  async delete(row) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete', row: row }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Error al eliminar el prompt');
      return data;
    } catch (error) {
      console.error('ApiService.delete:', error);
      throw error;
    }
  },
};

// ─── STATE MANAGER ──────────────────────────────────────────
const StateManager = {
  prompts: [],
  categories: [],
  filteredPrompts: [],
  searchTerm: '',
  selectedCategory: '',
  currentTheme: 'light',
  editingRow: null,
  deletingRow: null,
  viewingPrompt: null,
  isLoading: false,

  init() {
    // Cargar tema desde localStorage
    const savedTheme = localStorage.getItem('promptManager_theme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Detectar preferencia del sistema
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.currentTheme = 'dark';
      }
    }
  },

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('promptManager_theme', this.currentTheme);
  },

  setPrompts(prompts) {
    this.prompts = prompts;
    this.extractCategories();
    this.applyFilters();
  },

  extractCategories() {
    const catSet = new Set();
    this.prompts.forEach(p => {
      if (p.categoria && p.categoria.trim()) {
        catSet.add(p.categoria.trim());
      }
    });
    this.categories = Array.from(catSet).sort();
  },

  applyFilters() {
    let filtered = [...this.prompts];

    // Filtrar por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.categoria === this.selectedCategory);
    }

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.prompt || '').toLowerCase().includes(term) ||
        (p.categoria || '').toLowerCase().includes(term) ||
        (p.ejemplos || '').toLowerCase().includes(term)
      );
    }

    this.filteredPrompts = filtered;
  },
};

// ─── UI MANAGER ─────────────────────────────────────────────
const UIManager = {
  // DOM Elements cache
  el: {},

  init() {
    this.cacheElements();
    this.bindEvents();
    this.applyTheme();
  },

  cacheElements() {
    this.el = {
      body: document.body,
      themeToggle: document.getElementById('themeToggle'),
      searchInput: document.getElementById('searchInput'),
      categoryFilter: document.getElementById('categoryFilter'),
      btnAdd: document.getElementById('btnAdd'),
      tableBody: document.getElementById('promptsTableBody'),
      tableContainer: document.getElementById('tableContainer'),

      // Stats
      statTotal: document.getElementById('statTotal'),
      statCategories: document.getElementById('statCategories'),
      statFiltered: document.getElementById('statFiltered'),

      // Form modal
      formModal: document.getElementById('formModal'),
      formModalTitle: document.getElementById('formModalTitle'),
      formModalClose: document.getElementById('formModalClose'),
      formCancelBtn: document.getElementById('formCancelBtn'),
      formSaveBtn: document.getElementById('formSaveBtn'),
      promptForm: document.getElementById('promptForm'),
      formRowId: document.getElementById('formRowId'),
      formCategoria: document.getElementById('formCategoria'),
      formNewCategoria: document.getElementById('formNewCategoria'),
      newCategoryWrapper: document.getElementById('newCategoryWrapper'),
      formNombre: document.getElementById('formNombre'),
      formPrompt: document.getElementById('formPrompt'),
      formEjemplos: document.getElementById('formEjemplos'),
      promptCharCounter: document.getElementById('promptCharCounter'),

      // Confirm modal
      confirmModal: document.getElementById('confirmModal'),
      confirmText: document.getElementById('confirmText'),
      confirmCancelBtn: document.getElementById('confirmCancelBtn'),
      confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

      // Detail modal
      detailModal: document.getElementById('detailModal'),
      detailModalTitle: document.getElementById('detailModalTitle'),
      detailModalBody: document.getElementById('detailModalBody'),
      detailModalClose: document.getElementById('detailModalClose'),
      detailCloseBtn: document.getElementById('detailCloseBtn'),
      detailEditBtn: document.getElementById('detailEditBtn'),

      // Toast
      toastContainer: document.getElementById('toastContainer'),
    };
  },

  bindEvents() {
    // Theme toggle
    this.el.themeToggle.addEventListener('click', () => {
      StateManager.toggleTheme();
      this.applyTheme();
    });

    // Search
    let searchTimeout;
    this.el.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        StateManager.searchTerm = e.target.value.trim();
        StateManager.applyFilters();
        this.renderTable();
        this.renderStats();
      }, 250);
    });

    // Category filter
    this.el.categoryFilter.addEventListener('change', (e) => {
      StateManager.selectedCategory = e.target.value;
      StateManager.applyFilters();
      this.renderTable();
      this.renderStats();
    });

    // Add button
    this.el.btnAdd.addEventListener('click', () => this.openFormModal());

    // Form modal - close
    this.el.formModalClose.addEventListener('click', () => this.closeFormModal());
    this.el.formCancelBtn.addEventListener('click', () => this.closeFormModal());
    this.el.formModal.addEventListener('click', (e) => {
      if (e.target === this.el.formModal) this.closeFormModal();
    });

    // Form modal - save
    this.el.formSaveBtn.addEventListener('click', () => this.handleSave());

    // Form - category change
    this.el.formCategoria.addEventListener('change', (e) => {
      if (e.target.value === '__new__') {
        this.el.newCategoryWrapper.classList.add('visible');
        this.el.formNewCategoria.focus();
      } else {
        this.el.newCategoryWrapper.classList.remove('visible');
        this.el.formNewCategoria.value = '';
      }
    });

    // Form - char counter
    this.el.formPrompt.addEventListener('input', () => {
      const len = this.el.formPrompt.value.length;
      this.el.promptCharCounter.textContent = `${len} caracter${len !== 1 ? 'es' : ''}`;
    });

    // Confirm modal
    this.el.confirmCancelBtn.addEventListener('click', () => this.closeConfirmModal());
    this.el.confirmModal.addEventListener('click', (e) => {
      if (e.target === this.el.confirmModal) this.closeConfirmModal();
    });
    this.el.confirmDeleteBtn.addEventListener('click', () => this.handleDelete());

    // Detail modal
    this.el.detailModalClose.addEventListener('click', () => this.closeDetailModal());
    this.el.detailCloseBtn.addEventListener('click', () => this.closeDetailModal());
    this.el.detailModal.addEventListener('click', (e) => {
      if (e.target === this.el.detailModal) this.closeDetailModal();
    });
    this.el.detailEditBtn.addEventListener('click', () => {
      const prompt = StateManager.viewingPrompt;
      this.closeDetailModal();
      if (prompt) this.openFormModal(prompt);
    });

    // Table row clicks (delegated)
    this.el.tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) {
        // Click on row itself → show detail
        const row = e.target.closest('tr[data-row]');
        if (row) {
          const rowNum = parseInt(row.dataset.row);
          const prompt = StateManager.prompts.find(p => p.row === rowNum);
          if (prompt) this.openDetailModal(prompt);
        }
        return;
      }

      const action = btn.dataset.action;
      const row = parseInt(btn.dataset.row);
      const prompt = StateManager.prompts.find(p => p.row === row);
      if (!prompt) return;

      e.stopPropagation();

      if (action === 'edit') {
        this.openFormModal(prompt);
      } else if (action === 'delete') {
        this.openConfirmModal(prompt);
      } else if (action === 'view') {
        this.openDetailModal(prompt);
      }
    });

    // Keyboard - ESC to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.el.formModal.classList.contains('active')) this.closeFormModal();
        if (this.el.confirmModal.classList.contains('active')) this.closeConfirmModal();
        if (this.el.detailModal.classList.contains('active')) this.closeDetailModal();
      }
    });
  },

  // ─── Theme ──────────────────────────────────────────────
  applyTheme() {
    if (StateManager.currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  },

  // ─── Rendering ──────────────────────────────────────────
  renderTable() {
    const prompts = StateManager.filteredPrompts;

    if (StateManager.isLoading) {
      this.el.tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="loading-overlay">
              <div class="spinner"></div>
              <p class="loading-text">Cargando prompts...</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    if (prompts.length === 0) {
      const isFiltered = StateManager.searchTerm || StateManager.selectedCategory;
      this.el.tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon">${isFiltered ? '🔍' : '📝'}</div>
              <p class="empty-state-title">
                ${isFiltered ? 'No se encontraron resultados' : 'No hay prompts todavía'}
              </p>
              <p class="empty-state-text">
                ${isFiltered
          ? 'Intenta con otros términos de búsqueda o cambia el filtro de categoría.'
          : 'Comienza creando tu primer prompt con el botón "Nuevo Prompt".'
        }
              </p>
              ${!isFiltered ? `
                <button class="btn btn-primary" onclick="UIManager.openFormModal()">
                  <span aria-hidden="true">＋</span> Crear mi primer prompt
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
      return;
    }

    this.el.tableBody.innerHTML = prompts.map((p, index) => `
      <tr data-row="${p.row}" class="fade-in" style="animation-delay: ${Math.min(index * 30, 300)}ms">
        <td class="col-categoria" data-label="Categoría">
          ${p.categoria
        ? `<span class="category-badge">${this.escapeHtml(p.categoria)}</span>`
        : '<span style="color: var(--text-tertiary)">—</span>'
      }
        </td>
        <td class="col-nombre" data-label="Nombre">
          <span class="cell-nombre">${this.escapeHtml(p.nombre)}</span>
        </td>
        <td class="col-prompt" data-label="Prompt">
          <div class="cell-truncated">${this.escapeHtml(p.prompt)}</div>
        </td>
        <td class="col-ejemplos" data-label="Ejemplos">
          <div class="cell-truncated">${p.ejemplos ? this.escapeHtml(p.ejemplos) : '<span style="color: var(--text-tertiary)">—</span>'}</div>
        </td>
        <td class="col-fecha" data-label="Fecha">
          <span class="cell-fecha" style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">${p.fecha ? this.escapeHtml(p.fecha) : '<span style="color: var(--text-tertiary)">—</span>'}</span>
        </td>
        <td class="col-acciones" data-label="Acciones">
          <div class="row-actions">
            <button class="btn-icon" data-action="view" data-row="${p.row}" title="Ver detalle" aria-label="Ver detalle">👁️</button>
            <button class="btn-icon" data-action="edit" data-row="${p.row}" title="Editar" aria-label="Editar prompt">✏️</button>
            <button class="btn-icon danger" data-action="delete" data-row="${p.row}" title="Eliminar" aria-label="Eliminar prompt">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderStats() {
    this.el.statTotal.textContent = StateManager.prompts.length;
    this.el.statCategories.textContent = StateManager.categories.length;
    this.el.statFiltered.textContent = StateManager.filteredPrompts.length;
  },

  renderCategoryFilter() {
    const current = this.el.categoryFilter.value;

    // Keep first option, rebuild the rest
    let html = '<option value="">Todas las categorías</option>';
    StateManager.categories.forEach(cat => {
      html += `<option value="${this.escapeHtml(cat)}" ${cat === current ? 'selected' : ''}>${this.escapeHtml(cat)}</option>`;
    });
    this.el.categoryFilter.innerHTML = html;
  },

  renderFormCategories() {
    let html = '<option value="">Seleccionar categoría...</option>';
    StateManager.categories.forEach(cat => {
      html += `<option value="${this.escapeHtml(cat)}">${this.escapeHtml(cat)}</option>`;
    });
    html += '<option value="__new__">＋ Crear nueva categoría</option>';
    this.el.formCategoria.innerHTML = html;
  },

  // ─── Form Modal ─────────────────────────────────────────
  openFormModal(prompt = null) {
    this.renderFormCategories();
    this.el.newCategoryWrapper.classList.remove('visible');
    this.el.formNewCategoria.value = '';

    // Clear validation
    this.el.formNombre.classList.remove('error');
    this.el.formPrompt.classList.remove('error');

    if (prompt) {
      // Edit mode
      StateManager.editingRow = prompt.row;
      this.el.formModalTitle.textContent = 'Editar Prompt';
      this.el.formRowId.value = prompt.row;
      this.el.formCategoria.value = prompt.categoria || '';
      this.el.formNombre.value = prompt.nombre || '';
      this.el.formPrompt.value = prompt.prompt || '';
      this.el.formEjemplos.value = prompt.ejemplos || '';
    } else {
      // Create mode
      StateManager.editingRow = null;
      this.el.formModalTitle.textContent = 'Nuevo Prompt';
      this.el.formRowId.value = '';
      this.el.formCategoria.value = '';
      this.el.formNombre.value = '';
      this.el.formPrompt.value = '';
      this.el.formEjemplos.value = '';
    }

    // Update char counter
    const len = this.el.formPrompt.value.length;
    this.el.promptCharCounter.textContent = `${len} caracter${len !== 1 ? 'es' : ''}`;

    this.el.formModal.classList.add('active');
    setTimeout(() => this.el.formNombre.focus(), 200);
  },

  closeFormModal() {
    this.el.formModal.classList.remove('active');
    StateManager.editingRow = null;
  },

  // ─── Confirm Modal ──────────────────────────────────────
  openConfirmModal(prompt) {
    StateManager.deletingRow = prompt.row;
    this.el.confirmText.textContent = `Se eliminará "${prompt.nombre}". Esta acción no se puede deshacer.`;
    this.el.confirmModal.classList.add('active');
  },

  closeConfirmModal() {
    this.el.confirmModal.classList.remove('active');
    StateManager.deletingRow = null;
  },

  // ─── Detail Modal ───────────────────────────────────────
  openDetailModal(prompt) {
    StateManager.viewingPrompt = prompt;
    this.el.detailModalTitle.textContent = prompt.nombre || 'Sin nombre';
    this.el.detailModalBody.innerHTML = `
      <div class="detail-field">
        <div class="detail-label">Categoría</div>
        <div class="detail-value">${prompt.categoria ? this.escapeHtml(prompt.categoria) : '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Nombre del Prompt</div>
        <div class="detail-value">${this.escapeHtml(prompt.nombre)}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Prompt</div>
        <div class="detail-value">${this.escapeHtml(prompt.prompt)}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Ejemplos</div>
        <div class="detail-value">${prompt.ejemplos ? this.escapeHtml(prompt.ejemplos) : '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Fecha de Creación</div>
        <div class="detail-value">${prompt.fecha ? this.escapeHtml(prompt.fecha) : '—'}</div>
      </div>
    `;
    this.el.detailModal.classList.add('active');
  },

  closeDetailModal() {
    this.el.detailModal.classList.remove('active');
    StateManager.viewingPrompt = null;
  },

  // ─── CRUD Handlers ──────────────────────────────────────
  async handleSave() {
    // Validate
    let valid = true;

    if (!this.el.formNombre.value.trim()) {
      this.el.formNombre.classList.add('error');
      valid = false;
    } else {
      this.el.formNombre.classList.remove('error');
    }

    if (!this.el.formPrompt.value.trim()) {
      this.el.formPrompt.classList.add('error');
      valid = false;
    } else {
      this.el.formPrompt.classList.remove('error');
    }

    if (!valid) {
      this.showToast('Por favor completa los campos obligatorios', 'warning');
      return;
    }

    // Determine category
    let categoria = this.el.formCategoria.value;
    if (categoria === '__new__') {
      categoria = this.el.formNewCategoria.value.trim();
    }

    const promptData = {
      categoria: categoria,
      nombre: this.el.formNombre.value.trim(),
      prompt: this.el.formPrompt.value.trim(),
      ejemplos: this.el.formEjemplos.value.trim(),
    };

    // Disable save button
    this.el.formSaveBtn.disabled = true;
    this.el.formSaveBtn.textContent = 'Guardando...';

    try {
      if (StateManager.editingRow) {
        // Update
        await ApiService.update(StateManager.editingRow, promptData);
        this.showToast('Prompt actualizado exitosamente', 'success');
      } else {
        // Create
        await ApiService.create(promptData);
        this.showToast('Prompt creado exitosamente', 'success');
      }

      this.closeFormModal();
      await this.loadData();
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    } finally {
      this.el.formSaveBtn.disabled = false;
      this.el.formSaveBtn.innerHTML = '<span aria-hidden="true">💾</span> Guardar';
    }
  },

  async handleDelete() {
    if (!StateManager.deletingRow) return;

    this.el.confirmDeleteBtn.disabled = true;
    this.el.confirmDeleteBtn.textContent = 'Eliminando...';

    try {
      await ApiService.delete(StateManager.deletingRow);
      this.showToast('Prompt eliminado exitosamente', 'success');
      this.closeConfirmModal();
      await this.loadData();
    } catch (error) {
      this.showToast(`Error: ${error.message}`, 'error');
    } finally {
      this.el.confirmDeleteBtn.disabled = false;
      this.el.confirmDeleteBtn.innerHTML = '<span aria-hidden="true">🗑️</span> Eliminar';
    }
  },

  // ─── Data Loading ───────────────────────────────────────
  async loadData() {
    try {
      StateManager.isLoading = true;
      this.renderTable();

      const prompts = await ApiService.getAll();
      StateManager.isLoading = false;
      StateManager.setPrompts(prompts);

      this.renderTable();
      this.renderStats();
      this.renderCategoryFilter();
    } catch (error) {
      StateManager.isLoading = false;
      this.el.tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon">⚠️</div>
              <p class="empty-state-title">Error de conexión</p>
              <p class="empty-state-text">${this.escapeHtml(error.message)}</p>
              <button class="btn btn-primary" onclick="UIManager.loadData()">
                Reintentar
              </button>
            </div>
          </td>
        </tr>
      `;
      this.showToast('No se pudo conectar con el servidor', 'error');
    } finally {
      StateManager.isLoading = false;
    }
  },

  // ─── Toast Notifications ────────────────────────────────
  showToast(message, type = 'success') {
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '📢'}</span>
      <span>${this.escapeHtml(message)}</span>
    `;

    this.el.toastContainer.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('exiting');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // ─── Utility ────────────────────────────────────────────
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

// ─── DEMO MODE (when API_URL is not configured) ─────────────
const DemoMode = {
  isDemo: false,
  prompts: [],
  nextRow: 2,

  init() {
    if (API_URL === 'TU_URL_DE_WEB_APP_AQUI' || !API_URL) {
      this.isDemo = true;
      this.loadDemoData();
      this.patchApiService();
      UIManager.showToast('Modo demo activo — Configura la URL del API en app.js para conectar con Google Sheets', 'warning');
    }
  },

  loadDemoData() {
    this.prompts = [
      {
        row: 2,
        categoria: 'Escritura',
        nombre: 'Generador de Resúmenes',
        prompt: 'Actúa como un experto en síntesis de información. Toma el siguiente texto y genera un resumen conciso que capture los puntos clave, las ideas principales y las conclusiones más importantes. El resumen debe ser claro, objetivo y no exceder los 200 palabras.',
        ejemplos: 'Entrada: [Artículo de 2000 palabras sobre inteligencia artificial]\nSalida: "La inteligencia artificial (IA) ha evolucionado significativamente en la última década, impulsada por avances en aprendizaje profundo y la disponibilidad de grandes conjuntos de datos..."',
      },
      {
        row: 3,
        categoria: 'Programación',
        nombre: 'Revisor de Código',
        prompt: 'Eres un ingeniero de software senior con 15 años de experiencia. Revisa el siguiente fragmento de código y proporciona:\n1. Errores o bugs potenciales\n2. Mejoras de rendimiento\n3. Mejores prácticas que no se están siguiendo\n4. Sugerencias de refactorización\n\nSé constructivo y explica el "por qué" detrás de cada sugerencia.',
        ejemplos: 'Entrada: function getUser(id) { return db.query("SELECT * FROM users WHERE id=" + id); }\nSalida: "⚠️ SQL Injection: Usa consultas parametrizadas. ⚠️ SELECT *: Especifica solo las columnas necesarias..."',
      },
      {
        row: 4,
        categoria: 'Marketing',
        nombre: 'Generador de Copy',
        prompt: 'Actúa como un copywriter experto en marketing digital. Genera un copy persuasivo para [producto/servicio] siguiendo la estructura AIDA (Atención, Interés, Deseo, Acción). El tono debe ser [formal/casual/profesional] y el público objetivo es [descripción del público].',
        ejemplos: 'Producto: App de meditación\nTono: Casual y empático\nPúblico: Profesionales estresados de 25-40 años\n\nResultado: "¿Tu mente no para ni un segundo? 🧠 Descubre MindFlow — 10 minutos al día que transformarán tu bienestar..."',
      },
      {
        row: 5,
        categoria: 'Escritura',
        nombre: 'Corrector de Estilo',
        prompt: 'Eres un editor profesional con especialización en estilo y claridad. Revisa el siguiente texto y mejóralo manteniendo la voz del autor. Enfócate en:\n- Eliminar redundancias\n- Mejorar la fluidez entre párrafos\n- Simplificar oraciones complejas\n- Corregir errores gramaticales\n\nMuestra los cambios con formato de antes/después.',
        ejemplos: '',
      },
      {
        row: 6,
        categoria: 'Educación',
        nombre: 'Explicador Simple',
        prompt: 'Explica el concepto de [tema] como si le estuvieras enseñando a un niño de 10 años. Usa analogías de la vida cotidiana, evita jerga técnica y divide la explicación en pasos simples. Al final, incluye un ejemplo práctico que el estudiante pueda experimentar.',
        ejemplos: 'Tema: Fotosíntesis\n\n"Imagina que las plantas tienen una cocina mágica dentro de sus hojas. Los ingredientes son: luz del sol (como el fuego de la cocina), agua (del suelo) y aire (CO2)..."',
      },
      {
        row: 7,
        categoria: 'Programación',
        nombre: 'Documentador de API',
        prompt: 'Genera documentación técnica profesional para la siguiente API/función. Incluye:\n- Descripción general\n- Parámetros (nombre, tipo, requerido/opcional, descripción)\n- Valores de retorno\n- Ejemplos de uso\n- Posibles errores\n- Notas de implementación\n\nUsa formato Markdown.',
        ejemplos: '',
      },
    ];
    this.nextRow = 8;
  },

  patchApiService() {
    const self = this;

    ApiService.getAll = async function () {
      await self.fakeDelay();
      return [...self.prompts];
    };

    ApiService.getCategories = async function () {
      await self.fakeDelay();
      const cats = new Set();
      self.prompts.forEach(p => { if (p.categoria) cats.add(p.categoria); });
      return Array.from(cats).sort();
    };

    ApiService.create = async function (data) {
      await self.fakeDelay();
      const newPrompt = {
        row: self.nextRow++,
        categoria: data.categoria || '',
        nombre: data.nombre,
        prompt: data.prompt,
        ejemplos: data.ejemplos || '',
      };
      self.prompts.push(newPrompt);
      return { success: true, data: newPrompt, message: 'Prompt creado exitosamente' };
    };

    ApiService.update = async function (row, data) {
      await self.fakeDelay();
      const index = self.prompts.findIndex(p => p.row === row);
      if (index === -1) throw new Error('Prompt no encontrado');
      self.prompts[index] = { ...self.prompts[index], ...data };
      return { success: true, data: self.prompts[index], message: 'Prompt actualizado exitosamente' };
    };

    ApiService.delete = async function (row) {
      await self.fakeDelay();
      const index = self.prompts.findIndex(p => p.row === row);
      if (index === -1) throw new Error('Prompt no encontrado');
      self.prompts.splice(index, 1);
      return { success: true, message: 'Prompt eliminado exitosamente' };
    };
  },

  fakeDelay() {
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
  },
};

// ─── APP INITIALIZATION ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  StateManager.init();
  UIManager.init();
  DemoMode.init();
  UIManager.loadData();
});
