/**
 * ZIN-NUR AKADEMIYASI - TEACHER PORTAL LOGIC (teacher.js)
 * Version 3.5 (Full multi-language, Live Lesson Timer, Davomat, Student Profiles, Stats, i18n)
 */

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzk8hu77h_nGcUpnqe9aAPHtxX8LQrH4inmRkt1igiusHfcofkl0YeEniLsioYaBDc1/exec";

// Multi-language dictionary for Teacher Panel
const T_I18N = {
  uz: {
    portalTitle: "Teacher Panel",
    greeting: "Assalomu alaykum",
    subGreeting: "Bugungi darslaringiz va jadvalingiz.",
    loginTitle: "Ustozlar uchun kirish",
    loginSub: "ZIN-NUR Academy Teacher Panel",
    quickSelectTeacher: "Ustozani tanlang (Tezkor to'ldirish)",
    lblLogin: "Telefon raqami yoki Login",
    lblPin: "PIN-kod / Parol",
    btnEnter: "Kabinetga kirish",
    logout: "Chiqish",
    cancel: "Bekor qilish",
    
    // Nav
    navHome: "Bosh sahifa",
    navSchedule: "Mening jadvalim",
    navStudents: "O'quvchilarim",
    navCourses: "Kurslarim",
    navNotifs: "Bildirishnomalar",
    navProfile: "Profil",
    navStats: "Mening statistikalarim",
    
    // Stats
    statToday: "Bugungi darslar",
    statStudents: "O'quvchilar",
    statCourses: "Kurslar",
    statPending: "Kutilayotgan darslar",
    statCompletedLessons: "O'tkazilgan darslar",
    statActiveStudents: "Faol o'quvchilar",
    weeklyDistributionTitle: "Haftalik Darslar Taqsimoti",
    
    // Quick Actions
    quickActionsTitle: "⚡ Tezkor amallar",
    qaTodayScheduleTitle: "Bugungi jadval",
    qaTodayScheduleDesc: "Bugungi darslarni ko'rish",
    qaStudentsTitle: "O'quvchilar",
    qaStudentsDesc: "O'quvchilar ro'yxati",
    qaCoursesTitle: "Kurslar",
    qaCoursesDesc: "Biriktirilgan kurslar",
    qaNotifsTitle: "Bildirishnomalar",
    qaNotifsDesc: "Yangi xabarlarni ko'rish",
    
    // Lessons
    todayLessons: "📅 Bugungi darslar",
    openLesson: "Darsni ochish",
    startLesson: "Darsni boshlash",
    endLesson: "Darsni yakunlash",
    lessonOngoing: "🟢 Dars davom etmoqda",
    lessonEnded: "🔵 Dars yakunlandi",
    
    // Attendance
    davomatTitle: "Davomat",
    markAllPresent: "Barchasini kelgan deb belgilash",
    saveDavomat: "Davomatni saqlash",
    statusPresent: "Kelgan",
    statusAbsent: "Kelmagan",
    statusLate: "Kechikdi",
    
    // Student Profile
    studentInfo: "O'quvchi ma'lumotlari",
    attendanceRate: "Davomat ko'rsatkichi",
    internalNotes: "Izohlar",
    saveNote: "Izohni saqlash",
    
    // Profile
    profileHoursTitle: "Haftalik Ish vaqti",
    profileContactNotice: "Ushbu ma'lumotni o'zgartirish uchun administrator bilan bog'laning.",
    
    // Notifications
    markAllRead: "Barchasini o'qilgan deb belgilash",
    
    // Messages
    msgDavomatSaved: "Davomat muvaffaqiyatli saqlandi",
    msgNoteSaved: "Izoh saqlandi",
    msgLessonStarted: "Dars boshlandi!",
    msgLessonEnded: "Dars yakunlandi!"
  },
  ru: {
    portalTitle: "Панель Преподавателя",
    greeting: "Здравствуйте",
    subGreeting: "Ваши сегодняшние уроки и расписание.",
    loginTitle: "Вход для преподавателей",
    loginSub: "ZIN-NUR Academy Teacher Panel",
    quickSelectTeacher: "Выберите преподавателя (Быстрый выбор)",
    lblLogin: "Номер телефона или Логин",
    lblPin: "PIN-код / Пароль",
    btnEnter: "Войти в кабинет",
    logout: "Выйти",
    cancel: "Отмена",
    
    navHome: "Главная",
    navSchedule: "Мое расписание",
    navStudents: "Мои ученики",
    navCourses: "Мои курсы",
    navNotifs: "Уведомления",
    navProfile: "Профиль",
    navStats: "Моя статистика",
    
    statToday: "Уроки сегодня",
    statStudents: "Ученики",
    statCourses: "Курсы",
    statPending: "Ожидаемые уроки",
    statCompletedLessons: "Проведено уроков",
    statActiveStudents: "Активные ученики",
    weeklyDistributionTitle: "Распределение уроков по дням",
    
    quickActionsTitle: "⚡ Быстрые действия",
    qaTodayScheduleTitle: "Сегодняшнее расписание",
    qaTodayScheduleDesc: "Посмотреть уроки на сегодня",
    qaStudentsTitle: "Ученики",
    qaStudentsDesc: "Список ваших учеников",
    qaCoursesTitle: "Курсы",
    qaCoursesDesc: "Назначенные курсы",
    qaNotifsTitle: "Уведомления",
    qaNotifsDesc: "Посмотреть новые сообщения",
    
    todayLessons: "📅 Сегодняшние уроки",
    openLesson: "Открыть урок",
    startLesson: "Начать урок",
    endLesson: "Завершить урок",
    lessonOngoing: "🟢 Урок продолжается",
    lessonEnded: "🔵 Урок завершен",
    
    davomatTitle: "Посещаемость",
    markAllPresent: "Отметить всех как присутствующих",
    saveDavomat: "Сохранить посещаемость",
    statusPresent: "Пришел",
    statusAbsent: "Отсутствует",
    statusLate: "Опоздал",
    
    studentInfo: "Информация об ученике",
    attendanceRate: "Показатель посещаемости",
    internalNotes: "Заметки",
    saveNote: "Сохранить заметку",
    
    profileHoursTitle: "Рабочие часы по дням",
    profileContactNotice: "Для изменения этих данных свяжитесь с администратором.",
    
    markAllRead: "Отметить все как прочитанные",
    
    msgDavomatSaved: "Посещаемость сохранена",
    msgNoteSaved: "Заметка сохранена",
    msgLessonStarted: "Урок начался!",
    msgLessonEnded: "Урок завершен!"
  },
  en: {
    portalTitle: "Teacher Panel",
    greeting: "Welcome",
    subGreeting: "Your lessons and schedule for today.",
    loginTitle: "Teacher Sign In",
    loginSub: "ZIN-NUR Academy Teacher Panel",
    quickSelectTeacher: "Select Teacher (Quick Fill)",
    lblLogin: "Phone Number or Login",
    lblPin: "PIN Code / Password",
    btnEnter: "Sign In",
    logout: "Logout",
    cancel: "Cancel",
    
    navHome: "Dashboard",
    navSchedule: "My Schedule",
    navStudents: "My Students",
    navCourses: "My Courses",
    navNotifs: "Notifications",
    navProfile: "Profile",
    navStats: "My Statistics",
    
    statToday: "Today's Lessons",
    statStudents: "Students",
    statCourses: "Courses",
    statPending: "Pending Lessons",
    statCompletedLessons: "Completed Lessons",
    statActiveStudents: "Active Students",
    weeklyDistributionTitle: "Weekly Lesson Distribution",
    
    quickActionsTitle: "⚡ Quick Actions",
    qaTodayScheduleTitle: "Today's Schedule",
    qaTodayScheduleDesc: "View today's active classes",
    qaStudentsTitle: "Students",
    qaStudentsDesc: "My student roster",
    qaCoursesTitle: "Courses",
    qaCoursesDesc: "Assigned course catalog",
    qaNotifsTitle: "Notifications",
    qaNotifsDesc: "View latest announcements",
    
    todayLessons: "📅 Today's Lessons",
    openLesson: "Open Lesson",
    startLesson: "Start Lesson",
    endLesson: "End Lesson",
    lessonOngoing: "🟢 Lesson in progress",
    lessonEnded: "🔵 Lesson completed",
    
    davomatTitle: "Attendance",
    markAllPresent: "Mark all as present",
    saveDavomat: "Save Attendance",
    statusPresent: "Present",
    statusAbsent: "Absent",
    statusLate: "Late",
    
    studentInfo: "Student Information",
    attendanceRate: "Attendance Rate",
    internalNotes: "Internal Notes",
    saveNote: "Save Note",
    
    profileHoursTitle: "Weekly Working Hours",
    profileContactNotice: "Please contact administrator to change these details.",
    
    markAllRead: "Mark all as read",
    
    msgDavomatSaved: "Attendance saved successfully",
    msgNoteSaved: "Note saved",
    msgLessonStarted: "Lesson started!",
    msgLessonEnded: "Lesson completed!"
  }
};

