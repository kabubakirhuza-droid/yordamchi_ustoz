/**
 * ZIN-NUR AKADEMIYASI (SERGELI) - TO'LIQ GOOGLE APPS SCRIPT BACKEND
 * 
 * Ushbu kod:
 * 1. Asosiy sayt (https://www.zinnursupport-ser.uz/) uchun bandlik va ro'yxatdan o'tishni boshqaradi.
 * 2. Admin Panel (https://sergeli-admin.vercel.app/) uchun barcha arizalarni, ustozalarni,
 *    kurslarni va sozlamalarni sinxronlaydi.
 * 3. Oylik matrisa jadvallari (Kurs — Oy Yil) va umumiy "Royxat" varag'ini bir vaqtning o'zida yuritadi.
 */

// Standart sig'imlar
const CAPACITIES = {
  "Arab tili - Harf": 4,
  "Arab tili - Qoida": 4,
  "Arab tili - Amaliyot": 4,
  "Arab tili grammatikasi": 4,
  "Ingliz tili": 1,
  "Nurli Bolajon": 1
};

// Standart dars vaqtlari
const COURSE_SLOTS = {
  "Arab tili - Harf": buildSlots_(9, 0, 17, 0, 30),
  "Arab tili - Qoida": buildSlots_(9, 0, 17, 0, 30),
  "Arab tili - Amaliyot": buildSlots_(9, 0, 17, 0, 30),
  "Arab tili grammatikasi": buildSlots_(9, 0, 17, 0, 30),
  "Ingliz tili": buildSlots_(9, 0, 12, 0, 30),
  "Nurli Bolajon": buildSlots_(13, 0, 17, 0, 30)
};

// Standart ustoza biriktirmalari
const COURSE_TEACHERS_ = {
  "Arab tili - Harf": ["Feruza ustoza", "Xadicha Ustoza"],
  "Arab tili - Qoida": ["Feruza ustoza", "Xadicha Ustoza"],
  "Arab tili - Amaliyot": ["Feruza ustoza", "Xadicha Ustoza"],
  "Arab tili grammatikasi": [],
  "Ingliz tili": [],
  "Nurli Bolajon": []
};

const TEACHER_COURSES_ = Object.keys(COURSE_TEACHERS_);
const TEACHERS_ = Array.from(new Set([].concat.apply([], Object.values(COURSE_TEACHERS_))));

const HEADER_DATE_ROW = 1;
const HEADER_DOW_ROW = 2;
const FIRST_TIME_ROW = 3;
const TIME_COL = 1;

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
const UZ_DAYS = ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];

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
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function monthKeyFromDateStr_(sanaStr){
  const parts = String(sanaStr || '').trim().split('.');
  if (parts.length !== 3) return null;
  return `${parts[1]}.${parts[2]}`;
}

function sheetNameFor_(kurs, monthKey){
  const parts = monthKey.split('.');
  const monthIdx = Number(parts[0]) - 1;
  const year = parts[1];
  const monthLabel = (UZ_MONTHS[monthIdx] || parts[0]) + ' ' + year;
  return `${kurs} — ${monthLabel}`;
}

function currentMonthKey_(){
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM.yyyy');
}

// Admin paneldan kelgan dinamik sozlamalarni olish (mavjud bo'lsa)
function getAppConfig_(){
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('APP_CONFIG');
    if (raw) {
      const parsed = JSON.parse(raw);
      return (parsed && parsed.config) ? parsed.config : parsed;
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Sozlamalar');
    if (sheet){
      const zVal = sheet.getRange(1, 26).getValue();
      if (zVal && String(zVal).trim().startsWith('{')) {
        const parsed = JSON.parse(zVal);
        return (parsed && parsed.config) ? parsed.config : parsed;
      }
      if (sheet.getLastRow() >= 2){
        const val = sheet.getRange(2, 1).getValue();
        if (val && String(val).trim().startsWith('{')) {
          const parsed = JSON.parse(val);
          return (parsed && parsed.config) ? parsed.config : parsed;
        }
      }
    }
  } catch (e) {}
  return null;
}

