
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";
import JSZip from "jszip";

export const runtime="nodejs";

function cleanId(v:string){
  return v.trim().replace(/\.[^.]+$/,"").replace(/[^\dA-Za-z_-]/g,"");
}
function normalizeDigits(v:string){
  return v.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export async function POST(req:Request){
  const user=await requireUser();
  if(user.role!=="admin") return new NextResponse("Forbidden",{status:403});

  const fd=await req.formData();
  const file=fd.get("file");
  if(!(file instanceof File)||!file.size) return new NextResponse("ZIP required",{status:400});
  if(file.size>50*1024*1024) return new NextResponse("ZIP too large",{status:413});

  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  let matched=0,unmatched=0;

  for(const [path,entry] of Object.entries(zip.files)){
    if(entry.dir) continue;
    const filename=path.split("/").pop()||"";
    const ext=(filename.split(".").pop()||"").toLowerCase();
    if(!["jpg","jpeg","png","webp"].includes(ext)) continue;

    const base=normalizeDigits(cleanId(filename));
    if(!base){unmatched++;continue;}

    let rows=await sql`SELECT id FROM students WHERE national_id=${base} LIMIT 1`;
    if(!rows.length) rows=await sql`SELECT id FROM students WHERE student_code=${base} LIMIT 1`;
    if(!rows.length){unmatched++;continue;}

    const extracted = await entry.async("uint8array");
    if(extracted.byteLength>5*1024*1024){unmatched++;continue;}

    // Explicitly create a Node.js Buffer. Vercel Blob's PutBody accepts Buffer.
    const body: Buffer = Buffer.from(
      extracted.buffer,
      extracted.byteOffset,
      extracted.byteLength
    );

    const mime=ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg";
    const blob=await put(`students/${crypto.randomUUID()}.${ext==="jpeg"?"jpg":ext}`,body,{
      access:"private",
      addRandomSuffix:false,
      contentType:mime
    });

    await sql`UPDATE students SET photo_path=${blob.pathname} WHERE id=${rows[0].id}`;
    matched++;
  }

  return NextResponse.redirect(
    new URL(`/import-students?photos=${matched}&unmatched=${unmatched}`,req.url),303
  );
}