const DAY_NAMES_MAP = {
  0: { uz: "Yakshanba", ru: "Воскресенье", en: "Sunday" },
  1: { uz: "Dushanba", ru: "Понедельник", en: "Monday" },
  2: { uz: "Seshanba", ru: "Вторник", en: "Tuesday" },
  3: { uz: "Chorshanba", ru: "Среда", en: "Wednesday" },
  4: { uz: "Payshanba", ru: "Четверг", en: "Thursday" },
  5: { uz: "Juma", ru: "Пятница", en: "Friday" },
  6: { uz: "Shanba", ru: "Суббота", en: "Saturday" }
};

const UZ_OPERATOR_PREFIXES = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '77', '50', '55', '70', '71', '72', '73', '74', '75', '76', '78', '79', '20'];

function cleanPhoneDigits(val) {
  if (!val) return '';
  let str = String(val).trim();
  
  // 1. Remove explicit '+998'
  str = str.replace(/\+998\s*/g, '');
  
  let digits = str.replace(/\D/g, '');
  
  // 2. If 12 digits or more starting with '998' (e.g. 998901234567 or 998998521454)
  if (digits.length >= 12 && digits.startsWith('998')) {
    digits = digits.substring(3);
  }
  // 3. If user typed/pasted '998' country code followed by operator code (e.g. 99890..., 99897..., 99899..., 99888...)
  else if (digits.length >= 5 && digits.startsWith('998')) {
    const nextTwo = digits.substring(3, 5);
    if (UZ_OPERATOR_PREFIXES.includes(nextTwo) && digits.length >= 10) {
      digits = digits.substring(3);
    } else if (digits.length > 9) {
      digits = digits.substring(3);
    }
  }
  
  return digits.slice(0, 9);
}

function formatPhoneNumber(val) {
  if (!val) return '+998 ';
  
  // If user entered text login (letters like abubakir, admin, teacher)
  const cleanVal = String(val).replace(/\+998\s*/g, '').trim();
  if (/[a-zA-Zа-яА-ЯёЁ_]/.test(cleanVal)) {
    return cleanVal;
  }
  
  let digits = cleanPhoneDigits(val);
  if (digits.length === 0) return '+998 ';
  let res = '+998';
  if (digits.length > 0) res += ' ' + digits.substring(0, 2);
  if (digits.length > 2) res += ' ' + digits.substring(2, 5);
  if (digits.length > 5) res += ' ' + digits.substring(5, 7);
  if (digits.length > 7) res += ' ' + digits.substring(7, 9);
  return res;
}

class TeacherApp {
  constructor() {
    window.teacherApp = this;
    this.lang = localStorage.getItem('zn_teacher_lang') || 'uz';
    this.session = this.loadSession();
    this.config = this.loadAdminConfig();
    this.bookings = this.loadBookings();
    this.attendance = this.loadAttendance();
    this.notes = this.loadNotes();
    this.notifications = this.loadNotifications();
    
    this.currentTeacher = null;
    this.activeLesson = null;
    this.timerInterval = null;
    this.timerSeconds = 0;
    this.scheduleViewMode = 'day';
    
    this.initElements();
    this.bindEvents();
    this.applyLanguage(this.lang);
    this.populateQuickTeacherSelect();
    
    if (this.session) {
      this.currentTeacher = this.getTeacherBySession(this.session);
      if (this.currentTeacher) {
        this.showDashboard();
      } else {
        this.showLogin();
      }
    } else {
      this.showLogin();
    }

    this.refreshConfigFromSheets();
  }

  mergeConfigs(localCfg, remoteCfg) {
    if (!remoteCfg || typeof remoteCfg !== 'object') return localCfg;
    if (!localCfg || typeof localCfg !== 'object') return remoteCfg;

    const merged = { ...localCfg };
    const deletedSet = new Set(Array.isArray(localCfg.deletedTeachers) ? localCfg.deletedTeachers : []);
    if (Array.isArray(remoteCfg.deletedTeachers)) {
      remoteCfg.deletedTeachers.forEach(d => deletedSet.add(d));
    }
    
    // Merge teachers: local teachers take precedence (preserves newly created admin teachers)
    const localTeachers = Array.isArray(localCfg.teachers) ? localCfg.teachers : [];
    const remoteTeachers = Array.isArray(remoteCfg.teachers) ? remoteCfg.teachers : [];
    
    const isDeleted = (t) => {
      if (!t) return true;
      if (t.id && deletedSet.has(t.id)) return true;
      const cleanDigits = cleanPhoneDigits(t.phone || t.login);
      if (cleanDigits && deletedSet.has(cleanDigits)) return true;
      const cleanName = (t.name || '').trim().toLowerCase();
      if (cleanName && deletedSet.has(cleanName)) return true;
      return false;
    };

    const teacherMap = new Map();
    remoteTeachers.forEach(t => {
      if (t && (t.id || t.name || t.phone || t.login) && !isDeleted(t)) {
        const key = cleanPhoneDigits(t.phone || t.login) || (t.name || '').trim().toLowerCase() || t.id;
        if (key) teacherMap.set(key, t);
      }
    });
    localTeachers.forEach(t => {
      if (t && (t.id || t.name || t.phone || t.login) && !isDeleted(t)) {
        const key = cleanPhoneDigits(t.phone || t.login) || (t.name || '').trim().toLowerCase() || t.id;
        if (key) teacherMap.set(key, { ...(teacherMap.get(key) || {}), ...t });
      }
    });
    merged.teachers = Array.from(teacherMap.values());
    merged.deletedTeachers = Array.from(deletedSet);

    // Merge courses
    const localCourses = Array.isArray(localCfg.courses) ? localCfg.courses : [];
    const remoteCourses = Array.isArray(remoteCfg.courses) ? remoteCfg.courses : [];
    const courseMap = new Map();
    remoteCourses.forEach(c => {
      if (c && c.name) courseMap.set(c.name.trim().toLowerCase(), c);
    });
    localCourses.forEach(c => {
      if (c && c.name) courseMap.set(c.name.trim().toLowerCase(), { ...(courseMap.get(c.name.trim().toLowerCase()) || {}), ...c });
    });
    merged.courses = Array.from(courseMap.values());
    merged.scriptUrl = localCfg.scriptUrl || remoteCfg.scriptUrl || DEFAULT_SCRIPT_URL;

    return merged;
  }

