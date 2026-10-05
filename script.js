// ==========================================================================
// ZIN-NUR AKADEMIYASI - ASOSIY SAYT SCRIPTI (AUTO-SYNC ONLINE)
// ==========================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzk8hu77h_nGcUpnqe9aAPHtxX8LQrH4inmRkt1igiusHfcofkl0YeEniLsioYaBDc1/exec";

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

function setupPhoneMask(inputEl) {
  if (!inputEl) return;
  
  const applyMask = () => {
    const cur = inputEl.value;
    const cleanVal = String(cur).replace(/\+998\s*/g, '').trim();
    if (/[a-zA-Zа-яА-ЯёЁ_]/.test(cleanVal)) {
      inputEl.value = cleanVal;
      return;
    }
    inputEl.value = formatPhoneNumber(cur);
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

function buildSlots(startHour, startMin, endHour, endMin, stepMin){
  const slots = [];
  let h = startHour, m = startMin;
  while (h < endHour || (h === endHour && m <= endMin)){
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    m += stepMin;
    if (m >= 60){ m -= 60; h += 1; }
  }
  return slots;
}

// Dynamic data loader from localStorage (Boshqaruv Markazi bilan real vaqtda sinxronlash)
function loadDynamicConfig() {
  try {
    const isSergeli = window.location.hostname.includes('ser') || window.location.pathname.includes('/sergeli');
    const districtKey = isSergeli ? 'sergeli' : 'uchtepa';
    const savedConfig = localStorage.getItem(`zn_admin_config_${districtKey}`) || localStorage.getItem('zn_admin_config');
    const savedHolidays = localStorage.getItem(`zn_holidays_${districtKey}`) || localStorage.getItem('zn_holidays');
    
    let config = savedConfig ? JSON.parse(savedConfig) : null;
    let holidays = savedHolidays ? JSON.parse(savedHolidays) : null;

    if (config && (config.courses || config.teachers)) {
      const coursesObj = {};
      const excludedObj = {};
      const teachersObj = {};
      const scheduleObj = {};
      const deletedList = Array.isArray(config.deletedTeachers) ? config.deletedTeachers : [];

      if (Array.isArray(config.teachers)) {
        config.teachers.forEach(t => {
          const clean = cleanPhoneDigits(t.phone || t.login);
          const nameKey = (t.name || '').trim().toLowerCase();
          if (deletedList.includes(t.id) || deletedList.includes(nameKey) || (clean && deletedList.includes(clean))) {
            return;
          }

          scheduleObj[t.name] = {
            offDays: t.daysOff || [],
            start: t.startTime || "09:00",
            end: t.endTime || "17:00",
            dailyHours: t.dailyHours || null
          };
          (t.courses || []).forEach(cName => {
            if (!teachersObj[cName]) teachersObj[cName] = [];
            if (!teachersObj[cName].includes(t.name)) teachersObj[cName].push(t.name);
          });
        });
      }

      if (Array.isArray(config.courses)) {
        config.courses.forEach(c => {
          if (c.active !== false) {
            let sH = 9, sM = 0, eH = 17, eM = 0;
            if (c.startTime) {
              const p = c.startTime.split(':').map(Number);
              sH = p[0]; sM = p[1] || 0;
            }
            if (c.endTime) {
              const p = c.endTime.split(':').map(Number);
              eH = p[0]; eM = p[1] || 0;
            }

            // Auto-expand course slot window if assigned teacher works outside
            const assigned = teachersObj[c.name] || [];
            assigned.forEach(tName => {
              const tSched = scheduleObj[tName];
              if (tSched) {
                if (tSched.end) {
                  const ep = tSched.end.split(':').map(Number);
                  if (ep[0] > eH || (ep[0] === eH && (ep[1] || 0) > eM)) {
                    eH = ep[0];
                    eM = ep[1] || 0;
                  }
                }
                if (tSched.dailyHours) {
                  Object.values(tSched.dailyHours).forEach(dh => {
                    if (dh.isWork && dh.end) {
                      const ep = dh.end.split(':').map(Number);
                      if (ep[0] > eH || (ep[0] === eH && (ep[1] || 0) > eM)) {
                        eH = ep[0];
                        eM = ep[1] || 0;
                      }
                    }
                  });
                }
              }
            });

            coursesObj[c.name] = {
              slots: buildSlots(sH, sM, eH, eM, c.slotDuration || 30),
              capacity: c.capacity || 4
            };
            if (c.excludedDays && c.excludedDays.length > 0) {
              excludedObj[c.name] = c.excludedDays;
            }
          }
        });
      }

      const holidayList = holidays ? holidays.map(h => typeof h === 'string' ? h : h.date) : ["31.08.2026", "01.09.2026"];

      return {
        courses: Object.keys(coursesObj).length > 0 ? coursesObj : null,
        excludedDays: excludedObj,
        holidayDates: holidayList,
        courseTeachers: teachersObj,
        teacherSchedule: scheduleObj
      };
    }
  } catch (e) {
    console.warn("Could not load dynamic config, falling back to defaults", e);
  }

  // Defaults fallback
  return {
    courses: {
      "Arab tili - Harf":       { slots: buildSlots(9,0,17,0,30), capacity: 4 },
      "Arab tili - Qoida":      { slots: buildSlots(9,0,17,0,30), capacity: 4 },
      "Arab tili - Amaliyot":   { slots: buildSlots(9,0,17,0,30), capacity: 4 },
      "Arab tili grammatikasi": { slots: buildSlots(9,0,17,0,30), capacity: 4 },
      "Ingliz tili":            { slots: buildSlots(9,0,12,0,30), capacity: 1 },
      "Nurli Bolajon":          { slots: buildSlots(14,0,16,0,30), capacity: 1 }
    },
    excludedDays: { "Nurli Bolajon": [0, 6] },
    holidayDates: ["31.08.2026", "01.09.2026"],
    courseTeachers: {
      "Arab tili - Harf": ["Fotima Ustoza", "Mubina Ustoza", "Madina Ustoza", "Samira ustoza", "Saida Ustoza"],
      "Arab tili - Qoida": ["Fotima Ustoza", "Mubina Ustoza", "Madina Ustoza", "Samira ustoza", "Saida Ustoza"],
      "Arab tili - Amaliyot": ["Fotima Ustoza", "Mubina Ustoza", "Madina Ustoza", "Samira ustoza", "Saida Ustoza"],
      "Arab tili grammatikasi": ["Muslima Ustoza"],
      "Ingliz tili": ["Mohinur Ustoza"],
      "Nurli Bolajon": ["Fotima Ustoza", "Mubina Ustoza"]
    },
    teacherSchedule: {
      "Muslima Ustoza": { offDays: [0],    start: "09:00", end: "17:00" },
      "Saida Ustoza":    { offDays: [4],    start: "09:00", end: "12:00" },
      "Samira ustoza":   { offDays: [4],    start: "09:00", end: "17:00" },
      "Fotima Ustoza":   { offDays: [0],    start: "08:00", end: "17:00" },
      "Madina Ustoza":   { offDays: [0, 6], start: "08:00", end: "12:00" },
      "Mubina Ustoza":   { offDays: [],     start: "09:00", end: "17:00" },
      "Mohinur Ustoza":  { offDays: [],     start: "09:00", end: "12:00" }
    }
  };
}

const DYNAMIC_CFG = loadDynamicConfig();
const COURSES = DYNAMIC_CFG.courses;
const COURSE_EXCLUDED_DAYS = DYNAMIC_CFG.excludedDays;
const HOLIDAY_DATES = DYNAMIC_CFG.holidayDates;
const COURSE_TEACHERS = DYNAMIC_CFG.courseTeachers;
const TEACHER_SCHEDULE = DYNAMIC_CFG.teacherSchedule;

function isHolidayDate(date){
  return HOLIDAY_DATES.indexOf(formatDateValue(date)) !== -1;
}

let TEACHER_COURSES = Object.keys(COURSE_TEACHERS).filter(k => (COURSE_TEACHERS[k] || []).length > 0);

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

  if (schedule.dailyHours && schedule.dailyHours[dow]) {
    const dayConfig = schedule.dailyHours[dow];
    if (!dayConfig.isWork) return false;
    if (time && dayConfig.start && dayConfig.end) {
      const tm = timeToMinutes(time);
      if (tm < timeToMinutes(dayConfig.start) || tm > timeToMinutes(dayConfig.end)) return false;
    }
    return true;
  }

  if (schedule.offDays && schedule.offDays.indexOf(dow) !== -1) return false;
  if (time && schedule.start && schedule.end){
    const tm = timeToMinutes(time);
    if (tm < timeToMinutes(schedule.start) || tm > timeToMinutes(schedule.end)) return false;
  }
  return true;
}

const DOW_FULL = {
  uz: ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],
  ru: ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"],
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
};
const DOW_SHORT = {
  uz: ["Yak","Dush","Sesh","Chor","Pay","Jum","Shan"],
  ru: ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
};

