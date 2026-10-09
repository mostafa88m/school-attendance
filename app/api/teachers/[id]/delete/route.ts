
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  await requireAdmin();
  const {id}=await params;
  const teacherId=Number(id);
  await sql`DELETE FROM users WHERE id=${teacherId} AND role='teacher'`;
  return NextResponse.redirect(new URL("/manage",req.url),303);
}