function findCourseConfig_(kurs){
  if (!kurs) return null;
  const cfg = getAppConfig_();
  if (!cfg || !cfg.courses) return null;
  const cleanKurs = String(kurs).trim().toLowerCase();

  if (Array.isArray(cfg.courses)){
    for (let i = 0; i < cfg.courses.length; i++){
      const c = cfg.courses[i];
      if (!c) continue;
      const cName = typeof c === 'string' ? c : (c.name || '');
      if (cName.trim().toLowerCase() === cleanKurs){
        return typeof c === 'object' ? c : { name: c };
      }
    }
  } else if (typeof cfg.courses === 'object'){
    if (cfg.courses[kurs]) return cfg.courses[kurs];
    for (let k in cfg.courses){
      if (k.trim().toLowerCase() === cleanKurs){
        return cfg.courses[k];
      }
    }
  }
  return null;
}

function getEffectiveSlots_(kurs){
  const c = findCourseConfig_(kurs);
  if (c){
    let startH = 9, startM = 0, endH = 17, endM = 0, step = 30;
    if (c.startTime){
      const p = String(c.startTime).split(':');
      startH = Number(p[0]) || 9;
      startM = Number(p[1]) || 0;
    } else if (c.startHour !== undefined){
      startH = Number(c.startHour) || 9;
      startM = Number(c.startMin) || 0;
    }
    if (c.endTime){
      const p = String(c.endTime).split(':');
      endH = Number(p[0]) || 17;
      endM = Number(p[1]) || 0;
    } else if (c.endHour !== undefined){
      endH = Number(c.endHour) || 17;
      endM = Number(c.endMin) || 0;
    }
    step = Number(c.slotDuration || c.stepMin) || 30;
    return buildSlots_(startH, startM, endH, endM, step);
  }
  return COURSE_SLOTS[kurs] || buildSlots_(9, 0, 17, 0, 30);
}

function getEffectiveCapacity_(kurs){
  const c = findCourseConfig_(kurs);
  if (c && c.capacity){
    return Number(c.capacity);
  }
  return CAPACITIES[kurs] || 4;
}

function getEffectiveTeachers_(kurs){
  const cfg = getAppConfig_();
  const cleanKurs = String(kurs || '').trim().toLowerCase();

  if (cfg && cfg.courseTeachers){
    if (Array.isArray(cfg.courseTeachers[kurs])) return cfg.courseTeachers[kurs];
    for (let k in cfg.courseTeachers){
      if (k.trim().toLowerCase() === cleanKurs && Array.isArray(cfg.courseTeachers[k])){
        return cfg.courseTeachers[k];
      }
    }
  }

  if (cfg && Array.isArray(cfg.teachers)){
    const matched = [];
    cfg.teachers.forEach(t => {
      if (!t || !t.name || t.active === false) return;
      const tCourses = Array.isArray(t.courses) ? t.courses : (typeof t.courses === 'string' ? t.courses.split(',').map(s => s.trim()) : []);
      if (tCourses.some(cName => String(cName).trim().toLowerCase() === cleanKurs)){
        matched.push(t.name);
      }
    });
    if (matched.length > 0) return matched;
  }

  return COURSE_TEACHERS_[kurs] || [];
}

function findMatchingSheet_(ss, kurs, monthKey){
  const parts = monthKey.split('.');
  const monthIdx = Number(parts[0]) - 1;
  const year = parts[1];
  const monthName = (UZ_MONTHS[monthIdx] || parts[0]).toLowerCase();
  
  const cleanKurs = kurs.trim().toLowerCase();
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++){
    const name = sheets[i].getName();
    const cleanName = name.trim().toLowerCase();
    if (cleanName.includes(cleanKurs) && (cleanName.includes(monthName) || cleanName.includes(parts[0])) && cleanName.includes(year)){
      return sheets[i];
    }
  }
  return null;
}

function getOrCreateCourseSheet_(kurs, monthKey){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = findMatchingSheet_(ss, kurs, monthKey);
  if (existing) return existing;

  const sheetName = sheetNameFor_(kurs, monthKey);
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  sheet = ss.insertSheet(sheetName);
  sheet.getRange(HEADER_DOW_ROW, TIME_COL).setValue('Vaqti');

  const slots = getEffectiveSlots_(kurs);
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

function normalizeTimeStr_(val){
  if (!val && val !== 0) return "";
  if (Object.prototype.toString.call(val) === '[object Date]'){
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'HH:mm');
  }
  const str = String(val || '').trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return Utilities.formatString('%02d:%s', Number(match[1]), match[2]);
  }
  return str;
}