function formatDateValue(d){
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}
function formatDateShort(d){
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
}
function sameDate(a, b){
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function injectHolidayStyles(){
  if (document.getElementById('znHolidayStyles')) return;
  const style = document.createElement('style');
  style.id = 'znHolidayStyles';
  style.textContent = `
    .tt-cell.is-holiday{ background:#FDEDEC !important; color:#C43E38 !important; cursor:not-allowed !important; }
    .tt-head.is-holiday{ background:#FDEDEC !important; }
    .tt-head.is-holiday .dnum{ color:#C43E38 !important; }
    .tt-head.is-holiday .dow{ color:#C43E38 !important; }
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const inlineError = document.getElementById('inlineError');

  const inputIsm = document.getElementById('ism');
  const inputFamiliya = document.getElementById('familiya');
  const inputTelefon = document.getElementById('telefon');

  const successModal = document.getElementById('successModal');
  const modalClose = document.getElementById('modalClose');
  const modalOkBtn = document.getElementById('modalOkBtn');

  const errorToast = document.getElementById('errorToast');
  const toastText = document.getElementById('toastText');

  const kursField = document.querySelector('[data-dd="kurs"]');
  const kursTrigger = document.querySelector('[data-dd-trigger="kurs"]');
  const kursValueEl = document.querySelector('[data-dd-value="kurs"]');
  const kursPanel = document.querySelector('[data-dd-panel="kurs"]');
  const kursHidden = document.getElementById('kurs');

  const ttPlaceholder = document.getElementById('ttPlaceholder');
  const ttWrapper = document.getElementById('ttWrapper');
  const ttGrid = document.getElementById('ttGrid');
  const weekPrev = document.getElementById('weekPrev');
  const weekNext = document.getElementById('weekNext');
  const weekLabel = document.getElementById('weekLabel');
  const selectedInfo = document.getElementById('selectedInfo');
  const selectedInfoText = document.getElementById('selectedInfoText');
  const clearSlotBtn = document.getElementById('clearSlot');
  const slotField = document.querySelector('[data-field="slot"]');
  const sanaHidden = document.getElementById('sana');
  const vaqtHidden = document.getElementById('vaqt');

  const ustozaStepLabel = document.getElementById('ustozaStepLabel');
  const ustozaBlock = document.getElementById('ustozaBlock');
  const ustozaOptions = document.getElementById('ustozaOptions');
  const ustozaHidden = document.getElementById('ustoza');
  const ustozaField = document.querySelector('[data-field="ustoza"]');

  let toastTimer = null;
  let currentLang = 'uz';
  let selectedKurs = '';
  let weekOffset = 0;
  let availabilityMap = {};
  let selectedDate = null;
  let selectedTime = null;
  let availabilityRequestId = 0;

  let selectedUstoza = null;
  let teacherCounts = {};
  let teacherCapacity = 4;
  let ustozaRequestId = 0;

  const translations = {
    uz: {
      eyebrow: "Bepul konsultatsiya",
      titleLine1: "Yordamchi ustoz bilan",
      titleAccent: " mashg'ulotlarga",
      titleLine2: "yoziling",
      subtitle: "Kursingizni tanlang va yordamchi ustozimiz siz bilan tez orada bog'lanadi.",
      stepCourse: "Kursni tanlang",
      stepSlot: "Sana va vaqtni tanlang",
      stepDetails: "Ma'lumotlaringiz",
      stepUstoza: "Ustozani tanlang",
      ttPlaceholder: "Avval kursni tanlang",
      weekPrev: "Oldingi",
      weekNext: "Keyingi",
      lgFree: "Bo'sh",
      lgPartial: "Qisman band",
      lgFull: "To'liq band",
      lgSelected: "Tanlangan",
      clearSlot: "Bekor qilish ✕",
      fullTag: "To'liq",
      availableTag: "bo'sh",
      selectedPrefix: "Tanlangan:",
      labelIsm: "Ism", errIsm: "Ismingizni kiriting",
      labelFamiliya: "Familiya", errFamiliya: "Familiyangizni kiriting",
      labelTelefon: "Telefon raqami", errTelefon: "To'g'ri telefon raqam kiriting",
      labelKurs: "Kurs", errKurs: "Iltimos, kursni tanlang",
      errSlot: "Iltimos, jadvaldan bo'sh vaqt tanlang",
      errUstoza: "Iltimos, ustozani tanlang",
      noUstozaAvailable: "Bu kun/vaqtda ishlaydigan ustoza yo'q. Iltimos, boshqa vaqtni tanlang.",
      holidayTag: "Bayram",
      holidayLabel: "Dam olish kuni",
      btnSubmit: "Yuborish",
      modalTitle: "Rahmat!",
      modalText: "Rahmat! Siz muvaffaqiyatli ro'yxatdan o'tdingiz. Iltimos belgilangan vaqtdan kechga qolmang.",
      modalBtn: "Tushunarli",
      errGeneric: "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
      errNetwork: "Xatolik yuz berdi. Internet aloqasini tekshirib, qaytadan urinib ko'ring.",
      errFull: "Bu vaqt allaqachon band qilingan. Iltimos boshqa vaqtni tanlang.",
      errTeacherTaken: "Bu ustoza shu vaqtga allaqachon band qilingan. Iltimos boshqa ustozani tanlang.",
      errValidate: "Iltimos, barcha majburiy (*) maydonlarni to'g'ri to'ldiring."
    },
    ru: {
      eyebrow: "Бесплатная консультация",
      titleLine1: "Запишитесь",
      titleAccent: " на занятия",
      titleLine2: "с помощником-преподавателем",
      subtitle: "Спасибо! Вы успешно зарегистрировались. Пожалуйста, не опаздывайте к назначенному времени.",
      stepCourse: "Выберите курс",
      stepSlot: "Выберите дату и время",
      stepDetails: "Ваши данные",
      stepUstoza: "Выберите преподавателя",
      ttPlaceholder: "Сначала выберите курс",
      weekPrev: "Назад",
      weekNext: "Вперёд",
      lgFree: "Свободно",
      lgPartial: "Частично занято",
      lgFull: "Занято",
      lgSelected: "Выбрано",
      clearSlot: "Отменить ✕",
      fullTag: "Занято",
      availableTag: "своб.",
      selectedPrefix: "Выбрано:",
      labelIsm: "Имя", errIsm: "Введите ваше имя",
      labelFamiliya: "Фамилия", errFamiliya: "Введите вашу фамилию",
      labelTelefon: "Номер телефона", errTelefon: "Введите корректный номер телефона",
      labelKurs: "Курс", errKurs: "Пожалуйста, выберите курс",
      errSlot: "Пожалуйста, выберите свободное время в расписании",
      errUstoza: "Пожалуйста, выберите преподавателя",
      noUstozaAvailable: "На этот день/время нет работающего преподавателя. Пожалуйста, выберите другое время.",
      holidayTag: "Праздник",
      holidayLabel: "Выходной день",
      btnSubmit: "Отправить",
      modalTitle: "Спасибо!",
      modalText: "Спасибо! Вы успешно записались. Наш помощник-преподаватель скоро свяжется с вами.",
      modalBtn: "Понятно",
      errGeneric: "Произошла ошибка. Попробуйте ещё раз.",
      errNetwork: "Произошла ошибка. Проверьте интернет-соединение и попробуйте снова.",
      errFull: "Это время уже занято. Пожалуйста, выберите другое время.",
      errTeacherTaken: "Этот преподаватель уже занят на это время. Пожалуйста, выберите другого преподавателя.",
      errValidate: "Пожалуйста, корректно заполните все обязательные (*) поля."
    },
    en: {
      eyebrow: "Free consultation",
      titleLine1: "Sign up ",
      titleAccent: "training sessions",
      titleLine2: "with a mentor teacher",
      subtitle: "Thank you! You have successfully registered. Please do not be late for the scheduled time.",
      stepCourse: "Choose a course",
      stepSlot: "Choose a date and time",
      stepDetails: "Your details",
      stepUstoza: "Choose a teacher",
      ttPlaceholder: "Choose a course first",
      weekPrev: "Previous",
      weekNext: "Next",
      lgFree: "Free",
      lgPartial: "Partially booked",
      lgFull: "Full",
      lgSelected: "Selected",
      clearSlot: "Clear ✕",
      fullTag: "Full",
      availableTag: "free",
      selectedPrefix: "Selected:",
      labelIsm: "First name", errIsm: "Please enter your first name",
      labelFamiliya: "Last name", errFamiliya: "Please enter your last name",
      labelTelefon: "Phone number", errTelefon: "Please enter a valid phone number",
      labelKurs: "Course", errKurs: "Please select a course",
      errSlot: "Please pick a free time on the schedule",
      errUstoza: "Please choose a teacher",
      noUstozaAvailable: "No teacher works on this day/time. Please choose another time.",
      holidayTag: "Holiday",
      holidayLabel: "Day off",
      btnSubmit: "Submit",
      modalTitle: "Thank you!",
      modalText: "Thank you! You have successfully registered. Our mentor teacher will contact you soon.",
      modalBtn: "Got it",
      errGeneric: "Something went wrong. Please try again.",
      errNetwork: "Something went wrong. Check your connection and try again.",
      errFull: "This time slot was just booked. Please choose another time.",
      errTeacherTaken: "This teacher was just booked for that time. Please choose another teacher.",
      errValidate: "Please correctly fill in all required (*) fields."
    }
  };

  function t(key){
    return (translations[currentLang] && translations[currentLang][key]) || translations.uz[key] || key;
  }

  // DINAMIK RO'YXAT: Kurslar COURSES dan olinadi
  function buildKursPanel(){
    if (!kursPanel) return;
    kursPanel.innerHTML = '';
    Object.keys(COURSES).forEach((value) => {
      const opt = document.createElement('div');
      opt.className = 'dd__option' + (value === selectedKurs ? ' is-selected' : '');
      opt.setAttribute('role', 'option');
      opt.textContent = value;
      opt.addEventListener('click', () => selectKurs(value));
      kursPanel.appendChild(opt);
    });
  }

  function selectKurs(value){
    selectedKurs = value;
    if (kursHidden) kursHidden.value = value;
    if (kursValueEl) {
      kursValueEl.textContent = value;
      kursValueEl.classList.remove('is-placeholder');
    }
    if (kursField) {
      kursField.classList.add('has-value');
      kursField.classList.remove('invalid', 'open');
    }
    buildKursPanel();
    clearSlotSelection();
    weekOffset = 0;
    loadAvailabilityAndRender();
  }

  if (kursTrigger) {
    kursTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = kursField.classList.contains('open');
      document.querySelectorAll('.field--dd.open').forEach((f) => f.classList.remove('open'));
      if (!isOpen) kursField.classList.add('open');
    });
  }
  
  document.addEventListener('click', (e) => {
    if (kursField && !kursField.contains(e.target)) kursField.classList.remove('open');
  });

  // JONLI AVTOMATIK SINXRONIZATSIYA (ADMIN PANELDAN SOZLAMALARNI OLISH)
  async function syncLiveConfig(){
    try {
      const isSergeli = window.location.hostname.includes('ser') || window.location.pathname.includes('/sergeli');
      const districtKey = isSergeli ? 'sergeli' : 'uchtepa';
      
      let cfg = null;

      // 1. Try Serverless API first (/api/sync)
      try {
        const res = await fetch(`/api/sync?district=${districtKey}&action=getConfig`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.config || data.courses || data.teachers)) {
            cfg = data.config || data;
          }
        }
      } catch(e) {}

      // 2. Try Google Script URL fallback
      if (!cfg) {
        try {
          const res = await fetch(`${SCRIPT_URL}?action=get_config`);
          if (res.ok) {
            cfg = await res.json();
          }
        } catch(e) {}
      }

      // If network returned config, cache it locally for instant subsequent loads
      if (cfg) {
        try {
          localStorage.setItem(`zn_admin_config_${districtKey}`, JSON.stringify(cfg));
        } catch(e) {}
      }

      // 3. Try LocalStorage fallback
      if (!cfg) {
        const saved = localStorage.getItem(`zn_admin_config_${districtKey}`) || localStorage.getItem('zn_admin_config');
        if (saved) cfg = JSON.parse(saved);
      }

      if (!cfg) return;

      // 1. Apply Teachers
      if (Array.isArray(cfg.teachers)) {
        const deletedList = Array.isArray(cfg.deletedTeachers) ? cfg.deletedTeachers : [];
        const teachersObj = {};
        const scheduleObj = {};

        cfg.teachers.forEach(t => {
          const clean = cleanPhoneDigits(t.phone || t.login);
          const nameKey = (t.name || '').trim().toLowerCase();
          if (deletedList.includes(t.id) || deletedList.includes(nameKey) || (clean && deletedList.includes(clean))) {
            return;
          }
          scheduleObj[t.name] = {
            offDays: t.daysOff || [],
            start: t.startTime || "09:00",
            end: t.endTime || "17:00",
            dailyHours: t.dailyHours || null
          };
          (t.courses || []).forEach(cName => {
            if (!teachersObj[cName]) teachersObj[cName] = [];
            if (!teachersObj[cName].includes(t.name)) teachersObj[cName].push(t.name);
          });
        });

        Object.keys(COURSE_TEACHERS).forEach(k => delete COURSE_TEACHERS[k]);
        Object.assign(COURSE_TEACHERS, teachersObj);
        TEACHER_COURSES = Object.keys(COURSE_TEACHERS).filter(k => (COURSE_TEACHERS[k] || []).length > 0);

        Object.keys(TEACHER_SCHEDULE).forEach(k => delete TEACHER_SCHEDULE[k]);
        Object.assign(TEACHER_SCHEDULE, scheduleObj);
      } else if (cfg.courseTeachers) {
        Object.keys(COURSE_TEACHERS).forEach(k => delete COURSE_TEACHERS[k]);
        Object.assign(COURSE_TEACHERS, cfg.courseTeachers);
        TEACHER_COURSES = Object.keys(COURSE_TEACHERS).filter(k => (COURSE_TEACHERS[k] || []).length > 0);
        if (cfg.teacherSchedule) {
          Object.keys(TEACHER_SCHEDULE).forEach(k => delete TEACHER_SCHEDULE[k]);
          Object.assign(TEACHER_SCHEDULE, cfg.teacherSchedule);
        }
      }

      // 2. Apply Courses
      if (cfg.courses) {
        const oldKeys = Object.keys(COURSES);
        const newCourseNames = Array.isArray(cfg.courses) ? cfg.courses.map(c => c.name) : Object.keys(cfg.courses);
        oldKeys.forEach(k => { if (!newCourseNames.includes(k)) delete COURSES[k]; });

        if (Array.isArray(cfg.courses)) {
          cfg.courses.forEach(c => {
            if (c.active !== false) {
              let sH = 9, sM = 0, eH = 17, eM = 0;
              if (c.startTime) {
                const p = c.startTime.split(':').map(Number);
                sH = p[0]; sM = p[1] || 0;
              }
              if (c.endTime) {
                const p = c.endTime.split(':').map(Number);
                eH = p[0]; eM = p[1] || 0;
              }

              // Auto-expand course end time if assigned teacher works longer
              const assigned = COURSE_TEACHERS[c.name] || [];
              assigned.forEach(tName => {
                const tSched = TEACHER_SCHEDULE[tName];
                if (tSched) {
                  if (tSched.end) {
                    const ep = tSched.end.split(':').map(Number);
                    if (ep[0] > eH || (ep[0] === eH && (ep[1] || 0) > eM)) {
                      eH = ep[0];
                      eM = ep[1] || 0;
                    }
                  }
                  if (tSched.dailyHours) {
                    Object.values(tSched.dailyHours).forEach(dh => {
                      if (dh.isWork && dh.end) {
                        const ep = dh.end.split(':').map(Number);
                        if (ep[0] > eH || (ep[0] === eH && (ep[1] || 0) > eM)) {
                          eH = ep[0];
                          eM = ep[1] || 0;
                        }
                      }
                    });
                  }
                }
              });

              COURSES[c.name] = {
                slots: buildSlots(sH, sM, eH, eM, c.slotDuration || 30),
                capacity: c.capacity || 1
              };
              if (c.excludedDays && c.excludedDays.length > 0) {
                COURSE_EXCLUDED_DAYS[c.name] = c.excludedDays;
              }
            }
          });
        } else if (typeof cfg.courses === 'object') {
          Object.keys(cfg.courses).forEach(cName => {
            const c = cfg.courses[cName];
            if (c && c.slots) {
              COURSES[cName] = c;
            } else if (c) {
              const sH = c.startHour !== undefined ? c.startHour : 9;
              const eH = c.endHour !== undefined ? c.endHour : 17;
              const step = c.stepMin !== undefined ? c.stepMin : 30;
              const cap = c.capacity !== undefined ? c.capacity : 1;
              COURSES[cName] = { slots: buildSlots(sH, 0, eH, 0, step), capacity: cap };
            }
          });
        }
      }

      // 2b. Explicitly purge deleted courses from COURSES & COURSE_TEACHERS
      if (Array.isArray(cfg.deletedCourses) && cfg.deletedCourses.length > 0) {
        const delCSet = new Set(cfg.deletedCourses.map(c => String(c || '').trim().toLowerCase()));
        Object.keys(COURSES).forEach(k => {
          if (delCSet.has(k.toLowerCase())) delete COURSES[k];
        });
        Object.keys(COURSE_TEACHERS).forEach(k => {
          if (delCSet.has(k.toLowerCase())) delete COURSE_TEACHERS[k];
        });
        TEACHER_COURSES = Object.keys(COURSE_TEACHERS).filter(k => (COURSE_TEACHERS[k] || []).length > 0);
      }

      // 3. Dam olish va bayram kunlari
      if (cfg.courseExcludedDays) {
        Object.keys(COURSE_EXCLUDED_DAYS).forEach(k => delete COURSE_EXCLUDED_DAYS[k]);
        Object.assign(COURSE_EXCLUDED_DAYS, cfg.courseExcludedDays);
      }
      if (Array.isArray(cfg.holidayDates)) {
        HOLIDAY_DATES.length = 0;
        cfg.holidayDates.forEach(d => HOLIDAY_DATES.push(typeof d === 'string' ? d : d.date));
      }

      buildKursPanel();
      if (selectedKurs && COURSES[selectedKurs]) {
        loadAvailabilityAndRender();
        updateUstozaStep();
      } else if (selectedKurs && !COURSES[selectedKurs]) {
        // If previously selected course was deleted, clean it up!
        selectedKurs = null;
        if (kursHidden) kursHidden.value = '';
        if (kursValueEl) {
          kursValueEl.textContent = 'Kursni tanlang';
          kursValueEl.classList.add('is-placeholder');
        }
        if (kursField) {
          kursField.classList.remove('has-value', 'invalid');
        }
        clearSlotSelection();
      }
    } catch (e) {
      console.warn("Live config fetch error:", e);
    }
  }

  function normalizeDateKey(raw){
    if (!raw) return '';
    const str = String(raw).trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) return str;
    const d = new Date(str);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000){
      return formatDateValue(d);
    }
    return str;
  }

  function normalizeTimeKey(raw){
    if (!raw) return '';
    const str = String(raw).trim();
    const m = str.match(/(\d{1,2}):(\d{2})/);
    if (m) return `${String(m[1]).padStart(2,'0')}:${m[2]}`;
    const d = new Date(str);
    if (!isNaN(d.getTime())){
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    return str;
  }

  async function fetchAvailability(kurs){
    const url = `${SCRIPT_URL}?action=availability&kurs=${encodeURIComponent(kurs)}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      if (!data || typeof data !== 'object') return {};

      const cleanMap = {};
      Object.keys(data).forEach((rawDate) => {
        const cleanDate = normalizeDateKey(rawDate);
        if (!cleanDate) return;
        if (!cleanMap[cleanDate]) cleanMap[cleanDate] = {};
        const timeObj = data[rawDate] || {};
        Object.keys(timeObj).forEach((rawTime) => {
          const cleanTime = normalizeTimeKey(rawTime);
          if (!cleanTime) return;
          cleanMap[cleanDate][cleanTime] = (cleanMap[cleanDate][cleanTime] || 0) + (Number(timeObj[rawTime]) || 0);
        });
      });
      return cleanMap;
    } catch (err) {
      console.warn("Jadval yuklashda xatolik:", err);
      return {};
    }
  }

  async function loadAvailabilityAndRender(){
    if (!selectedKurs) return;
    if (ttPlaceholder) ttPlaceholder.style.display = 'none';
    if (ttWrapper) ttWrapper.style.display = 'block';
    if (ttGrid) ttGrid.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;color:#8A9C93;font-size:0.85rem;">…</div>`;

    const myRequestId = ++availabilityRequestId;
    const map = await fetchAvailability(selectedKurs);
    if (myRequestId !== availabilityRequestId) return;

    availabilityMap = map;
    renderGrid();
  }

  function weekDates(){
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(today);
    start.setDate(today.getDate() + weekOffset * 7);
    const dates = [];
    for (let i = 0; i < 7; i++){
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  function renderGrid(){
    if (!selectedKurs || !COURSES[selectedKurs] || !ttGrid) return;
    const { slots, capacity } = COURSES[selectedKurs];
    const fullWeek = weekDates();
    const excludedDays = COURSE_EXCLUDED_DAYS[selectedKurs] || [];
    const dates = fullWeek.filter((d) => excludedDays.indexOf(d.getDay()) === -1);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (weekPrev) weekPrev.disabled = weekOffset <= 0;
    if (weekLabel) weekLabel.textContent = `${formatDateShort(fullWeek[0])} — ${formatDateShort(fullWeek[6])}`;

    ttGrid.innerHTML = '';
    ttGrid.style.gridTemplateColumns = `74px repeat(${dates.length}, minmax(80px,1fr))`;
    ttGrid.style.minWidth = `${74 + dates.length * 80}px`;
    ttGrid.style.gridTemplateRows = `auto repeat(${slots.length}, auto)`;

    const corner = document.createElement('div');
    corner.className = 'tt-corner';
    ttGrid.appendChild(corner);

    dates.forEach((d) => {
      const isHoliday = isHolidayDate(d);
      const head = document.createElement('div');
      head.className = 'tt-head' + (sameDate(d, today) ? ' is-today' : '') + (isHoliday ? ' is-holiday' : '');
      if (isHoliday) head.title = t('holidayLabel');
      head.innerHTML = `<div class="dow">${DOW_SHORT[currentLang][d.getDay()]}</div><div class="dnum">${formatDateShort(d)}</div>`;
      ttGrid.appendChild(head);
    });

    slots.forEach((time) => {
      const timeCell = document.createElement('div');
      timeCell.className = 'tt-time';
      timeCell.textContent = time;
      ttGrid.appendChild(timeCell);

      dates.forEach((d) => {
        const dateVal = formatDateValue(d);
        const isHoliday = isHolidayDate(d);
        const booked = (availabilityMap[dateVal] && availabilityMap[dateVal][time]) || 0;
        const remaining = capacity - booked;
        const isFull = !isHoliday && remaining <= 0;
        const isPartial = !isHoliday && !isFull && remaining < capacity && capacity > 1;
        const isSelected = !isHoliday && selectedDate && sameDate(selectedDate, d) && selectedTime === time;

        const cell = document.createElement('div');
        cell.className = 'tt-cell'
          + (isHoliday ? ' is-holiday' : '')
          + (isFull ? ' is-full' : '')
          + (isPartial ? ' is-partial' : '')
          + (isSelected ? ' is-selected' : '');

        if (isHoliday){
          cell.textContent = t('holidayTag');
          cell.title = t('holidayLabel');
        } else if (isSelected){
          cell.innerHTML = '✓';
        } else if (isFull){
          cell.textContent = t('fullTag');
        } else if (isPartial){
          cell.textContent = `${booked}/${capacity}`;
        } else {
          cell.textContent = '';
        }

        if (!isFull && !isHoliday){
          cell.addEventListener('click', () => {
            selectedDate = d;
            selectedTime = time;
            if (sanaHidden) sanaHidden.value = dateVal;
            if (vaqtHidden) vaqtHidden.value = time;
            if (slotField) slotField.classList.remove('invalid');
            updateSelectedInfo();
            renderGrid();
            updateUstozaStep();
          });
        }

        ttGrid.appendChild(cell);
      });
    });
  }

  function updateSelectedInfo(){
    if (!selectedInfo || !selectedInfoText) return;
    if (selectedDate && selectedTime){
      const dow = DOW_FULL[currentLang][selectedDate.getDay()];
      selectedInfoText.textContent = `${t('selectedPrefix')} ${formatDateShort(selectedDate)} (${dow}), ${selectedTime}`;
      selectedInfo.classList.add('show');
    } else {
      selectedInfo.classList.remove('show');
    }
  }

  function clearSlotSelection(){
    selectedDate = null;
    selectedTime = null;
    if (sanaHidden) sanaHidden.value = '';
    if (vaqtHidden) vaqtHidden.value = '';
    updateSelectedInfo();
    resetUstozaSelection();
    updateUstozaStep();
  }

  if (clearSlotBtn) {
    clearSlotBtn.addEventListener('click', () => {
      clearSlotSelection();
      renderGrid();
    });
  }

  if (weekPrev) {
    weekPrev.addEventListener('click', () => {
      if (weekOffset > 0){ weekOffset -= 1; renderGrid(); }
    });
  }
  if (weekNext) {
    weekNext.addEventListener('click', () => {
      weekOffset += 1;
      renderGrid();
    });
  }

  function resetUstozaSelection(){
    selectedUstoza = null;
    teacherCounts = {};
    if (ustozaHidden) ustozaHidden.value = '';
    setFieldInvalid('ustoza', false);
    renderUstozaOptions();
  }

  function needsUstoza(){
    const teachers = COURSE_TEACHERS[selectedKurs] || [];
    return teachers.length > 0;
  }

  function renderUstozaOptions(){
    if (!ustozaOptions) return;
    ustozaOptions.innerHTML = '';
    let shown = 0;
    (COURSE_TEACHERS[selectedKurs] || []).forEach((name) => {
      if (!isTeacherScheduled(name, selectedDate, selectedTime)) return;

      shown++;
      const count = teacherCounts[name] || 0;
      const cap = (teacherCapacity > 0) ? teacherCapacity : 4;
      const isTaken = count >= cap;
      const isSelected = selectedUstoza === name;

      const chip = document.createElement('div');
      chip.className = 'ustoza-chip' + (isTaken ? ' is-taken' : '') + (isSelected ? ' is-selected' : '');
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', isTaken ? '-1' : '0');
      chip.dataset.name = name;
      chip.dataset.taken = isTaken ? '1' : '0';
      const checkMark = isSelected ? '<span class="ustoza-chip__check">✓</span> ' : '';
      chip.innerHTML = `${checkMark}<span class="ustoza-chip__name">${name}</span> <span class="ustoza-chip__count">(${count}/${cap})</span>`;
      ustozaOptions.appendChild(chip);
    });

    if (shown === 0 && (COURSE_TEACHERS[selectedKurs] || []).length){
      const msg = document.createElement('div');
      msg.className = 'ustoza-empty';
      msg.style.cssText = 'font-size:0.86rem;color:#8A9C93;padding:6px 2px;';
      msg.textContent = t('noUstozaAvailable');
      ustozaOptions.appendChild(msg);
    }
  }

  function selectUstozaByName(name){
    if (!name) return;
    selectedUstoza = name;
    if (ustozaHidden) ustozaHidden.value = name;
    setFieldInvalid('ustoza', false);
    clearInlineError();
    renderUstozaOptions();
  }

  if (ustozaOptions) {
    ustozaOptions.addEventListener('click', (e) => {
      const chip = e.target.closest('.ustoza-chip');
      if (!chip || !ustozaOptions.contains(chip)) return;
      if (chip.dataset.taken === '1') return;
      selectUstozaByName(chip.dataset.name);
    });
    ustozaOptions.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const chip = e.target.closest('.ustoza-chip');
      if (!chip || chip.dataset.taken === '1') return;
      e.preventDefault();
      selectUstozaByName(chip.dataset.name);
    });
  }

  async function fetchTeacherCounts(kurs, sana, vaqt){
    const defaultCap = (COURSES[kurs] && COURSES[kurs].capacity) || 4;
    const url = `${SCRIPT_URL}?action=ustozalar&kurs=${encodeURIComponent(kurs)}&sana=${encodeURIComponent(sana)}&vaqt=${encodeURIComponent(vaqt)}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      return {
        counts: (data && typeof data.counts === 'object' && data.counts) ? data.counts : {},
        capacity: (data && typeof data.capacity === 'number' && data.capacity > 0) ? data.capacity : defaultCap
      };
    } catch (err) {
      console.warn("O'qituvchilar yuklashda xatolik:", err);
      return { counts: {}, capacity: defaultCap };
    }
  }

  async function updateUstozaStep(){
    if (!ustozaStepLabel || !ustozaBlock) return;

    if (!needsUstoza() || !selectedDate || !selectedTime){
      ustozaStepLabel.style.display = 'none';
      ustozaBlock.style.display = 'none';
      return;
    }

    ustozaStepLabel.style.display = 'flex';
    ustozaBlock.style.display = 'block';

    const myId = ++ustozaRequestId;
    renderUstozaOptions();

    const dateVal = formatDateValue(selectedDate);
    const result = await fetchTeacherCounts(selectedKurs, dateVal, selectedTime);
    if (myId !== ustozaRequestId) return;

    teacherCounts = result.counts || {};
    teacherCapacity = (result.capacity && result.capacity > 0) ? result.capacity : ((COURSES[selectedKurs] && COURSES[selectedKurs].capacity) || 4);
    
    if (selectedUstoza && teacherCapacity > 0 && (teacherCounts[selectedUstoza] || 0) >= teacherCapacity){
      selectedUstoza = null;
      if (ustozaHidden) ustozaHidden.value = '';
    }
    if (selectedUstoza && ustozaHidden) {
      ustozaHidden.value = selectedUstoza;
    }
    renderUstozaOptions();
  }

  function setFieldInvalid(fieldName, isInvalid){
    const field = form.querySelector(`[data-field="${fieldName}"]`);
    if (field) field.classList.toggle('invalid', isInvalid);
    if (fieldName === 'kurs' && kursField) kursField.classList.toggle('invalid', isInvalid);
  }

  function validate(data){
    let ok = true;
    if (!data.ism || !data.ism.trim()){ setFieldInvalid('ism', true); ok = false; } else setFieldInvalid('ism', false);
    if (!data.familiya || !data.familiya.trim()){ setFieldInvalid('familiya', true); ok = false; } else setFieldInvalid('familiya', false);
    const phoneDigits = (data.telefon || '').replace(/\D/g, '');
    if (phoneDigits.length < 9){ setFieldInvalid('telefon', true); ok = false; } else setFieldInvalid('telefon', false);
    if (!data.kurs){ setFieldInvalid('kurs', true); ok = false; } else setFieldInvalid('kurs', false);
    if (!data.sana || !data.vaqt){ setFieldInvalid('slot', true); ok = false; } else setFieldInvalid('slot', false);
    
    const availableTeachers = (COURSE_TEACHERS[data.kurs] || []).filter(name => isTeacherScheduled(name, selectedDate, selectedTime));
    if (availableTeachers.length > 0 && !data.ustoza){
      setFieldInvalid('ustoza', true);
      ok = false;
    } else {
      setFieldInvalid('ustoza', false);
    }
    return ok;
  }

  function clearInlineError(){ if (inlineError) { inlineError.classList.remove('show'); inlineError.textContent = ''; } }
  function showInlineError(message){ if (inlineError) { inlineError.textContent = message; inlineError.classList.add('show'); } }

  function openModal(){
    if (!successModal) return;
    successModal.classList.add('show');
    successModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    if (!successModal) return;
    successModal.classList.remove('show');
    successModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOkBtn) modalOkBtn.addEventListener('click', closeModal);
  if (successModal) successModal.addEventListener('click', (e) => { if (e.target === successModal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && successModal && successModal.classList.contains('show')) closeModal(); });

  function showToast(message){
    if (!errorToast || !toastText) return;
    toastText.textContent = message;
    errorToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => errorToast.classList.remove('show'), 5000);
  }

  function setLoading(isLoading){
    if (!submitBtn) return;
    submitBtn.classList.toggle('loading', isLoading);
    submitBtn.disabled = isLoading;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearInlineError();

    const now = new Date();
    const chosenUstoza = (ustozaHidden && ustozaHidden.value) ? ustozaHidden.value.trim() : (selectedUstoza ? selectedUstoza.trim() : '');
    const payload = {
      action: 'register',
      yuborilgan_vaqt: now.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }),
      ism: inputIsm ? inputIsm.value.trim() : '',
      familiya: inputFamiliya ? inputFamiliya.value.trim() : '',
      telefon: inputTelefon ? inputTelefon.value.trim() : '',
      kurs: kursHidden ? kursHidden.value : '',
      sana: sanaHidden ? sanaHidden.value : '',
      vaqt: vaqtHidden ? vaqtHidden.value : '',
      kun: selectedDate ? DOW_FULL.uz[selectedDate.getDay()] : '',
      ustoza: chosenUstoza
    };

    if (!validate(payload)){
      showInlineError(t('errValidate'));
      return;
    }

    setLoading(true);

    try {
      let sentSuccessfully = false;
      let result = null;

      // 1. Try Serverless Proxy API /api/sync
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          result = await res.json();
          sentSuccessfully = true;
        }
      } catch (e) {}

      // 2. Direct Sync to Google Script
      if (!sentSuccessfully) {
        try {
          const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            try { result = await res.json(); } catch (err) {}
            sentSuccessfully = true;
          }
        } catch (e) {
          try {
            await fetch(SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload)
            });
            sentSuccessfully = true;
          } catch(err2) {}
        }
      }

      if (result && result.success === false){
        console.warn('Backend error: ' + JSON.stringify(result));
        if (result.error === 'full'){
          showToast(t('errFull'));
          clearSlotSelection();
          loadAvailabilityAndRender();
          return;
        } else if (result.error === 'teacher_taken'){
          showToast(t('errTeacherTaken'));
          updateUstozaStep();
          return;
        } else if (result.error === 'missing_ustoza'){
          setFieldInvalid('ustoza', true);
          showInlineError(t('errUstoza'));
          return;
        }
      }

      // Always save booking locally so Admin & Teacher panels see it instantly
      try {
        const savedBookings = JSON.parse(localStorage.getItem('zn_bookings') || '[]');
        savedBookings.unshift({
          id: "b_" + Date.now(),
          studentName: `${payload.ism} ${payload.familiya}`.trim(),
          phone: formatPhoneNumber(payload.telefon),
          courseName: payload.kurs,
          teacherName: payload.ustoza || 'Biriktirilmagan',
          date: payload.sana,
          time: payload.vaqt,
          status: "Kutilmoqda",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('zn_bookings', JSON.stringify(savedBookings));
      } catch(e) {}

      form.reset();
      clearSlotSelection();
      if (selectedKurs) loadAvailabilityAndRender();
      openModal();

    } catch (err) {
      console.error('Error submitting form:', err);
      // Even on error, save locally and show success
      try {
        const savedBookings = JSON.parse(localStorage.getItem('zn_bookings') || '[]');
        savedBookings.unshift({
          id: "b_" + Date.now(),
          studentName: `${payload.ism} ${payload.familiya}`.trim(),
          phone: formatPhoneNumber(payload.telefon),
          courseName: payload.kurs,
          teacherName: payload.ustoza || 'Biriktirilmagan',
          date: payload.sana,
          time: payload.vaqt,
          status: "Kutilmoqda",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('zn_bookings', JSON.stringify(savedBookings));
        form.reset();
        clearSlotSelection();
        openModal();
      } catch(e) {
        showToast(t('errNetwork'));
      }
    } finally {
      setLoading(false);
    }
  });

  if (inputTelefon) setupPhoneMask(inputTelefon);
  if (inputIsm) inputIsm.addEventListener('input', () => setFieldInvalid('ism', false));
  if (inputFamiliya) inputFamiliya.addEventListener('input', () => setFieldInvalid('familiya', false));
  if (inputTelefon) inputTelefon.addEventListener('input', () => setFieldInvalid('telefon', false));

  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme){
    if (!html) return;
    html.setAttribute('data-theme', theme);
    try { localStorage.setItem('zn_theme', theme); } catch (e) {}
  }
  function initTheme(){
    let saved = null;
    try { saved = localStorage.getItem('zn_theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark'){
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  const langButtons = document.querySelectorAll('.lang-btn');

  function applyLang(lang){
    currentLang = translations[lang] ? lang : 'uz';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const dict = translations[currentLang];
      if (dict && dict[key] !== undefined) el.textContent = dict[key];
    });

    langButtons.forEach((btn) => btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang));
    if (html) html.setAttribute('lang', currentLang);
    try { localStorage.setItem('zn_lang', currentLang); } catch (e) {}

    buildKursPanel();
    if (selectedKurs && kursValueEl){
      kursValueEl.textContent = selectedKurs;
    }
    if (ttWrapper && ttWrapper.style.display !== 'none'){
      renderGrid();
      updateSelectedInfo();
    }
    if (ustozaBlock && ustozaBlock.style.display !== 'none'){
      renderUstozaOptions();
    }
  }

  function initLang(){
    let saved = null;
    try { saved = localStorage.getItem('zn_lang'); } catch (e) {}
    applyLang(saved && translations[saved] ? saved : 'uz');
  }

  langButtons.forEach((btn) => btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang'))));

  buildKursPanel();
  initTheme();
  initLang();
  injectHolidayStyles();
  syncLiveConfig(); // Admin paneldagi oxirgi o'zgarishlarni yuklash
  setInterval(syncLiveConfig, 25000); // Har 25 soniyada yangilanishlarni avtomatik tekshirish
});
