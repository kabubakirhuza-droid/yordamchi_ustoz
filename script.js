const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyc8N0QyY9b3AI_BCGkdWeU7URxvjLrb-XJdsLQRwRYzJhwDtNFPb9vSaBfELL4uzfZ/exec";

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

const COURSES = {
  "Arab tili - Harf":       { slots: buildSlots(9,0,17,0,30), capacity: 4 },
  "Arab tili - Qoida":      { slots: buildSlots(9,0,17,0,30), capacity: 4 },
  "Arab tili - Amaliyot":   { slots: buildSlots(9,0,17,0,30), capacity: 4 },
  "Arab tili grammatikasi": { slots: buildSlots(9,0,17,0,30), capacity: 4 },
  "Ingliz tili":            { slots: buildSlots(9,0,12,0,30), capacity: 1 },
  "Nurli Bolajon":          { slots: buildSlots(13,0,17,0,30), capacity: 1 }
};

// Ba'zi kurslar faqat muayyan kunlarda mavjud bo'lishi mumkin.
// 0=Yak,1=Dush,2=Sesh,3=Chor,4=Pay,5=Jum,6=Shan
const COURSE_DAYS = {
  "Nurli Bolajon": [4] // faqat Payshanba
};

function isCourseDayAllowed(kurs, date){
  const days = COURSE_DAYS[kurs];
  if (!days) return true;
  return days.indexOf(date.getDay()) !== -1;
}

const COURSE_TEACHERS = {
  "Arab tili - Harf": [
    "Nargiza Ustoza",
    "Fazilat Ustoza",
    "Risolat Ustoza"
  ],
  "Arab tili - Qoida": [
    "Nargiza Ustoza",
    "Fazilat Ustoza",
    "Risolat Ustoza"
  ],
  "Arab tili - Amaliyot": [
    "Nargiza Ustoza",
    "Fazilat Ustoza",
    "Risolat Ustoza"
  ],
  "Nurli Bolajon": [
    "Muslima Ustoza"
  ]
};
const TEACHER_COURSES = Object.keys(COURSE_TEACHERS);

// --- Ish jadvali (ichki, saytda ko'rsatilmaydi) ---
// days: JS Date.getDay() bo'yicha: 0=Yak,1=Dush,2=Sesh,3=Chor,4=Pay,5=Jum,6=Shan
const WEEKDAYS_MON_FRI = [1,2,3,4,5];
const WEEKEND_SAT_SUN = [0,6];

const TEACHER_SCHEDULE = {
  "Nargiza Ustoza": [
    { days: WEEKDAYS_MON_FRI, start: "08:00", end: "12:00" }
  ],
  "Fazilat Ustoza": [
    { days: WEEKDAYS_MON_FRI, start: "09:00", end: "13:00" }
  ],
  "Muslima Ustoza": [
    { days: WEEKDAYS_MON_FRI, start: "13:00", end: "17:00" }
  ],
  "Risolat Ustoza": [
    { days: WEEKDAYS_MON_FRI, start: "14:00", end: "17:00" },
    { days: WEEKEND_SAT_SUN,  start: "09:00", end: "17:00" }
  ]
};