function findTimeRow_(sheetOrKurs, kursOrVaqt, maybeVaqt){
  let targetSheet = null;
  let kurs = "";
  let vaqt = "";

  if (sheetOrKurs && typeof sheetOrKurs === 'object' && typeof sheetOrKurs.getLastRow === 'function'){
    targetSheet = sheetOrKurs;
    kurs = kursOrVaqt || "";
    vaqt = maybeVaqt || "";
  } else {
    kurs = sheetOrKurs || "";
    vaqt = kursOrVaqt || "";
  }

  const cleanVaqt = normalizeTimeStr_(vaqt);

  if (targetSheet){
    const lastRow = targetSheet.getLastRow();
    if (lastRow >= FIRST_TIME_ROW){
      const timeVals = targetSheet.getRange(FIRST_TIME_ROW, TIME_COL, lastRow - FIRST_TIME_ROW + 1, 1).getValues();
      for (let i = 0; i < timeVals.length; i++){
        if (normalizeTimeStr_(timeVals[i][0]) === cleanVaqt){
          return FIRST_TIME_ROW + i;
        }
      }
    }
  }

  const slots = getEffectiveSlots_(kurs);
  for (let i = 0; i < slots.length; i++){
    if (normalizeTimeStr_(slots[i]) === cleanVaqt){
      return FIRST_TIME_ROW + i;
    }
  }
  return null;
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

function getTeacherCounts_(kurs, sana, vaqt){
  const counts = {};
  const courseTeachers = getEffectiveTeachers_(kurs);
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

  const timeRow = findTimeRow_(sheet, kurs, vaqt);
  if (!timeRow) return counts;

  const cellValue = sheet.getRange(timeRow, dateCol).getValue();
  const entries = cellEntries_(cellValue);

  courseTeachers.forEach(name => {
    counts[name] = entries.filter(line => line.indexOf(name) !== -1).length;
  });
  return counts;
}

// -------------------------------------------------------------
// ADMIN PANEL UCHUN: ARIZALARNI SAQLASH VA O'QISH ("Royxat" VARAG'I)
// -------------------------------------------------------------

function appendBookingToLogSheet_(b){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Royxat');
  if (!sheet){
    sheet = ss.insertSheet('Royxat');
    const headers = [
      "ID", "Ariza vaqti", "Ism", "Familiya", "Telefon",
      "Kurs", "Ustoza", "Sana", "Dars vaqti", "Slot", "Holat"
    ];
    const hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setFontWeight('bold')
          .setBackground('#10B981')
          .setFontColor('#FFFFFF')
          .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 100);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 110);
    sheet.setColumnWidth(4, 110);
    sheet.setColumnWidth(5, 140);
    sheet.setColumnWidth(6, 170);
    sheet.setColumnWidth(7, 140);
    sheet.setColumnWidth(8, 100);
    sheet.setColumnWidth(9, 90);
    sheet.setColumnWidth(10, 160);
    sheet.setColumnWidth(11, 110);
  }

  // Ustun formatini matn qilib qo'yish
  sheet.getRange(1, 5, Math.max(sheet.getMaxRows(), 2), 1).setNumberFormat('@');

  const id = 'B-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMddHHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');

  // Telefon raqami "+" bilan boshlansa, Google Sheets uni formula deb o'ylab #ERROR! bermasligi uchun apostrof qo'shish
  let telStr = String(b.telefon || '').trim();
  if (telStr.startsWith('+')) {
    telStr = "'" + telStr;
  }

  const row = [
    id,
    b.yuborilgan_vaqt || nowStr,
    b.ism,
    b.familiya,
    telStr,
    b.kurs,
    b.ustoza || '—',
    b.sana,
    b.vaqt,
    `${b.sana} ${b.vaqt}`,
    'Yangi'
  ];
  sheet.appendRow(row);
  return id;
}

function repairRoyxatPhoneErrors_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Royxat');
  if (!sheet || sheet.getLastRow() <= 1) return 0;

  const numRows = sheet.getLastRow() - 1;
  const colRange = sheet.getRange(2, 5, numRows, 1);
  colRange.setNumberFormat('@');
  const formulas = colRange.getFormulas();
  const values = colRange.getValues();
  let fixedCount = 0;

  for (let i = 0; i < numRows; i++){
    let form = formulas[i][0];
    let val = String(values[i][0] || '');

    if (val === '#ERROR!' || (form && form.startsWith('+')) || (form && form.startsWith('=+'))) {
      let clean = form || val;
      if (clean.startsWith('=')) clean = clean.substring(1);
      if (clean.startsWith('+')) clean = "'" + clean;
      sheet.getRange(i + 2, 5).setValue(clean);
      fixedCount++;
    }
  }
  return fixedCount;
}

