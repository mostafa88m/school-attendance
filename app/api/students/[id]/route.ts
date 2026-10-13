import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";
export const runtime="nodejs";
function clean(v:FormDataEntryValue|null){const s=String(v||"").trim();return s||null;}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireUser(); const {id}=await params; const studentId=Number(id); const rows=await sql`SELECT * FROM students WHERE id=${studentId}`; if(!rows.length)return new NextResponse("Not found",{status:404}); const old=rows[0]; if(user.role==="teacher"&&user.classId!==old.class_id)return new NextResponse("Forbidden",{status:403});
  const f=await req.formData(); let classId=Number(f.get("classId")); if(user.role==="teacher")classId=user.classId!; let photoPath=(old.photo_path as string|null)||null; let photoFileName=(old.photo_file_name as string|null)||null; const photo=f.get("photo");
  if(photo instanceof File&&photo.size>0){if(photo.size>5*1024*1024)return new NextResponse("حجم عکس بیش از حد مجاز است.",{status:413}); if(!["image/jpeg","image/png","image/webp"].includes(photo.type))return new NextResponse("فرمت عکس مجاز نیست.",{status:415}); const ext=photo.type==="image/png"?"png":photo.type==="image/webp"?"webp":"jpg"; const blob=await put(`students/${crypto.randomUUID()}.${ext}`,photo,{access:"private",addRandomSuffix:false}); photoPath=blob.pathname; photoFileName=photo.name;}
  await sql`UPDATE students SET name=${String(f.get("name")||"").trim()},class_id=${classId},student_phone=${clean(f.get("studentPhone"))},photo_path=${photoPath},photo_file_name=${photoFileName} WHERE id=${studentId}`;
  return NextResponse.redirect(new URL(`/class/${classId}`,req.url),303);
}
