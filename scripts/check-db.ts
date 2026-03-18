import { config } from "dotenv";
config({ path: "/Users/djalil/Desktop/dj/djalilnet-admin/.env.prod.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { count, desc } from "drizzle-orm";

console.log("DB_URL_LOADED:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function check() {
  try {
    const mediaCount = await db.select({ value: count() }).from(schema.media);
    const contactsCount = await db.select({ value: count() }).from(schema.contacts);
    const emailsCount = await db.select({ value: count() }).from(schema.emails);
    
    const latestEmails = await db.select().from(schema.emails).orderBy(desc(schema.emails.createdAt)).limit(10);

    console.log("RECORD_COUNTS:", JSON.stringify({
      media: mediaCount[0].value,
      contacts: contactsCount[0].value,
      emails: emailsCount[0].value
    }, null, 2));

    console.log("LATEST_EMAILS:", JSON.stringify(latestEmails, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error("DB_ERROR:", err);
    process.exit(1);
  }
}
check();
