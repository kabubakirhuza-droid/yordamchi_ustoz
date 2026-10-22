# Sergeli: Google Sheets jadvalini tiklash

Sayt → /api/sync → Google Apps Script → kursning oylik jadvali va Royxat.

GitHub/Vercel yangilanishi Code.gs kodini Google Apps Script ichida avtomatik yangilamaydi.

1. Shu sayt ulangan Google jadvalida Extensions → Apps Script ni oching.
2. Mavjud kodning nusxasini saqlang. Ushbu repodagi Code.gs bilan kodni yangilang.
3. restoreMonthlyTimetables funksiyasini bir marta Run qiling. U Royxatdagi telefon formulalarini tuzatadi va yetishmayotgan arizalarni kurs — oy jadvallariga ko‘chiradi. Mavjud hujayralarni tozalamaydi; aynan bir xil satrni qayta qo‘shmaydi. Qaytgan restored sonini tekshiring.
4. Deploy → Manage deployments → mavjud Web app → Edit → New version → Deploy. Mavjud deployment URL saqlansin; yangi deployment ochmang.
5. Jadvaldagi kurs — oy varaqlarini tekshiring. Royxat admin tarixi uchun saqlanadi.
6. Saytdan haqiqiy ariza yuborib, bookingId qaytishini va tanlangan sana/vaqt hujayrasiga yozilishini tekshiring.

Tekshiruvlar: node tests/sync.cjs; node --check script.js; node --check api/sync.js.

restoreMonthlyTimetables asl telefon formulasi saqlanmagan #ERROR! qiymatlaridan raqamni tiklay olmaydi. Bunday raqamlarni asl manbadan tekshirish kerak.
