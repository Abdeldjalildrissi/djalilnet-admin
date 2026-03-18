import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { articles, experiences, educations, certifications, skills, users, categories } from "./src/db/schema"
import { eq } from "drizzle-orm"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
// Fallback to production if local is missing
dotenv.config({ path: path.resolve(process.cwd(), ".env.production.local") })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function seed() {
  console.log("Starting CV synchronization...")
  
  try {
    // 1. Get or create Admin User
    let adminResults = await db.select().from(users).limit(1)
    let adminId = adminResults[0]?.id

    if (!adminId) {
      console.log("No user found. Creating dummy user for author mapping.")
      const [newUser] = await db.insert(users).values({
        id: "admin-cv-bot",
        name: "Abdeldjalil Drissi",
        email: "abdeldjalildrissi@gmail.com",
        role: "author"
      }).returning()
      adminId = newUser.id
    }
    
    // 2. Clear old resume data so we don't duplicate
    console.log("Cleaning old resume records...")
    await db.delete(experiences)
    await db.delete(educations)
    await db.delete(certifications)
    await db.delete(skills)

    // 3. Insert Experiences
    console.log("Inserting Experiences...")
    await db.insert(experiences).values([
      {
        company: "ADC-NABORS",
        role: "Rig Electrician",
        period: "Apr 2025 - Present",
        location: "Libya",
        current: true,
        bullets: [
          "Installation & Commissioning: Executed setup and initial start-up of rig electrical systems and motors during rig moves.",
          "Troubleshooting Repair: Diagnosed electromechanical failures in power distribution equipment to ensure continuous operations.",
          "Power Distribution: Monitored generators and switchgear to maintain stable power supply, similar to HV asset management.",
          "Documentation: Completed accurate shift reports, maintenance logs, and safety checklists in a timely manner.",
          "Collaboration: Acted as a liaison between the rig crew and technical management to resolve site errors quickly."
        ],
        order: 1
      },
      {
        company: "SNC Djoudi",
        role: "Electromechanical Engineer",
        period: "Aug 2022 – Nov 2024",
        location: "Algeria",
        current: false,
        bullets: [
          "Interpretation of Drawings (SolidWorks): Analyzed electrical and mechanical blueprints to guide assembly and modification of equipment.",
          "Maintenance Repair: Performed routine maintenance and adjustments on CNC machines and production lines based on mechanical principles.",
          "Production Supervision: Coordinated with contractors and internal teams to ensure project execution met technical specifications.",
          "Quality Inspection: Inspected materials and structures to identify defects and implement corrective actions."
        ],
        order: 2
      }
    ])

    // 4. Insert Education
    console.log("Inserting Education...")
    await db.insert(educations).values([
      {
        degree: "Master’s in Electromechanics",
        school: "Mohamed Khider University, Biskra",
        period: "Sep 2020 – Jul 2022",
        order: 1
      },
      {
        degree: "Bachelor’s Degree in Electromechanics",
        school: "Mohamed Khider University, Biskra",
        period: "Jan 2016 – Oct 2020",
        order: 2
      }
    ])

    // 5. Insert Certifications
    console.log("Inserting Certifications...")
    await db.insert(certifications).values([
      {
        name: "Well Control Certification – IWCF",
        issuer: "Online",
        date: "Apr 2023",
        focus: "Industrial Safety Standards, Pressure Control, and Operational Procedures in hazardous environments.",
        order: 1
      },
      {
        name: "Well Intervention Training – IFP",
        issuer: "Ouargla, Algeria",
        date: "Oct 2023 – Jan 2024",
        focus: "Equipment Maintenance, Wireline Operations, and HSE Practices.",
        order: 2
      },
      {
        name: "McKinsey Forward Program",
        issuer: "Online",
        date: "Apr 2023 – Aug 2023",
        focus: "Problem Solving, Effective Communication, and Adaptability.",
        order: 3
      }
    ])

    // 6. Insert Skills
    console.log("Inserting Skills...")
    await db.insert(skills).values([
      { name: "Troubleshooting & Repair", category: "Technical", order: 1 },
      { name: "Technical Reporting", category: "Technical", order: 2 },
      { name: "Power Distribution", category: "Technical", order: 3 },
      { name: "Project Commissioning", category: "Technical", order: 4 },
      { name: "SolidWorks CAD", category: "Software", order: 5 },
      { name: "Microsoft Office", category: "Software", order: 6 },
      { name: "Problem Solving", category: "Soft", order: 7 },
      { name: "Team Supervision", category: "Soft", order: 8 }
    ])

    // 7. Transform to Blog Article
    console.log("Creating Blog Article...")
    // find category
    let cats = await db.select().from(categories).limit(1)
    let catId = cats[0]?.id
    if (!catId) {
      const [newCat] = await db.insert(categories).values({
        name: "Career Journey",
        slug: "career-journey"
      }).returning()
      catId = newCat.id
    }

    const articleTitle = "My Evolution as a Field Service Specialist"
    const articleSlug = "my-evolution-as-a-field-service-specialist"
    
    // Attempt delete if exists to avoid dup
    await db.delete(articles).where(eq(articles.slug, articleSlug))

    await db.insert(articles).values({
      title: articleTitle,
      slug: articleSlug,
      status: "published",
      categoryId: catId,
      authorId: adminId,
      excerpt: "A hands-on electromechanical engineer's journey through field operations, installation, and commissioning of industrial systems.",
      contentHtml: `<p>As a hands-on Electromechanical Engineer with a Master’s degree, my career has been deeply rooted in field operations, installation, and commissioning of complex industrial systems.</p>
      <h2>Field Experience in Libya</h2>
      <p>Working as a Rig Electrician at ADC-NABORS since April 2025, I've specialized in the setup and initial start-up of rig electrical systems and motors during rig moves. Diagnosing electromechanical failures in power distribution equipment is a daily challenge that ensures continuous operations. Acting as a liaison between the rig crew and technical management has been key to rapid site error resolution.</p>
      <h2>Engineering Foundations in Algeria</h2>
      <p>Prior to my field dispatch in Libya, I spent more than two years at SNC Djoudi (Aug 2022 - Nov 2024), where my focus was heavily anchored on SolidWorks CAD interpretation and production supervision. I routinely analyzed electrical and mechanical blueprints to guide the assembly of equipment, and successfully coordinated contractors to ensure project execution met rigorous technical specifications.</p>
      <h2>Core Capabilities</h2>
      <p>My technical foundation is bolstered by critical certifications such as IWCF Well Control and IFP Well Intervention Training. I thrive in challenging environments by coupling my technical expertise with effective communication, adaptability, and proactive problem solving.</p>`,
      content: { "ops": [{ "insert": "Article imported from CV data." }] },
      tags: ["Engineering", "Field Service", "Career"],
      publishedAt: new Date()
    })

    console.log("✅ Sync complete!")
  } catch (err) {
    console.error("Error during sync:", err)
  }
}

seed()
