import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/db";
import { experiences, educations, certifications, skills, siteSettings } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding resume data...");

  // 1. Personal Info & Stats (Site Settings)
  const personalInfo = {
    name: "DRISSI Abdeldjalil",
    role: "Electromechanical Engineer & Field Service Specialist",
    tagline: "I scale engineering excellence in the field, blending electromechanical expertise with HSE standards.",
    email: "contact@djalilnet.com",
    phone: "+213 790750708",
    location: "Algeria / Libya (Field Deployed)",
    avatar: "/avatar.png",
  };

  const stats = [
    { label: "Years Experience", value: "3+", icon: "Wrench" },
    { label: "Projects Completed", value: "50+", icon: "Zap" },
    { label: "Uptime Managed", value: "99%", icon: "Shield" },
    { label: "Countries Worked", value: "Global", icon: "Globe" },
  ];

  // Upsert settings
  for (const item of [
    { key: "personal_info", value: personalInfo },
    { key: "site_stats", value: stats },
  ]) {
    await db.insert(siteSettings)
      .values(item)
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: item.value, updatedAt: new Date() }
      });
  }

  // 2. Experience
  const expData = [
    {
      company: "ADC-NABORS",
      role: "Rig Electrician",
      period: "Apr 2025 – Present",
      location: "Libya",
      current: true,
      bullets: [
        "Installation & Commissioning of rig electrical systems and motors during rig moves.",
        "Troubleshooting electromechanical failures in power distribution equipment.",
        "Monitoring generators and switchgear for stable power supply management.",
        "Completing accurate shift reports, maintenance logs, and HSE safety checklists.",
      ],
      order: 0,
    },
    {
      company: "SNC Djoudi",
      role: "Electromechanical Engineer",
      period: "Aug 2022 – Nov 2024",
      location: "Algeria",
      current: false,
      bullets: [
        "Analyzed electrical and mechanical blueprints (SolidWorks) for equipment assembly.",
        "Performed routine maintenance on CNC machines and production lines.",
        "Coordinated with contractors to ensure technical specifications were met.",
        "Inspected materials and structures — identified defects, implemented corrective actions.",
      ],
      order: 1,
    },
  ];
  await db.insert(experiences).values(expData);

  // 3. Certifications
  const certData = [
    { name: "IWCF Well Control", issuer: "IWCF", date: "2025", focus: "Well Control & Pressure Management", order: 0 },
    { name: "IFP Well Intervention Training", issuer: "IFP", date: "2024", focus: "Downhole Operations", order: 1 },
    { name: "McKinsey Forward Program", issuer: "McKinsey & Company", date: "2023", focus: "Leadership & Digital Strategy", order: 2 },
  ];
  await db.insert(certifications).values(certData);

  // 4. Education
  const eduData = [
    { degree: "Master's Degree in Electromechanics", school: "Mohamed Khider University, Biskra", period: "2020 – 2022", order: 0 },
    { degree: "Bachelor's Degree in Electromechanics", school: "Mohamed Khider University, Biskra", period: "2017 – 2020", order: 1 },
  ];
  await db.insert(educations).values(eduData);

  // 5. Skills
  const technicalSkills = ["SolidWorks", "Electrical Troubleshooting", "Mechanical Assembly", "Generators & Switchgear"].map((s, i) => ({ name: s, category: "technical", order: i }));
  const softwareSkills = ["MS Office Suite", "AI Productivity Tools", "CAD/CAM"].map((s, i) => ({ name: s, category: "software", order: i }));
  const languageSkills = ["English (Professional)", "Arabic (Native)", "French (Working)"].map((s, i) => ({ name: s, category: "language", order: i }));

  await db.insert(skills).values([...technicalSkills, ...softwareSkills, ...languageSkills]);

  console.log("✅ Resume seeding completed!");
}

main().catch(console.error);
