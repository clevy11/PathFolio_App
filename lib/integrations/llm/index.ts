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

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.6';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 4000;

export async function callLLM(options: LLMOptions): Promise<LLMResponse> {
  const {
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    systemPrompt,
    prompt,
  } = options;

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
}

export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}

export function getAvailableModels(): string[] {
  return [
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-haiku-5.5',
    'anthropic/claude-opus-4.8',
    'openai/gpt-4.1',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
  ];
}