function timeToMinutes(t){
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Ustoza tanlangan sana (Date) va vaqt ("HH:MM") da ishlaydimi, shuni tekshiradi.
function isTeacherAvailable(name, date, time){
  const schedule = TEACHER_SCHEDULE[name];
  if (!schedule) return true; // jadval belgilanmagan bo'lsa — cheklamaymiz
  if (!date || !time) return false;
  const dow = date.getDay();
  const mins = timeToMinutes(time);
  return schedule.some((block) => {
    if (block.days.indexOf(dow) === -1) return false;
    const startMins = timeToMinutes(block.start);
    const endMins = timeToMinutes(block.end);
    return mins >= startMins && mins < endMins;
  });
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

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const inlineError = document.getElementById('inlineError');

  // Поля ввода (исправление основной ошибки)
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
  let teacherCapacity = 1;
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
      btnSubmit: "Yuborish",
      modalTitle: "Rahmat!",
      modalText: "Rahmat! Siz muvaffaqiyatli ro'yxatdan o'tdingiz. Iltimos belgilangan vaqtdan kechga qolmang.",
      modalBtn: "Tushunarli",
      course1: "Arab tili - Harf",
      course2: "Arab tili - Qoida",
      course3: "Arab tili - Amaliyot",
      course4: "Arab tili grammatikasi",
      course5: "Ingliz tili",
      course6: "Nurli Bolajon",
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
      btnSubmit: "Отправить",
      modalTitle: "Спасибо!",
      modalText: "Спасибо! Вы успешно записались. Наш помощник-преподаватель скоро свяжется с вами.",
      modalBtn: "Понятно",
      course1: "Арабский язык - Буквы",
      course2: "Арабский язык - Правила",
      course3: "Арабский язык - Практика",
      course4: "Грамматика арабского языка",
      course5: "Английский язык",
      course6: "Нурли Болажон",
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
      btnSubmit: "Submit",
      modalTitle: "Thank you!",
      modalText: "Thank you! You have successfully registered. Our mentor teacher will contact you soon.",
      modalBtn: "Got it",
      course1: "Arabic Language - Letters",
      course2: "Arabic Language - Rules",
      course3: "Arabic Language - Practice",
      course4: "Arabic Grammar",
      course5: "English Language",
      course6: "Nurli Bolajon",
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

  const COURSE_KEYS = {
    "Arab tili - Harf": "course1",
    "Arab tili - Qoida": "course2",
    "Arab tili - Amaliyot": "course3",
    "Arab tili grammatikasi": "course4",
    "Ingliz tili": "course5",
    "Nurli Bolajon": "course6"
  };
  const COURSE_ORDER = ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot", "Arab tili grammatikasi", "Ingliz tili", "Nurli Bolajon"];

  function buildKursPanel(){
    if (!kursPanel) return;
    kursPanel.innerHTML = '';
    COURSE_ORDER.forEach((value) => {
      const opt = document.createElement('div');
      opt.className = 'dd__option' + (value === selectedKurs ? ' is-selected' : '');
      opt.setAttribute('role', 'option');
      opt.textContent = t(COURSE_KEYS[value]);
      opt.addEventListener('click', () => selectKurs(value));
      kursPanel.appendChild(opt);
    });
  }

  function selectKurs(value){
    selectedKurs = value;
    if (kursHidden) kursHidden.value = value;
    if (kursValueEl) {
      kursValueEl.textContent = t(COURSE_KEYS[value]);
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

  async function fetchAvailability(kurs){
    const url = `${SCRIPT_URL}?action=availability&kurs=${encodeURIComponent(kurs)}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      return (data && typeof data === 'object') ? data : {};
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
    const dates = weekDates();
    const today = new Date();
    today.setHours(0,0,0,0);

    if (weekPrev) weekPrev.disabled = weekOffset <= 0;
    if (weekLabel) weekLabel.textContent = `${formatDateShort(dates[0])} — ${formatDateShort(dates[6])}`;

    ttGrid.innerHTML = '';
    ttGrid.style.gridTemplateRows = `auto repeat(${slots.length}, auto)`;

    const corner = document.createElement('div');
    corner.className = 'tt-corner';
    ttGrid.appendChild(corner);

    dates.forEach((d) => {
      const dayAllowedForHeader = isCourseDayAllowed(selectedKurs, d);
      const head = document.createElement('div');
      head.className = 'tt-head' + (sameDate(d, today) ? ' is-today' : '') + (!dayAllowedForHeader ? ' is-blocked' : '');
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
        const dayAllowed = isCourseDayAllowed(selectedKurs, d);
        const booked = (availabilityMap[dateVal] && availabilityMap[dateVal][time]) || 0;
        const remaining = capacity - booked;
        const isFull = !dayAllowed || remaining <= 0;
        const isPartial = dayAllowed && !isFull && remaining < capacity && capacity > 1;
        const isSelected = selectedDate && sameDate(selectedDate, d) && selectedTime === time;

        const cell = document.createElement('div');
        cell.className = 'tt-cell' + (isFull ? ' is-full' : '') + (isPartial ? ' is-partial' : '') + (isSelected ? ' is-selected' : '');

        if (isSelected){
          cell.innerHTML = '✓';
        } else if (!dayAllowed){
          cell.textContent = '';
        } else if (isFull){
          cell.textContent = t('fullTag');
        } else if (isPartial){
          cell.textContent = `${booked}/${capacity}`;
        } else {
          cell.textContent = '';
        }

        if (!isFull){
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
    if (ustozaField) ustozaField.classList.remove('invalid');
    renderUstozaOptions();
  }

  function needsUstoza(){
    return TEACHER_COURSES.indexOf(selectedKurs) !== -1;
  }

  // Tanlangan sana/vaqtda haqiqatda ishlaydigan ustozalar ro'yxati.
  // Bu filtr saytda ko'rinmaydi — faqat mos keladigan ustozalar chip
  // sifatida chiqadi, ishlamaydiganlari umuman ro'yxatga tushmaydi.
  function getAvailableTeachersForSlot(){
    if (!selectedDate || !selectedTime) return [];
    return (COURSE_TEACHERS[selectedKurs] || []).filter((name) =>
      isTeacherAvailable(name, selectedDate, selectedTime)
    );
  }

  // --- Ustoza chips: rendering is purely visual now. Clicks are handled by a
  // single delegated listener attached once below, so a chip always reacts
  // to a click even while data is still being re-rendered/refreshed. ---
  function renderUstozaOptions(){
    if (!ustozaOptions) return;
    ustozaOptions.innerHTML = '';
    getAvailableTeachersForSlot().forEach((name) => {
      const count = teacherCounts[name] || 0;
      const isTaken = count >= teacherCapacity;
      const isSelected = selectedUstoza === name;

      const chip = document.createElement('div');
      chip.className = 'ustoza-chip' + (isTaken ? ' is-taken' : '') + (isSelected ? ' is-selected' : '');
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', isTaken ? '-1' : '0');
      chip.dataset.name = name;
      chip.dataset.taken = isTaken ? '1' : '0';
      const checkMark = isSelected ? '<span class="ustoza-chip__check">✓</span> ' : '';
      chip.innerHTML = `${checkMark}<span class="ustoza-chip__name">${name}</span> <span class="ustoza-chip__count">(${count}/${teacherCapacity})</span>`;
      ustozaOptions.appendChild(chip);
    });
  }

  function selectUstozaByName(name){
    if (!name) return;
    selectedUstoza = name;
    if (ustozaHidden) ustozaHidden.value = name;
    if (ustozaField) ustozaField.classList.remove('invalid');
    renderUstozaOptions();
  }

  if (ustozaOptions) {
    // Delegated click handler: attached once, so it keeps working no matter
    // how many times renderUstozaOptions() rebuilds the chips inside it.
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
    const url = `${SCRIPT_URL}?action=ustozalar&kurs=${encodeURIComponent(kurs)}&sana=${encodeURIComponent(sana)}&vaqt=${encodeURIComponent(vaqt)}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      return {
        counts: (data && typeof data.counts === 'object' && data.counts) ? data.counts : {},
        capacity: (data && typeof data.capacity === 'number' && data.capacity > 0) ? data.capacity : 1
      };
    } catch (err) {
      console.warn("O'qituvchilar yuklashda xatolik:", err);
      return { counts: {}, capacity: 1 };
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
    teacherCounts = {};
    renderUstozaOptions();

    const dateVal = formatDateValue(selectedDate);
    const result = await fetchTeacherCounts(selectedKurs, dateVal, selectedTime);
    if (myId !== ustozaRequestId) return;

    teacherCounts = result.counts;
    teacherCapacity = result.capacity;
    if (selectedUstoza && (teacherCounts[selectedUstoza] || 0) >= teacherCapacity){
      selectedUstoza = null;
      if (ustozaHidden) ustozaHidden.value = '';
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
    if (!data.ism.trim()){ setFieldInvalid('ism', true); ok = false; } else setFieldInvalid('ism', false);
    if (!data.familiya.trim()){ setFieldInvalid('familiya', true); ok = false; } else setFieldInvalid('familiya', false);
    const phoneDigits = data.telefon.replace(/\D/g, '');
    if (phoneDigits.length < 9){ setFieldInvalid('telefon', true); ok = false; } else setFieldInvalid('telefon', false);
    if (!data.kurs){ setFieldInvalid('kurs', true); ok = false; } else setFieldInvalid('kurs', false);
    if (!data.sana || !data.vaqt){ setFieldInvalid('slot', true); ok = false; } else setFieldInvalid('slot', false);
    if (TEACHER_COURSES.indexOf(data.kurs) !== -1 && !data.ustoza){ setFieldInvalid('ustoza', true); ok = false; } else setFieldInvalid('ustoza', false);
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
    const payload = {
      yuborilgan_vaqt: now.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }),
      ism: inputIsm ? inputIsm.value.trim() : '',
      familiya: inputFamiliya ? inputFamiliya.value.trim() : '',
      telefon: inputTelefon ? inputTelefon.value.trim() : '',
      kurs: kursHidden ? kursHidden.value : '',
      sana: sanaHidden ? sanaHidden.value : '',
      vaqt: vaqtHidden ? vaqtHidden.value : '',
      kun: selectedDate ? DOW_FULL.uz[selectedDate.getDay()] : '',
      ustoza: ustozaHidden ? ustozaHidden.value : ''
    };

    if (!validate(payload)){
      showInlineError(t('errValidate'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      let result = null;
      try { result = await res.json(); } catch (parseErr) { result = null; }

      if (result && result.success === false){
        console.warn('Backend error: ' + JSON.stringify(result));
        if (result.error === 'full'){
          showToast(t('errFull'));
          clearSlotSelection();
          loadAvailabilityAndRender();
        } else if (result.error === 'teacher_taken'){
          showToast(t('errTeacherTaken'));
          updateUstozaStep();
        } else if (result.error === 'missing_ustoza'){
          setFieldInvalid('ustoza', true);
          showInlineError(t('errUstoza'));
        } else {
          showToast(t('errGeneric'));
        }
        return;
      }

      form.reset();
      clearSlotSelection();
      if (selectedKurs) loadAvailabilityAndRender();
      openModal();

    } catch (err) {
      console.error('Error submitting form:', err);
      showToast(t('errNetwork'));
    } finally {
      setLoading(false);
    }
  });

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
      kursValueEl.textContent = t(COURSE_KEYS[selectedKurs]);
    }
    if (ttWrapper && ttWrapper.style.display !== 'none'){
      renderGrid();
      updateSelectedInfo();
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
});
