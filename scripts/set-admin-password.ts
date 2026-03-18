import { config } from "dotenv"
config({ path: ".env.local" })

import { db } from "../src/db"
import { users } from "../src/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "../src/lib/auth"

async function setAdminPassword(email: string, newPassword: string) {
  console.log(`Setting password for ${email}...`)

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    console.error(`User with email ${email} not found.`)
    process.exit(1)
  }

  try {
    // Note: Since this is an internal admin action, we bypass current password check
    // by using the internal API methods if possible, but better-auth changePassword 
    // requires a current password usually. 
    // However, we can use the 'setPassword' or just 'updateUser' if available.
    
    // The most robust way in scripts is to use the auth.api.admin.setSession or similar,
    // but better-auth's admin plugin would be needed.
    
    // Instead, let's just use the internal hasher from better-auth.
    const { hashPassword } = require("better-auth/crypto");
    const hashedPassword = await hashPassword(newPassword);

    // Update or Insert the account
    const { accounts } = require("../src/db/schema");
    const { and } = require("drizzle-orm");
    
    const existingAccount = await db.query.accounts.findFirst({
        where: and(
            eq(accounts.userId, user.id),
            eq(accounts.providerId, "credential")
        )
    });

    if (existingAccount) {
        await db.update(accounts)
            .set({ 
                password: hashedPassword,
                updatedAt: new Date()
            })
            .where(eq(accounts.id, existingAccount.id));
    } else {
        await db.insert(accounts).values({
            userId: user.id,
            accountId: user.email,
            providerId: "credential",
            password: hashedPassword,
        });
    }

    console.log(`✅ Password for ${email} has been updated successfully!`)

  } catch (err) {
    console.error("Failed to update password:", err)
    process.exit(1)
  }
}

const email = process.argv[2] || "abdeldjalildrissi@gmail.com"
const password = process.argv[3]

if (!password) {
  console.error("Usage: npx tsx scripts/set-admin-password.ts <email> <newPassword>")
  process.exit(1)
}

setAdminPassword(email, password)
  .catch(console.error)
  .finally(() => process.exit())

