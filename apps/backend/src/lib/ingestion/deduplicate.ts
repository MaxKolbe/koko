import { DuplicateGroup, NormalizedHealthRow } from "../../types/ingestion.js";

const normalizeForComparison = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const tokens = (value: string): Set<string> => {
  return new Set(normalizeForComparison(value).split(" ").filter(Boolean));
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;

  return union === 0 ? 0 : intersection / union;
};

const similarity = (a: NormalizedHealthRow, b: NormalizedHealthRow): number => {
  const titleSimilarity = jaccard(tokens(a.title), tokens(b.title));

  const bodySimilarity = jaccard(tokens(a.body), tokens(b.body));

  // Title is useful for identifying the same article,
  // body is stronger evidence that the content is actually duplicated.
  return titleSimilarity * 0.4 + bodySimilarity * 0.6;
};

const exactDuplicate = (a: NormalizedHealthRow, b: NormalizedHealthRow): boolean => {
  return (
    normalizeForComparison(a.title) === normalizeForComparison(b.title) &&
    normalizeForComparison(a.body) === normalizeForComparison(b.body)
  );
};

export const deduplicate = (
  rows: NormalizedHealthRow[],
): {
  unique: NormalizedHealthRow[];
  duplicateGroups: DuplicateGroup[];
} => {
  const unique: NormalizedHealthRow[] = [];
  const duplicateGroups: DuplicateGroup[] = [];

  for (const row of rows) {
    let matchedGroup: DuplicateGroup | undefined;

    for (const group of duplicateGroups) {
      if (exactDuplicate(row, group.canonical)) {
        matchedGroup = group;
        break;
      }

      const score = similarity(row, group.canonical);

      // Deliberately conservative.
      if (score >= 0.85) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.duplicates.push(row);
      continue;
    }

    const existing = unique.find((candidate) => {
      if (exactDuplicate(row, candidate)) {
        return true;
      }

      return similarity(row, candidate) >= 0.85;
    });

    if (existing) {
      const group: DuplicateGroup = {
        canonical: existing,
        duplicates: [row],
      };

      duplicateGroups.push(group);
      continue;
    }

    unique.push(row);
  }

  return {
    unique,
    duplicateGroups,
  };
};
