import { db } from "./src/db"
import { articles } from "./src/db/schema"
import { eq } from "drizzle-orm"

async function main() {
  const slug = "preventive-maintenance-on-the-mud-pump-motor"
  const post = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
  })
  console.log(JSON.stringify(post, null, 2))
}

main().catch(console.error)
