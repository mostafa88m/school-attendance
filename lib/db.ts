
import postgres from "postgres";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

export const sql = postgres(connectionString, {
  ssl: "require",
  max: 3,
  idle_timeout: 20,
  connect_timeout: 15,
});

let setupPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        grade INTEGER NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin','teacher')),
        class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        photo_path TEXT,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        day DATE NOT NULL,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('present','absent')),
        UNIQUE(day, student_id)
      )
    `;

    const [{ count: classCount }] = await sql`SELECT COUNT(*)::int AS count FROM classes`;
    if (classCount === 0) {
      const names = ["کلاس اول","کلاس دوم","کلاس سوم","کلاس چهارم","کلاس پنجم","کلاس ششم"];
      for (let i=0;i<6;i++) {
        await sql`INSERT INTO classes(name,grade) VALUES(${names[i]},${i+1})`;
      }
    }

    const [{ count: adminCount }] = await sql`SELECT COUNT(*)::int AS count FROM users WHERE username='admin'`;
    if (adminCount === 0) {
      const password = process.env.ADMIN_PASSWORD || "123456";
      const hash = await bcrypt.hash(password, 12);
      await sql`
        INSERT INTO users(name,username,password_hash,role)
        VALUES('مدیر مدرسه','admin',${hash},'admin')
      `;
    }
  })();
  return setupPromise;
}
