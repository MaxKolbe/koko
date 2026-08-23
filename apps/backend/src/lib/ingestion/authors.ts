import { sql } from "drizzle-orm";
import { authors } from "../../db/models/koko.js";
import db from "../../db/db.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const resolveAuthor = async (
  tx: Transaction,
  name: string,
) => {
  const normalized = name.trim();

  const [existing] = await db
    .select()
    .from(authors)
    .where(
      sql`lower(trim(${authors.name})) = lower(trim(${normalized}))`,
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(authors)
    .values({
      name: normalized,
    })
    .returning();

  return created;
}