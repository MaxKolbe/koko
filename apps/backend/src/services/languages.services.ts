import db from "../db/db.js";
import { languages } from "../db/models/koko.js";

//SERVICES

export const getLanguages = async (correlationId: string) => {
  const rows = await db
    .select({
      id: languages.id,
      code: languages.code,
      name: languages.name,
    })
    .from(languages);

  return {
    code: 200,
    message: "Languages retrieved successfully",
    data: rows,
    meta: { correlationId },
  };
};
