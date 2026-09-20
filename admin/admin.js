/**
 * ZIN-NUR AKADEMIYASI (SERGELI) - ADMIN PANEL CONTROLLER
 * Full management system for teachers, courses (add/edit/delete), schedules, holidays, and bookings.
 */

const DEFAULT_CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/AKfycbyc8N0QyY9b3AI_BCGkdWeU7URxvjLrb-XJdsLQRwRYzJhwDtNFPb9vSaBfELL4uzfZ/exec",
  courses: {
    "Arab tili - Harf":       { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: 4 },
    "Arab tili - Qoida":      { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: 4 },
    "Arab tili - Amaliyot":   { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: 4 },
    "Arab tili grammatikasi": { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: 4 },
    "Ingliz tili":            { startHour: 9, startMin: 0, endHour: 12, endMin: 0, stepMin: 30, capacity: 1 },
    "Nurli Bolajon":          { startHour: 13, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: 1 }
  },
  courseExcludedDays: {
    "Nurli Bolajon": [0, 1, 2, 3, 5, 6] // Faqat Payshanba kuni dars bor (boshqa kunlar chiqarib tashlangan)
  },
  holidayDates: [
    { date: "31.08.2026", title: "Mustaqillik kuni arafasi - dam olish" },
    { date: "01.09.2026", title: "Mustaqillik kuni" }
  ],
  courseTeachers: {
    "Arab tili - Harf": ["Fazilat Ustoza", "Feruza Ustoz", "Kamola Ustoza", "Nargiza Ustoza", "Risolat Ustoza"],
    "Arab tili - Qoida": ["Fazilat Ustoza", "Feruza Ustoz", "Kamola Ustoza", "Nargiza Ustoza", "Risolat Ustoza"],
    "Arab tili - Amaliyot": ["Fazilat Ustoza", "Feruza Ustoz", "Kamola Ustoza", "Nargiza Ustoza", "Risolat Ustoza"],
    "Arab tili grammatikasi": ["Nargiza Ustoza"],
    "Ingliz tili": ["Mohinur Ustoza"],
    "Nurli Bolajon": ["Fazilat Ustoza", "Kamola Ustoza"]
  },
  teacherSchedule: {
    "Fazilat Ustoza": { offDays: [4],    start: "09:00", end: "17:00" },
    "Feruza Ustoz":   { offDays: [],     start: "13:00", end: "17:00" },
    "Kamola Ustoza":  { offDays: [0, 6], start: "09:00", end: "17:00" },
    "Mohinur Ustoza": { offDays: [],     start: "09:00", end: "12:00" },
    "Nargiza Ustoza": { offDays: [0],    start: "09:00", end: "17:00" },
    "Risolat Ustoza": { offDays: [0],    start: "09:00", end: "17:00" }
  },
  bookings: []
};

const DOW_SHORT = {
  uz: ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};

const I18N = {
  uz: {
    navDashboard: "Boshqaruv paneli",
    navTeachers: "Ustozalar",
    navCourses: "Kurslar boshqaruvi",
    navSchedule: "Ish jadvali & Soatlar",
    navHolidays: "Bayramlar",
    navBookings: "Arizalar & Talabalar",
    navSync: "Sinxronlash & Kod",
    btnSaveAll: "Saqlash",
    saveSuccess: "Barcha o'zgarishlar muvaffaqiyatli saqlandi!"
  },
  ru: {
    navDashboard: "Панель управления",
    navTeachers: "Преподаватели",
    navCourses: "Курсы и лимиты",
    navSchedule: "График работы",
    navHolidays: "Праздники",
    navBookings: "Все заявки",
    navSync: "Синхронизация",
    btnSaveAll: "Сохранить",
    saveSuccess: "Все изменения успешно сохранены!"
  },
  en: {
    navDashboard: "Dashboard",
    navTeachers: "Teachers",
    navCourses: "Courses",
    navSchedule: "Schedule",
    navHolidays: "Holidays",
    navBookings: "Bookings",
    navSync: "Sync",
    btnSaveAll: "Save",
    saveSuccess: "All changes saved successfully!"
  }
};

