
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";

export const runtime="nodejs";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireUser();
  const {id}=await params; const studentId=Number(id);
  const existing=await sql`SELECT * FROM students WHERE id=${studentId}`;
  if(!existing.length) return new NextResponse("Not found",{status:404});
  const old=existing[0];
  if(user.role==="teacher" && user.classId!==old.class_id) return new NextResponse("Forbidden",{status:403});

  const f=await req.formData();
  const name=String(f.get("name")||"").trim();
  let classId=Number(f.get("classId"));
  if(user.role==="teacher") classId=user.classId!;
  if(!name) return new NextResponse("Invalid name",{status:400});

  let photoPath=old.photo_path as string|null;
  const photo=f.get("photo");
  if(photo instanceof File && photo.size){
    if(photo.size>4*1024*1024) return new NextResponse("Photo too large",{status:413});
    const ext=(photo.name.split(".").pop()||"jpg").toLowerCase();
    const safeExt=["jpg","jpeg","png","webp"].includes(ext)?ext:"jpg";
    const pathname=`students/${crypto.randomUUID()}.${safeExt}`;
    const blob=await put(pathname,photo,{access:"private",addRandomSuffix:false});
    photoPath=blob.pathname;
  }

  const valid=await sql`SELECT id FROM classes WHERE id=${classId}`;
  if(!valid.length) return new NextResponse("Invalid class",{status:400});
  await sql`UPDATE students SET name=${name},class_id=${classId},photo_path=${photoPath} WHERE id=${studentId}`;
  return NextResponse.redirect(new URL(`/class/${classId}`,req.url),303);
}
