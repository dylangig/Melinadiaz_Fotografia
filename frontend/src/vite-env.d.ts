/// <reference types="vite/client" />

declare module '@n8n/chat' {
  export interface ChatOptions {
    webhookUrl: string;
    webhookConfig?: { method?: string; headers?: Record<string, string> };
    target?: string;
    mode?: 'window' | 'fullscreen';
    showWelcomeScreen?: boolean;
    loadPreviousSession?: boolean;
    chatInputKey?: string;
    chatSessionKey?: string;
    defaultLanguage?: string;
    initialMessages?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    i18n?: Record<string, any>;
    metadata?: Record<string, unknown>;
    enableStreaming?: boolean;
  }
  export function createChat(options: ChatOptions): unknown;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_N8N_CHAT_WEBHOOK_URL?: string;
}
