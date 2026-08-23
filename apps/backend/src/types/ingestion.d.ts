export type RawHealthRow = {
  id: number;
  title: string | null;
  topic: string;
  summary: string | null;
  body: string;
  last_updated: string | null;
  author: string | null;
  status: string;
};

export type NormalizedHealthRow = {
  sourceId: number;
  title: string;
  topic: string;
  summary: string | null;
  body: string;
  lastUpdated: Date | null;
  author: string;
  status: "draft" | "published";
  contentType: "article";
};

export type RawPidginRow = {
  article_id: number;
  language: string;
  title: string;
  body: string;
};

export type NormalizedPidginRow = {
  sourceArticleId: number;
  language: string;
  title: string;
  body: string;
};

export type DuplicateGroup = {
  canonical: NormalizedHealthRow;
  duplicates: NormalizedHealthRow[];
};