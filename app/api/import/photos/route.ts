import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";
import JSZip from "jszip";
export const runtime="nodejs";
function norm(v:string){return v.replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/\u200c/g," ").replace(/\s+/g," ").trim().toLowerCase();}
function baseName(filename:string){return filename.replace(/\.[^.]+$/,"").trim();}
export async function POST(req:Request){
  const user=await requireUser(); if(user.role!=="admin")return new NextResponse("Forbidden",{status:403});
  const fd=await req.formData(); const file=fd.get("file"); if(!(file instanceof File)||!file.size)return new NextResponse("ZIP required",{status:400}); if(file.size>50*1024*1024)return new NextResponse("ZIP too large",{status:413});
  const zip=await JSZip.loadAsync(await file.arrayBuffer()); let matched=0,unmatched=0;
  for(const [path,entry] of Object.entries(zip.files)){
    if(entry.dir)continue; const filename=path.split("/").pop()||""; const ext=(filename.split(".").pop()||"").toLowerCase(); if(!["jpg","jpeg","png","webp"].includes(ext))continue;
    let rows=await sql`SELECT id FROM students WHERE photo_ref IS NOT NULL AND LOWER(TRIM(photo_ref))=LOWER(TRIM(${filename})) LIMIT 2`;
    if(rows.length!==1){const base=baseName(filename);rows=await sql`SELECT id FROM students WHERE LOWER(TRIM(name))=LOWER(TRIM(${base})) LIMIT 2`;}
    if(rows.length!==1){unmatched++;continue;}
    const buffer=await entry.async("arraybuffer"); if(buffer.byteLength>5*1024*1024){unmatched++;continue;}
    const mime=ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg";
    const imageBlob=new Blob([buffer],{type:mime});
    const blob=await put(`students/${crypto.randomUUID()}.${ext==="jpeg"?"jpg":ext}`,imageBlob,{access:"private",addRandomSuffix:false,contentType:mime});
    await sql`UPDATE students SET photo_path=${blob.pathname},photo_ref=${filename} WHERE id=${rows[0].id}`; matched++;
  }
  return NextResponse.redirect(new URL(`/import-students?photos=${matched}&unmatched=${unmatched}`,req.url),303);
}
