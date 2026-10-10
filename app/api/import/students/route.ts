
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import ExcelJS from "exceljs";

export const runtime="nodejs";

function normalize(v:any){
  return String(v??"")
    .replace(/\u200c/g," ")
    .replace(/\s+/g," ")
    .trim()
    .toLowerCase();
}
function cellText(v:any){
  if(v==null) return "";
  if(typeof v==="object"){
    if("text" in v) return String(v.text??"").trim();
    if("result" in v) return String(v.result??"").trim();
    if("richText" in v) return (v.richText||[]).map((x:any)=>x.text||"").join("").trim();
  }
  return String(v).trim();
}
function digits(v:string){
  return v.replace(/[^\d۰-۹٠-٩]/g,"")
    .replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

const aliases:Record<string,string[]>={
  name:["نام و نام خانوادگی","نام دانش آموز","نام دانش‌آموز","نام","نام ونام خانوادگی"],
  nationalId:["کد ملی","کدملی","شماره ملی"],
  studentCode:["کد دانش آموزی","کد دانش‌آموزی","کد دانش اموزی","شماره دانش آموزی"],
  grade:["پایه","پایه تحصیلی"],
  className:["کلاس","نام کلاس","کلاس بندی","کلاس‌بندی"],
  parentName:["نام پدر","نام مادر","نام ولی","ولی","نام والد"],
  parentPhone:["شماره تماس ولی","تلفن ولی","موبایل ولی","شماره همراه ولی","شماره تماس پدر","شماره تماس مادر"],
  studentPhone:["شماره دانش آموز","شماره دانش‌آموز","تلفن دانش آموز","موبایل دانش آموز","شماره همراه دانش آموز"]
};

function headerMap(headers:string[]){
  const map:Record<string,number>={};
  headers.forEach((h,i)=>{
    const n=normalize(h);
    for(const [key,arr] of Object.entries(aliases)){
      if(arr.some(a=>normalize(a)===n || n.includes(normalize(a)))){
        if(map[key]===undefined) map[key]=i+1;
      }
    }
  });
  return map;
}

function parseGrade(v:string){
  const d=digits(v);
  if(d){const n=Number(d);if(n>=1&&n<=6)return n;}
  const p=normalize(v);
  const names:Record<string,number>={"اول":1,"دوم":2,"سوم":3,"چهارم":4,"پنجم":5,"ششم":6};
  for(const [k,n] of Object.entries(names))if(p.includes(k))return n;
  return null;
}

export async function POST(req:Request){
  const user=await requireUser();
  if(user.role!=="admin") return new NextResponse("Forbidden",{status:403});

  const fd=await req.formData();
  const file=fd.get("file");
  if(!(file instanceof File)||!file.size) return new NextResponse("File required",{status:400});
  if(file.size>12*1024*1024) return new NextResponse("Excel file too large",{status:413});

  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any);
  const ws=wb.worksheets[0];
  if(!ws) return new NextResponse("Excel sheet not found",{status:400});

  const headers:string[]=[];
  ws.getRow(1).eachCell({includeEmpty:true},cell=>headers.push(cellText(cell.value)));
  const m=headerMap(headers);
  if(!m.name) return new NextResponse("ستون نام دانش‌آموز تشخیص داده نشد.",{status:400});

  const classes=await sql`SELECT id,name,grade FROM classes ORDER BY grade,name`;
  let imported=0,skipped=0;
  const skipDuplicates=fd.get("skipDuplicates")==="on";

  for(let r=2;r<=ws.rowCount;r++){
    const row=ws.getRow(r);
    const get=(key:string)=>m[key]?cellText(row.getCell(m[key]).value):"";
    const name=get("name").trim();
    if(!name){skipped++;continue;}

    const nationalId=digits(get("nationalId"))||null;
    const studentCode=get("studentCode").trim()||null;
    const grade=parseGrade(get("grade"));
    const classRaw=get("className").trim();

    let classId:number|null=null;
    if(classRaw){
      const n=normalize(classRaw);
      const hit=classes.find((c:any)=>normalize(String(c.name))===n || normalize(String(c.name)).includes(n) || n.includes(normalize(String(c.name))));
      if(hit) classId=Number(hit.id);
    }
    if(!classId && grade){
      const hit=classes.find((c:any)=>Number(c.grade)===grade);
      if(hit) classId=Number(hit.id);
    }
    if(!classId){
      skipped++;continue;
    }

    if(skipDuplicates && (nationalId||studentCode)){
      const dup=nationalId
        ? await sql`SELECT id FROM students WHERE national_id=${nationalId} LIMIT 1`
        : await sql`SELECT id FROM students WHERE student_code=${studentCode} LIMIT 1`;
      if(dup.length){skipped++;continue;}
    }

    await sql`
      INSERT INTO students(
        name,photo_path,class_id,national_id,student_code,
        parent_name,parent_phone,student_phone
      ) VALUES(
        ${name},${null},${classId},${nationalId},${studentCode},
        ${get("parentName").trim()||null},
        ${digits(get("parentPhone"))||get("parentPhone").trim()||null},
        ${digits(get("studentPhone"))||get("studentPhone").trim()||null}
      )
    `;
    imported++;
  }

  return NextResponse.redirect(
    new URL(`/import-students?imported=${imported}&skipped=${skipped}`,req.url),303
  );
}
