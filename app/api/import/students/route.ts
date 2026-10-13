import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import ExcelJS from "exceljs";

export const runtime="nodejs";
const EXACT_HEADERS=["نام و نام خانوادگی","کلاس","شماره تماس","عکس"];

function cellText(v:any){
  if(v==null) return "";
  if(typeof v==="object"){
    if("text" in v) return String(v.text??"").trim();
    if("result" in v) return String(v.result??"").trim();
    if("richText" in v) return (v.richText||[]).map((x:any)=>x.text||"").join("").trim();
  }
  return String(v).trim();
}
function normalize(v:string){return v.replace(/\u200c/g," ").replace(/[ي]/g,"ی").replace(/[ك]/g,"ک").replace(/\s+/g," ").trim().toLowerCase();}
function normalizePhone(v:string){return v.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^\d+]/g,"").trim();}
function gradeFromClass(v:string){
  const n=normalize(v); const words:Record<string,number>={"اول":1,"دوم":2,"سوم":3,"چهارم":4,"پنجم":5,"ششم":6};
  for(const [w,g] of Object.entries(words)) if(n.includes(w)) return g;
  const ascii=n.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const m=ascii.match(/[1-6]/); return m?Number(m[0]):null;
}

export async function POST(req:Request){
  const user=await requireUser();
  if(user.role!=="admin") return new NextResponse("Forbidden",{status:403});
  const fd=await req.formData(); const file=fd.get("file");
  if(!(file instanceof File)||!file.size) return new NextResponse("فایل Excel انتخاب نشده است.",{status:400});
  if(file.size>10*1024*1024) return new NextResponse("حجم فایل Excel بیش از حد مجاز است.",{status:413});

  const wb=new ExcelJS.Workbook();
  try{await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any);}catch{return new NextResponse("فایل Excel معتبر نیست یا آسیب دیده است.",{status:400});}
  const ws=wb.getWorksheet("دانش آموزان")||wb.worksheets[0];
  if(!ws) return new NextResponse("شیت دانش آموزان پیدا نشد.",{status:400});

  const headers=EXACT_HEADERS.map((_,i)=>cellText(ws.getRow(1).getCell(i+1).value));
  const exact=headers.every((h,i)=>normalize(h)===normalize(EXACT_HEADERS[i]));
  if(!exact) return new NextResponse(`قالب Excel صحیح نیست. ردیف اول باید دقیقاً این چهار ستون باشد: ${EXACT_HEADERS.join(" | ")}`,{status:400});

  const classes=await sql`SELECT id,name,grade FROM classes ORDER BY grade,name`;
  let created=0,updated=0,skipped=0;

  for(let r=2;r<=ws.rowCount;r++){
    const row=ws.getRow(r);
    const name=cellText(row.getCell(1).value);
    const classText=cellText(row.getCell(2).value);
    const phone=normalizePhone(cellText(row.getCell(3).value))||null;
    const photoFile=cellText(row.getCell(4).value)||null;
    if(!name&&!classText&&!phone&&!photoFile) continue;
    if(!name||!classText){skipped++;continue;}

    const classNorm=normalize(classText);
    let classRow=classes.find((c:any)=>normalize(String(c.name))===classNorm);
    if(!classRow){const grade=gradeFromClass(classText); if(grade) classRow=classes.find((c:any)=>Number(c.grade)===grade);}
    if(!classRow){skipped++;continue;}

    const existing=await sql`SELECT id FROM students WHERE LOWER(TRIM(name))=LOWER(TRIM(${name})) AND class_id=${classRow.id} LIMIT 1`;
    if(existing.length){
      await sql`UPDATE students SET student_phone=${phone},photo_file_name=${photoFile} WHERE id=${existing[0].id}`; updated++;
    }else{
      await sql`INSERT INTO students(name,class_id,photo_path,student_phone,photo_file_name) VALUES(${name},${classRow.id},${null},${phone},${photoFile})`; created++;
    }
  }
  return NextResponse.redirect(new URL(`/import-students?created=${created}&updated=${updated}&skipped=${skipped}`,req.url),303);
}