function getAllBookings_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('Royxat');
  const list = [];

  // Mavjud #ERROR! telefonlarni avtomatik tuzatish
  try { repairRoyxatPhoneErrors_(); } catch(e) {}

  // 1. Agar "Royxat" varag'i mavjud bo'lsa va unda arizalar bo'lsa:
  if (logSheet && logSheet.getLastRow() > 1){
    const numRows = logSheet.getLastRow() - 1;
    const data = logSheet.getRange(2, 1, numRows, 11).getValues();
    const formulas = logSheet.getRange(2, 5, numRows, 1).getFormulas();
    for (let i = 0; i < data.length; i++){
      const r = data[i];
      if (!r[2] && !r[4]) continue;

      let tel = String(r[4] || '');
      if (tel === '#ERROR!' && formulas[i] && formulas[i][0]) {
        tel = formulas[i][0].replace(/^=/, '');
      }
      list.push({
        id: String(r[0] || ('B-' + (i + 1))),
        vaqt: String(r[1] || ''),
        ism: String(r[2] || ''),
        familiya: String(r[3] || ''),
        telefon: String(r[4] || ''),
        kurs: String(r[5] || ''),
        ustoza: String(r[6] || '—'),
        sana: String(r[7] || ''),
        dars_vaqti: String(r[8] || ''),
        slot: String(r[9] || (r[7] + ' ' + r[8])),
        status: String(r[10] || 'Yangi')
      });
    }
    return list.reverse();
  }

  // 2. Agar "Royxat" bo'sh bo'lsa, oylik matrisa jadvallaridagi barcha talabalarni o'qib chiqish:
  const sheets = ss.getSheets();
  let idCounter = 1;
  for (let s = 0; s < sheets.length; s++){
    const sheet = sheets[s];
    const sheetName = sheet.getName();
    if (sheetName === 'Royxat' || sheetName === 'Sozlamalar' || sheetName.indexOf('—') === -1) continue;

    const kursName = sheetName.split('—')[0].trim();
    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    if (lastCol < 2 || lastRow < FIRST_TIME_ROW) continue;

    const dateHeaders = sheet.getRange(HEADER_DATE_ROW, 2, 1, lastCol - 1).getValues()[0];
    const timeSlots = sheet.getRange(FIRST_TIME_ROW, TIME_COL, lastRow - FIRST_TIME_ROW + 1, 1).getValues();
    const cells = sheet.getRange(FIRST_TIME_ROW, 2, lastRow - FIRST_TIME_ROW + 1, lastCol - 1).getValues();

    for (let c = 0; c < dateHeaders.length; c++){
      const sanaStr = normalizeDateStr_(dateHeaders[c]);
      if (!sanaStr) continue;

      for (let r = 0; r < timeSlots.length; r++){
        const timeStr = String(timeSlots[r][0] || '').trim();
        const cellVal = cells[r][c];
        if (!cellVal) continue;

        const entries = cellEntries_(cellVal);
        for (let e = 0; e < entries.length; e++){
          const line = entries[e];
          const parts = line.split('—').map(p => p.trim());
          const fullName = parts[0] || '';
          const nameParts = fullName.split(' ');
          const ism = nameParts[0] || '';
          const familiya = nameParts.slice(1).join(' ') || '';
          const telefon = parts[1] || '';
          const kurs = parts[2] || kursName;
          const ustoza = parts[3] || '—';

          list.push({
            id: 'LEGACY-' + (idCounter++),
            vaqt: sanaStr,
            ism: ism,
            familiya: familiya,
            telefon: telefon,
            kurs: kurs,
            ustoza: ustoza,
            sana: sanaStr,
            dars_vaqti: timeStr,
            slot: `${sanaStr} ${timeStr}`,
            status: 'Tasdiqlangan'
          });
        }
      }
    }
  }

  return list.reverse();
}

