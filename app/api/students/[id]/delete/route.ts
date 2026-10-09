
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireUser();
  const {id}=await params;
  const studentId=Number(id);
  const rows=await sql`SELECT id,class_id FROM students WHERE id=${studentId}`;
  if(!rows.length) return new NextResponse("Not found",{status:404});
  const student=rows[0];
  if(user.role==="teacher" && user.classId!==student.class_id){
    return new NextResponse("Forbidden",{status:403});
  }
  const classId=student.class_id as number;
  await sql`DELETE FROM students WHERE id=${studentId}`;
  return NextResponse.redirect(new URL(user.role==="teacher"?`/class/${classId}`:"/manage",req.url),303);
}
