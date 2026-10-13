import Header from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function ImportStudents({searchParams}:{searchParams:Promise<{created?:string;updated?:string;skipped?:string;photos?:string;unmatched?:string}>}){
  const user=await requireUser(); if(user.role!=="admin")redirect("/dashboard"); const sp=await searchParams;
  return <><Header user={user}/><main className="appMain">
    <div className="head"><div><h1>ورود گروهی دانش‌آموزان</h1><p>این بخش فقط با فایل نمونه رسمی سامانه کار می‌کند.</p></div><Link className="btn" href="/manage">بازگشت</Link></div>
    {(sp.created!==undefined||sp.photos!==undefined)&&<div className="importSuccess">{sp.created!==undefined&&<><b>{sp.created}</b> جدید، <b>{sp.updated||0}</b> به‌روزرسانی، <b>{sp.skipped||0}</b> رد شد. </>}{sp.photos!==undefined&&<><b>{sp.photos}</b> عکس متصل شد، <b>{sp.unmatched||0}</b> بدون تطبیق.</>}</div>}
    <section className="templateDownload box"><div><span className="templateIcon">XLSX</span><div><h2>فایل نمونه رسمی</h2><p>نام چهار ستون ردیف اول را تغییر ندهید.</p></div></div><a className="primary btn" href="/shohada_nodeh_students_import_template.xlsx" download>دانلود نمونه Excel</a></section>
    <div className="exactColumns"><div><b>۱</b><span>نام و نام خانوادگی</span><small>اجباری</small></div><div><b>۲</b><span>کلاس</span><small>اجباری</small></div><div><b>۳</b><span>شماره تماس</span><small>اختیاری</small></div><div><b>۴</b><span>عکس</span><small>اختیاری</small></div></div>
    <div className="importGrid">
      <section className="box importCard"><div className="importCardIcon">XLSX</div><h2>ورود / همگام‌سازی Excel</h2><p>کلید همگام‌سازی <b>نام و نام خانوادگی + کلاس</b> است. رکورد تکراری ساخته نمی‌شود.</p><form action="/api/import/students" method="post" encType="multipart/form-data"><label>فایل Excel استاندارد</label><input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required/><button className="primary wide">ثبت و همگام‌سازی</button></form></section>
      <section className="box importCard"><div className="importCardIcon photoIcon">ZIP</div><h2>ورود گروهی عکس‌ها</h2><p>نام فایل عکس با ستون «عکس» تطبیق داده می‌شود؛ اگر آن ستون خالی باشد، نام فایل می‌تواند نام کامل دانش‌آموز باشد.</p><div className="photoRule"><code>علی احمدی.jpg</code><code>زهرا محمدی.png</code></div><form action="/api/import/photos" method="post" encType="multipart/form-data"><label>فایل ZIP عکس‌ها</label><input type="file" name="file" accept=".zip,application/zip" required/><button className="primary wide">بارگذاری عکس‌ها</button></form></section>
    </div>
  </main></>;
}
