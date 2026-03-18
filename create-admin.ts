import { auth } from "./src/lib/auth"
import { db } from "./src/db"
import { users } from "./src/db/schema"
import { eq } from "drizzle-orm"

async function createAdmin() {
  const email = "abdeldjalildrissi@gmail.com"
  const password = "admin_password_2026" // Temporary password

  console.log(`Creating admin user: ${email}...`)

  try {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      console.log("User already exists. Updating role to super_admin...")
      await db.update(users)
        .set({ role: "super_admin" })
        .where(eq(users.email, email))
    }

    // Better Auth creation (Hashed)
    const user = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "DRISSI Abdeldjalil",
      }
    })

    console.log("✅ Admin user created successfully!")
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  } catch (error) {
    console.error("Error creating admin:", error)
  }
}

createAdmin().then(() => process.exit())
