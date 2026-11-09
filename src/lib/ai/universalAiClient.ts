import { GoogleGenAI } from '@google/genai';
import { AiProviderConfig } from '@/types/aiConfig';

/**
 * Normalizes OpenAI-compatible base URLs by stripping trailing slashes
 * and ensuring standard /v1 or /chat/completions structure.
 */
function getCompletionsUrl(baseUrl: string): string {
  let clean = baseUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/chat/completions')) {
    if (!clean.endsWith('/v1')) {
      clean = `${clean}/v1`;
    }
    clean = `${clean}/chat/completions`;
  }
  return clean;
}

/**
 * Strips markdown code fences (e.g. ```json ... ```) from LLM output.
 */
export function cleanJsonOutput(raw: string): string {
  let trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, '');
    trimmed = trimmed.replace(/\s*```$/, '');
  }
  return trimmed.trim();
}

/**
 * Executes a text completion against any AI provider.
 */
export async function callUniversalAiText(
  config: AiProviderConfig,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const { providerType, apiKey, model, baseUrl } = config;

  if (providerType === 'gemini') {
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      throw new Error('Gemini API key is required. Please configure it in settings.');
    }

    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const effectiveModel = model || 'gemini-2.5-flash';

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\nTask:\n${prompt}` : prompt;
    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: fullPrompt,
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned an empty response.');
    return text.trim();
  }

  // OpenAI-Compatible Provider (OpenAI, DeepSeek, Groq, OpenRouter, Ollama, etc.)
  const completionsUrl = getCompletionsUrl(baseUrl || 'https://api.openai.com/v1');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim().length > 0) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const body: Record<string, any> = {
    model: model || 'gpt-4o-mini',
    messages,
    temperature: 0.2,
  };

  const res = await fetch(completionsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`AI Provider HTTP Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('AI Provider returned an empty response choice.');
  }

  return text.trim();
}

/**
 * Executes a structured JSON extraction against any AI provider.
 */
export async function callUniversalAiJson<T>(
  config: AiProviderConfig,
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const { providerType, apiKey, model, baseUrl } = config;

  const jsonInstruction =
    'CRITICAL: You MUST respond with 100% valid, raw JSON only. Do NOT wrap the JSON in markdown code blocks. Do NOT include explanatory prose, notes, or greetings.';
  const combinedSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\n${jsonInstruction}`
    : jsonInstruction;

  if (providerType === 'gemini') {
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      throw new Error('Gemini API key is required. Please configure it in settings.');
    }

    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const effectiveModel = model || 'gemini-2.5-flash';

    const fullPrompt = `${combinedSystemPrompt}\n\nTask:\n${prompt}`;
    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned an empty JSON response.');
    const cleaned = cleanJsonOutput(text);
    return JSON.parse(cleaned) as T;
  }

  // OpenAI-Compatible Provider
  const completionsUrl = getCompletionsUrl(baseUrl || 'https://api.openai.com/v1');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim().length > 0) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: combinedSystemPrompt },
    { role: 'user', content: prompt },
  ];

  const body: Record<string, any> = {
    model: model || 'gpt-4o-mini',
    messages,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  };

  let res = await fetch(completionsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  // Some providers (e.g. certain local Ollama models) fail when response_format is passed
  if (!res.ok && res.status === 400) {
    delete body.response_format;
    res = await fetch(completionsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`AI Provider HTTP Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('AI Provider returned an empty response.');
  }

  const cleaned = cleanJsonOutput(text);
  return JSON.parse(cleaned) as T;
}

/**
 * Tests connection to the configured AI provider with a fast, lightweight ping.
 */
export async function testAiConnection(
  config: AiProviderConfig
): Promise<{ success: boolean; model: string; message: string }> {
  const reply = await callUniversalAiText(
    config,
    'Reply with the single word "OK".',
    'You are a test ping agent.'
  );

  return {
    success: true,
    model: config.model || (config.providerType === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'),
    message: reply || 'Connected successfully',
  };
}
