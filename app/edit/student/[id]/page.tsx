
import Header from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { signedPhotoUrl } from "@/lib/blob";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const dynamic="force-dynamic";

export default async function EditStudent({params}:{params:Promise<{id:string}>}){
  const user=await requireUser();
  const {id}=await params; const studentId=Number(id);
  const rows=await sql`SELECT s.*,c.name class_name FROM students s JOIN classes c ON c.id=s.class_id WHERE s.id=${studentId}`;
  if(!rows.length) notFound();
  const s=rows[0];
  if(user.role==="teacher" && user.classId!==s.class_id) redirect("/dashboard");
  const classes=user.role==="admin"
    ? await sql`SELECT * FROM classes ORDER BY grade,name`
    : await sql`SELECT * FROM classes WHERE id=${user.classId}`;
  const photoUrl=await signedPhotoUrl(s.photo_path as string|null);

  return <><Header user={user}/><main>
    <div className="head"><div><h1>ویرایش دانش‌آموز</h1><p>{s.class_name}</p></div><Link className="btn" href={`/class/${s.class_id}`}>بازگشت</Link></div>
    <section className="box editCard">
      <div className="editPhoto">{photoUrl?<img src={photoUrl} alt=""/>:<div className="avatar">👤</div>}<div><b>{s.name}</b><div className="muted">برای تغییر عکس، فایل جدید انتخاب کنید.</div></div></div>
      <form action={`/api/students/${studentId}`} method="post" encType="multipart/form-data">
        <label>نام و نام خانوادگی</label><input name="name" defaultValue={s.name} required/>
        <label>کلاس</label>
        <select name="classId" defaultValue={String(s.class_id)} disabled={user.role==="teacher"}>
          {classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {user.role==="teacher" && <input type="hidden" name="classId" value={user.classId!}/>}
        <label>عکس جدید (اختیاری)</label><input type="file" name="photo" accept="image/jpeg,image/png,image/webp"/>
        <button className="primary wide">ذخیره تغییرات</button>
      </form>
    </section>
  </main></>;
}
