
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
export async function POST(req:Request){
  await requireAdmin();
  const f=await req.formData(); const name=String(f.get("name")||"").trim(); const username=String(f.get("username")||"").trim();
  const password=String(f.get("password")||""); const classId=Number(f.get("classId"));
  if(name && username && password && classId){
    const hash=await bcrypt.hash(password,12);
    try{ await sql`INSERT INTO users(name,username,password_hash,role,class_id) VALUES(${name},${username},${hash},'teacher',${classId})`; }catch{}
  }
  return NextResponse.redirect(new URL("/manage",req.url),303);
}
