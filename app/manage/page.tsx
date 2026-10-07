
import Header from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { signedPhotoUrl } from "@/lib/blob";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic="force-dynamic";

export default async function Manage({searchParams}:{searchParams:Promise<{classId?:string}>}){
  const user=await requireUser();
  const sp=await searchParams;
  let allowedClassId:number|null=null;
  if(user.role==="teacher"){
    if(!user.classId) redirect("/dashboard");
    allowedClassId=user.classId;
  } else if(sp.classId){
    allowedClassId=Number(sp.classId)||null;
  }

  const classes=user.role==="teacher"
    ? await sql`SELECT * FROM classes WHERE id=${user.classId}`
    : await sql`SELECT * FROM classes ORDER BY grade,name`;

  const students=user.role==="teacher"
    ? await sql`SELECT s.*,c.name class_name FROM students s JOIN classes c ON c.id=s.class_id WHERE s.class_id=${user.classId} ORDER BY s.name`
    : await sql`SELECT s.*,c.name class_name FROM students s JOIN classes c ON c.id=s.class_id ORDER BY c.grade,s.name`;

  const withUrls=await Promise.all(students.map(async(s:any)=>({...s,photoUrl:await signedPhotoUrl(s.photo_path)})));
  const teachers=user.role==="admin"
    ? await sql`SELECT u.*,c.name class_name FROM users u LEFT JOIN classes c ON c.id=u.class_id WHERE u.role='teacher' ORDER BY u.name`
    : [];

  return <><Header user={user}/><main>
    <div className="head"><div><h1>{user.role==="admin"?"مدیریت سامانه":"مدیریت دانش‌آموزان کلاس"}</h1><p>{user.role==="teacher"?"ثبت و ویرایش دانش‌آموزان کلاس خودتان":"تعریف کلاس، معلم و دانش‌آموز"}</p></div>
      <Link className="btn no-print" href={user.role==="teacher"?`/class/${user.classId}`:"/dashboard"}>بازگشت</Link></div>

    {user.role==="admin" && <section className="box section">
      <h2>افزودن کلاس جدید</h2><p className="sectionDesc">برای هر پایه می‌توانید بیش از یک کلاس تعریف کنید.</p>
      <form action="/api/classes" method="post" className="formGrid">
        <div><label>نام کلاس</label><input name="name" placeholder="مثلاً اول الف" required/></div>
        <div><label>پایه</label><select name="grade">{[1,2,3,4,5,6].map(x=><option key={x}>{x}</option>)}</select></div>
        <button className="primary">ثبت کلاس</button>
      </form>
    </section>}

    {user.role==="admin" && <section className="box section">
      <h2>معلمان</h2><p className="sectionDesc">حساب معلم بسازید یا اطلاعات و کلاس او را ویرایش کنید.</p>
      <form action="/api/teachers" method="post" className="formGrid">
        <div><label>نام معلم</label><input name="name" required/></div>
        <div><label>نام کاربری</label><input name="username" required/></div>
        <div><label>رمز عبور</label><input type="password" name="password" required/></div>
        <div><label>کلاس</label><select name="classId">{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <button className="primary">ایجاد حساب معلم</button>
      </form>
      {teachers.length>0 && <div className="tableWrap"><table className="table"><thead><tr><th>نام معلم</th><th>نام کاربری</th><th>کلاس</th><th>عملیات</th></tr></thead><tbody>
        {teachers.map((t:any)=><tr key={t.id}><td>{t.name}</td><td>{t.username}</td><td>{t.class_name||"-"}</td><td><Link className="btn" href={`/edit/teacher/${t.id}`}>ویرایش</Link></td></tr>)}
      </tbody></table></div>}
    </section>}

    <section className="box section" id="student">
      <h2>ثبت دانش‌آموز</h2><p className="sectionDesc">نام، کلاس و عکس دانش‌آموز را ثبت کنید.</p>
      <form action="/api/students" method="post" encType="multipart/form-data" className="formGrid">
        <div><label>نام و نام خانوادگی</label><input name="name" required/></div>
        <div><label>کلاس</label><select name="classId" defaultValue={allowedClassId||undefined} disabled={user.role==="teacher"}>
          {classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>{user.role==="teacher" && <input type="hidden" name="classId" value={user.classId!}/>}</div>
        <div><label>عکس دانش‌آموز</label><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required/></div>
        <button className="primary">ثبت دانش‌آموز</button>
      </form>
    </section>

    <section>
      <div className="head"><div><h1 style={{fontSize:20}}>دانش‌آموزان</h1><p>{withUrls.length} دانش‌آموز ثبت شده</p></div></div>
      <div className="photoGrid">{withUrls.map((s:any)=><div className="studentMini" key={s.id}>
        {s.photoUrl?<img src={s.photoUrl} alt=""/>:<div className="avatar">👤</div>}
        <div><b>{s.name}</b><div className="muted">{s.class_name}</div></div>
        <Link className="btn editMini" href={`/edit/student/${s.id}`}>ویرایش</Link>
      </div>)}</div>
    </section>
  </main></>;
}
