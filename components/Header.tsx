
import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

export default function Header({ user }: { user: SessionUser }) {
  return (
    <header className="topbar no-print">
      <b>🏫 سامانه حضور و غیاب</b>
      <nav>
        <span>{user.name}</span>
        <Link href="/dashboard">صفحه اصلی</Link>
        {user.role === "admin" && <Link href="/manage">مدیریت</Link>}
        <form action="/api/logout" method="post"><button className="linkBtn">خروج</button></form>
      </nav>
    </header>
  );
}
