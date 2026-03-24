import { config } from "dotenv"
config({ path: ".env.local" })

import { db } from "."
import { users, categories, emailTemplates } from "./schema"

async function seed() {
  console.log("🌱 Seeding database...")

  // 1. Admin user (password set via Better Auth UI or admin SDK separately)
  await db
    .insert(users)
    .values([{
      id: "admin-user-001",
      email: "admin@djalilnet.com",
      name: "DRISSI Abdeldjalil",
      role: "super_admin",
      emailVerified: true,
      isActive: true,
    }])
    .onConflictDoNothing()
  console.log("✅ Admin user seeded")

  // 2. Default categories
  await db
    .insert(categories)
    .values([
      { name: "Engineering", slug: "engineering", color: "#3B82F6", description: "Technical engineering articles" },
      { name: "Oil & Gas", slug: "oil-and-gas", color: "#F59E0B", description: "Oil & gas industry insights" },
      { name: "Field Reports", slug: "field-reports", color: "#10B981", description: "On-site field work reports" },
      { name: "Technology", slug: "technology", color: "#8B5CF6", description: "Tech trends and tools" },
    ])
    .onConflictDoNothing()
  console.log("✅ Categories seeded")

  // 3. Email templates
  await db
    .insert(emailTemplates)
    .values([
      {
        name: "Contact Reply",
        subject: "Re: {{subject}}",
        bodyHtml: `<p>Hello {{name}},</p>
<p>Thank you for reaching out. I've received your message and will respond within 24 hours.</p>
<p>Best regards,<br/>DRISSI Abdeldjalil<br/>Electromechanical Engineer</p>`,
        bodyText: "Hello {{name}},\n\nThank you for reaching out. I've received your message and will respond within 24 hours.\n\nBest regards,\nDRISSI Abdeldjalil",
        variables: ["name", "subject"],
        isActive: true,
      },
      {
        name: "Newsletter",
        subject: "{{newsletter_title}} — djalilnet.com",
        bodyHtml: `<h2>{{newsletter_title}}</h2><p>{{content}}</p><p><small><a href="{{unsubscribe_url}}">Unsubscribe</a></small></p>`,
        bodyText: "{{newsletter_title}}\n\n{{content}}",
        variables: ["newsletter_title", "content", "unsubscribe_url"],
        isActive: true,
      },
    ])
    .onConflictDoNothing()
  console.log("✅ Email templates seeded")

  console.log("🎉 Seed complete!")
}

seed().catch(console.error).finally(() => process.exit())
