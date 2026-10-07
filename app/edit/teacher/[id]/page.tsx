
import Header from "@/components/Header";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic="force-dynamic";

export default async function EditTeacher({params}:{params:Promise<{id:string}>}){
  const user=await requireAdmin();
  const {id}=await params; const teacherId=Number(id);
  const rows=await sql`SELECT * FROM users WHERE id=${teacherId} AND role='teacher'`;
  if(!rows.length) notFound();
  const t=rows[0];
  const classes=await sql`SELECT * FROM classes ORDER BY grade,name`;

  return <><Header user={user}/><main>
    <div className="head"><div><h1>ویرایش معلم</h1><p>اطلاعات ورود و کلاس اختصاصی معلم</p></div><Link className="btn" href="/manage">بازگشت</Link></div>
    <section className="box editCard">
      <form action={`/api/teachers/${teacherId}`} method="post">
        <label>نام معلم</label><input name="name" defaultValue={t.name} required/>
        <label>نام کاربری</label><input name="username" defaultValue={t.username} required/>
        <label>کلاس</label><select name="classId" defaultValue={String(t.class_id||"")}>
          {classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="divider"/>
        <label>رمز عبور جدید (اختیاری)</label>
        <input type="password" name="password" placeholder="اگر نمی‌خواهید تغییر کند خالی بگذارید"/>
        <button className="primary wide">ذخیره تغییرات</button>
      </form>
    </section>
  </main></>;
}
