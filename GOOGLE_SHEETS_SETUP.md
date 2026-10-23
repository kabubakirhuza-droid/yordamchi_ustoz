# Supabase va Google Sheets ulanishi

Sayt → Vercel API → Supabase support-api → support_bookings va support_sheet_outbox → filialning Google Apps Script ilovasi → kurs — oy jadvali.

Ariza Supabase tranzaksiyasi tasdiqlangach sayt muvaffaqiyat ko‘rsatadi. requestId bir xil so‘rov qayta yuborilganda dublikatni oldini oladi. Sheets vaqtincha javob bermasa, navbat saqlanadi va support-sheets-retry har daqiqada qayta tekshiradi. Royxat ichki tarix sifatida yashiriladi; ariza kursning sana/vaqt hujayrasiga yoziladi.

Sergeli va Uchtepa ma’lumotlari district bilan ajratilgan va alohida Google jadvallariga yuboriladi. Admin sozlamalari va ustoz davomat/eslatmalari serverda saqlanadi. Ochiq konfiguratsiya ustoz PIN va loginlarini bermaydi.

## Server sozlamalari

Vercel production va preview muhitlarida SUPPORT_BACKEND_URL, SUPPORT_ANON_KEY, SUPPORT_GATEWAY_TOKEN va AUTH_SECRET kerak. Maxfiy kalitlar repoga yozilmaydi. Supabase Vault ichidagi support_gateway_token va support_anon_key avtomatik ishchiga xizmat qiladi. support_* jadvallari faqat server roli uchun ochiq.

Supabase sxemasi va Edge Function manbasi Sergeli reposining supabase/ papkasida. Migratsiyalar mavjud LMS jadvallarini o‘zgartirmaydi. Admin hisoblari maxfiy tarzda alohida yaratiladi.

## Oylik jadvallar

support-monthly-sheets har kuni Toshkent vaqti bilan 00:05 da joriy oy uchun sozlamalar sinxronlashini navbatga qo‘yadi; har filial/oy uchun bitta vazifa yaratiladi. Apps Script yangi kurs — oy varaqlarini ochadi, eski oylarni saqlaydi. Ariza kelganda kerakli oy varag‘i ham yaratiladi.

Code.gs GitHub yangilanishi bilan Google ichida avtomatik yangilanmaydi. Mavjud Apps Script loyihasidagi asosiy faylni yangilab, Deploy → Manage deployments → Edit → New version orqali aynan mavjud Web app versiyasini yangilang. Alohida Statistika.gs faylini saqlang. restoreMonthlyTimetables tiklash vositasi; uni muntazam ish sifatida ishga tushirmang.

## Tekshiruv

node tests/sync.cjs
node tests/monthly-sheets.cjs
node tests/sheets-idempotency.cjs
node tests/public-config.cjs

Sergeli tools/verify-support-backend.mjs xususiy tekshiruv papkasi bilan admin/ustoz kirishi, filial izolyatsiyasi va davomatni tekshiradi. tools/verify-sheets-e2e.mjs register/cleanup bosqichlari aniq belgilangan sinov arizasini yaratib, takror so‘rovni va Sheets navbatini tekshiradi. Sinovdan keyin cleanup bajaring. Ishlab turgan serverda bu vositalar haqiqiy yozuv yaratadi.
