export interface AiProviderConfig {
  providerType: 'openai-compatible' | 'gemini';
  baseUrl: string; // e.g., "https://api.openai.com/v1" or "https://openrouter.ai/api/v1" or "https://generativelanguage.googleapis.com"
  apiKey: string;  // Bearer token or API key
  model: string;   // e.g., "gpt-4o-mini", "deepseek-chat", "gemini-2.5-flash", "llama-3.3-70b-versatile"
}

export interface AiPreset {
  id: string;
  name: string;
  providerType: 'openai-compatible' | 'gemini';
  baseUrl: string;
  defaultModel: string;
  description: string;
  placeholderKey: string;
}

export const AI_PROVIDER_PRESETS: AiPreset[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    providerType: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.5-flash',
    description: 'Fast, high-quality multimodal model from Google',
    placeholderKey: 'AIzaSy...',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    providerType: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    description: 'Standard OpenAI models (GPT-4o, GPT-4o-mini)',
    placeholderKey: 'sk-proj-...',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    providerType: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    description: 'DeepSeek V3 / R1 reasoning and chat models',
    placeholderKey: 'sk-...',
  },
  {
    id: 'groq',
    name: 'Groq',
    providerType: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    description: 'Ultra-fast LPU inference (Llama 3.3 70B, Mixtral)',
    placeholderKey: 'gsk_...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    providerType: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    description: 'Unified router for 200+ AI models (Claude, Llama, Gemini)',
    placeholderKey: 'sk-or-v1-...',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local LLM)',
    providerType: 'openai-compatible',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    description: 'Zero-cost local inference running on your machine (no key required)',
    placeholderKey: 'ollama (optional)',
  },
  {
    id: 'custom',
    name: 'Custom OpenAI-Compatible',
    providerType: 'openai-compatible',
    baseUrl: 'https://api.example.com/v1',
    defaultModel: 'default-model',
    description: 'Any self-hosted vLLM, LMStudio, LocalAI or custom API proxy',
    placeholderKey: 'sk-...',
  },
];

export const DEFAULT_AI_CONFIG: AiProviderConfig = {
  providerType: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  apiKey: '',
  model: 'gemini-2.5-flash',
};

