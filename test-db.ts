
import { db } from "./src/db";
import { articles } from "./src/db/schema";

async function test() {
  try {
    const data = await db.select().from(articles).limit(1);
    console.log("Success:", data);
  } catch (err) {
    console.error("Database connection failed:", err);
  }
  process.exit(0);
}

test();
