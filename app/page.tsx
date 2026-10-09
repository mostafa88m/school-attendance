
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureSchema } from "@/lib/db";

export const dynamic="force-dynamic";

export default async function Page({
  searchParams
}:{
  searchParams:Promise<{error?:string}>
}){
  await ensureSchema();
  if(await getSession()) redirect("/dashboard");
  const sp=await searchParams;

  return (
    <main className="loginPage">
      <section className="loginShowcase">
        <div className="loginBrandMark">✓</div>
        <div className="loginShowcaseText">
          <span className="eyebrow">سامانه مدیریت حضور و غیاب</span>
          <h1>حضور و غیاب مدرسه شهدای نوده</h1>
          <p>
            ثبت سریع حضور، مدیریت دانش‌آموزان، پیگیری غیبت‌ها و دسترسی یکپارچه مدیر و معلمان
          </p>
        </div>

        <div className="loginFeatureGrid">
          <div className="loginFeature">
            <span className="featureIcon">👥</span>
            <div><b>مدیریت دانش‌آموزان</b><small>اطلاعات کامل و وضعیت هر دانش‌آموز</small></div>
          </div>
          <div className="loginFeature">
            <span className="featureIcon">✓</span>
            <div><b>حضور و غیاب روزانه</b><small>ثبت سریع و ساده در کلاس</small></div>
          </div>
          <div className="loginFeature">
            <span className="featureIcon">!</span>
            <div><b>هشدار غیبت</b><small>نمایش سبز، زرد و قرمز بر اساس تعداد غیبت</small></div>
          </div>
          <div className="loginFeature">
            <span className="featureIcon">▦</span>
            <div><b>گزارش مدیریتی</b><small>مشاهده و چاپ اطلاعات کلاس‌ها</small></div>
          </div>
        </div>

        <div className="loginFooterNote">
          <span className="secureDot"></span>
          دسترسی امن ویژه کارکنان مدرسه
        </div>
      </section>

      <section className="loginPanel">
        <div className="loginCard">
          <div className="loginCardHead">
            <div className="miniLogo">✓</div>
            <div>
              <h2>ورود مدیر و معلمان</h2>
              <p>برای ورود به سامانه اطلاعات حساب خود را وارد کنید.</p>
            </div>
          </div>

          {sp.error && (
            <div className="loginError">
              نام کاربری یا رمز عبور صحیح نیست.
            </div>
          )}

          <form action="/api/login" method="post" className="loginForm">
            <div>
              <label>نام کاربری</label>
              <div className="inputWithIcon">
                <span>👤</span>
                <input name="username" autoComplete="username" placeholder="نام کاربری" required/>
              </div>
            </div>

            <div>
              <label>رمز عبور</label>
              <div className="inputWithIcon">
                <span>🔒</span>
                <input type="password" name="password" autoComplete="current-password" placeholder="رمز عبور" required/>
              </div>
            </div>

            <button className="primary loginSubmit" type="submit">
              ورود به سامانه
            </button>
          </form>

          <div className="loginHelp">
            <span>در صورت فراموشی رمز عبور با مدیر مدرسه تماس بگیرید.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
