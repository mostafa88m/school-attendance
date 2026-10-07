
import Header from "@/components/Header";
import PrintButtons from "@/components/PrintButtons";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayISO, shamsi } from "@/lib/date";
import { signedPhotoUrl } from "@/lib/blob";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClassPage({params}:{params:Promise<{id:string}>}) {
  const user=await requireUser();
  const {id}=await params; const classId=Number(id);
  if (!Number.isInteger(classId)) notFound();
  if (user.role==="teacher" && user.classId!==classId) redirect("/dashboard");
  const classes=await sql`SELECT * FROM classes WHERE id=${classId}`;
  if (!classes.length) notFound();
  const cls=classes[0];
  const students=await sql`SELECT * FROM students WHERE class_id=${classId} ORDER BY name`;
  const day=todayISO();
  const recs=await sql`
    SELECT a.student_id,a.status FROM attendance a
    JOIN students s ON s.id=a.student_id
    WHERE a.day=${day} AND s.class_id=${classId}
  `;
  const map=new Map(recs.map((r:any)=>[r.student_id,r.status]));
  const items=await Promise.all(students.map(async(s:any)=>({...s,photoUrl:await signedPhotoUrl(s.photo_path)})));

  return <><Header user={user}/><main>
    <div className="head"><div><h1>{cls.name}</h1><p>{shamsi()} — {students.length} دانش‌آموز</p></div>
      <div className="actions no-print">
        <Link className="btn" href={`/manage?classId=${classId}#student`}>➕ ثبت دانش‌آموز</Link>
        {user.role==="admin" && <Link className="btn" href="/dashboard">همه کلاس‌ها</Link>}
        <PrintButtons pdf={user.role==="admin"}/>
      </div>
    </div>
    <form action="/api/attendance" method="post">
      <input type="hidden" name="classId" value={classId}/>
      <div className="students">
      {items.map((s:any)=>{
        const st=map.get(s.id)||"present";
        return <div className="student" key={s.id}>
          <div className="identity">{s.photoUrl?<img src={s.photoUrl} alt=""/>:<div className="avatar">👤</div>}<strong>{s.name}</strong></div>
          <div className="choice">
            <label><input type="radio" name={`s_${s.id}`} value="present" defaultChecked={st==="present"}/><span className="present">✓ حاضر</span></label>
            <label><input type="radio" name={`s_${s.id}`} value="absent" defaultChecked={st==="absent"}/><span className="absent">✕ غایب</span></label>
          </div>
        </div>
      })}
      </div>
      <button className="primary save no-print">ثبت حضور و غیاب امروز</button>
    </form>
  </main></>;
}
