import { AiProvider, AiAnalysisInput, AiAnalysisOutput } from './types';
import { env } from '../../config/env';

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';
  readonly model: string;
  
  constructor(private apiKey: string, model = env.AI_MODEL) { 
    this.model = model; 
  }
  
  isConfigured() { return Boolean(this.apiKey); }

  async analyze(input: AiAnalysisInput): Promise<AiAnalysisOutput> {
    const prompt = `Analyze this claim based on the following evidence:\n\nCLAIM: ${input.content}\n\nEVIDENCE:\n${input.evidence.map(e => `[${e.index}] ${e.title} (${e.url})`).join('\n')}`;
    
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const json: any = await res.json();
    return JSON.parse(json.choices[0].message.content);
  }
}