function saveConfig_(data){
  let cfg = (data && data.config) ? data.config : data;
  if (cfg && cfg.config) cfg = cfg.config;

  // 1. Script properties ga toza JSON saqlash
  try {
    PropertiesService.getScriptProperties().setProperty('APP_CONFIG', JSON.stringify(cfg));
  } catch (propErr) {
    Logger.log("ScriptProperties error: " + propErr);
  }

  // 2. Sozlamalar varag'ini chiroyli jadval qilib to'ldirish
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Sozlamalar');
  if (!sheet){
    sheet = ss.insertSheet('Sozlamalar');
  }

  // Backup JSON in cell Z1 (column 26) so it never gets lost
  try {
    sheet.getRange(1, 26).setValue(JSON.stringify(cfg));
  } catch (zErr) {}

  renderSettingsSheet_(sheet, cfg);

  // 3. Avtomatik ravishda barcha kurslar uchun oylik jadvallarni (varaq / tab) yaratish
  try {
    const curMonth = currentMonthKey_();
    let coursesList = [];
    if (cfg && cfg.courses) {
      if (Array.isArray(cfg.courses)) {
        coursesList = cfg.courses.map(c => typeof c === 'string' ? c : (c.name || '')).filter(Boolean);
      } else if (typeof cfg.courses === 'object') {
        coursesList = Object.keys(cfg.courses);
      }
    }
    if (coursesList.length === 0) {
      coursesList = Object.keys(COURSE_SLOTS);
    }

    coursesList.forEach(function(kursName) {
      if (kursName && String(kursName).trim()) {
        getOrCreateCourseSheet_(String(kursName).trim(), curMonth);
      }
    });
  } catch (sheetErr) {
    Logger.log("Error creating course sheets: " + sheetErr);
  }

  // 4. O'chirilgan kurslar varaqlarini (tablarini) Google Sheets dan butunlay o'chirish
  try {
    if (cfg && Array.isArray(cfg.deletedCourses) && cfg.deletedCourses.length > 0) {
      const delCourses = cfg.deletedCourses.map(function(s){ return String(s || '').trim().toLowerCase(); }).filter(Boolean);
      const allSheets = ss.getSheets();
      for (let s = 0; s < allSheets.length; s++) {
        const sh = allSheets[s];
        const shName = sh.getName();
        const cleanName = shName.trim().toLowerCase();
        // Tizim varaqlarini saqlab qolish
        if (cleanName === 'sozlamalar' || cleanName === 'royxat') continue;

        for (let d = 0; d < delCourses.length; d++) {
          const dName = delCourses[d];
          if (!dName) continue;
          if (cleanName === dName || cleanName.indexOf(dName) !== -1) {
            if (ss.getSheets().length > 1) {
              ss.deleteSheet(sh);
            }
            break;
          }
        }
      }
    }
  } catch (delSheetErr) {
    Logger.log("Error deleting course sheets: " + delSheetErr);
  }

  SpreadsheetApp.flush();
}

