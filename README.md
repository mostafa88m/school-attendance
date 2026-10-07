# سامانه حضور و غیاب فارسی — نسخه Vercel

این پروژه برای استقرار مستقیم روی Vercel ساخته شده است.

## امکانات
- فارسی و RTL
- تاریخ شمسی
- مدیر: مشاهده همه کلاس‌ها، لیست کل کلاس، غایبین هر کلاس با نام و عکس
- معلم: فقط کلاس خودش
- معلم می‌تواند دانش‌آموز را فقط در کلاس خودش ثبت کند
- ثبت فقط «حاضر / غایب»
- عکس دانش‌آموز در Vercel Private Blob
- PostgreSQL برای اطلاعات
- پرینت برای کلاس
- مدیر: ذخیره گزارش به PDF از طریق Print > Save as PDF
- مناسب Chrome اندروید و کامپیوتر
- بدون نصب نرم‌افزار برای مدیر یا معلم

## استقرار روی Vercel — روش پیشنهادی

### 1) GitHub
پوشه پروژه را در یک Repository خصوصی GitHub آپلود کنید.

### 2) Vercel
در Vercel:
- Add New > Project
- Repository را Import کنید
- Framework به صورت خودکار Next.js تشخیص داده می‌شود.

### 3) PostgreSQL
در Project > Storage / Marketplace یک PostgreSQL سازگار (مثلاً Neon Postgres یا یکی از Providerهای Marketplace) اضافه کنید.
باید Environment Variable زیر در پروژه موجود باشد:
DATABASE_URL

### 4) Vercel Blob
یک Blob Store برای Project بسازید و آن را روی Private قرار دهید.
این پروژه تصاویر دانش‌آموز را با access: "private" ذخیره می‌کند.

### 5) Environment Variables
در Settings > Environment Variables:
SESSION_SECRET = یک رشته طولانی و تصادفی
ADMIN_PASSWORD = رمز اولیه مدیر

DATABASE_URL معمولاً با اتصال دیتابیس به پروژه خودکار اضافه می‌شود.

### 6) Deploy
Redeploy را بزنید.

پس از Deploy یک آدرس مشابه این دریافت می‌کنید:
https://school-attendance-xxx.vercel.app

## ورود اولیه
Username: admin
Password: مقداری که برای ADMIN_PASSWORD تعریف کرده‌اید.

اگر ADMIN_PASSWORD تعریف نشود، در اولین Setup مقدار 123456 استفاده می‌شود؛ برای استفاده واقعی این کار توصیه نمی‌شود.

## استفاده روزانه
مدیر و معلمان فقط لینک vercel.app را در مرورگر باز می‌کنند.
هیچ برنامه‌ای روی ویندوز یا Android نصب نمی‌شود.

### Android
Chrome > لینک سایت > ورود با حساب معلم > کلاس خودش > حاضر/غایب > ثبت.

### مدیر
Chrome/Edge > لینک سایت > ورود مدیر > مشاهده همه کلاس‌ها و غایبین.

## PDF
در صفحه کلاس مدیر روی «ذخیره PDF» بزند و در پنجره چاپ:
Destination / Printer = Save as PDF
را انتخاب کند.

## نکات امنیتی
- Repository را Private نگه دارید.
- SESSION_SECRET و DATABASE_URL را در GitHub قرار ندهید.
- عکس‌ها در Blob خصوصی هستند و برای نمایش، لینک موقت امضاشده ایجاد می‌شود.
- بعد از راه‌اندازی از رمز قوی برای مدیر و معلمان استفاده کنید.


## نسخه 3
- ویرایش دانش‌آموز (نام، کلاس، عکس)
- ویرایش معلم (نام، نام کاربری، کلاس، رمز اختیاری)
- رابط کاربری حرفه‌ای‌تر و responsive
