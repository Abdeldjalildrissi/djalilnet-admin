import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function check() {
  const { db } = await import("./src/db");
  try {
    const articles = await db.query.articles.findMany();
    const categories = await db.query.categories.findMany();
    const emails = await db.query.emails.findMany({ limit: 5 });

    console.log("Admin DB Summary:");
    console.log("- Articles:", articles.length);
    console.log("- Categories:", categories.length);
    console.log("- Emails (samples check):", emails.length);

  } catch (err) {
    console.error("DB Connection Failed:", err);
    process.exit(1);
  }
}

check();
