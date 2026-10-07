
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureSchema, sql } from "./db";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "change-this-session-secret-in-vercel");

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "teacher";
  classId: number | null;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
  const jar = await cookies();
  jar.set("school_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set("school_session", "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get("school_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/");
  await ensureSchema();
  const rows = await sql`
    SELECT id,name,username,role,class_id FROM users WHERE id=${session.id}
  `;
  if (!rows.length) redirect("/");
  return {
    id: rows[0].id as number,
    name: rows[0].name as string,
    username: rows[0].username as string,
    role: rows[0].role as "admin" | "teacher",
    classId: rows[0].class_id as number | null,
  };
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/dashboard");
  return u;
}
