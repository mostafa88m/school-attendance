
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";

export const runtime="nodejs";

export async function POST(req:Request){
  const user=await requireUser();
  const f=await req.formData();
  const name=String(f.get("name")||"").trim();
  let classId=Number(f.get("classId"));
  if(user.role==="teacher"){
    if(!user.classId) return new NextResponse("No class assigned",{status:400});
    classId=user.classId;
  }
  const valid=await sql`SELECT id FROM classes WHERE id=${classId}`;
  if(!valid.length) return new NextResponse("Invalid class",{status:400});
  const photo=f.get("photo");
  if(!(photo instanceof File) || !photo.size || !name) return new NextResponse("Invalid data",{status:400});
  if(photo.size > 4*1024*1024) return new NextResponse("Photo too large",{status:413});
  const ext=(photo.name.split(".").pop()||"jpg").toLowerCase();
  const safeExt=["jpg","jpeg","png","webp"].includes(ext)?ext:"jpg";
  const pathname=`students/${crypto.randomUUID()}.${safeExt}`;
  const blob=await put(pathname,photo,{access:"private",addRandomSuffix:false});
  await sql`INSERT INTO students(name,photo_path,class_id) VALUES(${name},${blob.pathname},${classId})`;
  return NextResponse.redirect(new URL(user.role==="teacher"?`/class/${classId}`:"/manage",req.url),303);
}
