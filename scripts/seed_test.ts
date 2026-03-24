import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function seed() {
  const { db } = await import("../src/db")
  const { emailSenders, emailTemplates, subscribers } = await import("../src/db/schema")
  console.log("🌱 Seeding test data...")
  
  // 1. Create a sender
  const sender = await db.insert(emailSenders).values({
    name: "System Administrator",
    email: "contact@djalilnet.com",
    isActive: true,
  }).onConflictDoNothing().returning()
  
  console.log("✅ Sender created:", sender[0]?.email || "already exists")
  
  // 2. Create a template
  const template = await db.insert(emailTemplates).values({
    name: "System Test Template",
    subject: "🔍 Tracking Verification - {{name}}",
    bodyHtml: `
      <div style="font-family: sans-serif; padding: 40px; border-radius: 8px; border: 1px solid #eee;">
        <h1 style="color: #2563eb;">Verification Test</h1>
        <p>Hello {{name}},</p>
        <p>This is a <strong>production-level tracker test</strong>. We are verifying:</p>
        <ul>
          <li>Variable replacement ({{name}})</li>
          <li>Open tracking pixel</li>
          <li>Unsubscribe mechanism</li>
        </ul>
        <p>Please click the link below to verify unsubscribe:</p>
        <a href="{{unsubscribe_url}}" style="color: #2563eb; text-decoration: underline;">Test Unsubscribe Link</a>
      </div>
    `,
    variables: ["name", "unsubscribe_url"]
  }).onConflictDoNothing().returning()

  console.log("✅ Template created:", template[0]?.name || "already exists")

  // 3. Create a test subscriber
  await db.insert(subscribers).values({
    email: "test@djalilnet.com",
    active: true,
  }).onConflictDoNothing()

  console.log("✅ Test subscriber created: test@djalilnet.com")
  
  process.exit(0)
}

seed()
