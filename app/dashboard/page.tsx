
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
  let totalStudents=0,totalPresent=0,totalAbsent=0,registeredClasses=0;

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
    if(recs.length>0) registeredClasses++;
    totalStudents+=students.length; totalPresent+=present.length; totalAbsent+=absent.length;
    cards.push({c,students,present,absent:absentWithUrls,recs});
  }

  return <><Header user={user}/><main>
    <section className="heroPanel">
      <div><h1>سلام، {user.name}</h1><p>نمای کلی حضور و غیاب امروز مدرسه را اینجا می‌بینید.</p></div>
      <div className="heroDate">{shamsi()}</div>
    </section>

    <div className="statsTop">
      <div className="statBox"><div className="statIcon">👥</div><div className="statLabel">کل دانش‌آموزان</div><div className="statValue">{totalStudents}</div></div>
      <div className="statBox"><div className="statIcon">✓</div><div className="statLabel">حاضر امروز</div><div className="statValue green">{totalPresent}</div></div>
      <div className="statBox"><div className="statIcon">!</div><div className="statLabel">غایب امروز</div><div className="statValue red">{totalAbsent}</div></div>
      <div className="statBox"><div className="statIcon">▦</div><div className="statLabel">کلاس‌های ثبت‌شده</div><div className="statValue">{registeredClasses}/{classes.length}</div></div>
    </div>

    <div className="head"><div><h1>کلاس‌ها</h1><p>وضعیت هر کلاس و فهرست غایبین امروز</p></div>
      <div className="actions no-print"><Link className="btn primary" href="/manage">⚙ مدیریت سامانه</Link></div>
    </div>

    <div className="absenceLegend"><span className="legend low">۰ تا ۲ غیبت</span><span className="legend medium">۳ تا ۴ غیبت</span><span className="legend high">۵ غیبت و بیشتر</span></div><div className="grid">
      {cards.map(({c,students,present,absent,recs})=><section className="card" key={c.id}>
        <div className="cardTop"><div><h2>{c.name}</h2><span className="muted">پایه {c.grade}</span></div>
          <Link className="btn soft" href={`/class/${c.id}`}>مشاهده کلاس</Link></div>
        <div className="numbers">
          <span>کل <b>{students.length}</b></span>
          <span className="green">حاضر <b>{present.length}</b></span>
          <span className="red">غایب <b>{absent.length}</b></span>
        </div>
        <div className="sectionTitle"><h3>غایبین امروز</h3><span className="badge">{recs.length? "ثبت شده":"ثبت نشده"}</span></div>
        <div className="people">{absent.length===0?<div className="empty">{recs.length?"غایبی ثبت نشده است.":"هنوز حضور و غیاب ثبت نشده است."}</div>:absent.map((s:any)=>
          <div className="person" key={s.id}>{s.photoUrl?<img src={s.photoUrl} alt=""/>:<div className="avatar">👤</div>}<span>{s.name}</span></div>)}</div>
      </section>)}
    </div>
  </main></>;
}
