
import Header from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayISO, shamsi } from "@/lib/date";
import { signedPhotoUrl } from "@/lib/blob";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  if (user.role === "teacher" && user.classId) {
    const { redirect } = await import("next/navigation");
    redirect(`/class/${user.classId}`);
  }
  if (user.role === "teacher") {
    return <><Header user={user}/><main><div className="empty">هنوز کلاسی برای شما تعیین نشده است.</div></main></>;
  }

  const classes = await sql`SELECT * FROM classes ORDER BY grade,name`;
  const day = todayISO();
  const cards:any[] = [];
  for (const c of classes) {
    const students = await sql`SELECT * FROM students WHERE class_id=${c.id} ORDER BY name`;
    const recs = await sql`
      SELECT a.student_id,a.status FROM attendance a
      JOIN students s ON s.id=a.student_id
      WHERE a.day=${day} AND s.class_id=${c.id}
    `;
    const map = new Map(recs.map((r:any)=>[r.student_id,r.status]));
    const absent = students.filter((s:any)=>map.get(s.id)==="absent");
    const present = students.filter((s:any)=>map.get(s.id)==="present");
    const absentWithUrls = await Promise.all(absent.map(async(s:any)=>({...s,photoUrl:await signedPhotoUrl(s.photo_path)})));
    cards.push({c,students,present,absent:absentWithUrls});
  }

  return <><Header user={user}/><main>
    <div className="head"><div><h1>داشبورد مدیر</h1><p>امروز {shamsi()}</p></div>
      <div className="actions no-print"><Link className="btn" href="/manage">مدیریت کلاس‌ها و کاربران</Link></div>
    </div>
    <div className="grid">
      {cards.map(({c,students,present,absent})=><section className="card" key={c.id}>
        <div className="cardTop"><div><h2>{c.name}</h2><span className="muted">پایه {c.grade}</span></div>
          <Link className="btn primary" href={`/class/${c.id}`}>لیست کل کلاس</Link></div>
        <div className="numbers"><span>کل <b>{students.length}</b></span><span className="green">حاضر <b>{present.length}</b></span><span className="red">غایب <b>{absent.length}</b></span></div>
        <h3>غایبین امروز</h3>
        <div className="people">{absent.length===0?<div className="empty">غایبی ثبت نشده است.</div>:absent.map((s:any)=>
          <div className="person" key={s.id}>{s.photoUrl?<img src={s.photoUrl} alt=""/>:<div className="avatar">👤</div>}<span>{s.name}</span></div>)}</div>
      </section>)}
    </div>
  </main></>;
}
