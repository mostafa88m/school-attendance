
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureSchema, sql } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  await ensureSchema();
  const form = await req.formData();
  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");
  const users = await sql`SELECT * FROM users WHERE username=${username} LIMIT 1`;
  const u = users[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash as string))) {
    return NextResponse.redirect(new URL("/?error=1", req.url), 303);
  }
  await createSession({
    id: u.id as number, name: u.name as string, username: u.username as string,
    role: u.role as "admin"|"teacher", classId: u.class_id as number|null
  });
  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
