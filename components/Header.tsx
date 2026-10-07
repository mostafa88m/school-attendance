
import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

export default function Header({ user }: { user: SessionUser }) {
  const initials = user.name?.trim()?.charAt(0) || "ک";
  return (
    <header className="topbar no-print">
      <Link href="/dashboard" className="brandWrap">
        <div className="brandIcon">✓</div>
        <div className="brandText"><b>سامانه حضور و غیاب</b><small>مدرسه ابتدایی</small></div>
      </Link>
      <nav>
        <div className="userChip"><div className="userDot">{initials}</div><span>{user.name}</span></div>
        <Link href="/dashboard">صفحه اصلی</Link>
        {user.role === "admin" && <Link href="/manage">مدیریت</Link>}
        <form action="/api/logout" method="post"><button className="linkBtn">خروج</button></form>
      </nav>
    </header>
  );
}
