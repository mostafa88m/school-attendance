import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import ExcelJS from "exceljs";
export const runtime="nodejs";

function text(v:any){
  if(v==null)return "";
  if(typeof v==="object"){
    if("text" in v)return String(v.text??"").trim();
    if("result" in v)return String(v.result??"").trim();
    if("richText" in v)return (v.richText||[]).map((x:any)=>x.text||"").join("").trim();
  }
  return String(v).trim();
}
function norm(v:string){return v.replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/\u200c/g," ").replace(/\s+/g," ").trim().toLowerCase();}
function digits(v:string){return v.replace(/[^\d۰-۹٠-٩]/g,"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));}
function phone(v:string){let d=digits(v);if(d.length===10&&d.startsWith("9"))d="0"+d;return d||v.trim()||null;}
function gradeOf(v:string){
  const n=norm(v); const d=digits(n); if(d){const x=Number(d);if(x>=1&&x<=6)return x;}
  const map:Record<string,number>={"اول":1,"دوم":2,"سوم":3,"چهارم":4,"پنجم":5,"ششم":6};
  for(const [k,g] of Object.entries(map))if(n.includes(k))return g; return null;
}
export async function POST(req:Request){
  const user=await requireUser(); if(user.role!=="admin")return new NextResponse("Forbidden",{status:403});
  const fd=await req.formData(); const file=fd.get("file");
  if(!(file instanceof File)||!file.size)return new NextResponse("فایل Excel انتخاب نشده است.",{status:400});
  if(file.size>10*1024*1024)return new NextResponse("حجم فایل Excel زیاد است.",{status:413});
  const wb=new ExcelJS.Workbook(); await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any); const ws=wb.worksheets[0];
  if(!ws)return new NextResponse("Sheet پیدا نشد.",{status:400});
  const headers=[1,2,3,4].map(i=>norm(text(ws.getRow(1).getCell(i).value)));
  const expected=["نام و نام خانوادگی","کلاس","شماره تماس","عکس"].map(norm);
  if(expected.some((h,i)=>headers[i]!==h)){
    return new NextResponse("قالب Excel صحیح نیست. از فایل نمونه سامانه استفاده کنید: نام و نام خانوادگی | کلاس | شماره تماس | عکس",{status:400});
  }
  const classes=await sql`SELECT id,name,grade FROM classes ORDER BY grade,name`;
  let imported=0,updated=0,skipped=0;
  for(let r=2;r<=ws.rowCount;r++){
    const row=ws.getRow(r); const name=text(row.getCell(1).value); const classRaw=text(row.getCell(2).value); const phoneValue=phone(text(row.getCell(3).value)); const photoRef=text(row.getCell(4).value)||null;
    if(!name&&!classRaw&&!phoneValue&&!photoRef)continue;
    if(!name||!classRaw){skipped++;continue;}
    const nc=norm(classRaw); let hit=classes.find((c:any)=>norm(String(c.name))===nc);
    if(!hit){const g=gradeOf(classRaw);if(g)hit=classes.find((c:any)=>Number(c.grade)===g);}
    if(!hit){skipped++;continue;} const classId=Number(hit.id);
    const existing=await sql`SELECT id FROM students WHERE class_id=${classId} AND LOWER(TRIM(name))=LOWER(TRIM(${name})) LIMIT 1`;
    if(existing.length){
      await sql`UPDATE students SET student_phone=COALESCE(${phoneValue},student_phone),photo_ref=COALESCE(${photoRef},photo_ref) WHERE id=${existing[0].id}`; updated++;
    }else{
      await sql`INSERT INTO students(name,photo_path,class_id,student_phone,photo_ref) VALUES(${name},${null},${classId},${phoneValue},${photoRef})`; imported++;
    }
  }
  return NextResponse.redirect(new URL(`/import-students?imported=${imported}&updated=${updated}&skipped=${skipped}`,req.url),303);
}
