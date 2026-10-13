import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";
export const runtime="nodejs";
function clean(v:FormDataEntryValue|null){const s=String(v||"").trim();return s||null;}
export async function POST(req:Request){
  const user=await requireUser(); const f=await req.formData(); let classId=Number(f.get("classId")); if(user.role==="teacher") classId=user.classId!;
  const valid=await sql`SELECT id FROM classes WHERE id=${classId}`; if(!valid.length) return new NextResponse("Invalid class",{status:400});
  const name=String(f.get("name")||"").trim(); if(!name) return new NextResponse("نام دانش‌آموز الزامی است.",{status:400});
  let photoPath:string|null=null, photoFileName:string|null=null; const photo=f.get("photo");
  if(photo instanceof File&&photo.size>0){if(photo.size>5*1024*1024)return new NextResponse("حجم عکس بیش از حد مجاز است.",{status:413}); if(!["image/jpeg","image/png","image/webp"].includes(photo.type))return new NextResponse("فرمت عکس مجاز نیست.",{status:415}); const ext=photo.type==="image/png"?"png":photo.type==="image/webp"?"webp":"jpg"; const blob=await put(`students/${crypto.randomUUID()}.${ext}`,photo,{access:"private",addRandomSuffix:false}); photoPath=blob.pathname; photoFileName=photo.name;}
  await sql`INSERT INTO students(name,class_id,photo_path,student_phone,photo_file_name) VALUES(${name},${classId},${photoPath},${clean(f.get("studentPhone"))},${photoFileName})`;
  return NextResponse.redirect(new URL(user.role==="teacher"?`/class/${classId}`:"/manage",req.url),303);
}
