import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";
import JSZip from "jszip";

export const runtime="nodejs";
function normalizeFileName(v:string){return (v.split("/").pop()||"").replace(/[ي]/g,"ی").replace(/[ك]/g,"ک").replace(/\u200c/g," ").replace(/\s+/g," ").trim().toLowerCase();}
function baseName(v:string){return normalizeFileName(v).replace(/\.(jpg|jpeg|png|webp)$/i,"");}

export async function POST(req:Request){
  const user=await requireUser(); if(user.role!=="admin") return new NextResponse("Forbidden",{status:403});
  const fd=await req.formData(); const file=fd.get("file");
  if(!(file instanceof File)||!file.size) return new NextResponse("فایل ZIP انتخاب نشده است.",{status:400});
  if(file.size>50*1024*1024) return new NextResponse("حجم ZIP بیش از حد مجاز است.",{status:413});
  let zip:JSZip; try{zip=await JSZip.loadAsync(await file.arrayBuffer());}catch{return new NextResponse("فایل ZIP معتبر نیست.",{status:400});}
  const students=await sql`SELECT id,name,photo_file_name FROM students ORDER BY id`;
  let matched=0,unmatched=0;
  for(const [path,entry] of Object.entries(zip.files)){
    if(entry.dir) continue;
    const filename=path.split("/").pop()||""; const ext=(filename.split(".").pop()||"").toLowerCase();
    if(!["jpg","jpeg","png","webp"].includes(ext)) continue;
    const normalized=normalizeFileName(filename), base=baseName(filename);
    let student=students.find((s:any)=>s.photo_file_name&&normalizeFileName(String(s.photo_file_name))===normalized);
    if(!student) student=students.find((s:any)=>baseName(String(s.name))===base);
    if(!student){unmatched++;continue;}
    const extracted=await entry.async("uint8array"); if(extracted.byteLength>5*1024*1024){unmatched++;continue;}
    const body:Buffer=Buffer.from(extracted.buffer,extracted.byteOffset,extracted.byteLength);
    const mime=ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg";
    const finalExt=ext==="jpeg"?"jpg":ext;
    const blob=await put(`students/${crypto.randomUUID()}.${finalExt}`,body,{access:"private",addRandomSuffix:false,contentType:mime});
    await sql`UPDATE students SET photo_path=${blob.pathname},photo_file_name=${filename} WHERE id=${student.id}`; matched++;
  }
  return NextResponse.redirect(new URL(`/import-students?photos=${matched}&unmatched=${unmatched}`,req.url),303);
}
