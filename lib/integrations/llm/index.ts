import { generateText, type LanguageModel } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  prompt: string;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const MODEL_FALLBACK_CHAIN = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'poolside/laguna-s-2.1:free',
  'google/gemma-4-31b-it:free',
];

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || MODEL_FALLBACK_CHAIN[0];
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 8000;

export async function callLLM(options: LLMOptions): Promise<LLMResponse> {
  const {
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    systemPrompt,
    prompt,
  } = options;

  const requested = options.model ?? DEFAULT_MODEL;
  const candidates = [requested, ...MODEL_FALLBACK_CHAIN.filter((m) => m !== requested)];

  let lastError: unknown;
  for (const model of candidates) {
    try {
      const result = await generateText({
        model: openrouter(model) as LanguageModel,
        system: systemPrompt,
        prompt,
        temperature,
        maxTokens,
      });

      return {
        text: result.text,
        usage: result.usage
          ? {
              promptTokens: result.usage.promptTokens,
              completionTokens: result.usage.completionTokens,
              totalTokens: result.usage.totalTokens,
            }
          : undefined,
      };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160);
      console.warn(`LLM call failed on ${model}; trying next fallback:`, message);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All LLM models in the fallback chain failed');
}

export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}

export function getAvailableModels(): string[] {
  return [
    ...MODEL_FALLBACK_CHAIN,
    'anthropic/claude-sonnet-4.6',
    'openai/gpt-4.1',
    'openai/gpt-4o-mini',
  ];
}