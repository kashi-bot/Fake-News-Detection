import { AiProvider } from './types';
import { HeuristicProvider } from './HeuristicProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GroqProvider } from './GroqProvider';
import { env } from '../../config/env';

export function getAiProvider(): AiProvider {
  if (env.AI_PROVIDER === 'groq' && env.GROQ_API_KEY) {
    return new GroqProvider(env.GROQ_API_KEY, env.AI_MODEL);
  }
  if (env.AI_PROVIDER === 'openai' && env.AI_API_KEY) {
    return new OpenAIProvider(env.AI_API_KEY);
  }
  return new HeuristicProvider();
}