class AdminApp {
  constructor() {
    this.config = this.loadConfig();
    this.currentLang = localStorage.getItem('zn_admin_lang') || 'uz';
    this.currentTheme = localStorage.getItem('zn_admin_theme') || 'light';
    this.activeTab = 'dashboard';
    this.activeCodeTab = 'scriptJs';

    this.initElements();
    this.bindEvents();
    this.applyTheme(this.currentTheme);
    this.applyLanguage(this.currentLang);
    this.renderAll();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('zn_admin_sergeli_config') || localStorage.getItem('zn_admin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Object.assign({}, DEFAULT_CONFIG, parsed);
      }
    } catch (e) {
      console.warn("Local config load fallback", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  saveConfig(showToast = true) {
    try {
      const serialized = JSON.stringify(this.config);
      localStorage.setItem('zn_admin_sergeli_config', serialized);
      localStorage.setItem('zn_admin_config', serialized);
      if (showToast) this.showToast(I18N[this.currentLang].saveSuccess);
      this.renderAll();
      this.updateGeneratedCode();
      // Avtomatik Google Apps Script ga yuborish (Asosiy sayt bir zumda yangilanishi uchun)
      this.syncToCloud(true);
    } catch (e) {
      console.error("Error saving config", e);
    }
  }

  initElements() {
    this.sidebar = document.getElementById('sidebar');
    this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    this.sidebarCloseMobile = document.getElementById('sidebarCloseMobile');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.topSaveBtn = document.getElementById('topSaveBtn');

    this.navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    this.pageTitle = document.getElementById('pageTitle');
    this.pageSubtitle = document.getElementById('pageSubtitle');

    this.statTeachersCount = document.getElementById('statTeachersCount');
    this.statCoursesCount = document.getElementById('statCoursesCount');
    this.statBookingsCount = document.getElementById('statBookingsCount');
    this.statHolidaysCount = document.getElementById('statHolidaysCount');
    this.navTeacherCount = document.getElementById('navTeacherCount');
    this.navCourseCount = document.getElementById('navCourseCount');
    this.navBookingCount = document.getElementById('navBookingCount');

    this.dashboardTeacherList = document.getElementById('dashboardTeacherList');

    this.teachersListContainer = document.getElementById('teachersListContainer');
    this.teacherSearchInput = document.getElementById('teacherSearchInput');
    this.teacherCourseFilter = document.getElementById('teacherCourseFilter');

    this.scheduleTableBody = document.getElementById('scheduleTableBody');
    this.coursesGridContainer = document.getElementById('coursesGridContainer');
    this.holidaysListContainer = document.getElementById('holidaysListContainer');

    this.bookingsTableBody = document.getElementById('bookingsTableBody');
    this.bookingSearchInput = document.getElementById('bookingSearchInput');
    this.bookingCourseFilter = document.getElementById('bookingCourseFilter');
    this.bookingTeacherFilter = document.getElementById('bookingTeacherFilter');
    this.refreshBookingsBtn = document.getElementById('refreshBookingsBtn');
    this.exportBookingsCsvBtn = document.getElementById('exportBookingsCsvBtn');

    this.scriptUrlInput = document.getElementById('scriptUrlInput');
    this.saveCloudSyncBtn = document.getElementById('saveCloudSyncBtn');
    this.loadCloudSyncBtn = document.getElementById('loadCloudSyncBtn');
    this.exportBackupJsonBtn = document.getElementById('exportBackupJsonBtn');
    this.importBackupJsonInput = document.getElementById('importBackupJsonInput');
    this.generatedCodeArea = document.getElementById('generatedCodeArea');
    this.copyGeneratedCodeBtn = document.getElementById('copyGeneratedCodeBtn');
    this.codeTabBtns = document.querySelectorAll('.code-tab-btn');

    // Teacher Modal
    this.teacherModal = document.getElementById('teacherModal');
    this.teacherForm = document.getElementById('teacherForm');
    this.teacherOriginalName = document.getElementById('teacherOriginalName');
    this.teacherNameInput = document.getElementById('teacherNameInput');
    this.teacherCoursesCheckboxes = document.getElementById('teacherCoursesCheckboxes');
    this.teacherStartTime = document.getElementById('teacherStartTime');
    this.teacherEndTime = document.getElementById('teacherEndTime');
    this.teacherOffDaysToggles = document.getElementById('teacherOffDaysToggles');

    // Course Modal
    this.courseModal = document.getElementById('courseModal');
    this.courseForm = document.getElementById('courseForm');
    this.courseOriginalName = document.getElementById('courseOriginalName');
    this.courseNameInput = document.getElementById('courseNameInput');
    this.courseStartHour = document.getElementById('courseStartHour');
    this.courseEndHour = document.getElementById('courseEndHour');
    this.courseStepMin = document.getElementById('courseStepMin');
    this.courseCapacity = document.getElementById('courseCapacity');
    this.courseExcludedDaysToggles = document.getElementById('courseExcludedDaysToggles');

    // Holiday Modal
    this.holidayModal = document.getElementById('holidayModal');
    this.holidayForm = document.getElementById('holidayForm');
    this.holidayDateInput = document.getElementById('holidayDateInput');
    this.holidayTitleInput = document.getElementById('holidayTitleInput');

    // Confirm Modal
    this.confirmModal = document.getElementById('confirmModal');
    this.confirmTitle = document.getElementById('confirmTitle');
    this.confirmMessage = document.getElementById('confirmMessage');
    this.confirmOkBtn = document.getElementById('confirmOkBtn');
    this.confirmCancelBtn = document.getElementById('confirmCancelBtn');

    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    this.mobileMenuBtn.addEventListener('click', () => this.sidebar.classList.add('open'));
    this.sidebarCloseMobile.addEventListener('click', () => this.sidebar.classList.remove('open'));

    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        this.navigateTab(item.dataset.tab);
        this.sidebar.classList.remove('open');
      });
    });

    this.themeToggleBtn.addEventListener('click', () => {
      this.applyTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyLanguage(btn.dataset.lang));
    });

    this.topSaveBtn.addEventListener('click', () => this.saveConfig(true));

    this.teacherSearchInput.addEventListener('input', () => this.renderTeachers());
    this.teacherCourseFilter.addEventListener('change', () => this.renderTeachers());

    this.bookingSearchInput.addEventListener('input', () => this.renderBookings());
    this.bookingCourseFilter.addEventListener('change', () => this.renderBookings());
    this.bookingTeacherFilter.addEventListener('change', () => this.renderBookings());

    this.refreshBookingsBtn.addEventListener('click', () => this.refreshBookings());
    this.exportBookingsCsvBtn.addEventListener('click', () => this.exportBookingsCsv());

    this.teacherForm.addEventListener('submit', (e) => this.handleTeacherFormSubmit(e));
    this.courseForm.addEventListener('submit', (e) => this.handleCourseFormSubmit(e));
    this.holidayForm.addEventListener('submit', (e) => this.handleHolidayFormSubmit(e));

    this.teacherOffDaysToggles.querySelectorAll('.day-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    this.courseExcludedDaysToggles.querySelectorAll('.day-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    this.codeTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.codeTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCodeTab = btn.dataset.codeTab;
        this.updateGeneratedCode();
      });
    });

    this.copyGeneratedCodeBtn.addEventListener('click', () => {
      this.generatedCodeArea.select();
      navigator.clipboard.writeText(this.generatedCodeArea.value);
      this.showToast("Kod xotiraga nusxalandi!");
    });

    this.saveCloudSyncBtn.addEventListener('click', () => this.syncToCloud());
    this.loadCloudSyncBtn.addEventListener('click', () => this.syncFromCloud());
    this.exportBackupJsonBtn.addEventListener('click', () => this.exportBackupJson());
    this.importBackupJsonInput.addEventListener('change', (e) => this.importBackupJson(e));
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zn_admin_theme', theme);
  }

  applyLanguage(lang) {
    this.currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    localStorage.setItem('zn_admin_lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[lang] && I18N[lang][key]) {
        el.textContent = I18N[lang][key];
      }
    });

    this.renderAll();
  }

  navigateTab(tabName) {
    this.activeTab = tabName;
    this.navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
    this.tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`));

    const titles = {
      dashboard: { title: "Boshqaruv paneli", sub: "ZIN-NUR akademiyasi saytining real vaqt rejimidagi sozlamalari" },
      teachers: { title: "Ustozalar boshqaruvi", sub: "Yangi ustozalar qo'shish, tahrirlash, o'chirish va kurslarga biriktirish" },
      courses: { title: "Kurslar va sig'im", sub: "Kurslarni qo'shish, o'chirish, vaqtlar va guruh sig'imini boshqarish" },
      schedule: { title: "Ish jadvali va soatlar", sub: "Ustozalarning ish soatlari va dam olish kunlarini sozlash" },
      holidays: { title: "Bayramlar va Dam kunlari", sub: "Ro'yxatdan o'tish to'liq yopiladigan maxsus sanalar" },
      bookings: { title: "Arizalar & Talabalar", sub: "Saytdan kelib tushgan barcha yozilishlar ro'yxati" },
      sync: { title: "Sinxronizatsiya va Kod", sub: "Google Apps Script va sayt script.js bilan integratsiya" }
    };

    if (titles[tabName]) {
      this.pageTitle.textContent = titles[tabName].title;
      this.pageSubtitle.textContent = titles[tabName].sub;
    }

    if (tabName === 'sync') this.updateGeneratedCode();
  }

  renderAll() {
    this.renderStats();
    this.renderDashboard();
    this.renderCourseFilters();
    this.renderTeachers();
    this.renderCourses();
    this.renderSchedule();
    this.renderHolidays();
    this.renderBookings();
    this.scriptUrlInput.value = this.config.scriptUrl || '';
    this.updateGeneratedCode();
  }

  renderStats() {
    const allTeachers = this.getAllTeachersList();
    const coursesCount = Object.keys(this.config.courses || {}).length;
    const bookingsCount = (this.config.bookings || []).length;
    const holidaysCount = (this.config.holidayDates || []).length;

    this.statTeachersCount.textContent = allTeachers.length;
    this.statCoursesCount.textContent = coursesCount;
    this.statBookingsCount.textContent = bookingsCount;
    this.statHolidaysCount.textContent = holidaysCount;

    this.navTeacherCount.textContent = allTeachers.length;
    this.navCourseCount.textContent = coursesCount;
    this.navBookingCount.textContent = bookingsCount;
  }

  renderDashboard() {
    const allTeachers = this.getAllTeachersList();
    this.dashboardTeacherList.innerHTML = '';

    allTeachers.slice(0, 6).forEach(name => {
      const schedule = this.config.teacherSchedule[name] || { offDays: [], start: "09:00", end: "17:00" };
      const courses = this.getTeacherCourses(name);
      const offCount = (schedule.offDays || []).length;

      const item = document.createElement('div');
      item.className = 't-quick-item';
      item.innerHTML = `
        <div class="t-quick-info">
          <div class="t-quick-avatar">${name.charAt(0)}</div>
          <div>
            <strong>${name}</strong>
            <div style="font-size:0.75rem; color:var(--text-soft);">${courses.length} ta kurs • ${schedule.start} - ${schedule.end}</div>
          </div>
        </div>
        <div>
          <span class="status-badge ${offCount > 0 ? 'confirmed' : 'new'}">${offCount === 0 ? 'Har kuni' : `${7 - offCount} kun ish`}</span>
        </div>
      `;
      this.dashboardTeacherList.appendChild(item);
    });
  }

  renderCourseFilters() {
    const courses = Object.keys(this.config.courses || {});
    
    this.teacherCourseFilter.innerHTML = '<option value="all">Barcha kurslar</option>';
    courses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      this.teacherCourseFilter.appendChild(opt);
    });

    this.bookingCourseFilter.innerHTML = '<option value="all">Barcha kurslar</option>';
    courses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      this.bookingCourseFilter.appendChild(opt);
    });

    const allTeachers = this.getAllTeachersList();
    this.bookingTeacherFilter.innerHTML = '<option value="all">Barcha ustozalar</option>';
    allTeachers.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      this.bookingTeacherFilter.appendChild(opt);
    });
  }

  getAllTeachersList() {
    const set = new Set();
    Object.values(this.config.courseTeachers || {}).forEach(arr => {
      if (Array.isArray(arr)) arr.forEach(t => set.add(t));
    });
    Object.keys(this.config.teacherSchedule || {}).forEach(t => set.add(t));
    return Array.from(set).sort();
  }

  getTeacherCourses(teacherName) {
    const courses = [];
    Object.entries(this.config.courseTeachers || {}).forEach(([course, teachers]) => {
      if (Array.isArray(teachers) && teachers.includes(teacherName)) {
        courses.push(course);
      }
    });
    return courses;
  }

  // ================= COURSES TAB (ADD / EDIT / DELETE) =================
  renderCourses() {
    this.coursesGridContainer.innerHTML = '';
    const courses = Object.entries(this.config.courses || {});

    courses.forEach(([name, data]) => {
      const teachers = this.config.courseTeachers[name] || [];
      const excluded = (this.config.courseExcludedDays && this.config.courseExcludedDays[name]) || [];
      const excludedNames = excluded.map(d => DOW_SHORT[this.currentLang][d]).join(', ');

      const card = document.createElement('div');
      card.className = 'course-config-card';
      card.innerHTML = `
        <div class="course-config-header">
          <h4>${name}</h4>
          <span class="status-badge confirmed">Sig'im: ${data.capacity} kishi</span>
        </div>

        <div style="font-size:0.86rem; color:var(--text-soft); margin-bottom:12px;">
          <div><strong>Vaqt oralig'i:</strong> ${String(data.startHour).padStart(2,'0')}:${String(data.startMin).padStart(2,'0')} — ${String(data.endHour).padStart(2,'0')}:${String(data.endMin).padStart(2,'0')} (${data.stepMin} daqiqa)</div>
          <div style="margin-top:4px;"><strong>Dars bo'lmaydigan kunlar:</strong> ${excludedNames || "Har kuni dars bor"}</div>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-bottom:14px;">
          <div style="font-size:0.78rem; font-weight:600; color:var(--text-muted); margin-bottom:6px;">Biriktirilgan ustozalar (${teachers.length}):</div>
          <div class="teacher-courses-tags" style="margin-bottom:0;">
            ${teachers.map(t => `<span class="course-tag">${t}</span>`).join('') || '<span style="font-size:0.78rem; color:var(--text-muted);">Ustoza tanlanmagan</span>'}
          </div>
        </div>

        <div class="teacher-card-actions" style="margin-top:auto;">
          <button class="btn btn-outline btn-sm" onclick="adminApp.openEditCourseModal('${name.replace(/'/g, "\\'")}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>Tahrirlash</span>
          </button>
          <button class="btn btn-outline btn-sm" style="color:#DC2626;" onclick="adminApp.deleteCourse('${name.replace(/'/g, "\\'")}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            <span>O'chirish</span>
          </button>
        </div>
      `;
      this.coursesGridContainer.appendChild(card);
    });
  }

  openAddCourseModal() {
    this.courseOriginalName.value = '';
    this.courseNameInput.value = '';
    document.getElementById('courseModalTitle').textContent = "Yangi kurs qo'shish";
    this.courseStartHour.value = 9;
    this.courseEndHour.value = 17;
    this.courseStepMin.value = 30;
    this.courseCapacity.value = 1;

    this.courseExcludedDaysToggles.querySelectorAll('.day-toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    this.openModal('courseModal');
  }

  openEditCourseModal(name) {
    const data = this.config.courses[name] || { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: 1 };
    this.courseOriginalName.value = name;
    this.courseNameInput.value = name;
    document.getElementById('courseModalTitle').textContent = `Kursni tahrirlash: ${name}`;
    this.courseStartHour.value = data.startHour || 9;
    this.courseEndHour.value = data.endHour || 17;
    this.courseStepMin.value = data.stepMin || 30;
    this.courseCapacity.value = data.capacity || 1;

    const excluded = (this.config.courseExcludedDays && this.config.courseExcludedDays[name]) || [];
    this.courseExcludedDaysToggles.querySelectorAll('.day-toggle-btn').forEach(btn => {
      const dow = parseInt(btn.dataset.dow, 10);
      btn.classList.toggle('active', excluded.includes(dow));
    });

    this.openModal('courseModal');
  }

  handleCourseFormSubmit(e) {
    e.preventDefault();
    const origName = this.courseOriginalName.value.trim();
    const newName = this.courseNameInput.value.trim();
    const startHour = parseInt(this.courseStartHour.value, 10) || 9;
    const endHour = parseInt(this.courseEndHour.value, 10) || 17;
    const stepMin = parseInt(this.courseStepMin.value, 10) || 30;
    const capacity = parseInt(this.courseCapacity.value, 10) || 1;

    if (!newName) return;

    const excludedDays = [];
    this.courseExcludedDaysToggles.querySelectorAll('.day-toggle-btn.active').forEach(btn => {
      excludedDays.push(parseInt(btn.dataset.dow, 10));
    });

    if (origName && origName !== newName) {
      delete this.config.courses[origName];
      if (this.config.courseExcludedDays && this.config.courseExcludedDays[origName]) {
        delete this.config.courseExcludedDays[origName];
      }
      if (this.config.courseTeachers[origName]) {
        this.config.courseTeachers[newName] = this.config.courseTeachers[origName];
        delete this.config.courseTeachers[origName];
      }
    }

    this.config.courses[newName] = {
      startHour: startHour,
      startMin: 0,
      endHour: endHour,
      endMin: 0,
      stepMin: stepMin,
      capacity: capacity
    };

    if (!this.config.courseExcludedDays) this.config.courseExcludedDays = {};
    if (excludedDays.length > 0) {
      this.config.courseExcludedDays[newName] = excludedDays;
    } else {
      delete this.config.courseExcludedDays[newName];
    }

    if (!this.config.courseTeachers[newName]) {
      this.config.courseTeachers[newName] = [];
    }

    this.closeModal('courseModal');
    this.saveConfig(true);
    this.showToast(`Kurs "${newName}" saqlandi!`);
  }

  deleteCourse(courseName) {
    this.openConfirmModal(
      "Kursni o'chirish",
      `"${courseName}" kursini butunlay o'chirishni tasdiqlaysizmi?`,
      () => {
        delete this.config.courses[courseName];
        if (this.config.courseExcludedDays) delete this.config.courseExcludedDays[courseName];
        delete this.config.courseTeachers[courseName];
        this.saveConfig(true);
        this.showToast(`Kurs "${courseName}" o'chirildi!`);
      }
    );
  }

  // ================= TEACHERS TAB =================
  renderTeachers() {
    const query = this.teacherSearchInput.value.toLowerCase().trim();
    const filterCourse = this.teacherCourseFilter.value;
    const allTeachers = this.getAllTeachersList();

    this.teachersListContainer.innerHTML = '';

    const filtered = allTeachers.filter(name => {
      const matchQuery = name.toLowerCase().includes(query);
      const courses = this.getTeacherCourses(name);
      const matchCourse = filterCourse === 'all' || courses.includes(filterCourse);
      return matchQuery && matchCourse;
    });

    if (filtered.length === 0) {
      this.teachersListContainer.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-soft);">
          Ustozalar topilmadi.
        </div>
      `;
      return;
    }

    filtered.forEach(name => {
      const schedule = this.config.teacherSchedule[name] || { offDays: [], start: "09:00", end: "17:00" };
      const courses = this.getTeacherCourses(name);
      const offDaysNames = (schedule.offDays || []).map(d => DOW_SHORT[this.currentLang][d]).join(', ');

      const card = document.createElement('div');
      card.className = 'teacher-card';
      card.innerHTML = `
        <div class="teacher-card-top">
          <div class="teacher-avatar">${name.charAt(0)}</div>
          <div class="teacher-name-box">
            <h4>${name}</h4>
            <span class="teacher-hours-badge">⏱ ${schedule.start || '09:00'} — ${schedule.end || '17:00'}</span>
          </div>
        </div>

        <div class="teacher-courses-tags">
          ${courses.length > 0 ? courses.map(c => `<span class="course-tag">${c}</span>`).join('') : '<span class="course-tag" style="opacity:0.6;">Kurs biriktirilmagan</span>'}
        </div>

        <div class="teacher-card-schedule">
          <div><strong>Dam olish:</strong> ${offDaysNames || "Dam olish kuni yo'q"}</div>
        </div>

        <div class="teacher-card-actions">
          <button class="btn btn-outline btn-sm" onclick="adminApp.openEditTeacherModal('${name.replace(/'/g, "\\'")}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>Tahrirlash</span>
          </button>
          <button class="btn btn-outline btn-sm" style="color:#DC2626;" onclick="adminApp.deleteTeacher('${name.replace(/'/g, "\\'")}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            <span>O'chirish</span>
          </button>
        </div>
      `;
      this.teachersListContainer.appendChild(card);
    });
  }

  openAddTeacherModal() {
    this.teacherOriginalName.value = '';
    this.teacherNameInput.value = '';
    document.getElementById('teacherModalTitle').textContent = "Yangi ustoza qo'shish";
    this.teacherStartTime.value = '09:00';
    this.teacherEndTime.value = '17:00';

    this.renderModalCourseCheckboxes([]);

    this.teacherOffDaysToggles.querySelectorAll('.day-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dow === '0');
    });

    this.openModal('teacherModal');
  }

  openEditTeacherModal(name) {
    this.teacherOriginalName.value = name;
    this.teacherNameInput.value = name;
    document.getElementById('teacherModalTitle').textContent = `Ustozani tahrirlash: ${name}`;

    const schedule = this.config.teacherSchedule[name] || { offDays: [0], start: "09:00", end: "17:00" };
    this.teacherStartTime.value = schedule.start || '09:00';
    this.teacherEndTime.value = schedule.end || '17:00';

    const currentCourses = this.getTeacherCourses(name);
    this.renderModalCourseCheckboxes(currentCourses);

    const offDays = schedule.offDays || [];
    this.teacherOffDaysToggles.querySelectorAll('.day-toggle-btn').forEach(btn => {
      const dow = parseInt(btn.dataset.dow, 10);
      btn.classList.toggle('active', offDays.includes(dow));
    });

    this.openModal('teacherModal');
  }

  renderModalCourseCheckboxes(selectedCourses) {
    this.teacherCoursesCheckboxes.innerHTML = '';
    const courses = Object.keys(this.config.courses || {});
    courses.forEach(c => {
      const label = document.createElement('label');
      label.className = 'checkbox-item';
      label.innerHTML = `
        <input type="checkbox" name="teacherCourse" value="${c}" ${selectedCourses.includes(c) ? 'checked' : ''}>
        <span>${c}</span>
      `;
      this.teacherCoursesCheckboxes.appendChild(label);
    });
  }

  handleTeacherFormSubmit(e) {
    e.preventDefault();
    const origName = this.teacherOriginalName.value.trim();
    const newName = this.teacherNameInput.value.trim();
    const start = this.teacherStartTime.value;
    const end = this.teacherEndTime.value;

    if (!newName) return;

    const selectedCourses = [];
    this.teacherCoursesCheckboxes.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      selectedCourses.push(cb.value);
    });

    const offDays = [];
    this.teacherOffDaysToggles.querySelectorAll('.day-toggle-btn.active').forEach(btn => {
      offDays.push(parseInt(btn.dataset.dow, 10));
    });

    if (origName && origName !== newName) {
      Object.keys(this.config.courseTeachers).forEach(c => {
        this.config.courseTeachers[c] = (this.config.courseTeachers[c] || []).filter(t => t !== origName);
      });
      delete this.config.teacherSchedule[origName];
    }

    this.config.teacherSchedule[newName] = { offDays, start, end };

    Object.keys(this.config.courses).forEach(c => {
      if (!this.config.courseTeachers[c]) this.config.courseTeachers[c] = [];
      const shouldInclude = selectedCourses.includes(c);
      const isAlreadyIn = this.config.courseTeachers[c].includes(newName);

      if (shouldInclude && !isAlreadyIn) {
        this.config.courseTeachers[c].push(newName);
      } else if (!shouldInclude && isAlreadyIn) {
        this.config.courseTeachers[c] = this.config.courseTeachers[c].filter(t => t !== newName);
      }
    });

    this.closeModal('teacherModal');
    this.saveConfig(true);
    this.showToast(`Ustoza "${newName}" saqlandi!`);
  }

  deleteTeacher(name) {
    this.openConfirmModal(
      "Ustozani o'chirish",
      `"${name}" ni barcha kurslar va jadvallardan o'chirishni xohlaysizmi?`,
      () => {
        Object.keys(this.config.courseTeachers || {}).forEach(c => {
          this.config.courseTeachers[c] = (this.config.courseTeachers[c] || []).filter(t => t !== name);
        });
        delete this.config.teacherSchedule[name];
        this.saveConfig(true);
        this.showToast(`Ustoza "${name}" o'chirildi!`);
      }
    );
  }

  // ================= SCHEDULE TAB =================
  renderSchedule() {
    const allTeachers = this.getAllTeachersList();
    this.scheduleTableBody.innerHTML = '';

    allTeachers.forEach(name => {
      const schedule = this.config.teacherSchedule[name] || { offDays: [], start: "09:00", end: "17:00" };
      const courses = this.getTeacherCourses(name);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="t-quick-avatar" style="width:32px; height:32px;">${name.charAt(0)}</div>
            <strong>${name}</strong>
          </div>
        </td>
        <td>
          <span style="font-weight:600; color:var(--emerald-600);">${schedule.start || '09:00'} — ${schedule.end || '17:00'}</span>
        </td>
        <td>
          <div class="days-toggle-group" style="margin:0;">
            ${[1,2,3,4,5,6,0].map(dow => {
              const isOff = (schedule.offDays || []).includes(dow);
              return `<span class="day-toggle-btn ${isOff ? 'active' : ''}" style="padding:3px 7px; font-size:0.72rem; cursor:default;">${DOW_SHORT[this.currentLang][dow]}</span>`;
            }).join('')}
          </div>
        </td>
        <td>
          <div style="font-size:0.8rem; color:var(--text-soft); max-width:260px;">
            ${courses.join(', ') || '<em style="color:var(--text-muted);">Kurs yo\'q</em>'}
          </div>
        </td>
        <td>
          <button class="btn btn-outline btn-xs" onclick="adminApp.openEditTeacherModal('${name.replace(/'/g, "\\'")}')">O'zgartirish</button>
        </td>
      `;
      this.scheduleTableBody.appendChild(row);
    });
  }

  // ================= HOLIDAYS TAB =================
  renderHolidays() {
    this.holidaysListContainer.innerHTML = '';
    const holidays = this.config.holidayDates || [];

    if (holidays.length === 0) {
      this.holidaysListContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-soft);">Bayram sanalari belgilanmagan.</div>`;
      return;
    }

    holidays.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'holiday-card';
      card.innerHTML = `
        <div class="holiday-card-header">
          <span class="holiday-date-pill">🗓 ${item.date}</span>
          <button class="btn btn-outline btn-xs" style="color:#DC2626;" onclick="adminApp.deleteHoliday(${index})">O'chirish</button>
        </div>
        <p style="font-size:0.9rem; color:var(--text-main); font-weight:600;">${item.title || 'Dam olish kuni'}</p>
        <span style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Barcha kurslar uchun vaqt tanlash bloklanadi</span>
      `;
      this.holidaysListContainer.appendChild(card);
    });
  }

  openAddHolidayModal() {
    this.holidayDateInput.value = '';
    this.holidayTitleInput.value = '';
    this.openModal('holidayModal');
  }

  handleHolidayFormSubmit(e) {
    e.preventDefault();
    const rawDate = this.holidayDateInput.value;
    const title = this.holidayTitleInput.value.trim();
    if (!rawDate) return;

    const parts = rawDate.split('-');
    const formatted = `${parts[2]}.${parts[1]}.${parts[0]}`;

    if (!this.config.holidayDates) this.config.holidayDates = [];
    this.config.holidayDates.push({ date: formatted, title: title || "Dam olish kuni" });

    this.closeModal('holidayModal');
    this.saveConfig(true);
    this.showToast(`Bayram sanasi (${formatted}) qo'shildi!`);
  }

  deleteHoliday(index) {
    this.config.holidayDates.splice(index, 1);
    this.saveConfig(true);
    this.showToast("Bayram sanasi o'chirildi!");
  }

  // ================= BOOKINGS TAB =================
  renderBookings() {
    const search = this.bookingSearchInput.value.toLowerCase().trim();
    const course = this.bookingCourseFilter.value;
    const teacher = this.bookingTeacherFilter.value;

    const bookings = this.config.bookings || [];
    this.bookingsTableBody.innerHTML = '';

    const filtered = bookings.filter(b => {
      const matchSearch = (b.ism && b.ism.toLowerCase().includes(search)) ||
                          (b.familiya && b.familiya.toLowerCase().includes(search)) ||
                          (b.telefon && b.telefon.includes(search));
      const matchCourse = course === 'all' || b.kurs === course;
      const matchTeacher = teacher === 'all' || b.ustoza === teacher;
      return matchSearch && matchCourse && matchTeacher;
    });

    if (filtered.length === 0) {
      this.bookingsTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-soft);">Arizalar topilmadi.</td></tr>`;
      return;
    }

    filtered.forEach(b => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-size:0.8rem; color:var(--text-soft);">${b.vaqt || ''}</td>
        <td><strong>${b.ism || ''} ${b.familiya || ''}</strong></td>
        <td><a href="tel:${b.telefon}" style="color:var(--emerald-600); font-weight:600; text-decoration:none;">${b.telefon || ''}</a></td>
        <td><span class="course-tag">${b.kurs || ''}</span></td>
        <td><strong>${b.ustoza || '—'}</strong></td>
        <td>${b.slot || ''}</td>
        <td><span class="status-badge confirmed">${b.status || 'Yangi'}</span></td>
        <td>
          <button class="btn btn-outline btn-xs" style="color:#DC2626;" onclick="adminApp.deleteBooking('${b.id}')">✕</button>
        </td>
      `;
      this.bookingsTableBody.appendChild(row);
    });
  }

  deleteBooking(id) {
    this.config.bookings = (this.config.bookings || []).filter(b => b.id !== id);
    this.saveConfig(true);
    this.showToast("Ariza o'chirildi!");
  }

  exportBookingsCsv() {
    const bookings = this.config.bookings || [];
    if (bookings.length === 0) {
      this.showToast("Yuklab olish uchun arizalar yo'q!", true);
      return;
    }

    let csv = "\uFEFFID;Ariza vaqti;Ism;Familiya;Telefon;Kurs;Ustoza;Dars vaqti;Status\n";
    bookings.forEach(b => {
      csv += `"${b.id}";"${b.vaqt || ''}";"${b.ism || ''}";"${b.familiya || ''}";"${b.telefon || ''}";"${b.kurs || ''}";"${b.ustoza || ''}";"${b.slot || ''}";"${b.status || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zinnur_sergeli_yozilishlar_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async refreshBookings() {
    this.showToast("Arizalar yuklanmoqda...");
    if (this.config.scriptUrl) {
      try {
        const res = await fetch(`${this.config.scriptUrl}?action=get_bookings`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.config.bookings = data;
            this.saveConfig(false);
            this.showToast("Google Sheets dan yangi arizalar yuklandi!");
            return;
          }
        }
      } catch (err) {
        console.warn("Fetch error:", err);
      }
    }
    this.renderBookings();
    this.showToast("Arizalar yangilandi");
  }

  // ================= CLOUD SYNC & CODE GENERATOR =================
  async syncToCloud(silent = false) {
    const url = (this.scriptUrlInput ? this.scriptUrlInput.value.trim() : '') || this.config.scriptUrl || DEFAULT_CONFIG.scriptUrl;
    if (!url) {
      if (!silent) this.showToast("Iltimos, Google Script URL manzilini kiriting!", true);
      return;
    }
    this.config.scriptUrl = url;

    if (!silent) this.showToast("Google Sheets ga saqlanmoqda...");
    try {
      const payload = {
        action: "save_config",
        courses: this.config.courses,
        courseTeachers: this.config.courseTeachers,
        teacherSchedule: this.config.teacherSchedule,
        holidayDates: (this.config.holidayDates || []).map(h => typeof h === 'string' ? h : h.date),
        courseExcludedDays: this.config.courseExcludedDays
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (!silent) this.showToast("Google Sheets bilan muvaffaqiyatli sinxronlandi! ✅");
    } catch (err) {
      if (!silent) this.showToast("Lokal saqlandi! Yangilangan koddan nusxa oling.");
    }
  }

  async syncFromCloud() {
    const url = this.scriptUrlInput.value.trim();
    if (!url) {
      this.showToast("Google Script URL manzilini kiriting!", true);
      return;
    }

    this.showToast("Google Sheets dan yuklanmoqda...");
    try {
      const res = await fetch(`${url}?action=get_config`);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data && data.courseTeachers) {
        this.config.courseTeachers = data.courseTeachers;
        if (data.courses) this.config.courses = data.courses;
        if (data.teacherSchedule) this.config.teacherSchedule = data.teacherSchedule;
        if (data.holidayDates) {
          this.config.holidayDates = data.holidayDates.map(d => typeof d === 'string' ? { date: d, title: 'Dam olish kuni' } : d);
        }
        this.saveConfig(true);
        this.showToast("Google Sheets dan muvaffaqiyatli yuklandi!");
      }
    } catch (err) {
      this.showToast("Google Sheets dan yuklashda xatolik yuz berdi!", true);
    }
  }

  exportBackupJson() {
    const jsonStr = JSON.stringify(this.config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zinnur_sergeli_admin_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("JSON nusxa yuklab olindi!");
  }

  importBackupJson(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && parsed.courseTeachers) {
          this.config = Object.assign({}, DEFAULT_CONFIG, parsed);
          this.saveConfig(true);
          this.showToast("Zaxira nusxadan tiklandi!");
        }
      } catch (err) {
        this.showToast("Noto'g'ri JSON fayl tanlandi!", true);
      }
    };
    reader.readAsText(file);
  }

  updateGeneratedCode() {
    if (this.activeCodeTab === 'scriptJs') {
      document.getElementById('codeBoxTitle').textContent = "Saytingizdagi (script.js) ga qo'yiladigan avtomatik kod";
      this.generatedCodeArea.value = this.generateWebsiteScriptJs();
    } else {
      document.getElementById('codeBoxTitle').textContent = "Google Apps Script (Code.gs) ga qo'yiladigan to'liq kod";
      this.generatedCodeArea.value = this.generateGoogleAppsScriptCode();
    }
  }

  generateWebsiteScriptJs() {
    const holidays = (this.config.holidayDates || []).map(h => `  "${h.date}"`).join(',\n');
    const courseTeachersStr = JSON.stringify(this.config.courseTeachers, null, 2);
    const teacherScheduleStr = JSON.stringify(this.config.teacherSchedule, null, 2);
    const courseExcludedDaysStr = JSON.stringify(this.config.courseExcludedDays, null, 2);
    
    let coursesObjStr = '{\n';
    Object.entries(this.config.courses || {}).forEach(([cName, cData]) => {
      coursesObjStr += `  "${cName}": { slots: buildSlots(${cData.startHour},${cData.startMin||0},${cData.endHour},${cData.endMin||0},${cData.stepMin||30}), capacity: ${cData.capacity||1} },\n`;
    });
    coursesObjStr += '}';

    return `// ==========================================================================
// ZIN-NUR AKADEMIYASI (SERGELI) - ASOSIY SAYT SCRIPTI (YANGILANGAN AVTOMATIK KOD)
// ==========================================================================

const SCRIPT_URL = "${this.config.scriptUrl || DEFAULT_CONFIG.scriptUrl}";

function buildSlots(startHour, startMin, endHour, endMin, stepMin){
  const slots = [];
  let h = startHour, m = startMin;
  while (h < endHour || (h === endHour && m <= endMin)){
    slots.push(\`\${String(h).padStart(2,'0')}:\${String(m).padStart(2,'0')}\`);
    m += stepMin;
    if (m >= 60){ m -= 60; h += 1; }
  }
  return slots;
}

const COURSES = ${coursesObjStr};

// Kurslar bo'yicha chiqarib tashlangan kunlar (0=Yakshanba ... 6=Shanba)
const COURSE_EXCLUDED_DAYS = ${courseExcludedDaysStr};

// Bayram va umumiy dam olish kunlari
const HOLIDAY_DATES = [
${holidays}
];

function isHolidayDate(date){
  return HOLIDAY_DATES.indexOf(formatDateValue(date)) !== -1;
}

// Kurslar bo'yicha ustozalar ro'yxati
const COURSE_TEACHERS = ${courseTeachersStr};
const TEACHER_COURSES = Object.keys(COURSE_TEACHERS);

// Ustozalarning haftalik ish jadvali va soatlari
const TEACHER_SCHEDULE = ${teacherScheduleStr};

function timeToMinutes(str){
  const parts = String(str).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function isTeacherScheduled(name, date, time){
  const schedule = TEACHER_SCHEDULE[name];
  if (!schedule) return true;
  if (!date) return true;
  const dow = date.getDay();
  if (schedule.offDays && schedule.offDays.indexOf(dow) !== -1) return false;
  if (time && schedule.start && schedule.end){
    const tm = timeToMinutes(time);
    if (tm < timeToMinutes(schedule.start) || tm > timeToMinutes(schedule.end)) return false;
  }
  return true;
}
`;
  }

  generateGoogleAppsScriptCode() {
    return `// ==========================================================================
// ZIN-NUR AKADEMIYASI (SERGELI) - TO'LIQ ISHCHI GOOGLE APPS SCRIPT (Code.gs)
// ==========================================================================

const CAPACITIES = {
  "Arab tili - Harf": 4,
  "Arab tili - Qoida": 4,
  "Arab tili - Amaliyot": 4,
  "Arab tili grammatikasi": 4,
  "Ingliz tili": 1,
  "Nurli Bolajon": 1
};

function buildSlots_(startHour, startMin, endHour, endMin, stepMin){
  const slots = [];
  let h = startHour, m = startMin;
  while (h < endHour || (h === endHour && m <= endMin)){
    slots.push(Utilities.formatString('%02d:%02d', h, m));
    m += stepMin;
    if (m >= 60){ m -= 60; h += 1; }
  }
  return slots;
}

const COURSE_SLOTS = {
  "Arab tili - Harf": buildSlots_(9, 0, 17, 0, 30),
  "Arab tili - Qoida": buildSlots_(9, 0, 17, 0, 30),
  "Arab tili - Amaliyot": buildSlots_(9, 0, 17, 0, 30),
  "Arab tili grammatikasi": buildSlots_(9, 0, 17, 0, 30),
  "Ingliz tili": buildSlots_(9, 0, 12, 0, 30),
  "Nurli Bolajon": buildSlots_(13, 0, 17, 0, 30)
};

const COURSE_TEACHERS_ = {
  "Arab tili - Harf": ["Nargiza Ustoza", "Fazilat Ustoza"],
  "Arab tili - Qoida": ["Nargiza Ustoza", "Fazilat Ustoza"],
  "Arab tili - Amaliyot": ["Nargiza Ustoza", "Fazilat Ustoza"],
  "Arab tili grammatikasi": ["Nargiza Ustoza"],
  "Ingliz tili": ["Fazilat Ustoza"],
  "Nurli Bolajon": ["Muslima Ustoza"]
};

const TEACHER_COURSES_ = Object.keys(COURSE_TEACHERS_);
const TEACHERS_ = Array.from(new Set([].concat.apply([], Object.values(COURSE_TEACHERS_))));

const HEADER_DATE_ROW = 1;
const HEADER_DOW_ROW = 2;
const FIRST_TIME_ROW = 3;
const TIME_COL = 1;

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

function jsonOutput_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeDateStr_(value){
  if (Object.prototype.toString.call(value) === '[object Date]'){
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd.MM.yyyy');
  }
  return String(value || '').trim();
}

function parseDateStr_(s){
  const parts = String(s || '').trim().split('.');
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return null;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

function cellEntries_(value){
  return String(value || '')
    .split('\\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function monthKeyFromDateStr_(sanaStr){
  const parts = String(sanaStr || '').trim().split('.');
  if (parts.length !== 3) return null;
  return \`\${parts[1]}.\${parts[2]}\`;
}

function sheetNameFor_(kurs, monthKey){
  const parts = monthKey.split('.');
  const monthIdx = Number(parts[0]) - 1;
  const year = parts[1];
  const monthLabel = (UZ_MONTHS[monthIdx] || parts[0]) + ' ' + year;
  return \`\${kurs} — \${monthLabel}\`;
}

function currentMonthKey_(){
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM.yyyy');
}

function getOrCreateCourseSheet_(kurs, monthKey){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = sheetNameFor_(kurs, monthKey);
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  sheet = ss.insertSheet(sheetName);
  sheet.getRange(HEADER_DOW_ROW, TIME_COL).setValue('Vaqti');

  const slots = COURSE_SLOTS[kurs] || buildSlots_(9, 0, 17, 0, 30);
  const timeRange = sheet.getRange(FIRST_TIME_ROW, TIME_COL, slots.length, 1);
  timeRange.setNumberFormat('@');
  slots.forEach((time, idx) => {
    sheet.getRange(FIRST_TIME_ROW + idx, TIME_COL).setValue(time);
  });

  sheet.getRange(HEADER_DOW_ROW, TIME_COL).setFontWeight('bold').setBackground('#FFFF00');
  sheet.setColumnWidth(TIME_COL, 70);
  sheet.setFrozenRows(HEADER_DOW_ROW);
  sheet.setFrozenColumns(TIME_COL);

  return sheet;
}

function getOrCreateDateColumn_(sheet, sanaStr, dowLabel){
  const lastCol = sheet.getLastColumn();
  const newDate = parseDateStr_(sanaStr);

  let insertCol;

  if (lastCol >= 2){
    const headerVals = sheet.getRange(HEADER_DATE_ROW, 2, 1, lastCol - 1).getValues()[0];

    for (let i = 0; i < headerVals.length; i++){
      if (normalizeDateStr_(headerVals[i]) === sanaStr) return i + 2;
    }

    insertCol = lastCol + 1;
    for (let i = 0; i < headerVals.length; i++){
      const existingDate = parseDateStr_(normalizeDateStr_(headerVals[i]));
      if (existingDate && newDate && newDate.getTime() < existingDate.getTime()){
        insertCol = i + 2;
        break;
      }
    }

    if (insertCol <= lastCol){
      sheet.insertColumnBefore(insertCol);
    }
  } else {
    insertCol = 2;
  }

  const headerCells = sheet.getRange(HEADER_DATE_ROW, insertCol, 2, 1);
  headerCells.setNumberFormat('@');

  sheet.getRange(HEADER_DATE_ROW, insertCol).setValue(sanaStr);
  sheet.getRange(HEADER_DOW_ROW, insertCol).setValue(dowLabel);
  headerCells
    .setBackground('#FFFF00')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setColumnWidth(insertCol, 150);

  return insertCol;
}

function findTimeRow_(kurs, vaqt){
  const slots = COURSE_SLOTS[kurs] || [];
  const idx = slots.indexOf(vaqt);
  return idx === -1 ? null : FIRST_TIME_ROW + idx;
}

function getTeacherCounts_(kurs, sana, vaqt){
  const counts = {};
  const courseTeachers = COURSE_TEACHERS_[kurs] || [];
  courseTeachers.forEach(name => { counts[name] = 0; });

  const monthKey = monthKeyFromDateStr_(sana);
  if (!monthKey) return counts;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = sheetNameFor_(kurs, monthKey);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return counts;

  const lastCol = sheet.getLastColumn();
  if (lastCol < 2) return counts;

  const headerVals = sheet.getRange(HEADER_DATE_ROW, 2, 1, lastCol - 1).getValues()[0];
  let dateCol = -1;
  for (let i = 0; i < headerVals.length; i++){
    if (normalizeDateStr_(headerVals[i]) === sana){ dateCol = i + 2; break; }
  }
  if (dateCol === -1) return counts;

  const timeRow = findTimeRow_(kurs, vaqt);
  if (!timeRow) return counts;

  const cellValue = sheet.getRange(timeRow, dateCol).getValue();
  const entries = cellEntries_(cellValue);

  courseTeachers.forEach(name => {
    counts[name] = entries.filter(line => line.indexOf(name) !== -1).length;
  });
  return counts;
}

function getAllBookings_(ss){
  const bookings = [];

  // 1. Agar "Royxat" varag'i mavjud bo'lsa, to'g'ridan-to'g'ri o'qish
  const royxat = ss.getSheetByName("Royxat");
  if (royxat && royxat.getLastRow() > 1){
    const rows = royxat.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++){
      const r = rows[i];
      if (!r[0] && !r[1] && !r[3]) continue;
      bookings.push({
        id: "b_" + i,
        vaqt: r[0] ? String(r[0]) : "",
        ism: r[1] ? String(r[1]) : "",
        familiya: r[2] ? String(r[2]) : "",
        telefon: r[3] ? String(r[3]) : "",
        kurs: r[4] ? String(r[4]) : "",
        sana: r[5] ? String(r[5]) : "",
        vaqt_slot: r[6] ? String(r[6]) : "",
        slot: (r[5] ? String(r[5]) : "") + " (" + (r[6] ? String(r[6]) : "") + ")",
        kun: r[7] ? String(r[7]) : "",
        ustoza: r[8] ? String(r[8]) : "—",
        status: r[9] ? String(r[9]) : "Yangi"
      });
    }
    return bookings.reverse();
  }

  // 2. Aks holda oylik jadvallardan (matritsalardan) yig'ish
  const sheets = ss.getSheets();
  let counter = 1;
  for (let s = 0; s < sheets.length; s++){
    const sh = sheets[s];
    const sName = sh.getName();
    if (sName.indexOf(' — ') === -1) continue;
    const kursName = sName.split(' — ')[0].trim();

    const lastCol = sh.getLastColumn();
    const lastRow = sh.getLastRow();
    if (lastCol < 2 || lastRow < FIRST_TIME_ROW) continue;

    const dateHeaders = sh.getRange(HEADER_DATE_ROW, 2, 1, lastCol - 1).getValues()[0];
    const slots = COURSE_SLOTS[kursName] || [];
    const numRows = Math.min(slots.length, lastRow - FIRST_TIME_ROW + 1);
    const body = sh.getRange(FIRST_TIME_ROW, 2, numRows, lastCol - 1).getValues();

    for (let c = 0; c < dateHeaders.length; c++){
      const sanaStr = normalizeDateStr_(dateHeaders[c]);
      if (!sanaStr) continue;

      for (let r = 0; r < numRows; r++){
        const timeStr = slots[r];
        const entries = cellEntries_(body[r][c]);

        entries.forEach(line => {
          const parts = line.split('—').map(p => p.trim());
          const namePart = (parts[0] || '').split(' ');
          const ism = namePart[0] || '';
          const familiya = namePart.slice(1).join(' ') || '';
          const tel = parts[1] || '';
          const k = parts[2] || kursName;
          const u = parts[3] || '—';

          bookings.push({
            id: "m_" + (counter++),
            vaqt: sanaStr,
            ism: ism,
            familiya: familiya,
            telefon: tel,
            kurs: k,
            sana: sanaStr,
            vaqt_slot: timeStr,
            slot: sanaStr + " (" + timeStr + ")",
            kun: '',
            ustoza: u,
            status: "Yangi"
          });
        });
      }
    }
  }

  return bookings.reverse();
}

function doGet(e){
  SpreadsheetApp.flush();

  const params = e ? e.parameter : {};
  const action = params.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Admin panel va Sayt uchun hozirgi sozlamalarni olish
  if (action === 'get_config'){
    const configSheet = ss.getSheetByName("Sozlamalar");
    if (configSheet && configSheet.getLastRow() >= 1){
      try {
        const val = configSheet.getRange(1, 1).getValue();
        if (val) return jsonOutput_(JSON.parse(val));
      } catch (err){}
    }
    return jsonOutput_({
      courses: {
        "Arab tili - Harf":       { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: CAPACITIES["Arab tili - Harf"] || 4 },
        "Arab tili - Qoida":      { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: CAPACITIES["Arab tili - Qoida"] || 4 },
        "Arab tili - Amaliyot":   { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: CAPACITIES["Arab tili - Amaliyot"] || 4 },
        "Arab tili grammatikasi": { startHour: 9, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: 4 },
        "Ingliz tili":            { startHour: 9, startMin: 0, endHour: 12, endMin: 0, stepMin: 30, capacity: 1 },
        "Nurli Bolajon":          { startHour: 13, startMin: 0, endHour: 17, endMin: 0, stepMin: 30, capacity: CAPACITIES["Nurli Bolajon"] || 1 }
      },
      courseTeachers: COURSE_TEACHERS_,
      teacherSchedule: {
        "Nargiza Ustoza": { offDays: [0, 6], start: "08:00", end: "12:00" },
        "Fazilat Ustoza": { offDays: [0, 6], start: "09:00", end: "13:00" },
        "Muslima Ustoza": { offDays: [0, 1, 2, 3, 5, 6], start: "13:00", end: "17:00" }
      },
      holidayDates: [
        { date: "31.08.2026", title: "Mustaqillik kuni arafasi - dam olish" },
        { date: "01.09.2026", title: "Mustaqillik kuni" }
      ],
      courseExcludedDays: {
        "Nurli Bolajon": [0, 1, 2, 3, 5, 6]
      }
    });
  }

  // 2. Admin panel uchun arizalar ro'yxatini olish
  if (action === 'get_bookings'){
    return jsonOutput_(getAllBookings_(ss));
  }

  // 3. Mavjud vaqtlar (availability)
  if (action === 'availability'){
    const kurs = params.kurs;
    if (!kurs || !COURSE_SLOTS[kurs]) return jsonOutput_({ error: "kurs noto'g'ri yoki ko'rsatilmagan" });

    const monthKey = params.oy || currentMonthKey_();
    const sheetName = sheetNameFor_(kurs, monthKey);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonOutput_({});

    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    if (lastCol < 2 || lastRow < FIRST_TIME_ROW) return jsonOutput_({});

    const dateHeaders = sheet.getRange(HEADER_DATE_ROW, 2, 1, lastCol - 1).getValues()[0];
    const slots = COURSE_SLOTS[kurs];
    const numRows = Math.min(slots.length, lastRow - FIRST_TIME_ROW + 1);
    const body = sheet.getRange(FIRST_TIME_ROW, 2, numRows, lastCol - 1).getValues();

    const isTeacherCourse = TEACHER_COURSES_.indexOf(kurs) !== -1;
    const cap = CAPACITIES[kurs] || 4;

    const map = {};
    for (let c = 0; c < dateHeaders.length; c++){
      const sanaStr = normalizeDateStr_(dateHeaders[c]);
      if (!sanaStr) continue;
      for (let r = 0; r < numRows; r++){
        const entries = cellEntries_(body[r][c]);
        let count;
        if (isTeacherCourse){
          count = (COURSE_TEACHERS_[kurs] || TEACHERS_).filter(name => entries.filter(line => line.indexOf(name) !== -1).length >= cap).length;
        } else {
          count = entries.length;
        }
        if (count > 0){
          if (!map[sanaStr]) map[sanaStr] = {};
          map[sanaStr][slots[r]] = count;
        }
      }
    }

    return jsonOutput_(map);
  }

  // 4. Ustozalar bandligi
  if (action === 'ustozalar'){
    const kurs = params.kurs;
    const sana = params.sana;
    const vaqt = params.vaqt;

    if (!kurs || !COURSE_SLOTS[kurs] || !sana || !vaqt){
      return jsonOutput_({ error: "parametrlar noto'g'ri", counts: {}, capacity: 4 });
    }
    if (TEACHER_COURSES_.indexOf(kurs) === -1){
      return jsonOutput_({ counts: {}, capacity: 0 });
    }

    const counts = getTeacherCounts_(kurs, sana, vaqt);
    return jsonOutput_({ counts: counts, capacity: CAPACITIES[kurs] || 4 });
  }

  return jsonOutput_({ error: "Noma'lum action" });
}

function doPost(e){
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err){
    return jsonOutput_({ success: false, error: 'invalid_json' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Admin paneldan sozlamalarni saqlash
  if (data.action === 'save_config'){
    let configSheet = ss.getSheetByName("Sozlamalar");
    if (!configSheet){
      configSheet = ss.insertSheet("Sozlamalar");
    }
    configSheet.getRange(1, 1).setValue(JSON.stringify(data));
    SpreadsheetApp.flush();
    return jsonOutput_({ success: true, message: 'Config saved' });
  }

  // 2. Talaba ro'yxatdan o'tishi
  const kurs = (data.kurs || '').trim();
  const sana = (data.sana || '').trim();
  const vaqt = (data.vaqt || '').trim();
  const ism = (data.ism || '').trim();
  const familiya = (data.familiya || '').trim();
  const telefon = (data.telefon || '').trim();
  const ustoza = (data.ustoza || '').trim();

  if (!kurs || !sana || !vaqt || !ism || !familiya || !telefon){
    return jsonOutput_({ success: false, error: 'missing_fields' });
  }

  if (!CAPACITIES[kurs] || !COURSE_SLOTS[kurs]){
    return jsonOutput_({ success: false, error: 'unknown_course', kurs: kurs });
  }

  if (TEACHER_COURSES_.indexOf(kurs) !== -1){
    if (!ustoza || (COURSE_TEACHERS_[kurs] || []).indexOf(ustoza) === -1){
      return jsonOutput_({ success: false, error: 'missing_ustoza' });
    }
  }

  const timeRow = findTimeRow_(kurs, vaqt);
  if (!timeRow){
    return jsonOutput_({ success: false, error: 'unknown_time', vaqt: vaqt, kurs: kurs });
  }

  const monthKey = monthKeyFromDateStr_(sana);
  if (!monthKey){
    return jsonOutput_({ success: false, error: 'invalid_date', sana: sana });
  }

  const capacity = CAPACITIES[kurs];
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    let dowLabel = data.kun || '';
    if (!dowLabel){
      const parts = sana.split('.');
      if (parts.length === 3){
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const UZ_DAYS = ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
        dowLabel = UZ_DAYS[d.getDay()];
      }
    }

    // Kurslar bo'yicha matritsa jadvalga yozish
    const sheet = getOrCreateCourseSheet_(kurs, monthKey);
    const dateCol = getOrCreateDateColumn_(sheet, sana, dowLabel);
    const cell = sheet.getRange(timeRow, dateCol);

    const existingEntries = cellEntries_(cell.getValue());

    if (ustoza){
      const teacherCount = existingEntries.filter(line => line.indexOf(ustoza) !== -1).length;
      if (teacherCount >= capacity){
        return jsonOutput_({ success: false, error: 'full', kurs: kurs, sana: sana, vaqt: vaqt, ustoza: ustoza });
      }
    } else {
      if (existingEntries.length >= capacity){
        return jsonOutput_({ success: false, error: 'full', kurs: kurs, sana: sana, vaqt: vaqt });
      }
    }

    const newLine = ustoza
      ? \`\${ism} \${familiya} — \${telefon} — \${kurs} — \${ustoza}\`
      : \`\${ism} \${familiya} — \${telefon} — \${kurs}\`;
    existingEntries.push(newLine);
    cell.setValue(existingEntries.join('\\n'));
    cell.setWrap(true).setVerticalAlignment('top');

    // Shuningdek "Royxat" varag'iga ham tushirish (Admin panel oson ko'rishi uchun)
    try {
      let royxat = ss.getSheetByName("Royxat");
      if (!royxat){
        royxat = ss.insertSheet("Royxat");
        royxat.appendRow(["Vaqti", "Ism", "Familiya", "Telefon", "Kurs", "Sana", "Dars vaqti", "Kun", "Ustoza", "Status"]);
        royxat.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#F3F8F5");
        royxat.setFrozenRows(1);
      }
      royxat.appendRow([
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm"),
        ism,
        familiya,
        telefon,
        kurs,
        sana,
        vaqt,
        dowLabel,
        ustoza || "—",
        "Yangi"
      ]);
    } catch(rErr){}

    SpreadsheetApp.flush();

    try { updateStatistikaCharts(); } catch (chartErr) {}

    return jsonOutput_({ success: true });
  } catch (err){
    return jsonOutput_({
      success: false,
      error: 'exception',
      message: String(err && err.message ? err.message : err)
    });
  } finally {
    lock.releaseLock();
  }
}
`;
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('show');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('show');
  }

  openConfirmModal(title, msg, onOk) {
    this.confirmTitle.textContent = title;
    this.confirmMessage.textContent = msg;

    const handler = () => {
      onOk();
      this.closeModal('confirmModal');
      this.confirmOkBtn.removeEventListener('click', handler);
    };

    const cancelHandler = () => {
      this.closeModal('confirmModal');
      this.confirmOkBtn.removeEventListener('click', handler);
      this.confirmCancelBtn.removeEventListener('click', cancelHandler);
    };

    this.confirmOkBtn.addEventListener('click', handler);
    this.confirmCancelBtn.addEventListener('click', cancelHandler);

    this.openModal('confirmModal');
  }

  showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `<span>${isError ? '⚠️' : '✓'}</span><span>${msg}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

let adminApp;
document.addEventListener('DOMContentLoaded', () => {
  adminApp = new AdminApp();
});
