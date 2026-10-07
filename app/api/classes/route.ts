
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
export async function POST(req:Request){
  await requireAdmin();
  const f=await req.formData(); const name=String(f.get("name")||"").trim(); const grade=Number(f.get("grade"));
  if(name && grade>=1 && grade<=6) await sql`INSERT INTO classes(name,grade) VALUES(${name},${grade})`;
  return NextResponse.redirect(new URL("/manage",req.url),303);
}
