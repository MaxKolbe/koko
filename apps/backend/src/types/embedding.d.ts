export interface EmbeddingData {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface EmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface EmbeddingResponse {
  object: "list";
  data: EmbeddingData[];
  model: string;
  usage: EmbeddingUsage;
}