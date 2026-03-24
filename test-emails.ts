import { config } from "dotenv";
config({ path: ".env.local" });

import { Resend } from "resend";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./src/db/schema";
import { eq, and } from "drizzle-orm";
import { sanitize } from "./src/lib/utils";

async function fixEmails() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });

    const emptyEmails = await db.select()
      .from(schema.emails)
      .where(and(eq(schema.emails.direction, "inbound"), eq(schema.emails.bodyText, "")));

    console.log(`Found ${emptyEmails.length} empty inbound emails to fix.`);

    for (const email of emptyEmails) {
      if (!email.resendId) continue;
      console.log(`Fetching from Resend: ${email.resendId}...`);
      const { data: fullEmail } = await resend.emails.receiving.get(email.resendId);
      
      if (fullEmail) {
        const bodyText = fullEmail.text ?? "";
        const bodyHtml = fullEmail.html ? sanitize(fullEmail.html) : "";
        
        await db.update(schema.emails)
          .set({ bodyText, bodyHtml })
          .where(eq(schema.emails.id, email.id));
        console.log(`✅ Updated email ${email.id} (Subject: ${email.subject})`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}
fixEmails();