function renderSettingsSheet_(sheet, cfg){
  sheet.clear();
  sheet.clearFormats();

  // Bosh sarlavha
  sheet.getRange(1, 1).setValue("ZIN-NUR AKADEMIYASI — ASOSIY SOZLAMALAR");
  sheet.getRange(1, 1, 1, 7).merge();
  sheet.getRange(1, 1).setBackground("#1b5e20").setFontColor("#ffffff").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);

  let curRow = 3;

  // 1. KURSLAR RO'YXATI
  sheet.getRange(curRow, 1).setValue("1. KURSLAR VA DARS VAQTLARI");
  sheet.getRange(curRow, 1, 1, 7).merge();
  sheet.getRange(curRow, 1).setBackground("#e8f5e9").setFontWeight("bold").setFontSize(11);
  curRow++;

  const courseHeaders = ["#", "Kurs nomi", "Boshlanish", "Tugash", "Qadam (daq)", "Sig'imi (nafar)", "Holati"];
  sheet.getRange(curRow, 1, 1, courseHeaders.length).setValues([courseHeaders]);
  sheet.getRange(curRow, 1, 1, courseHeaders.length).setBackground("#c8e6c9").setFontWeight("bold").setHorizontalAlignment("center");
  curRow++;

  let courses = [];
  if (cfg && cfg.courses) {
    if (Array.isArray(cfg.courses)) {
      courses = cfg.courses;
    } else if (typeof cfg.courses === 'object') {
      courses = Object.entries(cfg.courses).map(([name, c]) => ({
        name: name,
        startTime: (c.startHour ? Utilities.formatString('%02d:%02d', c.startHour, c.startMin||0) : '09:00'),
        endTime: (c.endHour ? Utilities.formatString('%02d:%02d', c.endHour, c.endMin||0) : '17:00'),
        slotDuration: c.stepMin || 30,
        capacity: c.capacity || 4,
        active: true
      }));
    }
  }

  if (courses.length > 0) {
    const courseRows = courses.map((c, i) => [
      i + 1,
      typeof c === 'string' ? c : (c.name || ''),
      c.startTime || '09:00',
      c.endTime || '17:00',
      c.slotDuration || 30,
      c.capacity || 4,
      c.active !== false ? "Faol" : "Nofaol"
    ]);
    sheet.getRange(curRow, 1, courseRows.length, courseHeaders.length).setValues(courseRows);
    sheet.getRange(curRow, 1, courseRows.length, courseHeaders.length).setHorizontalAlignment("center");
    sheet.getRange(curRow, 2, courseRows.length, 1).setHorizontalAlignment("left");
    curRow += courseRows.length;
  } else {
    sheet.getRange(curRow, 1, 1, courseHeaders.length).setValue("Kurslar kiritilmagan");
    curRow++;
  }

  curRow += 2;

  // 2. USTOZALAR RO'YXATI
  sheet.getRange(curRow, 1).setValue("2. USTOZALAR RO'YXATI");
  sheet.getRange(curRow, 1, 1, 6).merge();
  sheet.getRange(curRow, 1).setBackground("#e8f5e9").setFontWeight("bold").setFontSize(11);
  curRow++;

  const teacherHeaders = ["#", "Ustoza F.I.SH", "Telefon / Login", "PIN kod", "Biriktirilgan kurslar", "Ish vaqti"];
  sheet.getRange(curRow, 1, 1, teacherHeaders.length).setValues([teacherHeaders]);
  sheet.getRange(curRow, 1, 1, teacherHeaders.length).setBackground("#c8e6c9").setFontWeight("bold").setHorizontalAlignment("center");
  curRow++;

  let teachers = [];
  if (cfg && Array.isArray(cfg.teachers)) {
    teachers = cfg.teachers;
  }

  if (teachers.length > 0) {
    const teacherRows = teachers.map((t, i) => [
      i + 1,
      t.name || '',
      t.phone || t.login || '',
      t.pin || '',
      Array.isArray(t.courses) ? t.courses.join(', ') : '',
      `${t.startTime || '09:00'} — ${t.endTime || '17:00'}`
    ]);
    sheet.getRange(curRow, 1, teacherRows.length, teacherHeaders.length).setValues(teacherRows);
    sheet.getRange(curRow, 1, teacherRows.length, teacherHeaders.length).setHorizontalAlignment("center");
    sheet.getRange(curRow, 2, teacherRows.length, 1).setHorizontalAlignment("left");
    curRow += teacherRows.length;
  } else {
    sheet.getRange(curRow, 1, 1, teacherHeaders.length).setValue("Hozircha ustozalar yo'q");
    curRow++;
  }

  // Ustunlar kengligini chiroyli moslash
  sheet.setColumnWidth(1, 45);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 110);
  sheet.setColumnWidth(5, 260);
  sheet.setColumnWidth(6, 140);
  sheet.setColumnWidth(7, 100);

  // Tizim uchun zaxira JSON ni Z1 ga yozish
  sheet.getRange(1, 26).setValue(JSON.stringify(cfg));
}

