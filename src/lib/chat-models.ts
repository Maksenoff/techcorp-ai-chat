export const CHAT_MODELS = [
  {
    id: 'ollama-cloud',
    label: 'Ollama Cloud',
    shortLabel: 'Ollama',
    provider: 'ollama',
    upstreamModel: null,
    maxTokens: 2048,
  },
  {
    id: 'google-gemma',
    label: 'Google · Gemma 2',
    shortLabel: 'Gemma 2',
    provider: 'nvidia',
    upstreamModel: 'google/gemma-2-2b-it',
    maxTokens: 1024,
  },
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek · V4 Pro',
    shortLabel: 'DeepSeek V4 Pro',
    provider: 'nvidia',
    upstreamModel: 'deepseek-ai/deepseek-v4-pro',
    maxTokens: 4096,
  },
  {
    id: 'qwen-3-5',
    label: 'Qwen · 3.5 122B',
    shortLabel: 'Qwen 3.5',
    provider: 'nvidia',
    upstreamModel: 'qwen/qwen3.5-122b-a10b',
    maxTokens: 4096,
  },
  {
    id: 'mistral-small-4',
    label: 'Mistral · Small 4',
    shortLabel: 'Mistral Small 4',
    provider: 'nvidia',
    upstreamModel: 'mistralai/mistral-small-4-119b-2603',
    maxTokens: 4096,
  },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]['id'];

export const DEFAULT_CHAT_MODEL_ID: ChatModelId = 'deepseek-v4-pro';

export function getChatModel(id: unknown) {
  return CHAT_MODELS.find((model) => model.id === id) ?? null;
}
