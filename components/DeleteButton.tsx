
"use client";

export default function DeleteButton({
  action,
  label="حذف",
  message="از حذف این مورد مطمئن هستید؟"
}:{action:string;label?:string;message?:string}){
  return (
    <form action={action} method="post" onSubmit={(e)=>{
      if(!window.confirm(message)) e.preventDefault();
    }}>
      <button className="btn dangerSoft" type="submit">{label}</button>
    </form>
  );
}