function deleteBooking_(id){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Royxat');
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < data.length; i++){
    if (String(data[i][0]) === String(id)){
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

function updateBookingStatus_(id, status){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Royxat');
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < data.length; i++){
    if (String(data[i][0]) === String(id)){
      sheet.getRange(i + 2, 11).setValue(status);
      break;
    }
  }
}

// -------------------------------------------------------------
// HTTP GET SO'ROVLARI (doGet)
// -------------------------------------------------------------

function doGet(e){
  const action = e && e.parameter ? e.parameter.action : '';

  // 1. Admin Panel: Barcha arizalarni olish
  if (action === 'get_bookings'){
    return jsonOutput_(getAllBookings_());
  }

  // 2. Admin Panel & Sayt: Konfiguratsiya va sozlamalarni olish
  if (action === 'get_config' || action === 'getConfig'){
    const cfg = getAppConfig_() || {};
    const defaultTeacherSchedule = {
      "Feruza ustoza":  { offDays: [0], start: "13:00", end: "17:00" },
      "Xadicha Ustoza": { offDays: [6], start: "09:00", end: "17:00" }
    };
    const defaultTeachers = [
      { id: "t_1790852387410", name: "Feruza ustoza", login: "+998 99 999 99 99", phone: "+998 99 999 99 99", pin: "9999", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"], startTime: "13:00", endTime: "17:00", daysOff: [0] },
      { id: "t_1790859927339", name: "Xadicha Ustoza", login: "+998 11 111 11 1", phone: "+998 11 111 11 1", pin: "1111", courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"], startTime: "09:00", endTime: "17:00", daysOff: [6] }
    ];
    const defaultCourses = [
      { id: "c1", name: "Arab tili - Harf", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
      { id: "c2", name: "Arab tili - Qoida", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
      { id: "c3", name: "Arab tili - Amaliyot", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
      { id: "c4", name: "Arab tili grammatikasi", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
      { id: "c5", name: "Ingliz tili", startTime: "09:00", endTime: "12:00", slotDuration: 30, capacity: 1, active: true },
      { id: "c6", name: "Nurli Bolajon", startTime: "13:00", endTime: "17:00", slotDuration: 30, capacity: 1, active: true }
    ];

    let finalCourses = (cfg.courses && cfg.courses.length > 0) ? cfg.courses : defaultCourses;
    const deletedCoursesList = cfg.deletedCourses || [];
    if (Array.isArray(finalCourses) && deletedCoursesList.length > 0) {
      const delSet = deletedCoursesList.map(function(s){ return String(s || '').trim().toLowerCase(); });
      finalCourses = finalCourses.filter(function(c) {
        const name = typeof c === 'string' ? c : (c.name || '');
        const id = typeof c === 'object' && c.id ? String(c.id).toLowerCase() : '';
        return delSet.indexOf(name.trim().toLowerCase()) === -1 && (id ? delSet.indexOf(id) === -1 : true);
      });
    }

    return jsonOutput_({
      config: cfg,
      district: "sergeli",
      teachers: (cfg.teachers && cfg.teachers.length > 0) ? cfg.teachers : defaultTeachers,
      courses: finalCourses,
      courseTeachers: cfg.courseTeachers || COURSE_TEACHERS_,
      teacherSchedule: cfg.teacherSchedule || defaultTeacherSchedule,
      deletedTeachers: cfg.deletedTeachers || [],
      deletedCourses: cfg.deletedCourses || [],
      holidayDates: cfg.holidayDates || ["31.08.2026", "01.09.2026"],
      courseExcludedDays: cfg.courseExcludedDays || { "Nurli Bolajon": [0, 1, 2, 3, 5, 6] }
    });
  }

  // 3. Asosiy sayt: Bandlik xaritasini olish
  if (action === 'availability'){
    const kurs = e.parameter.kurs;
    const slots = getEffectiveSlots_(kurs);
    if (!kurs || !slots || slots.length === 0){
      return jsonOutput_({ error: "kurs noto'g'ri yoki ko'rsatilmagan" });
    }

    const monthKey = e.parameter.oy || currentMonthKey_();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = sheetNameFor_(kurs, monthKey);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonOutput_({});

    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    if (lastCol < 2 || lastRow < FIRST_TIME_ROW) return jsonOutput_({});

    const dateHeaders = sheet.getRange(HEADER_DATE_ROW, 2, 1, lastCol - 1).getValues()[0];
    const numRows = Math.min(slots.length, lastRow - FIRST_TIME_ROW + 1);
    const body = sheet.getRange(FIRST_TIME_ROW, 2, numRows, lastCol - 1).getValues();

    const teachers = getEffectiveTeachers_(kurs);
    const isTeacherCourse = teachers && teachers.length > 0;
    const cap = getEffectiveCapacity_(kurs);

    const map = {};
    for (let c = 0; c < dateHeaders.length; c++){
      const sanaStr = normalizeDateStr_(dateHeaders[c]);
      if (!sanaStr) continue;
      for (let r = 0; r < numRows; r++){
        const entries = cellEntries_(body[r][c]);
        let count;
        if (isTeacherCourse){
          count = teachers.filter(name => entries.filter(line => line.indexOf(name) !== -1).length >= cap).length;
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

  // 4. Asosiy sayt: Ustozalar bandligini olish
  if (action === 'ustozalar'){
    const kurs = e.parameter.kurs;
    const sana = e.parameter.sana;
    const vaqt = e.parameter.vaqt;

    const slots = getEffectiveSlots_(kurs);
    if (!kurs || !slots || slots.length === 0 || !sana || !vaqt){
      return jsonOutput_({ error: "parametrlar noto'g'ri", counts: {}, capacity: 4 });
    }

    const teachers = getEffectiveTeachers_(kurs);
    if (!teachers || teachers.length === 0){
      return jsonOutput_({ counts: {}, capacity: 0 });
    }

    const counts = getTeacherCounts_(kurs, sana, vaqt);
    return jsonOutput_({ counts: counts, capacity: getEffectiveCapacity_(kurs) });
  }

  return jsonOutput_({ error: "Noma'lum action" });
}

// -------------------------------------------------------------
// HTTP POST SO'ROVLARI (doPost)
// -------------------------------------------------------------

function doPost(e){
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err){
    return jsonOutput_({ success: false, error: 'invalid_json' });
  }

  // 1. Admin Panel: Sozlamalarni saqlash
  if (data.action === 'save_config' || data.action === 'saveConfig'){
    try {
      saveConfig_(data);
      return jsonOutput_({ success: true, message: "Sozlamalar muvaffaqiyatli saqlandi" });
    } catch (cfgErr){
      return jsonOutput_({ success: false, error: String(cfgErr) });
    }
  }

  // 2. Admin Panel: Arizani o'chirish
  if (data.action === 'delete_booking' && data.id){
    try {
      deleteBooking_(data.id);
      return jsonOutput_({ success: true, message: "Ariza o'chirildi" });
    } catch (delErr){
      return jsonOutput_({ success: false, error: String(delErr) });
    }
  }

  // 3. Admin Panel: Statusni yangilash
  if (data.action === 'update_status' && data.id && data.status){
    try {
      updateBookingStatus_(data.id, data.status);
      return jsonOutput_({ success: true, message: "Status yangilandi" });
    } catch (updErr){
      return jsonOutput_({ success: false, error: String(updErr) });
    }
  }

  // 4. Asosiy sayt: Yangi talaba ro'yxatdan o'tishi
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

  const courseSlots = getEffectiveSlots_(kurs);
  const capacity = getEffectiveCapacity_(kurs);
  if (!capacity || !courseSlots || courseSlots.length === 0){
    return jsonOutput_({ success: false, error: 'unknown_course', kurs: kurs });
  }

  const monthKey = monthKeyFromDateStr_(sana);
  if (!monthKey){
    return jsonOutput_({ success: false, error: 'invalid_date', sana: sana });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    let dowLabel = data.kun || '';
    if (!dowLabel){
      const parts = sana.split('.');
      if (parts.length === 3){
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        dowLabel = UZ_DAYS[d.getDay()];
      }
    }

    const sheet = getOrCreateCourseSheet_(kurs, monthKey);
    const timeRow = findTimeRow_(sheet, kurs, vaqt);
    if (!timeRow){
      return jsonOutput_({ success: false, error: 'unknown_time', vaqt: vaqt, kurs: kurs });
    }

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
      ? `${ism} ${familiya} — ${telefon} — ${kurs} — ${ustoza}`
      : `${ism} ${familiya} — ${telefon} — ${kurs}`;
    existingEntries.push(newLine);
    cell.setValue(existingEntries.join('\n'));
    cell.setWrap(true).setVerticalAlignment('top');

    // Admin Panel uchun "Royxat" varag'iga ham qo'shib boramiz:
    const bookingId = appendBookingToLogSheet_({
      yuborilgan_vaqt: data.yuborilgan_vaqt,
      ism: ism,
      familiya: familiya,
      telefon: telefon,
      kurs: kurs,
      ustoza: ustoza,
      sana: sana,
      vaqt: vaqt,
      kun: dowLabel
    });

    SpreadsheetApp.flush();

    try { updateStatistikaCharts(); } catch (chartErr) {}

    return jsonOutput_({ success: true, bookingId: bookingId });
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

function updateStatistikaCharts(){
  // Statistika grafiklarini yangilash uchun zaxira funksiya
}