  populateQuickTeacherSelect() {
    const select = document.getElementById('quickTeacherSelect');
    if (!select) return;
    select.innerHTML = `<option value="">-- ${this.lang === 'ru' ? 'Выберите преподавателя (автозаполнение)' : (this.lang === 'en' ? 'Select teacher (auto-fill)' : 'Ustozani tanlang (avtomatik to\'ldirish)')} --</option>`;
    const teachers = Array.isArray(this.config?.teachers) ? this.config.teachers : [];
    teachers.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      const formattedPhone = formatPhoneNumber(t.phone || t.login);
      opt.innerText = `${t.name} (${formattedPhone} / PIN: ${t.pin})`;
      select.appendChild(opt);
    });

    select.onchange = () => {
      const selectedId = select.value;
      if (!selectedId) return;
      const t = teachers.find(item => item.id === selectedId);
      if (t) {
        const loginInp = document.getElementById('loginUsername');
        const pinInp = document.getElementById('loginPassword');
        if (loginInp) loginInp.value = formatPhoneNumber(t.phone || t.login || t.name);
        if (pinInp) pinInp.value = t.pin || '';
        const errBox = document.getElementById('loginErrorMsg');
        if (errBox) errBox.style.display = 'none';
        if (loginInp) loginInp.classList.remove('input-error');
        if (pinInp) pinInp.classList.remove('input-error');
      }
    };
  }

  async refreshConfigFromSheets() {
    try {
      let remoteConfig = null;

      // 1. Try /api/sync
      try {
        const res = await fetch('/api/sync?action=getConfig');
        if (res.ok) {
          const json = await res.json();
          if (json && json.config && Array.isArray(json.config.teachers)) {
            remoteConfig = json.config;
          }
        }
      } catch(e) {}

      // 2. Try Google Script directly
      if (!remoteConfig) {
        const scriptUrl = (this.config && this.config.scriptUrl) || DEFAULT_SCRIPT_URL;
        const res2 = await fetch(`${scriptUrl}?action=getConfig`);
        if (res2.ok) {
          const text = await res2.text();
          if (text && (text.startsWith('{') || text.startsWith('['))) {
            const json = JSON.parse(text);
            if (json && json.config && Array.isArray(json.config.teachers)) {
              remoteConfig = json.config;
            }
          }
        }
      }

      if (remoteConfig) {
        this.config = this.mergeConfigs(this.config, remoteConfig);
        localStorage.setItem('zn_admin_config', JSON.stringify(this.config));
        this.populateQuickTeacherSelect();
        if (this.session && !this.currentTeacher) {
          this.currentTeacher = this.getTeacherBySession(this.session);
          if (this.currentTeacher) this.showDashboard();
        }
      }
    } catch (e) {
      // Offline or local mode
    }
  }

  loadSession() {
    try {
      const saved = localStorage.getItem('zn_teacher_session');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  }

  normalizePhoneOrLogin(val) {
    if (!val) return '';
    const cleanDigits = cleanPhoneDigits(val);
    if (cleanDigits && cleanDigits.length >= 7) return cleanDigits;
    return String(val).trim().toLowerCase().replace(/[\s\-\+\(\)]/g, '');
  }

  isTeacherDeleted(t) {
    if (!t) return true;
    const deletedList = (this.config && Array.isArray(this.config.deletedTeachers)) ? this.config.deletedTeachers : [];
    let extraDeleted = [];
    try {
      const d1 = JSON.parse(localStorage.getItem('zn_admin_deleted_teachers') || '[]');
      if (Array.isArray(d1)) extraDeleted.push(...d1);
      const d2 = (JSON.parse(localStorage.getItem('zn_admin_config_uchtepa') || '{}')).deletedTeachers || [];
      if (Array.isArray(d2)) extraDeleted.push(...d2);
      const d3 = (JSON.parse(localStorage.getItem('zn_admin_config_sergeli') || '{}')).deletedTeachers || [];
      if (Array.isArray(d3)) extraDeleted.push(...d3);
    } catch(e) {}
    const deletedSet = new Set([...deletedList, ...extraDeleted]);

    if (t.id && deletedSet.has(t.id)) return true;
    const cleanDigits = cleanPhoneDigits(t.phone || t.login);
    if (cleanDigits && (deletedSet.has(cleanDigits) || deletedSet.has(String(t.phone).trim()) || deletedSet.has(String(t.login).trim()))) return true;
    const cleanName = (t.name || '').trim().toLowerCase();
    if (cleanName && deletedSet.has(cleanName)) return true;
    return false;
  }

  loadAdminConfig() {
    try {
      const defaultTeachers = [
        { id: "t_xadija", name: "Xadija ustoz", login: "+998 92 022 87 40", phone: "+998 92 022 87 40", pin: "2318", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"], startTime: "09:00", endTime: "17:00", daysOff: [] },
        { id: "t_abubakir", name: "Abubakir Ustoz", login: "+998 90 033 51 02", phone: "+998 90 033 51 02", pin: "0802", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot", "Arab tili grammatikasi", "Ingliz tili", "Nurli Bolajon"], startTime: "08:00", endTime: "18:00", daysOff: [] },
        { id: "t1", name: "Fotima Ustoza", login: "+998 90 987 65 43", phone: "+998 90 987 65 43", pin: "4821", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot", "Nurli Bolajon"], startTime: "08:00", endTime: "17:00", daysOff: [0] },
        { id: "t2", name: "Mubina Ustoza", login: "+998 93 111 22 33", phone: "+998 93 111 22 33", pin: "7193", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot", "Nurli Bolajon"], startTime: "09:00", endTime: "17:00", daysOff: [] },
        { id: "t3", name: "Madina Ustoza", login: "+998 94 222 33 44", phone: "+998 94 222 33 44", pin: "3305", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"], startTime: "08:00", endTime: "12:00", daysOff: [0, 6] },
        { id: "t4", name: "Samira ustoza", login: "+998 97 333 44 55", phone: "+998 97 333 44 55", pin: "9244", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"], startTime: "09:00", endTime: "17:00", daysOff: [4] },
        { id: "t5", name: "Saida Ustoza", login: "+998 99 444 55 66", phone: "+998 99 444 55 66", pin: "6182", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"], startTime: "09:00", endTime: "12:00", daysOff: [4] },
        { id: "t6", name: "Muslima Ustoza", login: "+998 91 555 66 77", phone: "+998 91 555 66 77", pin: "5519", courses: ["Arab tili grammatikasi"], startTime: "09:00", endTime: "17:00", daysOff: [0] },
        { id: "t7", name: "Mohinur Ustoza", login: "+998 98 666 77 88", phone: "+998 98 666 77 88", pin: "8407", courses: ["Ingliz tili"], startTime: "09:00", endTime: "12:00", daysOff: [] }
      ];

      const defaultCourses = [
        { id: "c1", name: "Arab tili - Harf", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4 },
        { id: "c2", name: "Arab tili - Qoida", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4 },
        { id: "c3", name: "Arab tili - Amaliyot", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4 },
        { id: "c4", name: "Arab tili grammatikasi", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4 },
        { id: "c5", name: "Ingliz tili", startTime: "09:00", endTime: "12:00", slotDuration: 30, capacity: 1 },
        { id: "c6", name: "Nurli Bolajon", startTime: "14:00", endTime: "16:00", slotDuration: 30, capacity: 1 }
      ];

      const saved = localStorage.getItem('zn_admin_config_uchtepa') || localStorage.getItem('zn_admin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (!Array.isArray(parsed.deletedTeachers)) {
            parsed.deletedTeachers = [];
          }
          if (Array.isArray(parsed.teachers)) {
            // Filter out deleted teachers
            parsed.teachers = parsed.teachers.filter(t => !this.isTeacherDeleted(t));
          } else {
            parsed.teachers = defaultTeachers.filter(t => !this.isTeacherDeleted(t));
          }
          if (!Array.isArray(parsed.courses) || parsed.courses.length === 0) {
            parsed.courses = defaultCourses;
          }
          return parsed;
        }
      }
      return {
        teachers: defaultTeachers.filter(t => !this.isTeacherDeleted(t)),
        courses: defaultCourses,
        deletedTeachers: []
      };
    } catch(e) { return { teachers: [], courses: [], deletedTeachers: [] }; }
  }

  loadBookings() {
    try {
      const saved = localStorage.getItem('zn_bookings');
      return saved ? JSON.parse(saved) : [
        { id: "b1", studentName: "Malika Sharipova", phone: "+998 90 123 45 67", courseName: "Arab tili - Harf", teacherName: "Fotima Ustoza", date: this.getTodayDate(), time: "09:00", status: "Kutilmoqda" },
        { id: "b2", studentName: "Dilnoza Alimova", phone: "+998 93 456 78 90", courseName: "Arab tili - Harf", teacherName: "Fotima Ustoza", date: this.getTodayDate(), time: "10:30", status: "Tasdiqlangan" }
      ];
    } catch(e) { return []; }
  }

  loadAttendance() {
    try {
      const saved = localStorage.getItem('zn_attendance');
      return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
  }

  loadNotes() {
    try {
      const saved = localStorage.getItem('zn_student_notes');
      return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
  }

  loadNotifications() {
    try {
      const saved = localStorage.getItem('zn_notifications');
      return saved ? JSON.parse(saved) : [
        { id: "n1", teacherName: "Fotima Ustoza", title: "Yangi dars belgilandi", message: "Bugun soat 09:00 da Arab tili - Harf darsi rejalashtirilgan.", date: "25.09.2026", read: false },
        { id: "n2", teacherName: "Fotima Ustoza", title: "Yangi o'quvchi qo'shildi", message: "Malika Sharipova guruhingizga qabul qilindi.", date: "25.09.2026", read: false }
      ];
    } catch(e) { return []; }
  }

  getTodayDate() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  }

  getTeacherBySession(session) {
    if (!session) return null;
    this.config = this.loadAdminConfig();
    if (!this.config || !Array.isArray(this.config.teachers)) return null;
    const found = this.config.teachers.find(t => 
      (session.id && t.id === session.id) ||
      (t.login && this.normalizePhoneOrLogin(t.login) === this.normalizePhoneOrLogin(session.login)) ||
      (t.phone && this.normalizePhoneOrLogin(t.phone) === this.normalizePhoneOrLogin(session.login)) ||
      (t.login && t.login.trim().toLowerCase() === (session.login || '').trim().toLowerCase()) ||
      (t.name && t.name.trim().toLowerCase() === (session.name || '').trim().toLowerCase())
    );
    if (!found || this.isTeacherDeleted(found)) {
      localStorage.removeItem('zn_teacher_session');
      return null;
    }
    return found;
  }

  initElements() {
    this.loginScreen = document.getElementById('loginScreen');
    this.teacherApp = document.getElementById('teacherApp');
    this.loginForm = document.getElementById('teacherLoginForm');
    this.btnToggleTeacherPass = document.getElementById('btnToggleTeacherPass');
    this.loginPasswordInput = document.getElementById('loginPassword');
    this.btnTeacherSubmit = document.getElementById('btnTeacherSubmit');
    this.loginErrorMsg = document.getElementById('loginErrorMsg');
    
    this.sidebar = document.getElementById('teacherSidebar');
    this.btnToggleTeacherSidebar = document.getElementById('btnToggleTeacherSidebar');
    this.langBtns = document.querySelectorAll('.lang-btn');
    this.navItems = document.querySelectorAll('.teacher-sidebar .nav-item');
    this.pageViews = document.querySelectorAll('.page-view');
    this.btnLogout = document.getElementById('btnLogout');
    
    // Header
    this.headerAvatar = document.getElementById('headerAvatar');
    this.headerGreetingText = document.getElementById('headerGreetingText');
    this.notifUnreadBadge = document.getElementById('notifUnreadBadge');
    this.headerNotifDot = document.getElementById('headerNotifDot');
    
    // Dashboard stats
    this.statTodayLessons = document.getElementById('statTodayLessons');
    this.statTotalStudents = document.getElementById('statTotalStudents');
    this.statCoursesCount = document.getElementById('statCoursesCount');
    this.statPendingCount = document.getElementById('statPendingCount');
    
    // Filters
    this.teacherScheduleCourseFilter = document.getElementById('teacherScheduleCourseFilter');
    this.teacherScheduleStatusFilter = document.getElementById('teacherScheduleStatusFilter');
    this.teacherStudentSearch = document.getElementById('teacherStudentSearch');
    this.teacherStudentCourseFilter = document.getElementById('teacherStudentCourseFilter');
    
    // Modals
    this.modalLesson = document.getElementById('modalLesson');
    this.modalStudent = document.getElementById('modalStudent');
    this.modalCourseDetail = document.getElementById('modalCourseDetail');
  }

  bindEvents() {
    this.setupPhoneMask(document.getElementById('loginUsername'));

    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (this.btnToggleTeacherPass && this.loginPasswordInput) {
      this.btnToggleTeacherPass.addEventListener('click', () => {
        const isPass = this.loginPasswordInput.type === 'password';
        this.loginPasswordInput.type = isPass ? 'text' : 'password';
        this.btnToggleTeacherPass.innerText = isPass ? '🙈' : '👁️';
      });
    }

    if (this.loginPasswordInput) {
      this.loginPasswordInput.addEventListener('input', () => {
        this.loginPasswordInput.classList.remove('input-error');
        const loginInp = document.getElementById('loginUsername');
        if (loginInp) loginInp.classList.remove('input-error');
        const errBox = document.getElementById('loginErrorMsg');
        if (errBox) errBox.style.display = 'none';
      });
    }

    if (this.btnToggleTeacherSidebar) {
      this.btnToggleTeacherSidebar.addEventListener('click', () => {
        this.sidebar.classList.toggle('active');
      });
    }

    this.langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedLang = e.currentTarget.dataset.lang;
        this.applyLanguage(selectedLang);
      });
    });

    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
        if (window.innerWidth <= 992 && this.sidebar) {
          this.sidebar.classList.remove('active');
        }
      });
    });

    if (this.btnLogout) {
      this.btnLogout.addEventListener('click', () => this.handleLogout());
    }

    // Filters
    [this.teacherScheduleCourseFilter, this.teacherScheduleStatusFilter].forEach(el => {
      if (el) el.addEventListener('change', () => this.renderSchedule());
    });
    [this.teacherStudentSearch, this.teacherStudentCourseFilter].forEach(el => {
      if (el) el.addEventListener('input', () => this.renderStudents());
    });

    document.querySelectorAll('.modal-close-btn, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });
  }

  showLogin() {
    this.loginScreen.style.display = 'flex';
    this.teacherApp.style.display = 'none';
  }

  showDashboard() {
    try {
      if (this.loginScreen) this.loginScreen.style.display = 'none';
      if (this.teacherApp) this.teacherApp.style.display = 'flex';
      
      if (this.currentTeacher) {
        if (this.headerAvatar) this.headerAvatar.innerText = (this.currentTeacher.name || 'U')[0];
        if (this.headerGreetingText) {
          const greeting = (T_I18N[this.lang] && T_I18N[this.lang].greeting) || 'Assalomu alaykum';
          this.headerGreetingText.innerText = `${greeting}, ${this.currentTeacher.name}! 👋`;
        }
      }

      this.renderAll();
    } catch(err) {
      console.error("Dashboard error", err);
    }
  }

  matchPin(savedPin, inputPin) {
    const p1 = String(savedPin ?? '').trim();
    const p2 = String(inputPin ?? '').trim();
    if (!p1 || !p2) return false;
    if (p1 === p2) return true;
    if (p1.padStart(4, '0') === p2.padStart(4, '0')) return true;
    if (!isNaN(p1) && !isNaN(p2) && Number(p1) === Number(p2)) return true;
    return false;
  }

  matchPhoneOrLogin(teacher, input) {
    if (!teacher || !input) return false;
    const rawInput = String(input).trim().toLowerCase();
    const inputClean = cleanPhoneDigits(rawInput);

    const tLogin = String(teacher.login || '').trim().toLowerCase();
    const tPhone = String(teacher.phone || '').trim().toLowerCase();
    const tName = String(teacher.name || '').trim().toLowerCase();

    // 1. Direct match
    if (tLogin === rawInput || tPhone === rawInput || tName === rawInput) return true;

    // 2. Clean digits match
    const tLoginClean = cleanPhoneDigits(tLogin);
    const tPhoneClean = cleanPhoneDigits(tPhone);

    if (inputClean && inputClean.length >= 5) {
      if (tLoginClean && (tLoginClean === inputClean || tLoginClean.endsWith(inputClean) || inputClean.endsWith(tLoginClean))) return true;
      if (tPhoneClean && (tPhoneClean === inputClean || tPhoneClean.endsWith(inputClean) || inputClean.endsWith(tPhoneClean))) return true;
    }

    // 3. Name match
    if (rawInput.length >= 3) {
      if (tName.includes(rawInput) || rawInput.includes(tName)) return true;
      if (tLogin.includes(rawInput) || rawInput.includes(tLogin)) return true;
    }

    return false;
  }

  setupPhoneMask(inputEl) {
    if (!inputEl) return;

    const applyMask = () => {
      const cur = inputEl.value;
      const cleanVal = String(cur).replace(/\+998\s*/g, '').trim();
      if (/[a-zA-Zа-яА-ЯёЁ_]/.test(cleanVal)) {
        inputEl.value = cleanVal;
        return;
      }
      inputEl.value = formatPhoneNumber(cur);
      inputEl.classList.remove('input-error');
      const errBox = document.getElementById('loginErrorMsg');
      if (errBox) errBox.style.display = 'none';
    };

    if (!inputEl.value || !inputEl.value.startsWith('+998')) {
      inputEl.value = inputEl.value ? formatPhoneNumber(inputEl.value) : '+998 ';
    } else {
      inputEl.value = formatPhoneNumber(inputEl.value);
    }

    inputEl.addEventListener('focus', () => {
      if (!inputEl.value || inputEl.value.trim() === '' || inputEl.value.trim() === '+' || inputEl.value.trim() === '+998') {
        inputEl.value = '+998 ';
      }
      setTimeout(() => {
        try {
          if (inputEl.selectionStart < 5 && inputEl.value.startsWith('+998 ')) {
            inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
          }
        } catch(e) {}
      }, 10);
    });

    inputEl.addEventListener('input', applyMask);

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (inputEl.selectionStart !== inputEl.selectionEnd) {
          setTimeout(applyMask, 0);
          return;
        }
        if (inputEl.value === '+998 ' || inputEl.value === '+998') {
          inputEl.value = '';
          e.preventDefault();
        }
      }
    });
  }

  async handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (this._isLoggingIn) return;
    this._isLoggingIn = true;

    try {
      this.config = this.loadAdminConfig();
      const loginInput = document.getElementById('loginUsername');
      const pinInput = document.getElementById('loginPassword');
      const errBox = document.getElementById('loginErrorMsg');
      const card = document.querySelector('.login-card');
      const rawLogin = loginInput ? loginInput.value.trim() : '';
      const pin = pinInput ? pinInput.value.trim() : '';

      if (errBox) errBox.style.display = 'none';
      if (loginInput) loginInput.classList.remove('input-error');
      if (pinInput) pinInput.classList.remove('input-error');

      if (!rawLogin || rawLogin === '+998' || rawLogin === '+998 ' || !pin) {
        if (errBox) {
          const msg = this.lang === 'ru' 
            ? "Пожалуйста, введите номер телефона/логин и PIN-код!"
            : (this.lang === 'en' ? "Please enter phone number/login and PIN code!" : "Iltimos, telefon raqami va PIN-kodni kiriting!");
          errBox.innerHTML = `<div style="font-weight:700;">⚠️ ${msg}</div>`;
          errBox.style.display = 'block';
        }
        if (card) {
          card.classList.remove('shake-error');
          void card.offsetWidth;
          card.classList.add('shake-error');
        }
        if (!rawLogin || rawLogin === '+998' || rawLogin === '+998 ') loginInput?.classList.add('input-error');
        if (!pin) pinInput?.classList.add('input-error');
        this.showToast(this.lang === 'ru' ? "Заполните все поля!" : "Barcha maydonlarni to'ldiring!", "error");
        return;
      }
      
      const findTeacher = () => {
        const configTeachers = Array.isArray(this.config.teachers) ? this.config.teachers : [];
        const fallbackTeachers = [
          { id: "t_xadija", name: "Xadija ustoz", login: "+998 92 022 87 40", phone: "+998 92 022 87 40", pin: "2318", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"], startTime: "09:00", endTime: "17:00", daysOff: [] },
          { id: "t_abubakir", name: "Abubakir Ustoz", login: "+998 90 033 51 02", phone: "+998 90 033 51 02", pin: "0802", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot", "Arab tili grammatikasi", "Ingliz tili", "Nurli Bolajon"], startTime: "08:00", endTime: "18:00", daysOff: [] }
        ];
        const allTeachers = [...configTeachers, ...fallbackTeachers].filter(t => !this.isTeacherDeleted(t));
        return allTeachers.find(t => {
          const pinOk = this.matchPin(t.pin, pin);
          if (!pinOk) return false;
          return this.matchPhoneOrLogin(t, rawLogin);
        });
      };

      let teacher = findTeacher();

      // If not found in local memory, try quick fetching latest config from Google Sheets / API
      if (!teacher) {
        try {
          let remoteConfig = null;

          // 1. Try serverless /api/sync
          try {
            const res = await fetch('/api/sync?action=getConfig');
            if (res.ok) {
              const json = await res.json();
              if (json && json.config && Array.isArray(json.config.teachers)) {
                remoteConfig = json.config;
              }
            }
          } catch(e) {}

          // 2. Try direct Google Script with timeout
          if (!remoteConfig) {
            const scriptUrl = (this.config && this.config.scriptUrl) || DEFAULT_SCRIPT_URL;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(`${scriptUrl}?action=getConfig`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
              const text = await res.text();
              if (text && (text.startsWith('{') || text.startsWith('['))) {
                const json = JSON.parse(text);
                if (json && json.config && Array.isArray(json.config.teachers)) {
                  remoteConfig = json.config;
                }
              }
            }
          }

          if (remoteConfig) {
            this.config = this.mergeConfigs(this.config, remoteConfig);
            localStorage.setItem('zn_admin_config', JSON.stringify(this.config));
            this.populateQuickTeacherSelect();
            teacher = findTeacher();
          }
        } catch (err) {
          // Network error or timeout, proceed to local feedback
        }
      }
      
      if (teacher) {
        if (errBox) errBox.style.display = 'none';
        if (loginInput) loginInput.classList.remove('input-error');
        if (pinInput) pinInput.classList.remove('input-error');
        this.currentTeacher = teacher;
        this.session = { id: teacher.id, login: teacher.login, phone: teacher.phone, name: teacher.name, pin: teacher.pin };
        localStorage.setItem('zn_teacher_session', JSON.stringify(this.session));
        this.showDashboard();
        this.showToast(`${teacher.name}, Xush kelibsiz!`, 'success');
      } else {
        if (errBox) {
          const errTitle = this.lang === 'ru'
            ? "❌ Неправильный логин или пароль!"
            : (this.lang === 'en' ? "❌ Incorrect phone number or PIN code!" : "❌ Telefon raqami yoki PIN-kod noto'g'ri!");
          const errSub = this.lang === 'ru'
            ? "Проверьте правильность введенного номера/логина и 4-значного PIN-кода."
            : (this.lang === 'en' ? "Please verify your credentials and try again." : "Kiritilgan telefon raqami yoki PIN-kodni qaytadan tekshirib ko'ring.");
          errBox.innerHTML = `
            <div style="font-weight:700; margin-bottom:4px; font-size:0.95rem;">${errTitle}</div>
            <div style="font-size:0.82rem; font-weight:normal; opacity:0.9;">${errSub}</div>
          `;
          errBox.style.display = 'block';
        }
        if (card) {
          card.classList.remove('shake-error');
          void card.offsetWidth;
          card.classList.add('shake-error');
        }
        if (loginInput) loginInput.classList.add('input-error');
        if (pinInput) pinInput.classList.add('input-error');
        this.showToast(this.lang === 'ru' ? "Неправильный логин или пароль!" : "Telefon raqami yoki PIN-kod noto'g'ri!", 'error');
      }
    } finally {
      this._isLoggingIn = false;
    }
  }

  handleLogout() {
    this.currentTeacher = null;
    this.session = null;
    localStorage.removeItem('zn_teacher_session');
    this.showLogin();
  }

  applyLanguage(lang) {
    this.lang = lang;
    localStorage.setItem('zn_teacher_lang', lang);
    
    this.langBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (T_I18N[lang] && T_I18N[lang][key]) {
        el.innerText = T_I18N[lang][key];
      }
    });

    if (this.currentTeacher && this.headerGreetingText) {
      this.headerGreetingText.innerText = `${T_I18N[this.lang].greeting}, ${this.currentTeacher.name}! 👋`;
    }

    this.renderAll();
  }

  switchTab(tabId) {
    this.navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));
    this.pageViews.forEach(view => view.classList.toggle('active', view.id === `view-${tabId}`));
  }

  setScheduleViewMode(mode) {
    this.scheduleViewMode = mode;
    const btns = document.querySelectorAll('#scheduleViewSwitcher button');
    btns.forEach(b => b.classList.toggle('active', b.dataset.view === mode));
    this.renderSchedule();
  }

  renderAll() {
    if (!this.currentTeacher) return;
    try { this.renderDashboardStats(); } catch(e) { console.warn("renderDashboardStats error", e); }
    try { this.renderTodayLessons(); } catch(e) { console.warn("renderTodayLessons error", e); }
    try { this.populateFilterDropdowns(); } catch(e) { console.warn("populateFilterDropdowns error", e); }
    try { this.renderSchedule(); } catch(e) { console.warn("renderSchedule error", e); }
    try { this.renderStudents(); } catch(e) { console.warn("renderStudents error", e); }
    try { this.renderCourses(); } catch(e) { console.warn("renderCourses error", e); }
    try { this.renderNotifications(); } catch(e) { console.warn("renderNotifications error", e); }
    try { this.renderProfile(); } catch(e) { console.warn("renderProfile error", e); }
    try { this.renderTeacherStats(); } catch(e) { console.warn("renderTeacherStats error", e); }
  }

  // Teacher-scoped data getter
  getTeacherBookings() {
    if (!this.currentTeacher) return [];
    return this.bookings.filter(b => b.teacherName === this.currentTeacher.name);
  }

  populateFilterDropdowns() {
    const courses = this.currentTeacher.courses || [];
    if (this.teacherScheduleCourseFilter) {
      const current = this.teacherScheduleCourseFilter.value;
      this.teacherScheduleCourseFilter.innerHTML = '<option value="">Barcha kurslar</option>';
      courses.forEach(c => {
        this.teacherScheduleCourseFilter.innerHTML += `<option value="${c}" ${current === c ? 'selected' : ''}>${c}</option>`;
      });
    }
    if (this.teacherStudentCourseFilter) {
      const current = this.teacherStudentCourseFilter.value;
      this.teacherStudentCourseFilter.innerHTML = '<option value="">Barcha kurslar</option>';
      courses.forEach(c => {
        this.teacherStudentCourseFilter.innerHTML += `<option value="${c}" ${current === c ? 'selected' : ''}>${c}</option>`;
      });
    }
  }

  renderDashboardStats() {
    const teacherBookings = this.getTeacherBookings();
    const today = this.getTodayDate();
    const todayLessons = teacherBookings.filter(b => b.date === today);
    const uniqueStudents = new Set(teacherBookings.map(b => b.studentName));
    const pendingLessons = teacherBookings.filter(b => b.status === 'Kutilmoqda');

    if (this.statTodayLessons) this.statTodayLessons.innerText = todayLessons.length;
    if (this.statTotalStudents) this.statTotalStudents.innerText = uniqueStudents.size;
    if (this.statCoursesCount) this.statCoursesCount.innerText = (this.currentTeacher.courses || []).length;
    if (this.statPendingCount) this.statPendingCount.innerText = pendingLessons.length;
  }

  renderTodayLessons() {
    const container = document.getElementById('todayLessonsContainer');
    if (!container) return;
    container.innerHTML = '';

    const today = this.getTodayDate();
    const lessons = this.getTeacherBookings().filter(b => b.date === today);

    if (lessons.length === 0) {
      container.innerHTML = `<div style="padding:28px; text-align:center; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-color); grid-column:1/-1;">Bugun darslar mavjud emas.</div>`;
      return;
    }

    lessons.forEach(l => {
      let statusBadgeClass = 'badge-warning';
      if (l.status === 'Tasdiqlangan') statusBadgeClass = 'badge-success';
      if (l.status === 'Yakunlangan') statusBadgeClass = 'badge-info';
      if (l.status === 'Bekor qilingan') statusBadgeClass = 'badge-danger';

      const card = document.createElement('div');
      card.className = 'lesson-card';
      card.innerHTML = `
        <div class="lesson-card-header">
          <span class="lesson-time">🕐 ${l.time}</span>
          <span class="badge ${statusBadgeClass}">${l.status}</span>
        </div>
        <div class="lesson-title">📚 ${l.courseName}</div>
        <div class="lesson-meta">
          <span>👥 Guruh: Asosiy guruh</span>
          <span>👨‍🎓 O'quvchi: <strong>${l.studentName}</strong></span>
          <span>📞 Tel: ${l.phone}</span>
        </div>
        <button type="button" class="btn btn-primary" style="margin-top:12px; width:100%;" onclick="teacherApp.openLessonModal('${l.id}')">
          ${T_I18N[this.lang].openLesson}
        </button>
      `;
      container.appendChild(card);
    });
  }

  openLessonModal(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    this.activeLesson = booking;
    document.getElementById('lessonModalTitle').innerText = `${booking.courseName} (${booking.time})`;
    document.getElementById('lessonModalInfo').innerText = `Sana: ${booking.date} | Talaba: ${booking.studentName} | Tel: ${booking.phone}`;
    
    // Live status indicator
    const statusContainer = document.getElementById('lessonLiveStatusBadge');
    if (statusContainer) {
      statusContainer.innerHTML = `<span class="badge ${booking.status === 'Yakunlangan' ? 'badge-info' : 'badge-success'}">${booking.status}</span>`;
    }

    // Render Davomat table
    const davomatBody = document.getElementById('davomatTableBody');
    davomatBody.innerHTML = '';

    const currentStatus = this.attendance[booking.id] || 'Kelgan';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${booking.studentName}</strong><br><small style="color:var(--text-muted);">${booking.phone}</small></td>
      <td>
        <div class="davomat-pill-group">
          <button type="button" class="davomat-pill kelgan ${currentStatus === 'Kelgan' ? 'active' : ''}" onclick="teacherApp.setStudentDavomat('${booking.id}', 'Kelgan', this)">🟢 Kelgan</button>
          <button type="button" class="davomat-pill kelmagan ${currentStatus === 'Kelmagan' ? 'active' : ''}" onclick="teacherApp.setStudentDavomat('${booking.id}', 'Kelmagan', this)">🔴 Kelmagan</button>
          <button type="button" class="davomat-pill kechikdi ${currentStatus === 'Kechikdi' ? 'active' : ''}" onclick="teacherApp.setStudentDavomat('${booking.id}', 'Kechikdi', this)">🟡 Kechikdi</button>
        </div>
      </td>
    `;
    davomatBody.appendChild(tr);

    this.modalLesson.classList.add('active');
  }

  setStudentDavomat(bookingId, status, btn) {
    this.attendance[bookingId] = status;
    localStorage.setItem('zn_attendance', JSON.stringify(this.attendance));
    
    const parent = btn.parentNode;
    parent.querySelectorAll('.davomat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  markAllPresentInModal() {
    if (!this.activeLesson) return;
    this.attendance[this.activeLesson.id] = 'Kelgan';
    localStorage.setItem('zn_attendance', JSON.stringify(this.attendance));
    
    document.querySelectorAll('#davomatTableBody .davomat-pill').forEach(b => {
      b.classList.toggle('active', b.classList.contains('kelgan'));
    });
    this.showToast(T_I18N[this.lang].markAllPresent, 'info');
  }

  saveDavomatFromModal() {
    this.showToast(T_I18N[this.lang].msgDavomatSaved, 'success');
    this.closeAllModals();
    this.renderTeacherStats();
  }

  startLiveLesson() {
    this.timerSeconds = 0;
    const timerElem = document.getElementById('liveTimerDisplay');
    if (timerElem) timerElem.style.display = 'block';
    
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const hrs = String(Math.floor(this.timerSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((this.timerSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(this.timerSeconds % 60).padStart(2, '0');
      if (timerElem) timerElem.innerText = `${hrs}:${mins}:${secs}`;
    }, 1000);

    const statusBadge = document.getElementById('lessonLiveStatusBadge');
    if (statusBadge) {
      statusBadge.innerHTML = `<span class="badge badge-success">${T_I18N[this.lang].lessonOngoing}</span>`;
    }

    this.showToast(T_I18N[this.lang].msgLessonStarted, 'info');
  }

  endLiveLesson() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerElem = document.getElementById('liveTimerDisplay');
    if (timerElem) {
      timerElem.innerText = '00:00:00';
      timerElem.style.display = 'none';
    }
    
    if (this.activeLesson) {
      this.activeLesson.status = 'Yakunlangan';
      localStorage.setItem('zn_bookings', JSON.stringify(this.bookings));
    }

    const statusBadge = document.getElementById('lessonLiveStatusBadge');
    if (statusBadge) {
      statusBadge.innerHTML = `<span class="badge badge-info">${T_I18N[this.lang].lessonEnded}</span>`;
    }
    
    this.closeAllModals();
    this.renderAll();
    this.showToast(T_I18N[this.lang].msgLessonEnded, 'success');
  }

  renderSchedule() {
    const container = document.getElementById('scheduleListContainer');
    if (!container) return;
    container.innerHTML = '';

    const courseFilter = this.teacherScheduleCourseFilter?.value || '';
    const statusFilter = this.teacherScheduleStatusFilter?.value || '';

    const teacherBookings = this.getTeacherBookings().filter(b => {
      if (courseFilter && b.courseName !== courseFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      return true;
    });

    if (teacherBookings.length === 0) {
      container.innerHTML = `<div style="padding:28px; text-align:center; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-color);">Hozircha darslar jadvali mavjud emas.</div>`;
      return;
    }

    teacherBookings.forEach(b => {
      let statusBadgeClass = 'badge-warning';
      if (b.status === 'Tasdiqlangan') statusBadgeClass = 'badge-success';
      if (b.status === 'Yakunlangan') statusBadgeClass = 'badge-info';
      if (b.status === 'Bekor qilingan') statusBadgeClass = 'badge-danger';

      const item = document.createElement('div');
      item.className = 'lesson-card';
      item.style.marginBottom = '12px';
      item.innerHTML = `
        <div class="lesson-card-header">
          <span><strong>📅 ${b.date}</strong> | 🕐 ${b.time}</span>
          <span class="badge ${statusBadgeClass}">${b.status}</span>
        </div>
        <div style="font-size:1.1rem; font-weight:700; margin: 6px 0;">📚 ${b.courseName}</div>
        <div style="font-size:0.9rem; color:var(--text-soft); margin-bottom:12px;">
          👨‍🎓 Talaba: <strong>${b.studentName}</strong> (${b.phone})
        </div>
        <button type="button" class="btn btn-secondary" style="font-size:0.85rem;" onclick="teacherApp.openLessonModal('${b.id}')">
          ${T_I18N[this.lang].openLesson}
        </button>
      `;
      container.appendChild(item);
    });
  }

  renderStudents() {
    const container = document.getElementById('studentsListContainer');
    if (!container) return;
    container.innerHTML = '';

    const query = (this.teacherStudentSearch?.value || '').toLowerCase();
    const courseFilter = this.teacherStudentCourseFilter?.value || '';

    const teacherBookings = this.getTeacherBookings();
    const studentsMap = {};
    teacherBookings.forEach(b => {
      if (query && !b.studentName.toLowerCase().includes(query) && !b.phone.includes(query)) return;
      if (courseFilter && b.courseName !== courseFilter) return;
      studentsMap[b.studentName] = b;
    });

    const studentNames = Object.keys(studentsMap);
    if (studentNames.length === 0) {
      container.innerHTML = `<div style="padding:28px; text-align:center; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-color); grid-column:1/-1;">Biriktirilgan o'quvchilar mavjud emas.</div>`;
      return;
    }

    studentNames.forEach(name => {
      const b = studentsMap[name];
      const card = document.createElement('div');
      card.className = 'lesson-card';
      card.innerHTML = `
        <div class="lesson-title">👨‍🎓 ${b.studentName}</div>
        <div class="lesson-meta">
          <span>📚 Kurs: <strong>${b.courseName}</strong></span>
          <span>📞 Telefon: <a href="tel:${b.phone}" style="color:var(--primary); text-decoration:none;">${b.phone}</a></span>
        </div>
        <button type="button" class="btn btn-secondary" style="margin-top:12px; width:100%;" onclick="teacherApp.openStudentModal('${b.studentName}')">
          Profilni ko'rish
        </button>
      `;
      container.appendChild(card);
    });
  }

  openStudentModal(studentName) {
    const booking = this.bookings.find(b => b.studentName === studentName);
    if (!booking) return;

    document.getElementById('studentModalName').innerText = booking.studentName;
    document.getElementById('studentModalPhone').innerText = booking.phone;
    document.getElementById('studentModalCourse').innerText = booking.courseName;

    const noteInput = document.getElementById('studentNoteInput');
    noteInput.value = this.notes[studentName] || '';

    const btnSaveNote = document.getElementById('btnSaveStudentNote');
    btnSaveNote.onclick = () => {
      this.notes[studentName] = noteInput.value.trim();
      localStorage.setItem('zn_student_notes', JSON.stringify(this.notes));
      this.showToast(T_I18N[this.lang].msgNoteSaved, 'success');
      this.closeAllModals();
    };

    this.modalStudent.classList.add('active');
  }

  renderCourses() {
    const container = document.getElementById('teacherCoursesContainer');
    if (!container) return;
    container.innerHTML = '';

    const courses = this.currentTeacher.courses || [];
    if (courses.length === 0) {
      container.innerHTML = `<div style="padding:28px; text-align:center; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-color); grid-column:1/-1;">Sizga biriktirilgan kurslar mavjud emas.</div>`;
      return;
    }

    courses.forEach(cName => {
      const courseObj = this.config.courses.find(c => c.name === cName) || { startTime: "09:00", endTime: "17:00", capacity: 4 };
      const teacherBookings = this.getTeacherBookings().filter(b => b.courseName === cName);
      const uniqueStudents = new Set(teacherBookings.map(b => b.studentName)).size;

      const card = document.createElement('div');
      card.className = 'lesson-card';
      card.innerHTML = `
        <div class="lesson-title">📚 ${cName}</div>
        <div class="lesson-meta">
          <span>🕐 Dars vaqti: ${courseObj.startTime} — ${courseObj.endTime}</span>
          <span>👥 Guruh sig'imi: ${courseObj.capacity} kishi</span>
          <span>👨‍🎓 Talabalar: <strong>${uniqueStudents} ta o'quvchi</strong></span>
        </div>
        <button type="button" class="btn btn-secondary" style="margin-top:12px; width:100%;" onclick="teacherApp.openCourseDetailModal('${cName}')">
          Kursni ochish
        </button>
      `;
      container.appendChild(card);
    });
  }

  openCourseDetailModal(courseName) {
    const courseObj = this.config.courses.find(c => c.name === courseName) || { startTime: "09:00", endTime: "17:00", capacity: 4 };
    document.getElementById('courseDetailTitle').innerText = courseName;
    document.getElementById('courseDetailTime').innerText = `${courseObj.startTime} — ${courseObj.endTime}`;
    document.getElementById('courseDetailCapacity').innerText = `${courseObj.capacity} kishi`;

    const studentsListContainer = document.getElementById('courseDetailStudentsList');
    const students = this.getTeacherBookings().filter(b => b.courseName === courseName);
    
    if (students.length === 0) {
      studentsListContainer.innerHTML = '<p style="color:var(--text-muted);">Bu kursda hozircha o\'quvchilar yo\'q.</p>';
    } else {
      studentsListContainer.innerHTML = students.map(s => `
        <div style="padding:8px 0; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between;">
          <span>👨‍🎓 ${s.studentName}</span>
          <span style="color:var(--text-muted);">${s.phone}</span>
        </div>
      `).join('');
    }

    this.modalCourseDetail.classList.add('active');
  }

  renderNotifications() {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    container.innerHTML = '';

    const teacherNotifs = this.notifications.filter(n => n.teacherName === this.currentTeacher.name);
    const unreadCount = teacherNotifs.filter(n => !n.read).length;

    if (this.notifUnreadBadge) {
      this.notifUnreadBadge.innerText = unreadCount;
      this.notifUnreadBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    if (this.headerNotifDot) {
      this.headerNotifDot.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    if (teacherNotifs.length === 0) {
      container.innerHTML = `<div style="padding:28px; text-align:center; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-color);">Yangi bildirishnomalar yo'q.</div>`;
      return;
    }

    teacherNotifs.forEach(n => {
      const item = document.createElement('div');
      item.className = 'lesson-card';
      item.style.marginBottom = '12px';
      item.style.borderLeft = n.read ? '1px solid var(--border-color)' : '4px solid var(--primary)';
      item.innerHTML = `
        <div class="lesson-card-header">
          <div class="lesson-title">🔔 ${n.title}</div>
          <span class="badge ${n.read ? 'badge-info' : 'badge-success'}">${n.read ? 'O\'qilgan' : 'Yangi'}</span>
        </div>
        <p style="font-size:0.92rem; color:var(--text-soft); margin: 6px 0;">${n.message}</p>
        <small style="color:var(--text-muted);">${n.date}</small>
      `;
      container.appendChild(item);
    });
  }

  markAllNotifsRead() {
    this.notifications.forEach(n => {
      if (n.teacherName === this.currentTeacher.name) {
        n.read = true;
      }
    });
    localStorage.setItem('zn_notifications', JSON.stringify(this.notifications));
    this.renderNotifications();
    this.showToast(T_I18N[this.lang].markAllRead, 'success');
  }

  renderProfile() {
    if (!this.currentTeacher) return;
    document.getElementById('profName').innerText = this.currentTeacher.name;
    document.getElementById('profAvatar').innerText = (this.currentTeacher.name || 'U')[0];
    document.getElementById('profLogin').innerText = this.currentTeacher.login;
    document.getElementById('profHours').innerText = `${this.currentTeacher.startTime || '09:00'} — ${this.currentTeacher.endTime || '17:00'}`;
    
    const courseCount = (this.currentTeacher.courses || []).length;
    document.getElementById('profCoursesBadge').innerText = `${courseCount} ta kurs`;

    // Weekly schedule table
    const weeklyBody = document.getElementById('profWeeklyScheduleBody');
    if (weeklyBody) {
      weeklyBody.innerHTML = '';
      const daysOff = this.currentTeacher.daysOff || [];
      const dailyHours = this.currentTeacher.dailyHours || {};
      
      [1, 2, 3, 4, 5, 6, 0].forEach(d => {
        let isDayOff = daysOff.includes(d);
        let start = this.currentTeacher.startTime || "09:00";
        let end = this.currentTeacher.endTime || "17:00";

        if (dailyHours[d]) {
          isDayOff = !dailyHours[d].isWork;
          if (dailyHours[d].start) start = dailyHours[d].start;
          if (dailyHours[d].end) end = dailyHours[d].end;
        }

        const tr = document.createElement('tr');
        const dayLabel = (DAY_NAMES_MAP[d] && DAY_NAMES_MAP[d][this.lang]) || `Day ${d}`;
        const dayOffText = this.lang === 'ru' ? 'Выходной' : (this.lang === 'en' ? 'Day off' : 'Dam olish kuni');
        const workDayText = this.lang === 'ru' ? 'Рабочий день' : (this.lang === 'en' ? 'Working day' : 'Ish kuni');

        tr.innerHTML = `
          <td><strong>${dayLabel}</strong></td>
          <td>${isDayOff ? '—' : `${start} — ${end}`}</td>
          <td>
            <span class="badge ${isDayOff ? 'badge-warning' : 'badge-success'}">
              ${isDayOff ? dayOffText : workDayText}
            </span>
          </td>
        `;
        weeklyBody.appendChild(tr);
      });
    }
  }

  renderTeacherStats() {
    const teacherBookings = this.getTeacherBookings();
    const completed = teacherBookings.filter(b => b.status === 'Yakunlangan').length;
    const uniqueStudents = new Set(teacherBookings.map(b => b.studentName)).size;
    const total = teacherBookings.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;

    const completedElem = document.getElementById('statCompletedLessonsCount');
    const studentsElem = document.getElementById('statActiveStudentsCount');
    const rateElem = document.getElementById('attendanceRateDisplay');
    
    if (completedElem) completedElem.innerText = completed;
    if (studentsElem) studentsElem.innerText = uniqueStudents;
    if (rateElem) rateElem.innerText = `${rate}%`;

    // Render Weekly Distribution Chart
    const chartContainer = document.getElementById('weeklyChartContainer');
    if (chartContainer) {
      chartContainer.innerHTML = '';
      const days = [
        { label: 'Du', count: 4 },
        { label: 'Se', count: 6 },
        { label: 'Chor', count: 5 },
        { label: 'Pay', count: 3 },
        { label: 'Jum', count: 7 },
        { label: 'Shan', count: 4 }
      ];

      const max = Math.max(...days.map(d => d.count), 1);
      days.forEach(d => {
        const heightPct = Math.round((d.count / max) * 100);
        const barWrapper = document.createElement('div');
        barWrapper.style.display = 'flex';
        barWrapper.style.flexDirection = 'column';
        barWrapper.style.alignItems = 'center';
        barWrapper.style.gap = '8px';
        barWrapper.style.flex = '1';
        barWrapper.innerHTML = `
          <div style="font-size:0.8rem; font-weight:700; color:var(--primary);">${d.count}</div>
          <div style="width:28px; height:${heightPct}px; background:var(--primary); border-radius:6px; opacity:0.85;"></div>
          <div style="font-size:0.85rem; font-weight:600; color:var(--text-soft);">${d.label}</div>
        `;
        chartContainer.appendChild(barWrapper);
      });
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

function initTeacherApp() {
  if (!window.teacherApp || !(window.teacherApp instanceof TeacherApp)) {
    window.teacherApp = new TeacherApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTeacherApp);
} else {
  initTeacherApp();
}
