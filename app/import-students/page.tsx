
import Header from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic="force-dynamic";

export default async function ImportStudents({
  searchParams
}:{searchParams:Promise<{ok?:string;imported?:string;skipped?:string;photos?:string;unmatched?:string}>}){
  const user=await requireUser();
  if(user.role!=="admin") redirect("/dashboard");
  const sp=await searchParams;

  return <><Header user={user}/><main className="appMain">
    <div className="head">
      <div>
        <h1>ورود گروهی دانش‌آموزان</h1>
        <p>ورود اطلاعات از Excel و تطبیق گروهی عکس‌ها با کد ملی یا کد دانش‌آموزی</p>
      </div>
      <Link className="btn" href="/manage">بازگشت به مدیریت</Link>
    </div>

    {(sp.imported||sp.photos)&&<div className="importSuccess">
      {sp.imported&&<>ورود Excel انجام شد: <b>{sp.imported}</b> دانش‌آموز ثبت شد؛ <b>{sp.skipped||0}</b> ردیف رد شد.</>}
      {sp.photos&&<>تطبیق عکس‌ها انجام شد: <b>{sp.photos}</b> عکس متصل شد؛ <b>{sp.unmatched||0}</b> فایل بدون تطبیق بود.</>}
    </div>}

    <div className="importGrid">
      <section className="box importCard">
        <div className="importCardIcon">XLSX</div>
        <h2>۱. ورود دانش‌آموزان از Excel</h2>
        <p>فایل <b>.xlsx</b> را از سیدا یا فایل مدرسه بارگذاری کنید. عکس در این مرحله لازم نیست.</p>

        <div className="columnGuide">
          <b>ستون‌های قابل تشخیص:</b>
          <span>نام و نام خانوادگی / نام</span>
          <span>کد ملی</span>
          <span>کد دانش‌آموزی</span>
          <span>پایه</span>
          <span>کلاس</span>
          <span>نام پدر / نام مادر / نام ولی</span>
          <span>شماره تماس ولی</span>
          <span>شماره دانش‌آموز</span>
        </div>

        <form action="/api/import/students" method="post" encType="multipart/form-data">
          <label>فایل Excel</label>
          <input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required/>
          <div className="importOptions">
            <label className="checkRow"><input type="checkbox" name="skipDuplicates" defaultChecked/> جلوگیری از ثبت تکراری بر اساس کد ملی/کد دانش‌آموزی</label>
          </div>
          <button className="primary wide">بارگذاری و ثبت اطلاعات</button>
        </form>
      </section>

      <section className="box importCard">
        <div className="importCardIcon photoIcon">ZIP</div>
        <h2>۲. ورود گروهی عکس‌ها</h2>
        <p>بعد از ثبت دانش‌آموزان، عکس‌ها را در یک ZIP بارگذاری کنید.</p>
        <div className="photoRule">
          <b>نام فایل عکس باید یکی از این‌ها باشد:</b>
          <code>0012345678.jpg</code>
          <code>STUDENTCODE.png</code>
          <small>سامانه نام فایل را با کد ملی و سپس کد دانش‌آموزی تطبیق می‌دهد.</small>
        </div>
        <form action="/api/import/photos" method="post" encType="multipart/form-data">
          <label>فایل ZIP عکس‌ها</label>
          <input type="file" name="file" accept=".zip,application/zip" required/>
          <button className="primary wide">تطبیق و ثبت عکس‌ها</button>
        </form>
      </section>
    </div>

    <section className="box importHelp">
      <h2>نکات مهم قبل از ورود</h2>
      <div className="helpSteps">
        <div><b>۱</b><span>اول Excel را وارد کنید و دانش‌آموزان را بدون عکس ثبت کنید.</span></div>
        <div><b>۲</b><span>در صورت وجود عکس، نام فایل‌ها را با کد ملی یا کد دانش‌آموزی تنظیم کنید.</span></div>
        <div><b>۳</b><span>ZIP عکس‌ها را بارگذاری کنید؛ دانش‌آموزانی که عکس ندارند همچنان در سامانه باقی می‌مانند.</span></div>
      </div>
    </section>
  </main></>;
}
