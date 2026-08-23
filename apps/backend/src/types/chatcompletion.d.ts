export interface ChatCompletionMessage {
  role: "assistant";
  content: string;
  refusal: string | null;
  annotations: unknown[];
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatCompletionMessage;
  logprobs: null | {
    content: unknown[] | null;
    refusal: unknown[] | null;
  };
  finish_reason: "stop" | "length" | "content_filter" | "tool_calls" | "function_call";
}

export interface PromptTokensDetails {
  cached_tokens: number;
  audio_tokens: number;
}

export interface CompletionTokensDetails {
  reasoning_tokens: number;
  audio_tokens: number;
  accepted_prediction_tokens: number;
  rejected_prediction_tokens: number;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details: PromptTokensDetails;
  completion_tokens_details: CompletionTokensDetails;
}

export interface ChatCompletionResult {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
  service_tier: "default" | "scale" | "auto" | null;
  system_fingerprint: string;
}

export interface ChatCompletionTestResponse {
  success: boolean;
  message: string;
  result: ChatCompletionResult;
}