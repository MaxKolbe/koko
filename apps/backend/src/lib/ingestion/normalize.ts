import { decode } from "html-entities";
import { z } from "zod";
import {
  RawHealthRow,
  NormalizedHealthRow,
  RawPidginRow,
  NormalizedPidginRow,
} from "../../types/ingestion.js";

const TOPIC_ALIASES: Record<string, string> = {
  malaria: "malaria",
  "malaria prevention": "malaria",
  "maternal health": "maternal_health",
  nutrition: "nutrition",
  nutriton: "nutrition",
  hygiene: "hygiene",
  "clean water": "clean_water",
  "first aid": "first_aid",
  immunisation: "immunisation",
  immunization: "immunisation",
  "family planning": "family_planning",
};

const STATUS_ALIASES: Record<string, "draft" | "published"> = {
  draft: "draft",
  published: "published",
  true: "published",
  yes: "published",
};

export const rawHealthRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().nullable(),
  topic: z.string().min(1),
  summary: z.string().nullable(),
  body: z.string().min(1),
  last_updated: z.string().nullable(),
  author: z.string().nullable(),
  status: z.string().min(1),
});

export const rawPidginRowSchema = z.object({
  article_id: z.coerce.number().int().positive(),
  language: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const cleanText = (value: string | null | undefined): string | null => {
  if (value == null) return null;

  const decoded = decode(value);
  const withoutHtml = decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  const normalized = withoutHtml
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized || null;
}

export const normalizeTitle = (value: string | null): string | null => {
  const data = cleanText(value);
  // placholder cause there's no time
  if(data === null){
    return "placeholder"
  }

  return data
}

export const normalizeTopic = (value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");

  return TOPIC_ALIASES[normalized] ?? normalized.replace(/\s+/g, "_");
}

export const normalizeStatus = (value: string): "draft" | "published" => {
  const normalized = value.trim().toLowerCase();

  const status = STATUS_ALIASES[normalized];

  if (!status) {
    throw new Error(`Unsupported content status: "${value}"`);
  }

  return status;
}

export const normalizeDate = (value: string | null): Date | null => {
  if (!value?.trim()) return null;

  const input = value.trim();

  // ISO dates/timestamps and slash-separated dates.
  const iso = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/;
  const slash = /^\d{2}\/\d{2}\/\d{4}$/;

  if (iso) {
    // you can try iso.test(input)
    const date = new Date(input);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (slash) {
    // you can try slash.test(input)
    const parts = input.split("/").map(Number);
    const [day, month, year] = parts;
    if (day !== undefined && month !== undefined && year !== undefined) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Handles values such as "Jan 2025" and "2nd April 2025".
  const cleaned = input.replace(/(\d+)(st|nd|rd|th)/gi, "$1");

  const date = new Date(cleaned);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  throw new Error(`Unable to parse date: "${value}"`);
}

export const normalizeHealthRow = (raw: RawHealthRow): NormalizedHealthRow => {
  const parsed = rawHealthRowSchema.parse(raw);

  const title = normalizeTitle(parsed.title);

  if (!title) {
    throw new Error(`Row ${parsed.id}: title is required`);
  }

  const body = cleanText(parsed.body);

  if (!body) {
    throw new Error(`Row ${parsed.id}: body is required`);
  }

  return {
    sourceId: parsed.id,
    title,
    topic: normalizeTopic(parsed.topic),
    summary: cleanText(parsed.summary),
    body,
    lastUpdated: normalizeDate(parsed.last_updated),
    author: parsed.author?.trim() || "Unknown",
    status: normalizeStatus(parsed.status),
    contentType: "article",
  };
}

export const normalizePidginRow = (raw: RawPidginRow): NormalizedPidginRow => {
  const parsed = rawPidginRowSchema.parse(raw);

  const title = cleanText(parsed.title);
  const body = cleanText(parsed.body);

  if (!title || !body) {
    throw new Error(`Pidgin row for article ${parsed.article_id} has empty content`);
  }

  return {
    sourceArticleId: parsed.article_id,
    language: parsed.language.trim().toLowerCase(),
    title,
    body,
  };
}
