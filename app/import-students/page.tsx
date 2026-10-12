import Header from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function ImportStudents({searchParams}:{searchParams:Promise<{imported?:string;updated?:string;skipped?:string;photos?:string;unmatched?:string}>}){
  const user=await requireUser(); if(user.role!=="admin")redirect("/dashboard"); const sp=await searchParams;
  return <><Header user={user}/><main className="appMain">
    <div className="head"><div><h1>ورود گروهی دانش‌آموزان</h1><p>فقط چهار ستون ثابت؛ بدون پیچیدگی و با قابلیت سینک</p></div><Link className="btn" href="/manage">بازگشت</Link></div>
    {(sp.imported||sp.photos)&&<div className="importSuccess">{sp.imported&&<>Excel سینک شد: <b>{sp.imported}</b> جدید، <b>{sp.updated||0}</b> به‌روزرسانی، <b>{sp.skipped||0}</b> رد شده.</>}{sp.photos&&<>عکس‌ها: <b>{sp.photos}</b> متصل، <b>{sp.unmatched||0}</b> بدون تطبیق.</>}</div>}
    <section className="box templateNotice"><div><h2>قالب استاندارد سامانه</h2><p>نام ستون‌ها و ترتیب آن‌ها را تغییر ندهید.</p></div><a className="btn primary" href="/sample-students.xlsx" download>دانلود نمونه Excel</a></section>
    <div className="importGrid">
      <section className="box importCard"><div className="importCardIcon">XLSX</div><h2>۱. ورود / سینک Excel</h2><div className="fixedColumns"><span>نام و نام خانوادگی</span><span>کلاس</span><span>شماره تماس</span><span>عکس</span></div><p>ستون «عکس» فقط نام فایل است و می‌تواند خالی باشد؛ مثلاً <b>علی احمدی.jpg</b>.</p><form action="/api/import/students" method="post" encType="multipart/form-data"><label>فایل Excel استاندارد</label><input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required/><button className="primary wide">سینک دانش‌آموزان</button></form></section>
      <section className="box importCard"><div className="importCardIcon photoIcon">ZIP</div><h2>۲. بارگذاری گروهی عکس‌ها</h2><p>اگر در Excel نام فایل عکس نوشته شده، همان فایل‌ها را داخل ZIP قرار دهید. اگر ستون عکس خالی است، نام فایل می‌تواند دقیقاً نام دانش‌آموز باشد.</p><div className="photoRule"><code>علی احمدی.jpg</code><code>محمد رضایی.png</code><small>اگر دو دانش‌آموز نام یکسان دارند، حتماً ستون «عکس» در Excel را با نام فایل متفاوت تکمیل کنید.</small></div><form action="/api/import/photos" method="post" encType="multipart/form-data"><label>فایل ZIP عکس‌ها</label><input type="file" name="file" accept=".zip,application/zip" required/><button className="primary wide">تطبیق و ثبت عکس‌ها</button></form></section>
    </div>
    <section className="box importHelp"><h2>روش استفاده</h2><div className="helpSteps"><div><b>۱</b><span>نمونه Excel را دانلود و فقط داده‌ها را جایگزین کنید.</span></div><div><b>۲</b><span>Excel را وارد کنید؛ دانش‌آموز بدون عکس هم ثبت می‌شود.</span></div><div><b>۳</b><span>در صورت نیاز ZIP عکس‌ها را بعداً بارگذاری کنید.</span></div></div></section>
  </main></>;
}
