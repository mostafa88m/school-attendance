
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureSchema } from "@/lib/db";

export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  await ensureSchema();
  if (await getSession()) redirect("/dashboard");
  const params = await searchParams;
  return <div className="loginWrap"><div className="login">
    <div className="logo">🏫</div>
    <h1>حضور و غیاب مدرسه</h1>
    <p>ورود مدیر و معلمان</p>
    {params.error && <div className="notice">نام کاربری یا رمز عبور نادرست است.</div>}
    <form action="/api/login" method="post">
      <label>نام کاربری</label><input name="username" required />
      <label>رمز عبور</label><input type="password" name="password" required />
      <button className="primary wide">ورود</button>
    </form>
    <p className="muted">ورود اولیه مدیر: admin / رمز تعیین‌شده در ADMIN_PASSWORD</p>
  </div></div>;
}
