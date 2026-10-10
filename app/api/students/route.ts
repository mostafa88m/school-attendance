
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

function clean(v:FormDataEntryValue|null){
  const s=String(v||"").trim();
  return s || null;
}

export async function POST(req:Request){
  const user=await requireUser();
  const f=await req.formData();

  let classId=Number(f.get("classId"));
  if(user.role==="teacher"){
    if(!user.classId) return new NextResponse("Teacher has no class",{status:400});
    classId=user.classId;
  }

  const validClass=await sql`SELECT id FROM classes WHERE id=${classId}`;
  if(!validClass.length) return new NextResponse("Invalid class",{status:400});

  const name=String(f.get("name")||"").trim();
  if(!name) return new NextResponse("Name required",{status:400});

  let photoPath:string|null=null;
  const photo=f.get("photo");
  if(photo instanceof File && photo.size>0){
    if(photo.size>5*1024*1024) return new NextResponse("Photo too large",{status:413});
    const type=photo.type.toLowerCase();
    if(!["image/jpeg","image/png","image/webp"].includes(type)){
      return new NextResponse("Invalid photo type",{status:415});
    }
    const ext=type==="image/png"?"png":type==="image/webp"?"webp":"jpg";
    const blob=await put(`students/${crypto.randomUUID()}.${ext}`,photo,{
      access:"private",
      addRandomSuffix:false
    });
    photoPath=blob.pathname;
  }

  await sql`
    INSERT INTO students(
      name,photo_path,class_id,national_id,student_code,
      student_phone,parent_name,parent_phone
    )
    VALUES(
      ${name},${photoPath},${classId},
      ${clean(f.get("nationalId"))},${clean(f.get("studentCode"))},
      ${clean(f.get("studentPhone"))},${clean(f.get("parentName"))},
      ${clean(f.get("parentPhone"))}
    )
  `;

  return NextResponse.redirect(
    new URL(user.role==="teacher"?`/class/${classId}`:"/manage",req.url),303
  );
}
