import { config } from "dotenv";
import path from "path";
config({ path: path.join(process.cwd(), ".env.local") });

// Import db after env is loaded
async function main() {
  const { db } = await import("../src/db");
  const { experiences } = await import("../src/db/schema");
  console.log("Adding a new test experience...");
  
  await db.insert(experiences).values({
    company: "Test Company AI",
    role: "AI Integration Consultant",
    period: "Mar 2026 – Present",
    location: "Global",
    current: true,
    bullets: [
      "Successfully integrated Gemini AI to manage resume data.",
      "Optimized admin dashboard performance by removing visual clutter.",
      "Verified real-time database synchronization with Next.js 16."
    ],
    order: -1 // Top priority
  });

  console.log("✅ New experience added successfully!");
}

main().catch(console.error);
