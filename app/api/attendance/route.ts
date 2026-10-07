
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayISO } from "@/lib/date";

export async function POST(req:Request){
  const user=await requireUser();
  const form=await req.formData();
  const classId=Number(form.get("classId"));
  if (user.role==="teacher" && user.classId!==classId) return new NextResponse("Forbidden",{status:403});
  const students=await sql`SELECT id FROM students WHERE class_id=${classId}`;
  const day=todayISO();
  for(const s of students){
    const raw=String(form.get(`s_${s.id}`)||"present");
    const status=raw==="absent"?"absent":"present";
    await sql`
      INSERT INTO attendance(day,student_id,status)
      VALUES(${day},${s.id},${status})
      ON CONFLICT(day,student_id) DO UPDATE SET status=EXCLUDED.status
    `;
  }
  return NextResponse.redirect(new URL(`/class/${classId}`,req.url),303);
}
