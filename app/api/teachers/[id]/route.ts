
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  await requireAdmin();
  const {id}=await params; const teacherId=Number(id);
  const f=await req.formData();
  const name=String(f.get("name")||"").trim();
  const username=String(f.get("username")||"").trim();
  const classId=Number(f.get("classId"));
  const password=String(f.get("password")||"");
  if(!name || !username || !classId) return new NextResponse("Invalid data",{status:400});

  const duplicate=await sql`SELECT id FROM users WHERE username=${username} AND id<>${teacherId}`;
  if(duplicate.length) return new NextResponse("Username already exists",{status:409});

  if(password){
    const hash=await bcrypt.hash(password,12);
    await sql`UPDATE users SET name=${name},username=${username},class_id=${classId},password_hash=${hash} WHERE id=${teacherId} AND role='teacher'`;
  }else{
    await sql`UPDATE users SET name=${name},username=${username},class_id=${classId} WHERE id=${teacherId} AND role='teacher'`;
  }
  return NextResponse.redirect(new URL("/manage",req.url),303);
}
